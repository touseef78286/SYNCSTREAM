
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Settings, 
  MessageSquare, Users, Mic, MicOff, Globe, ArrowLeft,
  Radio, Wifi, Phone, PhoneOff, Zap, Shield, ChevronUp, Check, Search, X, Link2, ExternalLink, Youtube, Send, Sparkles, RotateCw, Loader2, AlertTriangle, RefreshCcw, PictureInPicture2, AlertCircle
} from 'lucide-react';
import { User, UserRole, PlaybackState, SyncMessage, MessageType } from '../types';
import { HEARTBEAT_INTERVAL, SYNC_THRESHOLD, AUDIO_DUCKING_VOLUME } from '../constants';
import ChatOverlay from './ChatOverlay';
import BrowserOverlay from './BrowserOverlay';

interface Props {
  user: User;
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
}

const CinemaPage: React.FC<Props> = ({ user, role, onRoleChange }) => {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const wakeLockRef = useRef<any>(null);
  const syncChannel = useRef<BroadcastChannel | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [showBrowser, setShowBrowser] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchUrl, setSearchUrl] = useState('');
  const [syncHealth, setSyncHealth] = useState<'GOOD' | 'LAGGING'>('GOOD');
  const [videoUrl, setVideoUrl] = useState('https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
  const [browserUrl, setBrowserUrl] = useState('https://www.moviebox.ph');
  const [lastBrowserInteraction, setLastBrowserInteraction] = useState<{type: string, data: any} | null>(null);
  const [quality, setQuality] = useState('1080p');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [wakeLockDenied, setWakeLockDenied] = useState(false);

  const qualityOptions = ['480p', '720p', '1080p', '4K'];

  useEffect(() => {
    let animationFrame: number;
    let silenceTimer: number;

    const analyzeMic = () => {
      if (!analyserRef.current || !isMicOn) return;
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      if (average > 15) {
        setIsSpeaking(true);
        clearTimeout(silenceTimer);
      } else {
        silenceTimer = window.setTimeout(() => setIsSpeaking(false), 1500);
      }
      animationFrame = requestAnimationFrame(analyzeMic);
    };

    if (isMicOn) analyzeMic();
    else setIsSpeaking(false);

    return () => {
      cancelAnimationFrame(animationFrame);
      clearTimeout(silenceTimer);
    };
  }, [isMicOn]);

  const toggleMic = async () => {
    if (!isMicOn) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioCtxRef.current.createAnalyser();
        const source = audioCtxRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        analyserRef.current.fftSize = 256;
        setIsMicOn(true);
        setIsVoiceActive(true);
      } catch (err) {
        console.error("Microphone access denied", err);
      }
    } else {
      micStreamRef.current?.getTracks().forEach(track => track.stop());
      setIsMicOn(false);
      setIsVoiceActive(false);
    }
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await videoRef.current.requestPictureInPicture();
    } catch (err) { console.error("PiP failed", err); }
  };

  const requestWakeLock = async () => {
    if (!('wakeLock' in navigator)) return;
    if (wakeLockRef.current || document.visibilityState !== 'visible') return;
    try { 
      wakeLockRef.current = await (navigator as any).wakeLock.request('screen'); 
      setWakeLockDenied(false);
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setWakeLockDenied(true);
      }
      console.warn("Screen Wake Lock disabled:", err.message);
    }
  };

  useEffect(() => {
    if (isPlaying) requestWakeLock();
    else if (wakeLockRef.current) wakeLockRef.current.release().then(() => wakeLockRef.current = null);
  }, [isPlaying]);

  const broadcastState = (state?: PlaybackState, timeOverride?: number) => {
    if (role !== UserRole.MASTER || !syncChannel.current || !videoRef.current) return;
    syncChannel.current.postMessage({
      type: MessageType.SYNC,
      userId: user.id,
      currentTime: timeOverride ?? videoRef.current.currentTime,
      state: state ?? (isPlaying ? PlaybackState.PLAYING : PlaybackState.PAUSED),
      videoUrl,
      quality,
      timestamp: Date.now()
    });
  };

  useEffect(() => {
    syncChannel.current = new BroadcastChannel(`syncstream_${roomId}`);
    syncChannel.current.onmessage = (event) => {
      const msg: SyncMessage = event.data;
      if (msg.type === MessageType.URL_CHANGE && msg.browserUrl) setBrowserUrl(msg.browserUrl);
      
      if (msg.type === MessageType.BROWSER_ACTION && role === UserRole.FOLLOWER) {
        setLastBrowserInteraction({ type: msg.interactionType!, data: msg.interactionData });
      }

      if (role === UserRole.FOLLOWER) {
        if (msg.videoUrl && msg.videoUrl !== videoUrl) {
          setVideoUrl(msg.videoUrl);
          setVideoError(null);
        }
        if (!videoRef.current) return;
        const diff = Math.abs(videoRef.current.currentTime - (msg.currentTime || 0));
        setSyncHealth(diff > SYNC_THRESHOLD ? 'LAGGING' : 'GOOD');
        if (msg.state === PlaybackState.PLAYING && videoRef.current.paused && !videoError) {
          videoRef.current.play().catch(() => {});
          setIsPlaying(true);
        } else if (msg.state === PlaybackState.PAUSED && !videoRef.current.paused) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
        if (diff > SYNC_THRESHOLD) videoRef.current.currentTime = msg.currentTime || 0;
      }
    };
    return () => syncChannel.current?.close();
  }, [roomId, role, videoUrl, videoError]);

  useEffect(() => {
    if (videoRef.current) {
      const targetVolume = isSpeaking ? (volume * AUDIO_DUCKING_VOLUME) : volume;
      videoRef.current.volume = isMuted ? 0 : targetVolume;
    }
  }, [isSpeaking, volume, isMuted]);

  const togglePlay = async () => {
    if (!videoRef.current || videoError) return;
    const newState = !isPlaying;
    if (newState) await videoRef.current.play();
    else videoRef.current.pause();
    setIsPlaying(newState);
    if (role === UserRole.MASTER) broadcastState(newState ? PlaybackState.PLAYING : PlaybackState.PAUSED);
  };

  const handleVideoError = () => {
    setVideoError("Media stream encountered a decryption or network error.");
    setIsPlaying(false);
    if (role === UserRole.MASTER) broadcastState(PlaybackState.PAUSED);
  };

  const handleUrlSync = (newUrl: string) => {
    setBrowserUrl(newUrl);
    if (role === UserRole.MASTER && syncChannel.current) {
      syncChannel.current.postMessage({
        type: MessageType.URL_CHANGE,
        userId: user.id,
        browserUrl: newUrl,
        timestamp: Date.now()
      });
    }
  };

  const handleBrowserInteraction = (type: 'SCROLL' | 'CLICK' | 'HOVER', data: any) => {
    if (role === UserRole.MASTER && syncChannel.current) {
      syncChannel.current.postMessage({
        type: MessageType.BROWSER_ACTION,
        userId: user.id,
        interactionType: type,
        interactionData: data,
        timestamp: Date.now()
      });
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchUrl.trim()) return;

    // Simulation: In a production environment, we'd use a YouTube resolver API.
    // For this prototype, we'll switch to a different high-quality sample if a YouTube link is pasted.
    let finalUrl = searchUrl;
    if (searchUrl.includes('youtube.com') || searchUrl.includes('youtu.be')) {
      finalUrl = 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4';
    }

    setVideoUrl(finalUrl);
    setSearchUrl('');
    setShowSearchBar(false);
    setVideoError(null);

    if (role === UserRole.MASTER) {
      // Sync for all participants immediately
      broadcastState(PlaybackState.PLAYING, 0);
    }
  };

  return (
    <div className="relative h-screen w-screen bg-black overflow-hidden flex flex-col md:flex-row">
      <div className="flex-grow relative flex items-center justify-center bg-[#050505] group">
        
        {/* Wake Lock Error Banner */}
        {wakeLockDenied && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[70] animate-in slide-in-from-top duration-500 w-full max-w-sm px-4">
            <div className="glass-morphism bg-amber-500/10 border border-amber-500/20 backdrop-blur-2xl p-4 rounded-2xl flex items-start gap-3 shadow-2xl">
              <div className="bg-amber-500/20 p-2 rounded-lg shrink-0">
                <AlertCircle size={16} className="text-amber-500" />
              </div>
              <div className="flex-grow">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">Wake Lock Restricted</h4>
                <p className="text-[9px] text-amber-200/70 font-medium leading-relaxed">
                  Screen timeout prevention is disabled due to browser policy. Please check your browser or OS permissions if the screen turns off during playback.
                </p>
              </div>
              <button onClick={() => setWakeLockDenied(false)} className="text-amber-500 hover:text-white transition-colors p-1">
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {videoError && (
          <div className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
            <AlertTriangle size={48} className="text-red-500 mb-6" />
            <h2 className="text-xl font-black uppercase mb-2">Sync Interrupted</h2>
            <p className="text-gray-400 text-sm max-w-xs mb-8">{videoError}</p>
            <button onClick={() => setVideoError(null)} className="px-8 py-3 bg-white text-black rounded-xl font-bold uppercase text-[10px] tracking-widest">Dismiss</button>
          </div>
        )}

        {role === UserRole.FOLLOWER && syncHealth === 'LAGGING' && !videoError && (
          <div className="absolute inset-0 z-30 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <RotateCw className="text-red-600 animate-spin" size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest text-white">Catching up to Master...</p>
          </div>
        )}

        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain"
          onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
          onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
          onError={handleVideoError}
          muted={isMuted}
          playsInline
        />

        {/* Search Overlay */}
        {showSearchBar && (
          <div className="absolute inset-0 z-[60] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
            <div className="w-full max-w-2xl glass-morphism p-10 rounded-[3rem] border-white/10 shadow-[0_0_100px_rgba(220,38,38,0.2)]">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Youtube size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight uppercase">Inject Media Stream</h3>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">YouTube & Direct MP4 Synchronization</p>
                  </div>
                </div>
                <button onClick={() => setShowSearchBar(false)} className="p-3 hover:bg-white/10 rounded-xl transition-all text-gray-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSearchSubmit} className="space-y-6">
                <div className="relative group">
                  <input
                    autoFocus
                    type="text"
                    value={searchUrl}
                    onChange={(e) => setSearchUrl(e.target.value)}
                    placeholder="Paste YouTube link or direct video URL..."
                    className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-5 text-sm outline-none focus:border-red-600 transition-all shadow-inner"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <Link2 size={18} className="text-gray-600 group-focus-within:text-red-500 transition-colors" />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={!searchUrl.trim()}
                    className="flex-grow py-5 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-red-900/20 flex items-center justify-center gap-3"
                  >
                    <Sparkles size={16} /> Sync for Everyone
                  </button>
                </div>
                <p className="text-center text-[9px] text-gray-600 font-bold uppercase tracking-widest">
                  Master Control: Changing the URL will reload the theater for all followers.
                </p>
              </form>
            </div>
          </div>
        )}

        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-40 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 backdrop-blur-md transition-all">
              <ArrowLeft size={20} />
            </button>
            <div className="flex flex-col">
              <h2 className="text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                ROOM: {roomId} <Shield size={12} className="text-red-500" />
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-1.5 h-1.5 rounded-full ${syncHealth === 'GOOD' ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{syncHealth} SYNC</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={() => setShowSearchBar(true)} className="p-3.5 bg-white/5 border border-white/10 text-gray-400 rounded-2xl hover:bg-white/10 transition-all shadow-2xl"><Search size={22} /></button>
            <div className="px-5 py-2.5 bg-black/60 rounded-2xl border border-white/10 backdrop-blur-xl text-[10px] font-black uppercase tracking-tight flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${role === UserRole.MASTER ? 'bg-red-500 shadow-[0_0_5px_red]' : 'bg-blue-500'}`}></div>
              {role}
            </div>
          </div>
        </div>

        <div className={`absolute inset-0 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-500 cinema-gradient p-10 pointer-events-none ${videoError ? '!opacity-0' : ''}`}>
          <div className="flex items-center gap-4 mb-6 pointer-events-auto">
            <span className="text-[10px] font-black font-mono bg-black/60 px-3 py-1.5 rounded-xl border border-white/5">{Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}</span>
            <div className="relative flex-grow h-1.5 bg-white/10 rounded-full cursor-pointer overflow-hidden">
              <div className="absolute top-0 left-0 h-full bg-red-600 shadow-[0_0_15px_rgba(220,38,38,1)]" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}></div>
              <input type="range" min={0} max={duration || 100} step="0.1" value={currentTime} disabled={role !== UserRole.MASTER} onChange={(e) => { if(videoRef.current) videoRef.current.currentTime = Number(e.target.value); }} className="absolute inset-0 w-full opacity-0 cursor-pointer" />
            </div>
            <span className="text-[10px] font-black font-mono text-gray-500">{Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}</span>
          </div>

          <div className="flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-8">
              <button onClick={togglePlay} className="text-white hover:text-red-600 transition-all active:scale-90 transform">
                {isPlaying ? <Pause size={48} fill="currentColor" /> : <Play size={48} fill="currentColor" className="ml-1" />}
              </button>
              <div className="flex items-center gap-4 group/vol bg-black/40 px-4 py-2 rounded-2xl border border-white/5">
                <button onClick={() => setIsMuted(!isMuted)} className="text-gray-400 hover:text-white">{isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}</button>
                <div className="w-0 group-hover/vol:w-28 overflow-hidden transition-all duration-300">
                  <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-24 accent-red-600 cursor-pointer" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button onClick={() => setShowBrowser(true)} className="flex items-center gap-2 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-600/20 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                <Globe size={18} /> CO-BROWSE
              </button>
              <button onClick={togglePiP} className="p-4 bg-white/5 rounded-2xl border border-white/10 text-gray-400 hover:text-white"><PictureInPicture2 size={24} /></button>
              <button onClick={() => videoRef.current?.requestFullscreen()} className="p-4 bg-white/5 rounded-2xl border border-white/10 text-gray-400 hover:text-white"><Maximize size={24} /></button>
            </div>
          </div>
        </div>
      </div>

      {showChat && (
        <div className="w-full md:w-[420px] h-1/2 md:h-full glass-morphism border-l border-white/10 flex flex-col z-50">
          <ChatOverlay currentUser={user} currentMovie={videoUrl.split('/').pop() || 'Remote Cinema'} />
          
          <div className="p-8 bg-black/90 border-t border-white/10 flex items-center justify-between backdrop-blur-3xl relative">
            {isSpeaking && (
              <div className="absolute -top-12 left-0 right-0 h-12 flex items-center justify-center gap-1.5 pointer-events-none">
                {[1,2,3,4,5,6,7].map(i => <div key={i} className="w-1 bg-red-500 rounded-full animate-voice-pulse" style={{ animationDelay: `${i * 0.1}s` }}></div>)}
                <span className="text-[8px] font-black text-red-500 uppercase ml-2 tracking-widest">Auto-Ducking Active</span>
              </div>
            )}
            <div className="flex gap-4">
              <button onClick={toggleMic} className={`p-6 rounded-[2.5rem] transition-all shadow-xl ${isMicOn ? 'bg-red-600 shadow-red-900/30' : 'bg-white/5 border border-white/5 text-gray-500'}`}>
                {isMicOn ? <Mic size={28} className="text-white" /> : <MicOff size={28} />}
              </button>
              <button onClick={() => setIsVoiceActive(!isVoiceActive)} className={`p-6 rounded-[2.5rem] transition-all shadow-xl ${isVoiceActive ? 'bg-green-600 shadow-green-900/30' : 'bg-white/5 border border-white/5 text-gray-500'}`}>
                <Phone size={28} className={isVoiceActive ? 'text-white' : ''} />
              </button>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end mb-1">
                <Wifi size={10} className="text-green-500" />
                <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest">V-SYNC Engine</p>
              </div>
              <p className="text-[9px] font-bold text-gray-600 uppercase">JITTER: 12ms</p>
            </div>
          </div>
        </div>
      )}

      {showBrowser && (
        <BrowserOverlay 
          initialUrl={browserUrl} 
          isMaster={role === UserRole.MASTER} 
          onClose={() => setShowBrowser(false)} 
          onUrlChange={handleUrlSync} 
          onInteraction={handleBrowserInteraction}
          lastInteraction={lastBrowserInteraction}
          onVideoInject={(url) => { setVideoUrl(url); setShowBrowser(false); broadcastState(); }} 
        />
      )}
      
      <style>{`
        @keyframes voice-pulse { 0%, 100% { height: 4px; } 50% { height: 20px; } }
        .animate-voice-pulse { animation: voice-pulse 0.4s ease-in-out infinite; }
        input[type=range] { -webkit-appearance: none; background: transparent; }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none; height: 18px; width: 18px; border-radius: 50%;
          background: #ef4444; cursor: pointer; border: 2px solid white; box-shadow: 0 0 10px rgba(239, 68, 68, 0.6);
        }
      `}</style>
    </div>
  );
};

export default CinemaPage;
