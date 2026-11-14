type Bus = "music" | "effects" | "interface";
type SoundVoice = OscillatorNode | AudioBufferSourceNode;
const clamp = (value: number) =>
  Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;

/** Original, bounded Web Audio synthesis. Nothing starts before user interaction. */
export class AudioEngine {
  ctx?: AudioContext;
  timer?: number;
  step = 0;
  private master?: GainNode;
  private channels?: Record<Bus, GainNode>;
  private compressor?: DynamicsCompressorNode;
  private voices = new Set<SoundVoice>();
  private lastSound = new Map<string, number>();
  private nextBeat = 0;
  private eventGain = 1;
  private eventPitch = 1;
  private noiseBuffer?: AudioBuffer;
  private engine?: {
    oscillators: OscillatorNode[];
    gain: GainNode;
    filter: BiquadFilterNode;
  };
  private _volume = 0.35;
  private _musicVolume = 0.55;
  private _effectsVolume = 0.7;
  private _uiVolume = 0.55;
  private _mode = "menu";
  private _paused = false;

  get volume() {
    return this._volume;
  }
  set volume(value: number) {
    this._volume = clamp(value);
    this.syncVolumes();
  }
  get musicVolume() {
    return this._musicVolume;
  }
  set musicVolume(value: number) {
    this._musicVolume = clamp(value);
    this.syncVolumes();
  }
  get effectsVolume() {
    return this._effectsVolume;
  }
  set effectsVolume(value: number) {
    this._effectsVolume = clamp(value);
    this.syncVolumes();
  }
  get uiVolume() {
    return this._uiVolume;
  }
  set uiVolume(value: number) {
    this._uiVolume = clamp(value);
    this.syncVolumes();
  }
  get mode() {
    return this._mode;
  }
  set mode(value: string) {
    if (value === this._mode) return;
    this._mode = value;
    this.step = 0;
    this.nextBeat = this.ctx?.currentTime ?? 0;
    this.syncEngine();
  }
  get paused() {
    return this._paused;
  }
  set paused(value: boolean) {
    this._paused = !!value;
    this.syncVolumes();
    this.syncEngine();
  }

