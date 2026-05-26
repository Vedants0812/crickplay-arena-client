import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../socket';
import { useGameStore } from '../store/gameStore';
import Avatar3D from '../components/Avatar3D';
import StadiumBackground from '../components/StadiumBackground';
import { AVATAR_LIST } from '../store/gameStore';
import { sound } from '../utils/sound';

const AVATAR_DESC = {
  bat:        'Master of boundaries & towering sixes',
  bowl:       'Destroyer of batting lineups',
  keeper:     'The last line of defence behind the stumps',
  allrounder: 'Equally lethal with bat and ball',
  captain:    'The tactical mastermind on the field',
  fielder:    'Lightning-fast in the deep outfield',
};

const AVATAR_STATS = {
  bat:        { Power:90, Speed:65, Defense:70, IQ:75 },
  bowl:       { Power:80, Speed:85, Defense:60, IQ:80 },
  keeper:     { Power:60, Speed:75, Defense:95, IQ:85 },
  allrounder: { Power:85, Speed:80, Defense:80, IQ:90 },
  captain:    { Power:70, Speed:70, Defense:85, IQ:95 },
  fielder:    { Power:65, Speed:95, Defense:75, IQ:75 },
};

function StatBar({ label, value, color }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-body text-xs text-white/35 w-16 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, ${color}, ${color}cc)`,
            boxShadow: `0 0 6px ${color}66`,
          }}
        />
      </div>
      <span className="font-mono text-xs w-6 text-right shrink-0" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

export default function AvatarSelect() {
  const navigate = useNavigate();
  const { roomId, player, setPlayer, setGameState } = useGameStore();
  const [selectedId,  setSelectedId]  = useState(player?.avatar?.id || 'bat');
  const [confirming,  setConfirming]  = useState(false);
  const [hoveredId,   setHoveredId]   = useState(null);

  useEffect(() => { sound.transition(); }, []);

  if (!roomId || !player) { navigate('/'); return null; }

  const selected  = AVATAR_LIST.find(a => a.id === selectedId);
  const hovered   = hoveredId ? AVATAR_LIST.find(a => a.id === hoveredId) : null;
  const displayed = hovered || selected;
  const stats     = AVATAR_STATS[selectedId];

  const handleSelect = (id) => {
    if (id === selectedId) return;
    setSelectedId(id);
    sound.click();
  };

  const handleConfirm = () => {
    const avatar = AVATAR_LIST.find(a => a.id === selectedId);
    socket.emit('selectAvatar', { roomId, avatarId: selectedId });
    setPlayer({ ...player, avatar });
    setConfirming(true);
    sound.join();
    setTimeout(() => { setGameState('lobby'); navigate('/lobby'); }, 700);
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center px-4 py-10 overflow-hidden">
      <StadiumBackground />

      <div className="relative z-10 w-full max-w-4xl">

        {/* ── Header ── */}
        <div className="text-center mb-8 animate-slide-down">
          <p className="font-body text-white/25 uppercase tracking-[0.35em] text-xs mb-3">
            Step 2 of 2 — Choose your fighter
          </p>
          <h1 className="font-display tracking-widest leading-none"
            style={{
              fontSize: 'clamp(2.8rem, 8vw, 5rem)',
              background: 'linear-gradient(135deg, #00ff88 0%, #40c4ff 60%, #00ff88 100%)',
              backgroundSize: '200% 100%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'shimmer 4s linear infinite',
            }}>
            CHOOSE AVATAR
          </h1>
          <p className="font-body text-white/30 mt-2">Pick your cricket persona for the battle</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── Left: Big preview ── */}
          <div className="lg:w-72 flex flex-col items-center gap-4 animate-scale-in mx-auto lg:mx-0">

            {/* 3D preview */}
            <div className="relative">
              {/* Glow backdrop */}
              <div className="absolute inset-0 rounded-2xl blur-3xl scale-75 transition-all duration-500"
                style={{ background: `radial-gradient(circle, ${selected.color}40 0%, transparent 70%)` }} />

              <div className="relative rounded-2xl overflow-hidden"
                style={{ border: `2px solid ${selected.color}40` }}>
                <Avatar3D avatarId={selectedId} size={220} rotating selected />
              </div>

              {/* Selection ring pulse */}
              <div className="absolute inset-0 rounded-2xl pointer-events-none animate-pulse-ring"
                style={{ borderRadius: '1rem' }} />
            </div>

            {/* Name + desc */}
            <div className="text-center">
              <div className="font-display text-2xl tracking-widest transition-all duration-300"
                style={{ color: selected.color, textShadow: `0 0 15px ${selected.color}66` }}>
                {selected.emoji} {selected.name}
              </div>
              <p className="font-body text-white/35 text-sm mt-1.5 max-w-[220px] leading-snug">
                {AVATAR_DESC[selectedId]}
              </p>
            </div>

            {/* Stat bars */}
            <div className="w-full space-y-2 p-4 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="font-display text-sm tracking-widest text-white/30 mb-3">STATS</p>
              {Object.entries(stats).map(([label, value]) => (
                <StatBar key={label} label={label} value={value} color={selected.color} />
              ))}
            </div>
          </div>

          {/* ── Right: Grid + button ── */}
          <div className="flex-1 w-full">

            {/* Grid */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {AVATAR_LIST.map((av, i) => {
                const isSelected = selectedId === av.id;
                return (
                  <button key={av.id}
                    onClick={() => handleSelect(av.id)}
                    onMouseEnter={() => setHoveredId(av.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className="group relative flex flex-col items-center gap-2 p-3 rounded-2xl
                               transition-all duration-200 animate-scale-in overflow-hidden"
                    style={{
                      animationDelay: `${i * 0.06}s`,
                      border: isSelected
                        ? `2px solid ${av.color}`
                        : '2px solid rgba(255,255,255,0.07)',
                      background: isSelected
                        ? `linear-gradient(135deg, ${av.color}18, ${av.color}08)`
                        : 'rgba(255,255,255,0.025)',
                      boxShadow: isSelected ? `0 0 20px ${av.color}30` : 'none',
                      transform: isSelected ? 'scale(1.04)' : undefined,
                    }}>

                    {/* Hover shimmer */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"
                      style={{ background: `linear-gradient(135deg, ${av.color}0a, transparent)` }} />

                    <Avatar3D
                      avatarId={av.id}
                      size={74}
                      rotating={isSelected}
                      selected={isSelected}
                    />

                    <div className="text-center relative z-10">
                      <div className="font-body font-semibold text-xs leading-tight"
                        style={{ color: isSelected ? av.color : 'rgba(255,255,255,0.45)' }}>
                        {av.emoji} {av.name.replace('The ', '')}
                      </div>
                    </div>

                    {/* Selected checkmark */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full
                                      flex items-center justify-center text-[10px] font-bold text-[#04080f]
                                      animate-pop-in"
                        style={{ background: av.color }}>
                        ✓
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Confirm button */}
            <button onClick={handleConfirm} disabled={confirming}
              className="w-full py-4 rounded-xl font-display text-2xl tracking-widest relative overflow-hidden
                         transition-all duration-200 active:scale-[0.98] disabled:opacity-60"
              style={{
                background: confirming
                  ? `${selected.color}60`
                  : `linear-gradient(135deg, ${selected.color}, ${selected.color}cc)`,
                color: '#04080f',
                boxShadow: confirming ? 'none' : `0 0 30px ${selected.color}50, 0 4px 20px rgba(0,0,0,0.4)`,
              }}>
              {/* Shimmer */}
              <span className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity rounded-xl pointer-events-none"
                style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)' }} />

              {confirming ? (
                <span className="flex items-center justify-center gap-3 relative">
                  <span className="w-5 h-5 border-2 border-[#04080f]/40 border-t-[#04080f] rounded-full animate-spin" />
                  ENTERING LOBBY…
                </span>
              ) : (
                <span className="relative">
                  {selected.emoji} PLAY AS {selected.name.toUpperCase()}
                </span>
              )}
            </button>

            <p className="text-center text-white/18 font-body text-xs mt-3">
              You can't change avatar once the game starts
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
