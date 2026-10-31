// Calm, synthesized ambience and effects for the 3D world (Web Audio).
// There is no music. Ambience and effects have their own volumes; the
// narration (device voice) and the Quran recitation (human reciter, streamed)
// are controlled separately and never pass through here.

export type Ambience = 'room' | 'sea' | 'underwater' | 'dark' | 'shore' | 'none';

type Preset = { cutoff: number; gain: number; swell: number; swellRate: number; wind: number };

const presets: Record<Ambience, Preset> = {
  none: { cutoff: 200, gain: 0, swell: 0, swellRate: 0.1, wind: 0 },
  room: { cutoff: 260, gain: 0.05, swell: 0.1, swellRate: 0.05, wind: 0 },
  sea: { cutoff: 700, gain: 0.16, swell: 0.75, swellRate: 0.11, wind: 0.025 },
  underwater: { cutoff: 220, gain: 0.2, swell: 0.35, swellRate: 0.07, wind: 0 },
  dark: { cutoff: 120, gain: 0.12, swell: 0.2, swellRate: 0.04, wind: 0 },
  shore: { cutoff: 900, gain: 0.13, swell: 0.85, swellRate: 0.09, wind: 0.04 },
};

class SoundEngine {
  private ctx: AudioContext | null = null;
  private ambienceBus!: GainNode;
  private effectsBus!: GainNode;
  private bed!: { filter: BiquadFilterNode; gain: GainNode; lfoDepth: GainNode; lfo: OscillatorNode };
  private wind!: { gain: GainNode };
  private noise!: AudioBuffer;
  private current: Ambience = 'none';
  private volumes = { ambience: 0.6, effects: 0.7, quiet: false };

  /** Must be called from a user gesture (browser autoplay rules). */
  start() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    const AC: typeof AudioContext | undefined = (window as any).AudioContext ?? (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;
    this.noise = this.makeBrownNoise(ctx, 6);
    this.ambienceBus = ctx.createGain();
    this.effectsBus = ctx.createGain();
    this.ambienceBus.connect(ctx.destination);
    this.effectsBus.connect(ctx.destination);

    // Ambience bed: brown noise → low-pass → gain, with a slow swell like waves.
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    const gain = ctx.createGain();
    gain.gain.value = 0;
    const lfo = ctx.createOscillator();
    const lfoDepth = ctx.createGain();
    lfo.connect(lfoDepth).connect(gain.gain);
    src.connect(filter).connect(gain).connect(this.ambienceBus);
    src.start();
    lfo.start();
    this.bed = { filter, gain, lfoDepth, lfo };

    // Wind: white-ish noise, band-passed high and kept very soft.
    const wsrc = ctx.createBufferSource();
    wsrc.buffer = this.makeWhiteNoise(ctx, 4);
    wsrc.loop = true;
    const wf = ctx.createBiquadFilter();
    wf.type = 'bandpass';
    wf.frequency.value = 1400;
    wf.Q.value = 0.4;
    const wg = ctx.createGain();
    wg.gain.value = 0;
    wsrc.connect(wf).connect(wg).connect(this.ambienceBus);
    wsrc.start();
    this.wind = { gain: wg };

    this.applyVolumes();
    const next = this.current;
    this.current = 'none';
    this.setAmbience(next);
  }

  setVolumes(v: { ambience: number; effects: number; quiet: boolean }) {
    this.volumes = v;
    this.applyVolumes();
  }

  private applyVolumes() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const q = this.volumes.quiet ? 0 : 1;
    this.ambienceBus.gain.setTargetAtTime(this.volumes.ambience * q, t, 0.3);
    this.effectsBus.gain.setTargetAtTime(this.volumes.effects * q, t, 0.1);
  }

  setAmbience(name: Ambience, seconds = 2.5) {
    if (name === this.current) return;
    this.current = name;
    if (!this.ctx) return;
    const p = presets[name];
    const t = this.ctx.currentTime;
    const tc = seconds / 3;
    this.bed.filter.frequency.setTargetAtTime(p.cutoff, t, tc);
    this.bed.gain.gain.setTargetAtTime(p.gain * (1 - p.swell * 0.5), t, tc);
    this.bed.lfoDepth.gain.setTargetAtTime(p.gain * p.swell * 0.5, t, tc);
    this.bed.lfo.frequency.setTargetAtTime(p.swellRate, t, tc);
    this.wind.gain.gain.setTargetAtTime(p.wind, t, tc);
  }

  /** A soft paper sound: a short band-passed noise burst. */
  pageTurn() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.makeWhiteNoise(ctx, 0.5);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(2600, t);
    bp.frequency.linearRampToValueAtTime(1200, t + 0.35);
    bp.Q.value = 0.9;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.22, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
    src.connect(bp).connect(g).connect(this.effectsBus);
    src.start(t);
    src.stop(t + 0.5);
  }

  /** A gentle airy rise or fall for the book-to-world transition. */
  transition(rising = true, seconds = 3) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(rising ? 200 : 1600, t);
    lp.frequency.exponentialRampToValueAtTime(rising ? 1600 : 200, t + seconds);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.18, t + seconds * 0.4);
    g.gain.linearRampToValueAtTime(0, t + seconds);
    src.connect(lp).connect(g).connect(this.effectsBus);
    src.start(t);
    src.stop(t + seconds + 0.1);
  }

  private makeWhiteNoise(ctx: AudioContext, seconds: number) {
    const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  private makeBrownNoise(ctx: AudioContext, seconds: number) {
    const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      d[i] = last * 3.5;
    }
    return buf;
  }
}

export const sound = new SoundEngine();
