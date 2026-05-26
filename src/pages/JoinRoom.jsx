import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socket from '../socket';
import { useGameStore } from '../store/gameStore';
import StadiumBackground from '../components/StadiumBackground';
import { sound } from '../utils/sound';

export default function JoinRoom() {
  const { roomId }  = useParams();
  const navigate    = useNavigate();
  const { setPlayer, setRoomId, setPlayers, setGameState, setError, connected } = useGameStore();

  const [name,      setName]      = useState('');
  const [loading,   setLoading]   = useState(false);
  const [roomInfo,  setRoomInfo]  = useState(null);
  const [roomError, setRoomError] = useState(null);
  const [nameErr,   setNameErr]   = useState('');

  useEffect(() => {
    sound.transition();
    fetch(`/api/room/${roomId}`)
      .then(r => r.json())
      .then(d => { if (d.error) setRoomError(d.error); else setRoomInfo(d); })
      .catch(() => setRoomError('Could not reach server'));
  }, [roomId]);

  const handleJoin = () => {
    if (!name.trim() || name.trim().length < 2) {
      setNameErr('Name must be at least 2 characters');
      return;
    }
    setNameErr('');
    sound.click();
    setLoading(true);

    socket.emit('joinRoom', { roomId: roomId.toUpperCase(), playerName: name.trim() }, (res) => {
      setLoading(false);
      if (res?.error) { setError(res.error); return; }
      setPlayer(res.player);
      setRoomId(res.roomId);
      setPlayers(res.players);
      setGameState('avatar');
      sound.join();
      navigate('/avatar');
    });
  };

  /* ── Room not found ── */
  if (roomError) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center px-4">
        <StadiumBackground />
        <div className="relative z-10 text-center glass rounded-2xl p-10 max-w-sm w-full animate-scale-in">
          <div className="text-6xl mb-4">😢</div>
          <h2 className="font-display text-4xl mb-3" style={{ color:'#ff6b35' }}>ROOM NOT FOUND</h2>
          <p className="text-white/40 font-body mb-6 leading-relaxed">
            This room doesn't exist or the game has already started.
          </p>
          <button onClick={() => navigate('/')}
            className="w-full py-3 rounded-xl font-display text-xl tracking-widest text-[#04080f]
                       transition-all duration-200 active:scale-[0.97]"
            style={{ background:'linear-gradient(135deg,#00ff88,#00cc6a)', boxShadow:'0 0 20px rgba(0,255,136,0.4)' }}>
            GO HOME
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center px-4">
      <StadiumBackground />

      <div className="relative z-10 w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8 animate-slide-down">
          <div className="text-6xl mb-3 animate-float">🏏</div>
          <h1 className="font-display text-5xl tracking-widest"
            style={{ color:'#00ff88', textShadow:'0 0 25px rgba(0,255,136,0.5)' }}>
            YOU'RE INVITED!
          </h1>
          <p className="font-body text-white/35 mt-2">Join the cricket quiz battle</p>
        </div>

        {/* Card */}
        <div className="relative animate-scale-in" style={{ animationDelay:'0.1s' }}>
          {/* Gradient border */}
          <div className="absolute -inset-[1px] rounded-2xl"
            style={{
              background:'linear-gradient(135deg,rgba(0,255,136,0.5),rgba(64,196,255,0.4),rgba(224,64,251,0.4),rgba(0,255,136,0.5))',
              backgroundSize:'300% 300%',
              animation:'gradientShift 6s ease infinite',
            }} />

          <div className="relative rounded-2xl p-7"
            style={{ background:'rgba(4,10,20,0.93)', backdropFilter:'blur(30px)' }}>

            {/* Room info */}
            {roomInfo ? (
              <div className="text-center mb-6 p-4 rounded-xl"
                style={{ background:'rgba(0,255,136,0.06)', border:'1px solid rgba(0,255,136,0.2)' }}>
                <div className="font-display text-4xl tracking-widest text-pitch-400 mb-1">{roomId}</div>
                <div className="font-body text-sm text-white/40">
                  {roomInfo.playerCount}/{roomInfo.maxPlayers} players already in lobby
                </div>
                {/* Player count bar */}
                <div className="flex gap-1 justify-center mt-2">
                  {Array(roomInfo.maxPlayers).fill(0).map((_,i) => (
                    <div key={i} className="w-2 h-2 rounded-full transition-all"
                      style={{
                        background: i < roomInfo.playerCount ? '#00ff88' : 'rgba(255,255,255,0.1)',
                        boxShadow: i < roomInfo.playerCount ? '0 0 5px rgba(0,255,136,0.7)' : 'none',
                      }} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center mb-6">
                <div className="w-8 h-8 border-2 border-pitch-400/30 border-t-pitch-400 rounded-full animate-spin mx-auto" />
              </div>
            )}

            {/* Name input */}
            <label className="block font-body font-semibold text-white/40 mb-2 text-xs uppercase tracking-[0.2em]">
              Your Name
            </label>
            <div className="relative mb-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base pointer-events-none">🎮</span>
              <input type="text" value={name}
                onChange={e => { setName(e.target.value.slice(0,16)); setNameErr(''); }}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                placeholder="Enter your name…" maxLength={16}
                className="w-full pl-10 pr-4 py-3 rounded-xl font-body text-lg text-white
                           placeholder:text-white/20 outline-none transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: nameErr ? '2px solid #ff6b35' : '2px solid rgba(255,255,255,0.1)',
                }}
                onFocus={e => { if (!nameErr) e.target.style.borderColor = 'rgba(0,255,136,0.5)'; }}
                onBlur={e  => { if (!nameErr) e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              />
            </div>

            {nameErr && (
              <p className="text-ember-400 font-body text-sm mb-3 animate-slide-down flex items-center gap-1">
                <span>⚠️</span> {nameErr}
              </p>
            )}

            {/* Connection */}
            <div className="flex items-center gap-2 mb-5 mt-2">
              <span className={`w-2 h-2 rounded-full transition-all ${connected
                ? 'bg-pitch-400 animate-pulse shadow-[0_0_8px_rgba(0,255,136,0.8)]'
                : 'bg-white/20'}`} />
              <span className={`font-body text-xs ${connected ? 'text-pitch-400/55' : 'text-white/25'}`}>
                {connected ? 'Connected to server' : 'Connecting…'}
              </span>
            </div>

            <button onClick={handleJoin} disabled={loading || !connected || !roomInfo}
              className="w-full py-4 rounded-xl font-display text-2xl tracking-widest
                         transition-all duration-200 active:scale-[0.97] disabled:opacity-40 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
                color: '#04080f',
                boxShadow: '0 0 25px rgba(0,255,136,0.4)',
              }}>
              <span className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity rounded-xl"
                style={{ background:'linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.15) 50%,transparent 70%)' }} />
              {loading ? (
                <span className="flex items-center justify-center gap-3 relative">
                  <span className="w-5 h-5 border-2 border-[#04080f]/40 border-t-[#04080f] rounded-full animate-spin" />
                  JOINING…
                </span>
              ) : (
                <span className="relative">🏏 JOIN GAME</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
