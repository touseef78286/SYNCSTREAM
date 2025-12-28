
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';
import { DEFAULT_ROOM_ID, MOCK_USERS } from '../constants';
import { Users, Play, MessageCircle, Heart, Shield, LogOut, Copy, Check, UserPlus, Activity, Radio } from 'lucide-react';

interface Props {
  user: User;
  onLogout: () => void;
}

const LandingPage: React.FC<Props> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [copied, setCopied] = React.useState(false);
  
  const inviteLink = `${window.location.origin}${window.location.pathname}#/invite/${DEFAULT_ROOM_ID}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onlineFriends = [
    { name: 'Sarah J.', activity: 'Watching Interstellar', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
    { name: 'Mike Ross', activity: 'In Lobby', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike' },
    { name: 'Jessica P.', activity: 'Browsing Moviebox', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica' },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-12">
      <header className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center font-bold text-xl shadow-[0_0_20px_rgba(220,38,38,0.3)]">S</div>
          <h1 className="text-2xl font-black tracking-tighter">SyncStream</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-2xl border border-white/5 backdrop-blur-xl">
            <img src={user.avatar} className="w-8 h-8 rounded-full border border-red-600" alt="Me" />
            <div className="hidden md:block">
              <p className="text-[10px] font-black uppercase tracking-widest">{user.name}</p>
              <p className="text-[9px] text-gray-500 font-bold uppercase">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="p-3 bg-white/5 hover:bg-red-600 hover:text-white rounded-xl transition-all border border-white/5"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Banner */}
          <section className="glass-morphism rounded-[2.5rem] p-12 overflow-hidden relative border border-white/10 group">
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-red-500 mb-6">
                <Radio size={14} className="animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">System Online</span>
              </div>
              <h2 className="text-5xl font-black tracking-tight mb-4 leading-tight">Your Private<br/><span className="text-red-500">Cinema Cloud.</span></h2>
              <p className="text-gray-400 mb-10 max-w-sm text-sm font-medium leading-relaxed">Start a synchronized session to browse movies, extract streams, and watch in 4K with your partner.</p>
              <button 
                onClick={() => navigate(`/room/${DEFAULT_ROOM_ID}`)}
                className="bg-red-600 hover:bg-red-500 text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-3 transition-all active:scale-95 shadow-2xl shadow-red-900/40 group-hover:px-12"
              >
                <Play size={18} fill="white" /> Launch Master Engine
              </button>
            </div>
            <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 blur-[120px] -mr-20 -mt-20 rounded-full group-hover:bg-red-600/20 transition-all duration-700"></div>
          </section>

          {/* Friends Section */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3">
                <Users size={18} className="text-red-500" /> Active Friends
              </h3>
              <button className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:underline flex items-center gap-2">
                <UserPlus size={14} /> View All
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {onlineFriends.map((friend, idx) => (
                <div key={idx} className="glass-morphism p-5 rounded-2xl border border-white/5 flex items-center justify-between hover:border-red-500/20 transition-all group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img src={friend.avatar} className="w-12 h-12 rounded-2xl border border-white/10" alt={friend.name} />
                      <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-black rounded-full"></div>
                    </div>
                    <div>
                      <p className="text-sm font-black tracking-tight">{friend.name}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1.5 mt-0.5">
                        <Activity size={10} className="text-red-500" /> {friend.activity}
                      </p>
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center text-gray-500 group-hover:bg-red-600 group-hover:text-white transition-all">
                    <Play size={14} fill="currentColor" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <div className="glass-morphism rounded-[2rem] p-8 border border-white/10">
            <h3 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2">
              <Shield size={16} className="text-blue-500" /> Security Status
            </h3>
            <div className="space-y-5">
              {[
                { label: 'Verified Auth', value: 'Active', color: 'text-green-500' },
                { label: 'VoIP Layer', value: 'AES-256', color: 'text-blue-500' },
                { label: 'Sync Health', value: '100%', color: 'text-green-500' }
              ].map((stat, i) => (
                <div key={i} className="flex justify-between items-center pb-4 border-b border-white/5 last:border-0 last:pb-0">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">{stat.label}</span>
                  <span className={`text-[10px] font-black uppercase ${stat.color}`}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-morphism rounded-[2rem] p-8 bg-gradient-to-br from-red-900/10 to-transparent border border-red-900/20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <h3 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
              <Heart size={16} className="text-red-500" /> Cinema Invite
            </h3>
            <p className="text-[11px] text-gray-500 mb-8 font-medium leading-relaxed uppercase tracking-tight">Share this unique gateway to invite your partner directly into your Master Session.</p>
            
            <div className="bg-black/60 p-4 rounded-xl border border-white/5 font-mono text-[10px] break-all mb-8 text-red-400 flex items-center justify-between shadow-inner">
              <span className="truncate mr-3">{inviteLink}</span>
              <button onClick={copyToClipboard} className="text-gray-500 hover:text-white transition-colors shrink-0">
                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              </button>
            </div>
            
            <button 
              onClick={copyToClipboard}
              className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-100 transition-all active:scale-95 shadow-xl flex items-center justify-center gap-3"
            >
              {copied ? 'Link Copied!' : 'Copy Gateway Link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
