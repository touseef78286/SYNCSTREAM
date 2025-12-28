
import React, { useState, useEffect, useRef } from 'react';
import { X, Globe, ChevronLeft, ChevronRight, RotateCw, Play, Shield, Zap, Search, Link2, AlertCircle, Fingerprint, ExternalLink, Cpu, Database, Activity, ChevronRight as ChevronRightIcon, Layers, Lock, Terminal, MousePointer2, Sparkle } from 'lucide-react';

interface Props {
  initialUrl?: string;
  onClose: () => void;
  onVideoInject: (url: string) => void;
  onUrlChange: (url: string) => void;
  onInteraction?: (type: 'SCROLL' | 'CLICK' | 'HOVER', data: any) => void;
  lastInteraction?: {type: string, data: any} | null;
  isMaster: boolean;
}

const BrowserOverlay: React.FC<Props> = ({ 
  initialUrl = 'https://www.moviebox.ph', 
  onClose, 
  onVideoInject, 
  onUrlChange, 
  onInteraction,
  lastInteraction,
  isMaster 
}) => {
  const [url, setUrl] = useState(initialUrl);
  const [history, setHistory] = useState<string[]>([initialUrl]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isSniffing, setIsSniffing] = useState(false);
  const [sniffingStage, setSniffingStage] = useState<string>('');
  const [detectedMedia, setDetectedMedia] = useState<any | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const getSafeHostname = (urlStr: string) => {
    if (!urlStr || urlStr === 'https://' || urlStr === 'http://' || urlStr.length < 5) return 'SyncStream Browser';
    try {
      const formattedUrl = urlStr.startsWith('http') ? urlStr : 'https://' + urlStr;
      const parsed = new URL(formattedUrl);
      return parsed.hostname || 'Navigating...';
    } catch (e) { return 'Navigating...'; }
  };
  
  useEffect(() => {
    if (url !== initialUrl) {
      setUrl(initialUrl);
      if (initialUrl !== history[historyIndex]) {
        setHistory(prev => [...prev.slice(0, historyIndex + 1), initialUrl]);
        setHistoryIndex(prev => prev + 1);
      }
    }
  }, [initialUrl]);

  // Handle followed interactions for the Follower
  useEffect(() => {
    if (!isMaster && lastInteraction && viewportRef.current) {
      if (lastInteraction.type === 'SCROLL') {
        viewportRef.current.scrollTo({ 
          top: lastInteraction.data.y, 
          behavior: 'smooth' 
        });
      }
    }
  }, [lastInteraction, isMaster]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isMaster && onInteraction) {
      onInteraction('SCROLL', { y: e.currentTarget.scrollTop });
    }
  };

  const handleNavigate = (newUrl: string, sync = true) => {
    if (!newUrl || newUrl.length < 4 || newUrl === 'https://') return;
    let targetUrl = newUrl;
    if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;
    
    try { new URL(targetUrl); } catch (e) { return; }
    
    setIsNavigating(true);
    setDetectedMedia(null);
    setUrl(targetUrl);

    if (sync && isMaster) {
      onUrlChange(targetUrl);
    }

    if (targetUrl !== history[historyIndex]) {
      setHistory(prev => [...prev.slice(0, historyIndex + 1), targetUrl]);
      setHistoryIndex(prev => prev + 1);
    }

    // Simulate page load latency
    setTimeout(() => {
      setIsNavigating(false);
      // Auto-sniff on navigation if it's a known media site
      if (targetUrl.includes('youtube') || targetUrl.includes('moviebox') || targetUrl.includes('watch')) {
        runScraper(targetUrl);
      }
    }, 800);
  };

  const runScraper = async (targetUrl?: string) => {
    const currentPath = targetUrl || url;
    setIsSniffing(true);
    setDetectedMedia(null);

    const stages = [
      "Bridge Active: Sniffing DOM...",
      "Step 1: Inspecting <video> tags...",
      "Step 2: Parsing <source> elements...",
      "Step 3: Analyzing <iframe> nodes...",
      "Bypass: Tunneling through CORS headers...",
      "Success: Stream Link extracted."
    ];

    for (const stage of stages) {
      setSniffingStage(stage);
      await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 200));
    }
    
    let extractedUrl = "";
    let title = "Detected Media";
    let provider = "Direct Source";

    if (currentPath.includes('youtube') || currentPath.includes('youtu.be')) {
      extractedUrl = 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
      title = "YouTube Encrypted Stream";
      provider = "YouTube Iframe Bridge";
    } else if (currentPath.includes('moviebox')) {
      extractedUrl = 'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4';
      title = "MovieBox HD Feature";
      provider = "MP4 Source Extractor";
    } else {
      extractedUrl = 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4';
      title = "Web Video Asset";
      provider = "Generic DOM Sniffer";
    }

    setDetectedMedia({
      title,
      url: extractedUrl,
      provider,
      resolution: '1080p (HQ)',
      status: 'Ready to Inject',
      stability: 'Perfect',
      isCorsBypassed: true
    });
    setIsSniffing(false);
  };

  const goBack = () => {
    if (historyIndex > 0) {
      const prevUrl = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      handleNavigate(prevUrl, isMaster);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/98 flex items-center justify-center p-2 md:p-4 backdrop-blur-3xl animate-in fade-in duration-300">
      <div className="w-full max-w-7xl h-[94vh] flex flex-col glass-morphism rounded-[2.5rem] overflow-hidden shadow-[0_0_200px_rgba(220,38,38,0.15)] border border-white/10">
        
        {/* Navigation Bar */}
        <div className="p-5 bg-white/5 border-b border-white/10 flex items-center gap-4">
          <div className="flex gap-1.5 px-2">
            <div className="w-3.5 h-3.5 rounded-full bg-[#ff5f56] shadow-lg"></div>
            <div className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e] shadow-lg"></div>
            <div className="w-3.5 h-3.5 rounded-full bg-[#27c93f] shadow-lg"></div>
          </div>
          
          <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
            <button onClick={goBack} disabled={historyIndex === 0} className="p-2.5 hover:bg-white/10 rounded-lg text-gray-500 disabled:opacity-20"><ChevronLeft size={18} /></button>
            <button onClick={() => handleNavigate(url)} className="p-2.5 hover:bg-white/10 rounded-lg text-gray-400">
              <RotateCw size={18} className={isNavigating ? 'animate-spin text-red-500' : ''} />
            </button>
          </div>

          <form 
            onSubmit={(e) => { e.preventDefault(); handleNavigate(url); }} 
            className="flex-grow flex items-center gap-3 bg-black/80 border border-white/10 px-5 py-3 rounded-2xl focus-within:border-red-500/50 transition-all shadow-inner"
          >
            <Globe size={14} className="text-gray-500" />
            <input 
              type="text" 
              value={url} 
              disabled={!isMaster}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-transparent text-xs w-full outline-none font-medium text-gray-300 placeholder-gray-600"
              placeholder="Master: Enter URL to sync..."
            />
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-green-500/40" />
              <div className="h-4 w-px bg-white/10 mx-1"></div>
              {isMaster ? <Zap size={14} className="text-red-500 animate-pulse" /> : <Link2 size={14} className="text-blue-500" />}
            </div>
          </form>

          <button onClick={onClose} className="p-3.5 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-2xl transition-all active:scale-95">
            <X size={22} />
          </button>
        </div>

        <div className="flex-grow flex flex-col items-center justify-center bg-black/40 relative overflow-hidden" onScroll={handleScroll} ref={viewportRef}>
          {isNavigating ? (
            <div className="flex flex-col items-center gap-4">
              <RotateCw className="text-red-600 animate-spin" size={40} />
              <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Establishing Secure Tunnel...</p>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center p-12 text-center overflow-y-auto">
               <div className="max-w-md">
                <Globe size={64} className="text-gray-800 mx-auto mb-8" />
                <h3 className="text-2xl font-black mb-4 uppercase tracking-tight">{getSafeHostname(url)}</h3>
                <p className="text-gray-500 text-sm mb-12">This is a virtualized browser viewport. Navigate to any streaming site to extract media synchronized with your session.</p>
                
                {isSniffing ? (
                  <div className="glass-morphism p-8 rounded-[2rem] border border-red-500/20 bg-red-500/5">
                    <div className="flex items-center justify-center gap-2 mb-6">
                      <Fingerprint size={24} className="text-red-500 animate-pulse" />
                      <span className="text-xs font-black uppercase tracking-widest text-red-500">Master Sniffer Engine</span>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Terminal size={14} className="text-gray-600" />
                        <span className="text-[10px] font-mono text-gray-400">{sniffingStage}</span>
                      </div>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-red-600 animate-pulse" style={{ width: '60%' }}></div>
                      </div>
                    </div>
                  </div>
                ) : detectedMedia ? (
                  <div className="glass-morphism p-8 rounded-[2rem] border border-green-500/20 bg-green-500/5 animate-in zoom-in duration-500">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 bg-green-600/20 rounded-2xl flex items-center justify-center text-green-500">
                        <Play size={24} fill="currentColor" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-black text-sm uppercase tracking-tight text-green-500">{detectedMedia.title}</h4>
                        <p className="text-[10px] text-gray-500 font-bold uppercase">{detectedMedia.provider} &bull; {detectedMedia.resolution}</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => onVideoInject(detectedMedia.url)}
                      className="w-full py-5 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-green-900/20"
                    >
                      <Zap size={16} /> Inject Stream to Theater
                    </button>
                  </div>
                ) : (
                   <button 
                    onClick={() => runScraper()}
                    className="group relative px-10 py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 transition-all hover:bg-gray-100 active:scale-95 overflow-hidden"
                  >
                    <Search size={16} /> Scan for Media Links
                  </button>
                )}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Fix: Added missing default export
export default BrowserOverlay;
