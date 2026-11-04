// Natural sounds for the Ark slice, synthesized with Web Audio: wind, the
// river, birdsong, rain, footsteps on grass and wood, soft animal calls and the
// creak and thud of the ark's door. No music, and never any recitation here.

type Bus = { gain: GainNode };

class Nature {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private amb!: GainNode;
  private fx!: GainNode;
  private wind!: Bus & { filter: BiquadFilterNode };
  private river!: Bus;
  private rain!: Bus & { filter: BiquadFilterNode };
  private hold!: Bus;
  private white!: AudioBuffer;
  private brown!: AudioBuffer;
  private birdTimer = 0;
  private vol = { ambience: 0.6, effects: 0.7, quiet: false };

  /** Call from a tap or key press (browser autoplay rules). */
  start() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    const AC: typeof AudioContext | undefined = (window as any).AudioContext ?? (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;
    this.white = this.noise(ctx, 4, false);
    this.brown = this.noise(ctx, 6, true);
    this.master = ctx.createGain();
    this.master.connect(ctx.destination);
    this.amb = ctx.createGain();
    this.fx = ctx.createGain();
    this.amb.connect(this.master);
    this.fx.connect(this.master);
    const loop = (buf: AudioBuffer, type: BiquadFilterType, f: number, q: number) => {
      const s = ctx.createBufferSource();
      s.buffer = buf;
      s.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = type;
      filter.frequency.value = f;
      filter.Q.value = q;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      s.connect(filter).connect(gain).connect(this.amb);
      s.start();
      return { gain, filter };
    };
    this.wind = loop(this.white, 'bandpass', 600, 0.5);
    // Gusts: a slow wobble on the wind filter.
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const depth = ctx.createGain();
    depth.gain.value = 250;
    lfo.connect(depth).connect(this.wind.filter.frequency);
    lfo.start();
    this.river = loop(this.brown, 'bandpass', 900, 0.6);
    this.rain = loop(this.white, 'highpass', 2400, 0.3);
    this.hold = loop(this.brown, 'lowpass', 180, 0.5);
    this.apply();
  }

  setVolumes(v: { ambience: number; effects: number; quiet: boolean }) {
    this.vol = v;
    this.apply();
  }

  private apply() {
    if (!this.ctx) return;
    const q = this.vol.quiet ? 0 : 1;
    const t = this.ctx.currentTime;
    this.amb.gain.setTargetAtTime(this.vol.ambience * q, t, 0.3);
    this.fx.gain.setTargetAtTime(this.vol.effects * q, t, 0.1);
  }

  /** Called every frame or so with where the listener is and the weather. */
  update(o: { river: number; storm: number; rain: number; inside: boolean; dt: number }) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const muffle = o.inside ? 0.45 : 1;
    this.wind.gain.gain.setTargetAtTime((0.05 + o.storm * 0.12) * muffle, t, 0.5);
    this.river.gain.gain.setTargetAtTime(Math.max(0, 1 - o.river / 45) * 0.16 * (1 - o.storm * 0.5), t, 0.5);
    this.rain.gain.gain.setTargetAtTime(o.rain * 0.12 * (o.inside ? 0.7 : 1), t, 0.6);
    this.rain.filter.frequency.setTargetAtTime(o.inside ? 900 : 2400, t, 0.4);
    // Creaks and the sea against the hull while afloat, felt more than heard.
    this.hold.gain.gain.setTargetAtTime(o.inside ? 0.08 + o.storm * 0.08 : 0, t, 0.8);
    // Birds sing while it is fair.
    this.birdTimer -= o.dt;
    if (this.birdTimer <= 0) {
      this.birdTimer = 2 + Math.random() * 5;
      if (o.storm < 0.35 && !o.inside) this.bird();
    }
  }

  private bird() {
    const ctx = this.ctx!;
    const t0 = ctx.currentTime;
    const notes = 2 + Math.floor(Math.random() * 4);
    const base = 2200 + Math.random() * 1600;
    const pan = ctx.createStereoPanner();
    pan.pan.value = Math.random() * 1.6 - 0.8;
    pan.connect(this.amb);
    for (let i = 0; i < notes; i++) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const t = t0 + i * (0.09 + Math.random() * 0.05);
      o.type = 'sine';
      o.frequency.setValueAtTime(base * (0.9 + Math.random() * 0.3), t);
      o.frequency.exponentialRampToValueAtTime(base * (1.2 + Math.random() * 0.4), t + 0.06);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.025, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0005, t + 0.08);
      o.connect(g).connect(pan);
      o.start(t);
      o.stop(t + 0.1);
    }
  }

  private burst(f: number, q: number, dur: number, level: number, type: BiquadFilterType = 'bandpass', buf = this.white) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const s = ctx.createBufferSource();
    s.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = type;
    bp.frequency.value = f;
    bp.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(level, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    s.connect(bp).connect(g).connect(this.fx);
    s.start(t, Math.random() * 2);
    s.stop(t + dur + 0.05);
  }

  step(wood: boolean) {
    if (wood) this.burst(380 + Math.random() * 80, 2.5, 0.09, 0.18, 'bandpass', this.brown);
    else this.burst(1600 + Math.random() * 600, 0.8, 0.07, 0.05);
  }

  /** A soft hoof or pad on the ground, quieter than the explorer's steps. */
  hoof() {
    this.burst(500 + Math.random() * 200, 3, 0.06, 0.05, 'bandpass', this.brown);
  }

  /** A short, gentle call: no recordings, just a breathy voiced tone. */
  call(kind: string) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const spec: Record<string, [number, number, number, OscillatorType]> = {
      sheep: [420, 380, 0.55, 'sawtooth'],
      horse: [700, 320, 0.7, 'sawtooth'],
      camel: [160, 120, 0.6, 'sawtooth'],
      elephant: [520, 760, 0.6, 'sawtooth'],
      giraffe: [180, 150, 0.35, 'triangle'],
    };
    const [f0, f1, dur, type] = spec[kind] ?? spec.sheep;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.linearRampToValueAtTime(f1, t + dur);
    const vib = ctx.createOscillator();
    vib.frequency.value = kind === 'sheep' ? 9 : 5;
    const vd = ctx.createGain();
    vd.gain.value = kind === 'sheep' ? 18 : 6;
    vib.connect(vd).connect(o.frequency);
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = kind === 'elephant' ? 1100 : 900;
    f.Q.value = 1.2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.05, t + 0.06);
    g.gain.linearRampToValueAtTime(0.035, t + dur * 0.7);
    g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(f).connect(g).connect(this.fx);
    o.start(t);
    vib.start(t);
    o.stop(t + dur + 0.05);
    vib.stop(t + dur + 0.05);
  }

  /** The ramp swinging shut: a wooden creak, then a soft thud. */
  door() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(70, t);
    o.frequency.linearRampToValueAtTime(110, t + 1.6);
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 700;
    f.Q.value = 6;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.03, t + 0.3);
    g.gain.linearRampToValueAtTime(0.0, t + 1.7);
    o.connect(f).connect(g).connect(this.fx);
    o.start(t);
    o.stop(t + 1.8);
    setTimeout(() => this.burst(120, 1, 0.5, 0.35, 'lowpass', this.brown), 1800);
  }

  /** Something set down: a soft wooden knock. */
  place() {
    this.burst(260, 2, 0.12, 0.2, 'bandpass', this.brown);
  }

  private noise(ctx: AudioContext, seconds: number, brown: boolean) {
    const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      const w = Math.random() * 2 - 1;
      if (brown) {
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.5;
      } else d[i] = w;
    }
    return buf;
  }
}

export const nature = new Nature();