  start() {
    if (!this.ctx) {
      const AudioConstructor =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioConstructor) return;
      this.ctx = new AudioConstructor();
      this.master = this.ctx.createGain();
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -15;
      this.compressor.knee.value = 10;
      this.compressor.ratio.value = 8;
      this.compressor.attack.value = 0.004;
      this.compressor.release.value = 0.18;
      this.channels = {
        music: this.ctx.createGain(),
        effects: this.ctx.createGain(),
        interface: this.ctx.createGain(),
      };
      for (const channel of Object.values(this.channels))
        channel.connect(this.master);
      this.master.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);
      this.noiseBuffer = this.createNoise();
      this.syncVolumes();
      this.syncEngine();
    }
    void this.ctx.resume().catch(() => {});
    if (this.timer === undefined)
      this.timer = window.setInterval(() => this.tick(), 80);
  }

  private syncVolumes() {
    if (!this.ctx || !this.master || !this.channels) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this._volume, t, 0.035);
    this.channels.music.gain.setTargetAtTime(
      this._musicVolume * (this._paused ? 0.2 : 1),
      t,
      0.06,
    );
    this.channels.effects.gain.setTargetAtTime(this._effectsVolume, t, 0.035);
    this.channels.interface.gain.setTargetAtTime(this._uiVolume, t, 0.035);
  }

  private syncEngine() {
    if (!this.ctx || !this.channels) return;
    const flying =
      ["battle", "boss", "landmark", "training"].includes(this._mode) &&
      !this._paused;
    if (!flying) {
      if (this.engine) {
        const previous = this.engine;
        previous.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
        previous.oscillators.forEach((o) => {
          try {
            o.stop(this.ctx!.currentTime + 0.4);
          } catch {}
        });
        this.engine = undefined;
      }
      return;
    }
    if (this.engine) return;
    const gain = this.ctx.createGain(),
      filter = this.ctx.createBiquadFilter();
    gain.gain.value = 0.017;
    filter.type = "lowpass";
    filter.frequency.value = 270;
    filter.Q.value = 0.6;
    gain.connect(filter);
    filter.connect(this.channels.effects);
    const oscillators = [
      this.ctx.createOscillator(),
      this.ctx.createOscillator(),
    ];
    oscillators.forEach((o, i) => {
      o.type = i ? "triangle" : "sawtooth";
      o.frequency.value = i ? 96 : 47;
      o.connect(gain);
      o.start();
    });
    this.engine = { oscillators, gain, filter };
  }

  private tick() {
    if (!this.ctx) return;
    if (document.hidden) {
      this.engine?.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
      this.nextBeat = this.ctx.currentTime;
      return;
    }
    if (this.engine) {
      this.engine.gain.gain.setTargetAtTime(
        this._paused ? 0 : 0.017,
        this.ctx.currentTime,
        0.15,
      );
      this.engine.oscillators[0].frequency.setTargetAtTime(
        47 + Math.sin(this.ctx.currentTime * 0.7) * 2,
        this.ctx.currentTime,
        0.1,
      );
    }
    if (this._musicVolume <= 0 || this.ctx.currentTime + 0.05 < this.nextBeat)
      return;
    const energetic =
      this._mode === "boss" ||
      this._mode === "battle" ||
      this._mode === "training";
    const interval =
      this._mode === "boss"
        ? 0.22
        : energetic
          ? 0.27
          : this._mode === "landmark"
            ? 0.4
            : 0.38;
    this.musicBeat(this.step++, energetic);
    this.nextBeat = this.ctx.currentTime + interval;
  }

  private musicBeat(step: number, energetic: boolean) {
    const modes: Record<string, number[]> = {
      menu: [130.81, 155.56, 196, 174.61],
      hangar: [110, 130.81, 164.81, 146.83],
      campaign: [146.83, 174.61, 220, 196],
      battle: [110, 130.81, 146.83, 98],
      training: [130.81, 164.81, 196, 146.83],
      boss: [82.41, 98, 110, 77.78],
      landmark: [196, 246.94, 293.66, 261.63],
      victory: [196, 246.94, 293.66, 392],
      defeat: [110, 98, 87.31, 82.41],
    };
    const roots = modes[this._mode] || modes.menu;
    const root = roots[Math.floor(step / 8) % roots.length];
    // Sparse bass, a twelve-note arpeggio and long harmonic pads form separate
    // tracks rather than replaying one loud note over every gun sound.
    if (step % 4 === 0)
      this.note(
        root / 2,
        energetic ? 0.35 : 0.7,
        "triangle",
        energetic ? 0.14 : 0.085,
        "music",
      );
    if (step % 8 === 0) {
      this.note(root, energetic ? 0.75 : 1.3, "sine", 0.055, "music");
      this.note(
        root * 1.4983,
        energetic ? 0.8 : 1.5,
        "triangle",
        0.032,
        "music",
      );
      this.note(
        root * (this._mode === "landmark" ? 1.2599 : 1.1892),
        1.1,
        "sine",
        0.032,
        "music",
      );
    }
    const intervals = [
      2, 0, 2.9966, 2.3784, 0, 2.5198, 2, 0, 3.5636, 2.9966, 2.3784, 0,
    ];
    const ratio = intervals[step % intervals.length];
    if (ratio)
      this.note(
        root * ratio,
        energetic ? 0.12 : 0.24,
        "triangle",
        energetic ? 0.065 : 0.043,
        "music",
      );
    if (energetic && !this._paused) {
      if (step % 4 === 0) this.note(92, 0.12, "sine", 0.13, "music", 0, 35);
      if (step % 4 === 2) this.noise(0.07, 0.025, "music", 1800);
      if (step % 2 === 1) this.noise(0.025, 0.009, "music", 6500);
    }
  }

  private createNoise() {
    const ctx = this.ctx!;
    const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate),
      data = buffer.getChannelData(0);
    // Fixed noise keeps the sound original and reproducible, with no downloads.
    let seed = 1945;
    for (let i = 0; i < data.length; i++) {
      seed = (1664525 * seed + 1013904223) >>> 0;
      data[i] = (seed / 4294967296) * 2 - 1;
    }
    return buffer;
  }

  private register(source: SoundVoice) {
    if (this.voices.size >= 28) return false;
    this.voices.add(source);
    source.onended = () => {
      this.voices.delete(source);
      source.disconnect();
    };
    return true;
  }

  private note(
    f: number,
    d: number,
    type: OscillatorType,
    v: number,
    bus: Bus,
    delay = 0,
    endFrequency?: number,
  ) {
    if (!this.ctx || !this.channels || this._volume === 0 || v <= 0) return;
    const o = this.ctx.createOscillator(),
      g = this.ctx.createGain();
    if (!this.register(o)) return;
    const t = this.ctx.currentTime + delay;
    o.type = type;
    const pitch = bus === "effects" ? this.eventPitch : 1;
    const amplitude = bus === "effects" ? this.eventGain : 1;
    o.frequency.setValueAtTime(Math.max(25, f * pitch), t);
    if (endFrequency)
      o.frequency.exponentialRampToValueAtTime(
        Math.max(25, endFrequency * pitch),
        t + d,
      );
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(
      Math.max(0.0002, Math.min(0.4, v * amplitude)),
      t + 0.006,
    );
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g);
    g.connect(this.channels[bus]);
    o.onended = () => {
      this.voices.delete(o);
      o.disconnect();
      g.disconnect();
    };
    o.start(t);
    o.stop(t + d + 0.015);
  }

  private noise(
    d: number,
    v: number,
    bus: Bus,
    filterFrequency: number,
    delay = 0,
  ) {
    if (!this.ctx || !this.channels || !this.noiseBuffer || this._volume === 0)
      return;
    const n = this.ctx.createBufferSource(),
      g = this.ctx.createGain(),
      filter = this.ctx.createBiquadFilter();
    if (!this.register(n)) return;
    const t = this.ctx.currentTime + delay;
    n.buffer = this.noiseBuffer;
    filter.type = "lowpass";
    filter.frequency.value = Math.min(
      16000,
      filterFrequency * (bus === "effects" ? this.eventPitch : 1),
    );
    g.gain.setValueAtTime(
      Math.max(
        0.0002,
        Math.min(0.4, v * (bus === "effects" ? this.eventGain : 1)),
      ),
      t,
    );
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    n.connect(filter);
    filter.connect(g);
    g.connect(this.channels[bus]);
    n.onended = () => {
      this.voices.delete(n);
      n.disconnect();
      filter.disconnect();
      g.disconnect();
    };
    n.start(t);
    n.stop(t + d);
  }

  /** Compatibility with older combat effects. New code can select play(name). */
  tone(f: number, d = 0.08, type: OscillatorType = "sine", v = 0.2) {
    this.note(f, d, type, v, "effects", 0, Math.max(25, f * 0.45));
  }

  /** Weapon level adds a modest transient accent; persistent bus levels never change. */
  play(name: string, level = 1) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const interval: Record<string, number> = {
      gun: 0.07,
      minigun: 0.045,
      cannon: 0.12,
      missile: 0.09,
      laser: 0.1,
      plasma: 0.1,
      electric: 0.12,
      coin: 0.08,
      ui: 0.045,
      critical: 1.8,
    };
    if (
      now - (this.lastSound.get(name) ?? -Infinity) <
      (interval[name] ?? 0.06)
    )
      return;
    this.lastSound.set(name, now);
    const safeLevel = Number.isFinite(level)
      ? Math.min(5, Math.max(1, Math.round(level)))
      : 1;
    const previousGain = this.eventGain,
      previousPitch = this.eventPitch;
    this.eventGain = 1 + (safeLevel - 1) * 0.08;
    this.eventPitch = 1 + (safeLevel - 1) * 0.02;
    try {
      switch (name) {
        case "gun":
          this.noise(0.035, 0.055, "effects", 2600);
          this.note(480, 0.035, "square", 0.022, "effects", 0, 110);
          break;
        case "minigun":
          this.noise(0.045, 0.052, "effects", 3100);
          this.note(125, 0.05, "sawtooth", 0.032, "effects", 0, 72);
          break;
        case "cannon":
          this.noise(0.14, 0.11, "effects", 950);
          this.note(118, 0.15, "triangle", 0.1, "effects", 0, 35);
          break;
        case "special":
        case "barrage":
        case "missile":
          this.noise(0.25, 0.08, "effects", 1600);
          this.note(440, 0.23, "sawtooth", 0.033, "effects", 0, 850);
          break;
        case "bomb":
        case "explosion":
          this.noise(0.42, 0.17, "effects", 1000);
          this.note(95, 0.38, "sine", 0.16, "effects", 0, 28);
          break;
        case "boss-explosion":
          this.noise(0.9, 0.22, "effects", 700);
          this.note(74, 0.85, "sine", 0.19, "effects", 0, 25);
          this.noise(0.5, 0.09, "effects", 1400, 0.18);
          break;
        case "laser":
          this.note(850, 0.12, "sawtooth", 0.035, "effects", 0, 1250);
          this.note(1700, 0.12, "sine", 0.02, "effects", 0, 2100);
          break;
        case "plasma":
          this.note(280, 0.2, "triangle", 0.065, "effects", 0, 110);
          this.note(560, 0.17, "sine", 0.05, "effects", 0, 200);
          break;
        case "electric":
          this.noise(0.12, 0.05, "effects", 4000);
          this.note(1200, 0.13, "sawtooth", 0.025, "effects", 0, 220);
          break;
        case "drone":
          this.note(145, 0.15, "sawtooth", 0.032, "effects", 0, 245);
          this.noise(0.1, 0.024, "effects", 1100);
          break;
        case "green":
          [392, 493.88, 587.33, 783.99].forEach((f, i) =>
            this.note(f, 0.21, "triangle", 0.06, "effects", i * 0.045),
          );
          break;
        case "repair":
          this.note(523.25, 0.25, "sine", 0.065, "effects");
          this.note(783.99, 0.35, "triangle", 0.04, "effects", 0.12);
          break;
        case "turbo":
          this.noise(0.35, 0.08, "effects", 1900);
          this.note(140, 0.3, "sawtooth", 0.04, "effects", 0, 540);
          break;
        case "coin":
          this.note(1100, 0.07, "sine", 0.065, "effects");
          this.note(1650, 0.1, "sine", 0.045, "effects", 0.04);
          break;
        case "damage":
          this.noise(0.15, 0.095, "effects", 1300);
          this.note(180, 0.16, "square", 0.045, "effects", 0, 65);
          break;
        case "shield":
          this.note(330, 0.2, "sine", 0.08, "effects", 0, 880);
          this.note(660, 0.3, "triangle", 0.035, "effects", 0.05, 1320);
          break;
        case "critical":
          this.note(620, 0.12, "triangle", 0.12, "effects");
          this.note(440, 0.14, "triangle", 0.08, "effects", 0.17);
          break;
        case "purchase":
        case "upgrade":
          [440, 554.37, 659.25, 880].forEach((f, i) =>
            this.note(f, 0.16, "triangle", 0.07, "interface", i * 0.055),
          );
          break;
        case "victory":
          [392, 493.88, 587.33, 783.99, 987.77].forEach((f, i) =>
            this.note(f, 0.35, "triangle", 0.1, "music", i * 0.1),
          );
          break;
        case "defeat":
          [220, 196, 164.81, 110].forEach((f, i) =>
            this.note(f, 0.4, "triangle", 0.075, "music", i * 0.15),
          );
          break;
        default:
          this.note(520, 0.07, "triangle", 0.055, "interface", 0, 760);
          break;
      }
    } finally {
      // Scheduling captures these multipliers on the newly created nodes. Later
      // UI/music events and older tone() callers retain their normal levels.
      this.eventGain = previousGain;
      this.eventPitch = previousPitch;
    }
  }

  stop() {
    if (this.timer !== undefined) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
    this.voices.forEach((v) => {
      try {
        v.stop();
      } catch {}
    });
    this.voices.clear();
    this.engine?.oscillators.forEach((o) => {
      try {
        o.stop();
      } catch {}
    });
    this.engine = undefined;
    if (this.ctx) void this.ctx.close().catch(() => {});
    this.ctx = undefined;
    this.channels = undefined;
    this.master = undefined;
    this.noiseBuffer = undefined;
  }
}
export const audio = new AudioEngine();
