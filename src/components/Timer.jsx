import React, { useMemo } from 'react';

export default function Timer({ timeLeft, maxTime = 30, size = 96 }) {
  const radius      = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress    = Math.max(0, Math.min(1, timeLeft / maxTime));
  const dashOffset  = circumference * (1 - progress);

  const { stroke, textColor, glowColor } = useMemo(() => {
    if (progress > 0.55) return { stroke:'#00ff88', textColor:'#00ff88', glowColor:'rgba(0,255,136,0.5)' };
    if (progress > 0.25) return { stroke:'#ffd700', textColor:'#ffd700', glowColor:'rgba(255,215,0,0.5)'  };
    return               { stroke:'#ff6b35', textColor:'#ff6b35', glowColor:'rgba(255,107,53,0.6)' };
  }, [progress]);

  const urgent  = progress <= 0.25;
  const warning = progress <= 0.55 && progress > 0.25;

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full ${urgent ? 'animate-pulse-fast' : ''}`}
      style={{ width: size, height: size }}
    >
      {/* Outer glow ring */}
      <div
        className="absolute inset-0 rounded-full transition-all duration-300"
        style={{ boxShadow: urgent ? `0 0 22px ${glowColor}, 0 0 44px ${glowColor}55` : `0 0 12px ${glowColor}44` }}
      />

      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 absolute">
        {/* Track */}
        <circle cx={size/2} cy={size/2} r={radius} fill="none"
          stroke="rgba(255,255,255,0.07)" strokeWidth="6" />
        {/* Progress arc */}
        <circle cx={size/2} cy={size/2} r={radius} fill="none"
          stroke={stroke} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={dashOffset}
          style={{
            transition: 'stroke-dashoffset 0.92s linear, stroke 0.35s ease',
            filter: `drop-shadow(0 0 5px ${glowColor})`,
          }}
        />
      </svg>

      {/* Number */}
      <div className="relative flex flex-col items-center justify-center">
        <span
          className="font-display leading-none"
          style={{
            fontSize: size * 0.33,
            color: textColor,
            textShadow: `0 0 14px ${glowColor}`,
            transition: 'color 0.35s ease',
          }}
        >
          {timeLeft}
        </span>
        <span className="font-body text-white/25 leading-none" style={{ fontSize: size * 0.11 }}>
          SEC
        </span>
      </div>
    </div>
  );
}
