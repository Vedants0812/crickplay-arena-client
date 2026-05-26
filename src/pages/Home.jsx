import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../socket';
import { useGameStore } from '../store/gameStore';
import StadiumBackground from '../components/StadiumBackground';
import { sound } from '../utils/sound';

const FACTS = [
  { icon:'🏏', text:'Cricket has 2.5 billion fans worldwide' },
  { icon:'🌍', text:'Played professionally in 106 countries' },
  { icon:'⚡', text:'Fastest delivery: 161.3 km/h — Shoaib Akhtar' },
  { icon:'🎯', text:'Sachin Tendulkar: 100 international centuries' },
  { icon:'🏆', text:'India won World Cups in 1983, 2007 & 2011' },
  { icon:'📜', text:'First Test match was played in 1877' },
  { icon:'🔥', text:'Yuvraj Singh: 6 sixes in 1 over (2007 T20 WC)' },
];

export default function Home() {
  const navigate = useNavigate();
  const { setPlayer, setRoomId, setPlayers, setGameState, setError, connected } = useGameStore();

  const [name, setName]         = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode]         = useState('create');
  const [loading, setLoading]   = useState(false);
  const [factIdx, setFactIdx]   = useState(0);
  const [soundOn, setSoundOn]   = useState(true);
  const [nameError, setNameError] = useState('');
  const nameRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setFactIdx(i => (i + 1) % FACTS.length), 3800);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { nameRef.current?.focus(); }, []);

  const toggleSound = () => {
    const on = sound.toggle();
    setSoundOn(on);
    if (on) sound.click();
  };

  const validate = () => {
    if (!name.trim() || name.trim().length < 2) {
      setNameError('Name must be at least 2 characters');
      return false;
    }
    if (mode === 'join' && roomCode.trim().length !== 6) {
      setNameError('Room code must be exactly 6 characters');
      return false;
    }
    setNameError('');
    return true;
  };

  const handleCreate = () => {
    if (!validate()) return;
    sound.click();
    setLoading(true);
    socket.emit('createRoom', { playerName: name.trim() }, (res) => {
      setLoading(false);
      if (res?.error) { setError(res.error); return; }
      setPlayer(res.player); setRoomId(res.roomId);
      setPlayers([res.player]); setGameState('avatar');
      sound.transition(); navigate('/avatar');
    });
  };

  const handleJoin = () => {
    if (!validate()) return;
    sound.click();
    setLoading(true);
    socket.emit('joinRoom', { roomId: roomCode.trim().toUpperCase(), playerName: name.trim() }, (res) => {
      setLoading(false);
      if (res?.error) { setError(res.error); return; }
      setPlayer(res.player); setRoomId(res.roomId);
      setPlayers(res.players); setGameState('avatar');
      sound.transition(); navigate('/avatar');
    });
  };

  const fact = FACTS[factIdx];

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center px-4 overflow-hidden">
      <StadiumBackground />

      {/* Sound toggle */}
      <button onClick={toggleSound}
        className="fixed top-4 right-4 z-30 w-10 h-10 rounded-full glass flex items-center justify-center
                   text-base hover:bg-white/10 transition-all duration-200 border border-white/10">
        {soundOn ? '🔊' : '🔇'}
      </button>

      {/* ── Hero ── */}
      <div className="relative z-10 text-center mb-10 animate-slide-up">
        {/* Logo mark */}
        <div className="relative inline-flex items-center justify-center mb-4">
          <div className="absolute w-32 h-32 rounded-full"
            style={{ background:'radial-gradient(circle, rgba(0,255,136,0.2) 0%, transparent 70%)' }} />
          <span className="relative text-7xl animate-float" style={{ filter:'drop-shadow(0 0 20px rgba(0,255,136,0.6))' }}>
            🏏
          </span>
        </div>

        <h1 className="font-display tracking-widest leading-none mb-1"
          style={{
            fontSize: 'clamp(3.5rem, 10vw, 7rem)',
            background: 'linear-gradient(135deg, #00ff88 0%, #40c4ff 50%, #00ff88 100%)',
            backgroundSize: '200% 100%',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'shimmer 4s linear infinite',
          }}>
          CRICKPLAY
        </h1>
        <div className="font-display tracking-[0.6em] text-gold-400 neon-gold"
          style={{ fontSize: 'clamp(1.5rem,4vw,2.8rem)' }}>
          ARENA
        </div>
        <p className="font-body text-white/35 mt-3 tracking-wide text-lg">
          Real-time Multiplayer Cricket Quiz
        </p>

        {/* Fact ticker */}
        <div className="mt-5 h-8 overflow-hidden">
          <div key={factIdx} className="flex items-center justify-center gap-2 animate-slide-down">
            <span className="text-base">{fact.icon}</span>
            <span className="font-body text-sm text-white/45">{fact.text}</span>
          </div>
        </div>
      </div>

      {/* ── Card ── */}
      <div className="relative z-10 w-full max-w-[420px] animate-scale-in" style={{ animationDelay:'0.1s' }}>
        {/* Gradient border wrapper */}
        <div className="absolute -inset-[1px] rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(0,255,136,0.5), rgba(64,196,255,0.4), rgba(224,64,251,0.4), rgba(0,255,136,0.5))',
            backgroundSize: '300% 300%',
            animation: 'gradientShift 6s ease infinite',
            borderRadius: '1rem',
          }} />

        <div className="relative rounded-2xl p-7 overflow-hidden"
          style={{ background: 'rgba(4,10,20,0.92)', backdropFilter:'blur(30px)' }}>

          {/* Mode tabs */}
          <div className="flex rounded-xl overflow-hidden mb-6 p-1 gap-1"
            style={{ background:'rgba(255,255,255,0.05)' }}>
            {['create','join'].map(m => (
              <button key={m} onClick={() => { setMode(m); setNameError(''); sound.click(); }}
                className="flex-1 py-2.5 rounded-lg font-display text-lg tracking-widest transition-all duration-250"
                style={mode === m ? {
                  background:'linear-gradient(135deg, #00ff88, #00cc6a)',
                  color:'#04080f',
                  boxShadow:'0 0 20px rgba(0,255,136,0.35)',
                } : { color:'rgba(255,255,255,0.35)' }}>
                {m === 'create' ? '⚡ CREATE' : '🔗 JOIN'}
              </button>
            ))}
          </div>

          {/* Name field */}
          <div className="mb-4">
            <label className="block font-body font-semibold text-white/40 mb-2 text-xs uppercase tracking-[0.2em]">
              Cricket Name
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none">🎮</span>
              <input ref={nameRef} type="text" value={name}
                onChange={e => { setName(e.target.value.slice(0,16)); setNameError(''); }}
                onKeyDown={e => e.key==='Enter' && (mode==='create' ? handleCreate() : handleJoin())}
                placeholder="Enter your name…" maxLength={16}
                className="w-full pl-10 pr-4 py-3 rounded-xl font-body text-lg text-white placeholder:text-white/20
                           transition-all duration-200 outline-none"
                style={{
                  background:'rgba(255,255,255,0.06)',
                  border: nameError ? '2px solid #ff6b35' : '2px solid rgba(255,255,255,0.1)',
                }}
                onFocus={e => { if(!nameError) e.target.style.borderColor='rgba(0,255,136,0.5)'; }}
                onBlur={e  => { if(!nameError) e.target.style.borderColor='rgba(255,255,255,0.1)'; }}
              />
            </div>
          </div>

          {/* Room code field */}
          {mode === 'join' && (
            <div className="mb-4">
              <label className="block font-body font-semibold text-white/40 mb-2 text-xs uppercase tracking-[0.2em]">
                Room Code
              </label>
              <input type="text" value={roomCode}
                onChange={e => { setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6)); setNameError(''); }}
                onKeyDown={e => e.key==='Enter' && handleJoin()}
                placeholder="AB3XYZ" maxLength={6}
                className="w-full px-4 py-3 rounded-xl outline-none transition-all duration-200
                           font-display text-3xl text-center tracking-[0.4em] text-pitch-400
                           placeholder:font-body placeholder:tracking-normal placeholder:text-white/20 placeholder:text-lg"
                style={{
                  background:'rgba(255,255,255,0.06)',
                  border:'2px solid rgba(255,255,255,0.1)',
                }}
                onFocus={e => e.target.style.borderColor='rgba(0,255,136,0.5)'}
                onBlur={e  => e.target.style.borderColor='rgba(255,255,255,0.1)'}
              />
            </div>
          )}

          {/* Validation error */}
          {nameError && (
            <p className="text-ember-400 font-body text-sm mb-3 animate-slide-down flex items-center gap-1">
              <span>⚠️</span> {nameError}
            </p>
          )}

          {/* Connection dot */}
          <div className="flex items-center gap-2 mb-5">
            <span className={`w-2 h-2 rounded-full transition-all ${connected
              ? 'bg-pitch-400 shadow-[0_0_8px_rgba(0,255,136,0.8)] animate-pulse'
              : 'bg-white/20'}`} />
            <span className={`font-body text-sm ${connected ? 'text-pitch-400/55' : 'text-white/25'}`}>
              {connected ? 'Server connected' : 'Connecting…'}
            </span>
          </div>

          {/* CTA */}
          <button onClick={mode==='create' ? handleCreate : handleJoin}
            disabled={loading || !connected}
            className="w-full py-4 rounded-xl font-display text-2xl tracking-widest relative overflow-hidden
                       transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: loading ? 'rgba(0,255,136,0.3)' : 'linear-gradient(135deg, #00ff88, #00dd77)',
              color: '#04080f',
              boxShadow: loading ? 'none' : '0 0 30px rgba(0,255,136,0.4), 0 4px 20px rgba(0,0,0,0.4)',
            }}>
            {/* Shimmer overlay */}
            {!loading && (
              <span className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300"
                style={{ background:'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)' }} />
            )}
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <span className="w-5 h-5 border-2 border-[#04080f]/40 border-t-[#04080f] rounded-full animate-spin" />
                {mode==='create' ? 'CREATING…' : 'JOINING…'}
              </span>
            ) : mode==='create' ? '⚡ CREATE ROOM' : '🏏 JOIN ROOM'}
          </button>

          <p className="text-center text-white/18 text-xs mt-4 font-body">
            No sign-up needed · Instant play
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="relative z-10 flex gap-10 mt-8 text-center animate-fade-in" style={{ animationDelay:'0.3s' }}>
        {[['8','MAX PLAYERS'],['10','QUESTIONS'],['30s','PER QUESTION'],['40+','QUESTION POOL']].map(([val,lbl]) => (
          <div key={lbl}>
            <div className="font-display text-2xl neon-green">{val}</div>
            <div className="font-body text-[10px] text-white/25 uppercase tracking-widest">{lbl}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
