import React from 'react';

const MEDALS = ['🥇','🥈','🥉'];

export default function Leaderboard({ players = [], currentPlayerId, showProgress = false }) {
  if (!players.length) return (
    <div className="text-center py-6 text-white/20 font-body text-sm">
      Scores will appear here…
    </div>
  );

  return (
    <div className="space-y-1.5">
      {players.map((p, idx) => {
        const isMe    = p.id === currentPlayerId;
        const medal   = idx < 3 ? MEDALS[idx] : null;
        const progPct = showProgress && p.total ? Math.round((p.progress / p.total) * 100) : null;

        return (
          <div
            key={p.id}
            className="relative flex items-center gap-2.5 px-3 py-2 rounded-xl
                       transition-all duration-500 overflow-hidden"
            style={{
              background: isMe
                ? `${p.avatar?.color || '#00ff88'}14`
                : 'rgba(255,255,255,0.03)',
              border: isMe
                ? `1px solid ${p.avatar?.color || '#00ff88'}35`
                : '1px solid transparent',
            }}
          >
            {/* Progress bar background (subtle) */}
            {progPct !== null && (
              <div
                className="absolute inset-0 rounded-xl transition-all duration-700"
                style={{
                  background: `linear-gradient(90deg, ${p.avatar?.color || '#00ff88'}0a ${progPct}%, transparent ${progPct}%)`,
                }}
              />
            )}

            {/* Rank */}
            <div className="w-6 text-center shrink-0 font-display text-base relative z-10">
              {medal ?? <span className="text-white/25 text-sm">#{idx+1}</span>}
            </div>

            {/* Avatar emoji */}
            <span className="text-lg shrink-0 relative z-10">{p.avatar?.emoji || '🏏'}</span>

            {/* Name + progress */}
            <div className="flex-1 min-w-0 relative z-10">
              <div
                className="font-body font-semibold text-sm truncate"
                style={{ color: isMe ? (p.avatar?.color || '#00ff88') : 'rgba(255,255,255,0.8)' }}
              >
                {p.name}
                {isMe && <span className="text-[10px] opacity-40 ml-1">(you)</span>}
              </div>
              {showProgress && p.total && (
                <div className="text-[10px] text-white/25 font-body">
                  Q{Math.min(p.progress, p.total)}/{p.total}
                  {p.finished && <span className="text-pitch-400 ml-1">✓ Done</span>}
                </div>
              )}
            </div>

            {/* Score */}
            <div
              className="font-display text-lg shrink-0 relative z-10 transition-all duration-300"
              style={{
                color: p.avatar?.color || '#00ff88',
                textShadow: isMe ? `0 0 10px ${p.avatar?.color || '#00ff88'}66` : 'none',
              }}
            >
              {p.score.toLocaleString()}
            </div>
          </div>
        );
      })}
    </div>
  );
}
