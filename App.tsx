import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import CinemaPage from './components/Cinema';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import { User, UserRole } from './types';

const InviteRedirect: React.FC<{ isLoggedIn: boolean }> = ({ isLoggedIn }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      if (isLoggedIn) {
        navigate(`/room/${id}`, { replace: true });
      } else {
        localStorage.setItem('syncstream_pending_invite', id);
        navigate('/login', { replace: true });
      }
    }
  }, [id, isLoggedIn, navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white gap-4">
      <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="font-bold tracking-widest text-xs uppercase">Processing Invite...</p>
    </div>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.MASTER);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate checking local session
    const savedUser = localStorage.getItem('syncstream_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('syncstream_user', JSON.stringify(user));
    
    // Check for pending invite after login
    const pendingInvite = localStorage.getItem('syncstream_pending_invite');
    if (pendingInvite) {
      localStorage.removeItem('syncstream_pending_invite');
      // The router will handle navigation if we provide a way, 
      // but simpler to just let the route render handle it.
      window.location.hash = `#/room/${pendingInvite}`;
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('syncstream_user');
    localStorage.removeItem('syncstream_pending_invite');
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white gap-4">
      <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="font-bold tracking-widest text-xs uppercase">Initializing SyncStream...</p>
    </div>
  );

  return (
    <Router>
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <Routes>
          <Route 
            path="/login" 
            element={currentUser ? <Navigate to="/" /> : <LoginPage onLogin={handleLogin} />} 
          />
          <Route 
            path="/invite/:id" 
            element={<InviteRedirect isLoggedIn={!!currentUser} />} 
          />
          <Route 
            path="/" 
            element={currentUser ? <LandingPage user={currentUser} onLogout={handleLogout} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/room/:id" 
            element={
              currentUser ? (
                <CinemaPage 
                  user={currentUser} 
                  role={userRole} 
                  onRoleChange={setUserRole}
                />
              ) : <Navigate to="/login" />
            } 
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;