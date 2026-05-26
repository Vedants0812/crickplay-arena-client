import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../socket';
import { useGameStore } from '../store/gameStore';
import Avatar3D from '../components/Avatar3D';
import Confetti from '../components/Confetti';
import StadiumBackground from '../components/StadiumBackground';
import { sound } from '../utils/sound';

const MEDALS  = ['🥇','🥈','🥉'];
const COLORS  = ['#ffd700','#c0c0c0','#cd7f32'];
const HEIGHTS = ['h-40','h-28','h-20'];
// Podium order: 2nd left, 1st centre, 3rd right
const PODIUM_INDICES = [1, 0, 2];
const PODIUM_DELAYS  = ['0.35s','0.1s','0.55s'];

/* ── Animated score counter ── */
function AnimatedScore({ target, duration = 1800 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setVal(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return <span>{val.toLocaleString()}</span>;
}

/* ── Podium step ── */
function PodiumStep({ entry, podiumIdx, revealed }) {
  const rank  = PODIUM_INDICES[podiumIdx];
  const color = COLORS[rank];
  const delay = PODIUM_DELAYS[podiumIdx];

  if (!entry) return <div className="flex-1" />;

  return (
    <div className={`flex flex-col items-center gap-3 flex-1 ${revealed ? 'animate-slide-up' : 'opacity-0'}`}
      style={{ animationDelay: delay }}>

      <span className="text-4xl">{MEDALS[rank]}</span>

      <div className="relative">
        <div className="absolute inset-0 rounded-xl blur-xl scale-90"
          style={{ background: `${color}30` }} />
        <Avatar3D avatarId={entry.avatar?.id || 'bat'} size={rank === 0 ? 110 : 88} rotating />
        {rank === 0 && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-3xl animate-float">👑</div>
        )}
      </div>

      <div className="text-center">
        <div className="font-body font-bold text-sm" style={{ color }}>{entry.name}</div>
        <div className="font-display text-2xl" style={{ color, textShadow:`0 0 12px ${color}88` }}>
          <AnimatedScore target={entry.score} duration={rank === 0 ? 2000 : 1600} />
        </div>
        <div className="text-white/20 font-body text-xs">pts</div>
      </div>

      {/* Podium block */}
      <div className={`${HEIGHTS[rank]} w-28 rounded-t-xl flex items-end justify-center pb-3`}
        style={{
          background: `linear-gradient(180deg, ${color}22, ${color}0a)`,
          border: `1px solid ${color}30`,
        }}>
        <span className="font-display text-3xl" style={{ color:`${color}60` }}>{rank+1}</span>
      </div>
    </div>
  );
}

/* ── Result row ── */
function ResultRow({ entry, rank, isMe, delay }) {
  const medal = rank < 3 ? MEDALS[rank] : null;
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl animate-slide-left transition-all"
      style={{
        animationDelay: delay,
        background: isMe ? `${entry.avatar?.color || '#00ff88'}10` : 'rgba(255,255,255,0.025)',
        border: isMe ? `1px solid ${entry.avatar?.color || '#00ff88'}30` : '1px solid transparent',
      }}>
      <div className="w-8 text-center font-display text-xl shrink-0">
        {medal ?? <span className="text-white/25 text-sm">#{rank+1}</span>}
      </div>
      <span className="text-2xl shrink-0">{entry.avatar?.emoji || '🏏'}</span>
      <div className="flex-1 min-w-0">
        <span className="font-body font-bold text-sm block truncate"
          style={{ color: isMe ? entry.avatar?.color||'#00ff88' : 'rgba(255,255,255,0.78)' }}>
          {entry.name}{isMe && <span className="text-[10px] opacity-40 ml-1">(you)</span>}
        </span>
        {entry.finished && (
          <span className="text-[10px] text-pitch-400/50 font-body">✓ Completed</span>
        )}
      </div>
      <div className="font-display text-xl shrink-0" style={{ color: entry.avatar?.color || '#00ff88' }}>
        {entry.score.toLocaleString()}
        <span className="font-body text-xs text-white/20 ml-1">pts</span>
      </div>
    </div>
  );
}

export default function Results() {
  const navigate = useNavigate();
  const { roomId, player, finalLeaderboard, reset, resetGame } = useGameStore();
  const [confetti,   setConfetti]   = useState(false);
  const [revealed,   setRevealed]   = useState(false);
  const [showRows,   setShowRows]   = useState(false);
  const [playAgainLoading, setPAL]  = useState(false);

  useEffect(() => {
    if (!roomId || !player) { navigate('/'); return; }
    // Staggered reveal
    setTimeout(() => setRevealed(true),  400);
    setTimeout(() => setConfetti(true),  900);
    setTimeout(() => setShowRows(true),  1100);
    const myRank = finalLeaderboard.findIndex(p => p.id === player?.id) + 1;
    if (myRank === 1) setTimeout(() => sound.winner(), 800);
  }, []);

  if (!roomId || !player) return null;

  const myRank = finalLeaderboard.findIndex(p => p.id === player?.id) + 1;
  const podiumEntries = PODIUM_INDICES.map(i => finalLeaderboard[i]);

  const handlePlayAgain = () => {
    setPAL(true); sound.click();
    socket.emit('playAgain', { roomId }, (res) => {
      if (res?.error) { setPAL(false); useGameStore.getState().setError(res.error); }
    });
  };

  const handleLeave = () => { sound.click(); reset(); navigate('/'); };

  const resultMsg = myRank === 1 ? '🎉 Champion! Unbeatable cricket knowledge!'
    : myRank === 2 ? '🥈 So close! Silver finish!'
    : myRank === 3 ? '🥉 Bronze medal — well played!'
    : `You finished #${myRank} — keep practicing!`;

  return (
    <div className="min-h-screen relative flex flex-col items-center px-4 py-10 overflow-x-hidden">
      <StadiumBackground intensity="heavy" />
      <Confetti trigger={confetti} type="winner" />

      <div className="relative z-10 w-full max-w-2xl">

        {/* ── Header ── */}
        <div className="text-center mb-10 animate-slide-down">
          <div className="text-6xl mb-3 animate-bounce">🏆</div>
          <h1 className="font-display tracking-widest leading-none mb-3"
            style={{
              fontSize:'clamp(3rem,10vw,5.5rem)',
              background:'linear-gradient(135deg, #ffd700, #ff8c00, #ffd700)',
              backgroundSize:'200% 100%',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
              backgroundClip:'text',
              animation:'shimmer 3s linear infinite',
              textShadow:'none',
            }}>
            GAME OVER
          </h1>
          <p className="font-body text-lg text-white/55">{resultMsg}</p>

          {/* My result pill */}
          {finalLeaderboard[myRank-1] && (
            <div className="mt-4 inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl glass border border-white/10">
              <span className="text-2xl">{finalLeaderboard[myRank-1]?.avatar?.emoji || '🏏'}</span>
              <div className="text-left">
                <div className="font-body font-bold text-white/70 text-sm">{player.name}</div>
                <div className="font-display text-xl"
                  style={{ color: finalLeaderboard[myRank-1]?.avatar?.color || '#00ff88' }}>
                  <AnimatedScore target={finalLeaderboard[myRank-1]?.score || 0} />
                  <span className="font-body text-xs text-white/25 ml-1">pts</span>
                </div>
              </div>
              <div className="ml-1">
                {myRank <= 3
                  ? <span className="text-3xl">{MEDALS[myRank-1]}</span>
                  : <span className="font-display text-2xl text-white/30">#{myRank}</span>}
              </div>
            </div>
          )}
        </div>

        {/* ── Podium ── */}
        {finalLeaderboard.length > 0 && (
          <div className="flex items-end justify-center gap-2 mb-10 px-2">
            {podiumEntries.map((e, i) => (
              <PodiumStep key={e?.id || i} entry={e} podiumIdx={i} revealed={revealed} />
            ))}
          </div>
        )}

        {/* ── Full leaderboard ── */}
        <div className="glass rounded-2xl p-6 mb-6">
          <h3 className="font-display text-2xl tracking-widest text-white/35 mb-4">FINAL STANDINGS</h3>
          <div className="space-y-2">
            {showRows && finalLeaderboard.map((entry, i) => (
              <ResultRow key={entry.id} entry={entry} rank={i}
                isMe={entry.id === player?.id}
                delay={`${0.04 + i * 0.07}s`} />
            ))}
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex flex-col sm:flex-row gap-3 animate-slide-up" style={{ animationDelay:'0.5s' }}>
          {player?.isHost && (
            <button onClick={handlePlayAgain} disabled={playAgainLoading}
              className="flex-1 py-4 rounded-xl font-display text-2xl tracking-widest text-[#04080f]
                         transition-all duration-200 active:scale-[0.97] disabled:opacity-50"
              style={{
                background:'linear-gradient(135deg, #00ff88, #00dd77)',
                boxShadow:'0 0 30px rgba(0,255,136,0.4)',
              }}>
              {playAgainLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-[#04080f]/40 border-t-[#04080f] rounded-full animate-spin" />
                  SETTING UP…
                </span>
              ) : '⚡ PLAY AGAIN'}
            </button>
          )}
          <button onClick={handleLeave}
            className="flex-1 py-4 rounded-xl font-display text-2xl tracking-widest
                       border-2 border-white/12 text-white/35
                       hover:border-white/25 hover:text-white/55
                       transition-all duration-200 active:scale-[0.97]">
            🚪 LEAVE ARENA
          </button>
        </div>

        {!player?.isHost && (
          <p className="text-center text-white/20 font-body text-sm mt-4">
            Waiting for host to start a rematch…
          </p>
        )}
      </div>
    </div>
  );
}
