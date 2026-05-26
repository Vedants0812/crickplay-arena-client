// ─────────────────────────────────────────────────────────────
//  CrickPlay Arena – Sound Engine v2
//  Pure Web Audio API — zero external files, zero dependencies
// ─────────────────────────────────────────────────────────────
class SoundManager {
  constructor() {
    this.ctx     = null;
    this.enabled = true;
    this.volume  = 0.55; // master volume multiplier
    this._init();
  }

  _init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      this.enabled = false;
    }
  }

  _resume() {
    if (this.ctx?.state === 'suspended') this.ctx.resume();
  }

  toggle() { this.enabled = !this.enabled; return this.enabled; }
  setVolume(v) { this.volume = Math.max(0, Math.min(1, v)); }

  // ── Core synth helpers ─────────────────────────────────────
  _tone({ freq=440, type='sine', dur=0.15, gain=0.3, attack=0.005, release=0.1, delay=0 }={}) {
    if (!this.enabled || !this.ctx) return;
    this._resume();
    const t   = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.connect(env);
    env.connect(this.ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(gain * this.volume, t + attack);
    env.gain.setValueAtTime(gain * this.volume, t + dur - release);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.start(t);
    osc.stop(t + dur + 0.01);
  }

  _noise({ dur=0.1, gain=0.15, delay=0 }={}) {
    if (!this.enabled || !this.ctx) return;
    this._resume();
    const t      = this.ctx.currentTime + delay;
    const bufLen = Math.ceil(this.ctx.sampleRate * dur);
    const buf    = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
    const data   = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
    const src  = this.ctx.createBufferSource();
    const env  = this.ctx.createGain();
    const filt = this.ctx.createBiquadFilter();
    src.buffer = buf;
    filt.type  = 'bandpass';
    filt.frequency.value = 600;
    src.connect(filt); filt.connect(env); env.connect(this.ctx.destination);
    env.gain.setValueAtTime(gain * this.volume, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.start(t);
    src.stop(t + dur + 0.01);
  }

  // ── Sound effects ──────────────────────────────────────────

  /** UI button click */
  click() {
    this._tone({ freq:800, type:'sine',   dur:0.06, gain:0.18, attack:0.002 });
  }

  /** Player joins lobby */
  join() {
    this._tone({ freq:523, dur:0.09, gain:0.22, delay:0    });
    this._tone({ freq:659, dur:0.09, gain:0.22, delay:0.09 });
    this._tone({ freq:784, dur:0.14, gain:0.25, delay:0.18 });
  }

  /** Countdown tick (n = 5..1) */
  countdownTick(n) {
    if (n > 0) {
      this._tone({ freq: 300 + n*60, type:'square', dur:0.12, gain:0.18 });
    } else {
      // GO! — triple ascending blip
      this._tone({ freq:880,  type:'square', dur:0.08, gain:0.22, delay:0    });
      this._tone({ freq:1100, type:'square', dur:0.10, gain:0.22, delay:0.08 });
      this._tone({ freq:1320, type:'sawtooth', dur:0.25, gain:0.28, delay:0.16 });
    }
  }

  /** Question card slides in */
  questionAppear() {
    this._tone({ freq:440, type:'sine', dur:0.07, gain:0.12, attack:0.002 });
    this._tone({ freq:550, type:'sine', dur:0.12, gain:0.14, delay:0.06  });
  }

  /** Player taps an answer option */
  answerSelected() {
    this._tone({ freq:660, type:'sine', dur:0.07, gain:0.18, attack:0.003 });
    this._noise({ dur:0.04, gain:0.08 });
  }

  /** Correct answer */
  correct() {
    this._tone({ freq:523,  dur:0.09, gain:0.28, delay:0    });
    this._tone({ freq:659,  dur:0.09, gain:0.28, delay:0.09 });
    this._tone({ freq:784,  dur:0.09, gain:0.28, delay:0.18 });
    this._tone({ freq:1047, dur:0.28, gain:0.32, delay:0.27, release:0.2 });
  }

  /** Wrong answer — descending buzz */
  wrong() {
    this._tone({ freq:280, type:'sawtooth', dur:0.14, gain:0.24, delay:0    });
    this._tone({ freq:200, type:'sawtooth', dur:0.18, gain:0.20, delay:0.12 });
    this._noise({ dur:0.1, gain:0.12, delay:0.08 });
  }

  /** Timer warning (last 5 seconds) — urgent double beep */
  timerWarning() {
    this._tone({ freq:900, type:'square', dur:0.05, gain:0.14, delay:0    });
    this._tone({ freq:900, type:'square', dur:0.05, gain:0.14, delay:0.12 });
  }

  /** Timer hits zero */
  timerEnd() {
    this._tone({ freq:160, type:'sawtooth', dur:0.28, gain:0.28 });
    this._tone({ freq:120, type:'sawtooth', dur:0.32, gain:0.22, delay:0.14 });
  }

  /** Player finishes all questions */
  finish() {
    const seq = [523,659,784,880,1047,880,1047,1319];
    seq.forEach((f,i) =>
      this._tone({ freq:f, dur: i===seq.length-1 ? 0.55 : 0.13, gain:0.28, delay: i*0.12 })
    );
  }

  /** Winner fanfare on results screen */
  winner() {
    const seq = [523,659,784,1047,784,1047,1319,1047,1319,1568];
    seq.forEach((f,i) =>
      this._tone({ freq:f, dur: i>=seq.length-2 ? 0.5 : 0.14, gain:0.3, delay: i*0.13 })
    );
  }

  /** Soft whoosh for screen transitions */
  transition() {
    for (let i = 0; i < 8; i++) {
      this._tone({ freq: 200 + i*60, type:'sine', dur:0.08, gain:0.06, delay: i*0.03 });
    }
  }
}

export const sound = new SoundManager();
