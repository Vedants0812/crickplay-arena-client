import { useEffect } from 'react';
import confetti from 'canvas-confetti';

export default function Confetti({ trigger = true, type = 'winner' }) {
  useEffect(() => {
    if (!trigger) return;

    if (type === 'winner') {
      // Epic winner burst
      const count = 300;
      const defaults = { origin: { y: 0.7 } };

      function fire(particleRatio, opts) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      }

      fire(0.25, { spread: 26, startVelocity: 55, colors: ['#ffd700', '#ff6b35'] });
      fire(0.2, { spread: 60, colors: ['#00ff88', '#40c4ff'] });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ['#e040fb', '#ffd700'] });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45, colors: ['#00ff88'] });

      // Repeat a few times
      setTimeout(() => {
        confetti({ particleCount: 100, spread: 70, origin: { x: 0.1, y: 0.6 }, colors: ['#ffd700', '#ff6b35'] });
        confetti({ particleCount: 100, spread: 70, origin: { x: 0.9, y: 0.6 }, colors: ['#00ff88', '#40c4ff'] });
      }, 500);

      setTimeout(() => {
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.4 }, colors: ['#ffd700', '#e040fb', '#00ff88'] });
      }, 1000);
    } else if (type === 'correct') {
      confetti({
        particleCount: 60,
        spread: 55,
        origin: { y: 0.8 },
        colors: ['#00ff88', '#40c4ff'],
        ticks: 100,
        gravity: 1.2,
        scalar: 0.8,
      });
    }
  }, [trigger, type]);

  return null;
}
