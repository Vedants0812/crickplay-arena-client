import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSocketEvents } from './hooks/useSocketEvents';
import { useGameStore }    from './store/gameStore';

import Home         from './pages/Home';
import Lobby        from './pages/Lobby';
import AvatarSelect from './pages/AvatarSelect';
import Game         from './pages/Game';
import Results      from './pages/Results';
import JoinRoom     from './pages/JoinRoom';

/* ── Auto-dismissing error toast ── */
function ErrorToast() {
  const error      = useGameStore(s => s.error);
  const clearError = useGameStore(s => s.clearError);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(clearError, 4500);
    return () => clearTimeout(t);
  }, [error, clearError]);

  if (!error) return null;

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[200]
                    flex items-center gap-3 px-5 py-3 rounded-2xl
                    font-body font-semibold text-white text-base
                    animate-slide-down max-w-[90vw] cursor-pointer"
      style={{
        background:    'rgba(255,107,53,0.92)',
        backdropFilter:'blur(20px)',
        boxShadow:     '0 0 30px rgba(255,107,53,0.4), 0 8px 32px rgba(0,0,0,0.5)',
        border:        '1px solid rgba(255,107,53,0.5)',
      }}
      onClick={clearError}>
      <span className="text-xl shrink-0">⚠️</span>
      <span className="flex-1 min-w-0">{error}</span>
      <button className="ml-1 text-2xl leading-none opacity-60 hover:opacity-100 shrink-0">×</button>
    </div>
  );
}

/* ── Page transition wrapper ── */
function PageWrapper({ children }) {
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 40);
    return () => clearTimeout(t);
  }, [location.pathname]);

  return (
    <div style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.25s ease' }}>
      {children}
    </div>
  );
}

/* ── Splash / loading screen shown before socket connects ── */
function SplashScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#04080f] z-[300]">
      <div className="text-7xl mb-4 animate-float" style={{ filter:'drop-shadow(0 0 20px rgba(0,255,136,0.6))' }}>
        🏏
      </div>
      <div className="font-display text-5xl tracking-widest"
        style={{ color:'#00ff88', textShadow:'0 0 25px rgba(0,255,136,0.5)' }}>
        CRICKPLAY
      </div>
      <div className="mt-4 flex gap-2 items-center">
        <span className="w-2 h-2 rounded-full bg-pitch-400 animate-bounce" style={{ animationDelay:'0ms' }} />
        <span className="w-2 h-2 rounded-full bg-pitch-400 animate-bounce" style={{ animationDelay:'150ms' }} />
        <span className="w-2 h-2 rounded-full bg-pitch-400 animate-bounce" style={{ animationDelay:'300ms' }} />
      </div>
    </div>
  );
}

function AppInner() {
  useSocketEvents();
  const connected = useGameStore(s => s.connected);
  const [showSplash, setShowSplash] = useState(true);

  /* Hide splash after first connect or 2.5s timeout */
  useEffect(() => {
    if (connected) {
      setTimeout(() => setShowSplash(false), 300);
    }
    const timeout = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timeout);
  }, [connected]);

  return (
    <>
      {showSplash && <SplashScreen />}
      <ErrorToast />
      <PageWrapper>
        <Routes>
          <Route path="/"            element={<Home />} />
          <Route path="/join/:roomId" element={<JoinRoom />} />
          <Route path="/avatar"      element={<AvatarSelect />} />
          <Route path="/lobby"       element={<Lobby />} />
          <Route path="/game"        element={<Game />} />
          <Route path="/results"     element={<Results />} />
          <Route path="*"            element={<Navigate to="/" replace />} />
        </Routes>
      </PageWrapper>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
