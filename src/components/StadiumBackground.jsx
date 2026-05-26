import React, { useEffect, useRef, useMemo } from 'react';

/* ── Animated canvas orbs + grid + particle system ── */
function OrbCanvas() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Floating orbs
    const orbs = [
      { x:0.15, y:0.2,  r:280, color:'rgba(0,255,136,', speed:0.0004, phase:0    },
      { x:0.82, y:0.75, r:240, color:'rgba(64,196,255,', speed:0.0003, phase:2.1 },
      { x:0.55, y:0.5,  r:200, color:'rgba(224,64,251,', speed:0.0005, phase:4.2 },
      { x:0.2,  y:0.8,  r:180, color:'rgba(255,107,53,', speed:0.0004, phase:1.5 },
    ];

    // Small particles
    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00012,
      vy: (Math.random() - 0.5) * 0.00012,
      size: 0.5 + Math.random() * 1.5,
      alpha: 0.08 + Math.random() * 0.18,
    }));

    let t = 0;
    const draw = () => {
      t += 16;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Orbs
      for (const o of orbs) {
        const px = (o.x + Math.sin(t * o.speed + o.phase) * 0.08) * W;
        const py = (o.y + Math.cos(t * o.speed + o.phase * 1.3) * 0.06) * H;
        const grad = ctx.createRadialGradient(px, py, 0, px, py, o.r);
        grad.addColorStop(0,   `${o.color}0.06)`);
        grad.addColorStop(0.5, `${o.color}0.03)`);
        grad.addColorStop(1,   `${o.color}0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, o.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Particles
      for (const p of particles) {
        p.x = (p.x + p.vx + 1) % 1;
        p.y = (p.y + p.vy + 1) % 1;
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,255,136,${p.alpha})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

export default function StadiumBackground({ intensity = 'normal' }) {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Deep gradient base */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 120% 80% at 50% -10%, rgba(0,255,136,0.06) 0%, transparent 55%), radial-gradient(ellipse 80% 60% at 85% 90%, rgba(64,196,255,0.05) 0%, transparent 50%), #04080f',
        }}
      />

      {/* Animated canvas */}
      <OrbCanvas />

      {/* Grid overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,255,136,0.022) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,136,0.022) 1px, transparent 1px)
          `,
          backgroundSize: '70px 70px',
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 90% 90% at 50% 50%, transparent 40%, rgba(4,8,15,0.7) 100%)',
        }}
      />

      {/* Scanlines */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,1) 3px, rgba(0,0,0,1) 4px)',
        }}
      />
    </div>
  );
}
