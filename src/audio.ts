export class AudioEngine {
  ctx?: AudioContext;
  volume = 0.35;
  timer?: number;
  mode = "menu";
  step = 0;
  paused = false;
  start() {
    this.ctx ??= new AudioContext();
    void this.ctx.resume();
    if (!this.timer)
      this.timer = window.setInterval(() => {
        if (document.hidden) return;
        const seq =
          this.mode === "boss"
            ? [55, 65.4, 73.4, 61.7]
            : this.mode === "battle"
              ? [110, 130.8, 164.8, 146.8]
              : [130.8, 164.8, 196, 164.8];
        this.tone(
          seq[this.step++ % 4],
          0.22,
          "triangle",
          this.paused ? 0.025 : 0.12,
        );
      }, 320);
  }
  tone(f: number, d = 0.08, type: OscillatorType = "sine", v = 0.2) {
    if (!this.ctx || !this.volume) return;
    const o = this.ctx.createOscillator(),
      g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, this.ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(
      Math.max(25, f * 0.45),
      this.ctx.currentTime + d,
    );
    g.gain.setValueAtTime(v * this.volume, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + d);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start();
    o.stop(this.ctx.currentTime + d);
  }
}
export const audio = new AudioEngine();
