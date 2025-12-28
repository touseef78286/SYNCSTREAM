
import React, { useState } from 'react';
import { User } from '../types';
import { ShieldCheck, Chrome } from 'lucide-react';

interface Props {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<Props> = ({ onLogin }) => {
  const [isHovering, setIsHovering] = useState(false);

  const simulateGoogleLogin = () => {
    const mockGoogleUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Professional User',
      email: 'user@gmail.com',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
      isOnline: true,
      friends: []
    };
    onLogin(mockGoogleUser);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden px-4">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-md glass-morphism p-8 rounded-[2rem] border border-white/10 relative z-10 shadow-2xl">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center font-bold text-3xl mb-6 shadow-lg shadow-red-600/20">S</div>
          <h1 className="text-3xl font-extrabold mb-2 tracking-tight">Welcome Back</h1>
          <p className="text-gray-400 text-sm">Sign in to join your synchronized cinema.</p>
        </div>

        <div className="space-y-4">
          <button 
            onClick={simulateGoogleLogin}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            className="w-full bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all hover:bg-gray-100 active:scale-95 group"
          >
            <Chrome size={20} className="group-hover:rotate-12 transition-transform" />
            Sign in with Google
          </button>
          
          <button className="w-full bg-white/5 border border-white/10 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all">
            Join as Guest
          </button>
        </div>

        <div className="mt-12 flex items-center justify-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
          <ShieldCheck size={14} className="text-green-500" />
          Secured by SyncStream Protocol
        </div>
      </div>

      <footer className="absolute bottom-8 text-gray-600 text-[10px] uppercase tracking-widest font-bold">
        Privacy Policy &bull; Terms of Service &bull; Help
      </footer>
    </div>
  );
};

export default LoginPage;
