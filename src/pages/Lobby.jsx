import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../socket';
import { useGameStore } from '../store/gameStore';
import Avatar3D from '../components/Avatar3D';
import StadiumBackground from '../components/StadiumBackground';
import { sound } from '../utils/sound';

/* ─── Player card shown in lobby grid ─── */
function PlayerCard({ p, isMe, index }) {
  return (
    <div
      className="relative flex flex-col items-center gap-2 p-4 rounded-2xl
                 transition-all duration-400 animate-scale-in overflow-hidden"
      style={{
        animationDelay: `${index * 0.07}s`,
        background: isMe
          ? `linear-gradient(135deg, ${p.avatar?.color || '#00ff88'}14, rgba(255,255,255,0.03))`
          : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isMe ? (p.avatar?.color || '#00ff88') + '35' : 'rgba(255,255,255,0.07)'}`,
      }}
    >
      {/* Host crown / ready checkmark */}
      {p.isHost && (
        <div className="absolute top-2 right-2 text-sm animate-float" style={{ animationDelay:`${index*0.2}s` }}>
          👑
        </div>
      )}
      {!p.isHost && p.isReady && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center
                        text-[10px] font-bold text-[#04080f]"
          style={{ background: '#00ff88', boxShadow:'0 0 8px rgba(0,255,136,0.6)' }}>
          ✓
        </div>
      )}

      <div className="relative">
        <Avatar3D avatarId={p.avatar?.id || 'bat'} size={84} rotating={isMe} />
        {/* Online pulse */}
        <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-pitch-400
                        border-2 border-[#04080f] animate-pulse-ring" />
      </div>

      <div className="text-center w-full">
        <div className="font-body font-bold text-sm truncate px-1"
          style={{ color: isMe ? (p.avatar?.color || '#00ff88') : 'rgba(255,255,255,0.85)' }}>
          {p.name}
        </div>
        <div className="text-xs font-body mt-0.5">
          {p.isHost
            ? <span className="text-gold-400 font-semibold">HOST</span>
            : p.isReady
            ? <span className="text-pitch-400">READY ✓</span>
            : <span className="text-white/25">waiting…</span>}
        </div>
      </div>
    </div>
  );
}

/* ─── Empty slot placeholder ─── */
function EmptySlot() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl
                    border border-dashed border-white/8 min-h-[148px]">
      <div className="text-3xl text-white/10">+</div>
      <div className="font-body text-xs text-white/15">Empty slot</div>
    </div>
  );
}

/* ─── Chat bubble ─── */
function ChatBubble({ msg, isMe }) {
  return (
    <div className={`flex gap-2 items-start animate-fade-in ${isMe ? 'flex-row-reverse' : ''}`}>
      <span className="text-lg shrink-0 mt-0.5">{msg.avatar?.emoji || '🏏'}</span>
      <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
        <span className="font-body text-[10px] font-semibold px-1"
          style={{ color: msg.avatar?.color || '#00ff88' }}>
          {isMe ? 'You' : msg.playerName}
        </span>
        <div className="font-body text-sm text-white/70 px-3 py-2 rounded-2xl break-words"
          style={{
            background: isMe ? 'rgba(0,255,136,0.12)' : 'rgba(255,255,255,0.06)',
            border: isMe ? '1px solid rgba(0,255,136,0.2)' : '1px solid rgba(255,255,255,0.07)',
            borderBottomRightRadius: isMe ? 4 : undefined,
            borderBottomLeftRadius: !isMe ? 4 : undefined,
          }}>
          {msg.message}
        </div>
      </div>
    </div>
  );
}

export default function Lobby() {
  const navigate = useNavigate();
  const { roomId, player, players, gameState, countdown, chatMessages } = useGameStore();

  const [chatInput, setChatInput]   = useState('');
  const [copied,    setCopied]      = useState(false);
  const [isReady,   setIsReady]     = useState(false);
  const [starting,  setStarting]    = useState(false);
  const chatEndRef  = useRef(null);
  const inputRef    = useRef(null);
  const prevCount   = useRef(null);

  /* Auto-scroll chat */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  /* Countdown sounds */
  useEffect(() => {
    if (countdown !== null && countdown !== prevCount.current) {
      sound.countdownTick(countdown);
      prevCount.current = countdown;
    }
  }, [countdown]);

  /* Join sound when player count changes */
  const prevLen = useRef(players.length);
  useEffect(() => {
    if (players.length > prevLen.current) sound.join();
    prevLen.current = players.length;
  }, [players.length]);

  /* Navigate when game starts */
  useEffect(() => {
    if (gameState === 'playing') navigate('/game');
  }, [gameState, navigate]);

  if (!roomId || !player) { navigate('/'); return null; }

  const inviteLink = `${window.location.origin}/join/${roomId}`;

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink).catch(() => {});
    setCopied(true);
    sound.click();
    setTimeout(() => setCopied(false), 2500);
  };

  const toggleReady = () => {
    const next = !isReady;
    setIsReady(next);
    sound.click();
    socket.emit('setReady', { roomId, ready: next });
  };

  const handleStart = () => {
    sound.click();
    setStarting(true);
    socket.emit('startGame', { roomId }, (res) => {
      if (res?.error) {
        setStarting(false);
        useGameStore.getState().setError(res.error);
      }
    });
  };

  const sendChat = useCallback(() => {
    if (!chatInput.trim()) return;
    socket.emit('lobbyChat', { roomId, message: chatInput.trim() });
    setChatInput('');
    inputRef.current?.focus();
  }, [chatInput, roomId]);

  const isHost  = player.isHost;
  const slots   = [...players, ...Array(Math.max(0, 4 - players.length)).fill(null)];
  const myId    = player.id;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <StadiumBackground />

      {/* ── Countdown full-screen overlay ── */}
      {gameState === 'countdown' && countdown !== null && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{ background:'rgba(4,8,15,0.92)', backdropFilter:'blur(18px)' }}>

          <p className="font-body text-white/35 uppercase tracking-[0.35em] text-base mb-4">
            Game starting in
          </p>

          {/* Giant number */}
          <div key={countdown} className="animate-countdown-pop font-display leading-none"
            style={{
              fontSize:'clamp(9rem,22vw,18rem)',
              background:'linear-gradient(135deg, #00ff88, #40c4ff)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
              backgroundClip:'text',
              filter:'drop-shadow(0 0 40px rgba(0,255,136,0.7))',
            }}>
            {countdown}
          </div>

          {/* Player avatars strip */}
          <div className="flex gap-3 items-end mt-8">
            {players.map((p, i) => (
              <div key={p.id} className="flex flex-col items-center gap-1 animate-slide-up"
                style={{ animationDelay:`${i * 0.1}s` }}>
                <Avatar3D avatarId={p.avatar?.id || 'bat'} size={52} rotating={false} />
                <span className="font-body text-xs text-white/35 max-w-[60px] truncate text-center">
                  {p.name}
                </span>
              </div>
            ))}
          </div>

          <p className="font-body text-pitch-400/50 mt-6 text-sm tracking-wide">
            🏏 Each player gets their own question set!
          </p>
        </div>
      )}

      {/* ── Main layout ── */}
      <div className="relative z-10 flex flex-col lg:flex-row gap-4 p-4 max-w-6xl mx-auto min-h-screen">

        {/* ────── Left column ────── */}
        <div className="flex-1 flex flex-col gap-4">

          {/* Room header card */}
          <div className="glass rounded-2xl p-5 animate-slide-down">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-pitch-400 animate-pulse"
                    style={{ boxShadow:'0 0 8px rgba(0,255,136,0.9)' }} />
                  <span className="font-body text-xs text-pitch-400/65 uppercase tracking-[0.25em]">Live Lobby</span>
                </div>
                <h1 className="font-display text-5xl tracking-widest leading-none"
                  style={{ color:'#00ff88', textShadow:'0 0 20px rgba(0,255,136,0.4)' }}>
                  LOBBY
                </h1>
                <p className="font-body text-white/35 text-sm mt-1">
                  {players.length}/8 players · Independent questions mode
                </p>
              </div>

              {/* Room code badge */}
              <div className="text-right shrink-0">
                <div className="font-display text-4xl tracking-widest"
                  style={{ color:'#00ff88', textShadow:'0 0 15px rgba(0,255,136,0.5)' }}>
                  {roomId}
                </div>
                <div className="text-white/25 text-xs font-body uppercase tracking-widest mt-0.5">Room Code</div>
              </div>
            </div>

            {/* Invite link row */}
            <div className="flex gap-2 mt-4">
              <div className="flex-1 min-w-0 px-3 py-2 rounded-xl font-mono text-xs text-white/28 truncate"
                style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
                {inviteLink}
              </div>
              <button onClick={copyLink}
                className="shrink-0 px-4 py-2 rounded-xl font-body font-semibold text-sm
                           transition-all duration-250 active:scale-95"
                style={copied ? {
                  background:'#00ff88', color:'#04080f',
                  boxShadow:'0 0 16px rgba(0,255,136,0.5)',
                } : {
                  background:'rgba(0,255,136,0.1)',
                  border:'1px solid rgba(0,255,136,0.3)',
                  color:'#00ff88',
                }}>
                {copied ? '✓ Copied!' : '📋 Copy Link'}
              </button>
            </div>
          </div>

          {/* Players grid */}
          <div className="glass rounded-2xl p-5 flex-1 animate-slide-up" style={{ animationDelay:'0.1s' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl tracking-widest text-white/40">PLAYERS</h3>
              {/* Slot pips */}
              <div className="flex gap-1.5">
                {Array(8).fill(0).map((_,i) => (
                  <div key={i} className="w-2 h-2 rounded-full transition-all duration-300"
                    style={{
                      background: i < players.length ? '#00ff88' : 'rgba(255,255,255,0.1)',
                      boxShadow:  i < players.length ? '0 0 5px rgba(0,255,136,0.6)' : 'none',
                    }} />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {slots.map((p, i) =>
                p ? (
                  <PlayerCard key={p.id} p={p} isMe={p.id === myId} index={i} />
                ) : (
                  <EmptySlot key={`e${i}`} />
                )
              )}
            </div>

            {/* Info banner */}
            <div className="mt-4 flex items-start gap-3 px-4 py-3 rounded-xl"
              style={{ background:'rgba(64,196,255,0.07)', border:'1px solid rgba(64,196,255,0.15)' }}>
              <span className="text-xl shrink-0">⚡</span>
              <p className="font-body text-sm text-white/45 leading-relaxed">
                <span className="text-cyan-400 font-semibold">Independent mode active.</span>{' '}
                Each player gets their own random questions and timer — no waiting for others!
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 animate-slide-up" style={{ animationDelay:'0.2s' }}>
            {isHost ? (
              <button onClick={handleStart} disabled={starting}
                className="flex-1 py-4 rounded-xl font-display text-2xl tracking-widest
                           relative overflow-hidden active:scale-[0.98]
                           transition-all duration-200 disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
                  color: '#04080f',
                  boxShadow: starting ? 'none' : '0 0 35px rgba(0,255,136,0.5), 0 4px 20px rgba(0,0,0,0.4)',
                }}>
                {/* Shimmer */}
                <span className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity"
                  style={{ background:'linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.15) 50%,transparent 70%)' }} />
                {starting ? (
                  <span className="flex items-center justify-center gap-3 relative">
                    <span className="w-5 h-5 border-2 border-[#04080f]/40 border-t-[#04080f] rounded-full animate-spin" />
                    STARTING GAME…
                  </span>
                ) : (
                  <span className="relative">
                    ⚡ START GAME
                    <span className="text-sm ml-2 opacity-60">({players.length} player{players.length !== 1 ? 's' : ''})</span>
                  </span>
                )}
              </button>
            ) : (
              <button onClick={toggleReady}
                className="flex-1 py-4 rounded-xl font-display text-2xl tracking-widest
                           border-2 transition-all duration-250 active:scale-[0.98]"
                style={isReady ? {
                  borderColor: '#00ff88',
                  background: 'rgba(0,255,136,0.12)',
                  color: '#00ff88',
                  boxShadow: '0 0 20px rgba(0,255,136,0.25)',
                } : {
                  borderColor: 'rgba(255,255,255,0.15)',
                  color: 'rgba(255,255,255,0.4)',
                }}>
                {isReady ? '✓ READY!' : '🏏 READY UP'}
              </button>
            )}
          </div>
        </div>

        {/* ────── Right column: Chat ────── */}
        <div className="w-full lg:w-72 glass rounded-2xl p-4 flex flex-col animate-slide-left"
          style={{ animationDelay:'0.15s', maxHeight:'calc(100vh - 2rem)', minHeight: 320 }}>

          <div className="flex items-center gap-2 mb-3 shrink-0">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <h3 className="font-display text-lg tracking-widest text-white/40">LOBBY CHAT</h3>
            <span className="ml-auto font-body text-xs text-white/20">{chatMessages.length}</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3">
            {chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="text-4xl mb-2 opacity-20">💬</div>
                <p className="font-body text-white/20 text-sm">Be the first to say hello!</p>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <ChatBubble key={i} msg={msg} isMe={msg.playerId === myId} />
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2 shrink-0">
            <input ref={inputRef} type="text" value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendChat()}
              placeholder="Say something…" maxLength={200}
              className="flex-1 min-w-0 px-3 py-2.5 rounded-xl font-body text-sm text-white
                         placeholder:text-white/20 outline-none transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(0,255,136,0.4)'}
              onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
            <button onClick={sendChat} disabled={!chatInput.trim()}
              className="shrink-0 w-10 h-10 rounded-xl font-body font-bold text-lg
                         flex items-center justify-center
                         transition-all duration-200 active:scale-90 disabled:opacity-30"
              style={{
                background: 'rgba(0,255,136,0.15)',
                border: '1px solid rgba(0,255,136,0.3)',
                color: '#00ff88',
              }}>
              ↑
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
