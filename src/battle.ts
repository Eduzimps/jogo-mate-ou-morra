import Phaser from "phaser";
import {
  aircraft,
  svgUrl,
  warship,
  fortress,
  ground,
  companionArt,
} from "./art";
import { planes, stages, type Save } from "./data";
import { audio } from "./audio";
type Bullet = {
  s: Phaser.GameObjects.Image;
  vx: number;
  vy: number;
  damage: number;
  enemy: boolean;
  homing: boolean;
  hits?: Enemy[];
};
type Enemy = {
  s: Phaser.GameObjects.Image;
  hp: number;
  max: number;
  kind: number;
  born: number;
  fire: number;
  base: number;
  boss: boolean;
  phase: number;
};
export type BattleResult = {
  win: boolean;
  score: number;
  coins: number;
  kills: number;
  hp: number;
  bosses: number;
};
export class Battle extends Phaser.Scene {
  save!: Save;
  stage = 0;
  done!: (r: BattleResult) => void;
  player!: Phaser.GameObjects.Image;
  wing: Phaser.GameObjects.Image[] = [];
  shadow!: Phaser.GameObjects.Image;
  bullets: Bullet[] = [];
  enemies: Enemy[] = [];
  pool: Phaser.GameObjects.Image[] = [];
  fx!: Phaser.GameObjects.Particles.ParticleEmitter;
  bg!: Phaser.GameObjects.TileSprite;
  clouds!: Phaser.GameObjects.TileSprite;
  hud!: (v: Battle) => void;
  keys!: Record<string, Phaser.Input.Keyboard.Key>;
  elapsed = 0;
  spawn = 0;
  shot = 0;
  hp = 100;
  maxHp = 100;
  shield = 0;
  inv = 0;
  score = 0;
  coins = 0;
  kills = 0;
  bosses = 0;
  bossSpawned = false;
  ended = false;
  paused = false;
  cooldowns = [0, 0, 0, 0, 0];
  target?: Phaser.Math.Vector2;
  level = 1;
  difficulty = 1;
  laser = 0;
  secondaryShot = 3;
  specialCooldown = 0;
  specialRemaining = 0;
  specialShot = 0;
  lastAlert = -5;
  constructor() {
    super("battle");
  }
  init(d: {
    save: Save;
    stage: number;
    done: (r: BattleResult) => void;
    hud: (v: Battle) => void;
  }) {
    this.save = d.save;
    this.stage = d.stage;
    this.done = d.done;
    this.hud = d.hud;
  }
  preload() {
    const p = planes[this.save.selected];
    this.load.svg("plane" + p.id, svgUrl(aircraft(p.color, p.id)), {
      width: 160,
      height: 160,
    });
    this.load.svg("wing", svgUrl(companionArt(this.save.wing)), {
      width: 80,
      height: 84,
    });
    this.load.svg("enemy", svgUrl(aircraft("#d78a73", 2)));
    this.load.svg("ship", svgUrl(warship()));
    this.load.svg("fortress", svgUrl(fortress()));
    this.load.svg("mech", svgUrl(fortress(true)));
    this.load.svg("tank", svgUrl(ground(8)));
    this.load.svg("turret", svgUrl(ground(6)));
  }
  create() {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xffffff);
    g.fillCircle(4, 4, 4);
    g.generateTexture("spark", 8, 8);
    g.clear();
    g.fillStyle(0xffe8a0);
    g.fillRoundedRect(0, 0, 5, 22, 2);
    g.generateTexture("bullet", 5, 22);
    g.destroy();
    const bc = document.createElement("canvas");
    bc.width = 20;
    bc.height = 40;
    const bctx = bc.getContext("2d")!;
    const glow = bctx.createRadialGradient(10, 20, 0, 10, 20, 19);
    glow.addColorStop(0, "#fffcdc");
    glow.addColorStop(0.25, "#ffe78c");
    glow.addColorStop(0.5, "#ffc33788");
    glow.addColorStop(1, "#ff9e0000");
    bctx.fillStyle = glow;
    bctx.fillRect(0, 0, 20, 40);
    bctx.fillStyle = "#ffffe9";
    bctx.fillRect(8, 9, 4, 22);
    this.textures.addCanvas("glowBullet", bc);
    const rocket = this.make.graphics({ x: 0, y: 0 });
    rocket.fillStyle(0x203c4d);
    rocket.fillTriangle(2, 27, 8, 14, 14, 27);
    rocket.fillStyle(0xd3e3d1);
    rocket.fillRoundedRect(5, 4, 6, 23, 3);
    rocket.fillStyle(0xf5c96a);
    rocket.fillTriangle(5, 5, 8, 0, 11, 5);
    rocket.fillStyle(0xffa84e);
    rocket.fillTriangle(5, 28, 8, 35, 11, 28);
    rocket.generateTexture("missile", 16, 36);
    rocket.destroy();
    this.makeTerrain();
    this.bg = this.add.tileSprite(270, 480, 540, 960, "terrain");
    this.clouds = this.add
      .tileSprite(270, 480, 540, 960, "cloud")
      .setAlpha(0.24)
      .setDepth(2);
    this.fx = this.add
      .particles(0, 0, "spark", {
        emitting: false,
        speed: { min: 30, max: 230 },
        lifespan: 550,
        scale: { start: 1.7, end: 0 },
        alpha: { start: 1, end: 0 },
        tint: [0xffd28d, 0xff8049, 0x6c7773],
        quantity: 18,
      })
      .setDepth(8);
    this.level = this.save.levels[this.save.selected] || 1;
    this.maxHp = planes[this.save.selected].hp * (1 + (this.level - 1) * 0.16);
    this.hp = this.maxHp;
    this.difficulty =
      this.save.difficulty === "Fácil"
        ? 0.7
        : this.save.difficulty === "Difícil"
          ? 1.35
          : 1;
    this.player = this.add
      .image(270, 790, "plane" + this.save.selected)
      .setDisplaySize(94, 94)
      .setDepth(5);
    this.shadow = this.add
      .image(280, 805, "plane" + this.save.selected)
      .setDisplaySize(94, 94)
      .setDepth(2.5)
      .setTint(0x03151f)
      .setAlpha(0.3);
    for (const x of [-1, 1])
      this.wing.push(
        this.add
          .image(270 + x * 63, 830, "wing")
          .setDisplaySize(45, 47)
          .setDepth(4),
      );
    this.keys = this.input.keyboard!.addKeys(
      "W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,ONE,TWO,THREE,FOUR,FIVE,ESC",
    ) as typeof this.keys;
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (!p.wasTouch || p.isDown)
        this.target = new Phaser.Math.Vector2(
          p.x,
          p.y - (p.wasTouch ? this.save.touchOffset : 0),
        );
    });
    this.input.on(
      "pointerdown",
      (p: Phaser.Input.Pointer) =>
        (this.target = new Phaser.Math.Vector2(
          p.x,
          p.y - (p.wasTouch ? this.save.touchOffset : 0),
        )),
    );
    this.input.keyboard!.on("keydown-ESC", () => this.togglePause());
    this.input.keyboard!.on("keydown-SPACE", () => this.special());
    ["ONE", "TWO", "THREE", "FOUR", "FIVE"].forEach((k, i) =>
      this.input.keyboard!.on("keydown-" + k, () => this.ability(i)),
    );
    this.game.events.on("blur", this.onBlur, this);
    this.events.once("shutdown", () => {
      this.game.events.off("blur", this.onBlur, this);
      this.bullets = [];
      this.enemies = [];
      this.pool = [];
    });
    audio.mode = "battle";
    audio.paused = false;
  }
  onBlur() {
    if (!this.ended && !this.paused) this.togglePause();
  }
  togglePause() {
    if (this.ended) return;
    this.paused = !this.paused;
    this.time.paused = this.paused;
    if (this.paused) this.tweens.pauseAll();
    else this.tweens.resumeAll();
    audio.paused = this.paused;
    this.hud(this);
  }
  makeTerrain() {
    const c = document.createElement("canvas");
    c.width = 540;
    c.height = 960;
    const ctx = c.getContext("2d")!;
    const colors = [
      "#16475b",
      "#294c3e",
      "#9d754c",
      "#a3c1c8",
      "#37484c",
      "#253b51",
    ];
    ctx.fillStyle = colors[stages[this.stage].environment];
    ctx.fillRect(0, 0, 540, 960);
    let seed = 42 + this.stage;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let i = 0; i < 350; i++) {
      ctx.fillStyle = i % 2 ? "#ffffff0c" : "#00000010";
      ctx.fillRect(
        rand() * 540,
        rand() * 960,
        20 + rand() * 80,
        1 + rand() * 4,
      );
    }
    for (let i = 0; i < 7; i++) {
      const x = rand() * 540,
        y = rand() * 960;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rand() * 3);
      ctx.fillStyle = "#0b25343b";
      ctx.beginPath();
      ctx.ellipse(8, 12, 38, 95, 0, 0, 7);
      ctx.fill();
      ctx.fillStyle = [
        "#6d8b60",
        "#183b2b",
        "#bb935f",
        "#d6e5df",
        "#263337",
        "#4d6375",
      ][stages[this.stage].environment];
      ctx.beginPath();
      ctx.ellipse(0, 0, 30, 85, 0, 0, 7);
      ctx.fill();
      ctx.strokeStyle = "#d7d2a34a";
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();
    }
    const env = stages[this.stage].environment;
    // Deterministic terrain details remain seamless under vertical scrolling.
    for (let n = 0; n < 9; n++) {
      const x = rand() * 540,
        y = rand() * 960;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rand() * 2);
      ctx.beginPath();
      for (let k = 0; k < 18; k++) {
        const a = (k / 18) * Math.PI * 2,
          r = 35 + rand() * 18;
        const px = Math.cos(a) * r,
          py = Math.sin(a) * r * 1.8;
        k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle =
        env === 0
          ? "#adab7f"
          : env === 2
            ? "#c29a69"
            : env === 3
              ? "#dce5df"
              : "#496e50";
      ctx.strokeStyle = env === 0 ? "#79b4ac55" : "#172c3933";
      ctx.lineWidth = 12;
      ctx.stroke();
      ctx.fill();
      ctx.save();
      ctx.clip();
      if (env === 0 || env === 1) {
        for (let k = 0; k < 40; k++) {
          const tx = rand() * 100 - 50,
            ty = rand() * 150 - 75;
          ctx.fillStyle = ["#385b3e", "#507346", "#63834e"][k % 3];
          ctx.beginPath();
          ctx.arc(tx, ty, 3 + rand() * 8, 0, 7);
          ctx.fill();
        }
      } else if (env === 4 || env === 5) {
        for (let k = 0; k < 14; k++) {
          const bx = rand() * 90 - 45,
            by = rand() * 140 - 70;
          ctx.fillStyle = "#142a32";
          ctx.fillRect(bx + 3, by + 4, 14, 22);
          ctx.fillStyle = "#87938a";
          ctx.fillRect(bx, by, 14, 22);
          ctx.fillStyle = "#cad0a5";
          ctx.fillRect(bx + 2, by + 3, 4, 5);
        }
      } else {
        ctx.strokeStyle = env === 3 ? "#b8cdd0" : "#805737";
        ctx.lineWidth = 3;
        for (let k = 0; k < 6; k++) {
          ctx.beginPath();
          ctx.moveTo(-40, k * 18 - 50);
          ctx.bezierCurveTo(-20, k * 18 - 60, 10, k * 18 - 35, 50, k * 18 - 45);
          ctx.stroke();
        }
      }
      ctx.restore();
      ctx.restore();
    }
    if (env > 0) {
      ctx.strokeStyle = env === 2 ? "#d0ae7b" : "#82908a";
      ctx.lineWidth = 15;
      ctx.beginPath();
      ctx.moveTo(400, 0);
      ctx.bezierCurveTo(200, 300, 600, 650, 400, 960);
      ctx.stroke();
      ctx.strokeStyle = "#c6c2a8";
      ctx.lineWidth = 1;
      ctx.setLineDash([12, 16]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    this.textures.addCanvas("terrain", c);
    const cloud = document.createElement("canvas");
    cloud.width = 540;
    cloud.height = 960;
    const a = cloud.getContext("2d")!;
    for (let i = 0; i < 12; i++) {
      const x = rand() * 540,
        y = rand() * 960,
        r = 35 + rand() * 65;
      const grad = a.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(1, "#ffffff00");
      a.fillStyle = grad;
      a.fillRect(x - r, y - r, r * 2, r * 2);
    }
    this.textures.addCanvas("cloud", cloud);
  }
  bullet(
    x: number,
    y: number,
    vx: number,
    vy: number,
    enemy = false,
    damage = 10,
    homing = false,
    color?: number,
    piercing = false,
  ) {
    if (this.bullets.length > 650) return;
    const s = this.pool.pop() || this.add.image(0, 0, "glowBullet");
    s.setPosition(x, y)
      .setActive(true)
      .setVisible(true)
      .setDepth(enemy ? 6 : 4)
      .setTint(color ?? (enemy ? 0xff755f : homing ? 0x79eaff : 0xffefa9))
      .setScale(enemy ? 0.85 : 0.8, enemy ? 0.43 : 0.85)
      .setRotation(Math.atan2(vx, -vy));
    s.setTexture(homing ? "missile" : "glowBullet");
    if (piercing) s.setScale(0.65, 2);
    this.bullets.push({
      s,
      vx,
      vy,
      enemy,
      damage,
      homing,
      hits: piercing ? [] : undefined,
    });
  }
  recycle(i: number) {
    const [b] = this.bullets.splice(i, 1);
    b.s.setVisible(false).setActive(false);
    this.pool.push(b.s);
  }
  explosion(x: number, y: number, big = false) {
    this.fx.explode(
      this.save.reducedEffects ? (big ? 18 : 6) : big ? 85 : 28,
      x,
      y,
    );
    for (let k = 0; k < (big ? 6 : 2); k++) {
      const core = this.add
        .circle(
          x + Phaser.Math.Between(-18, 18),
          y + Phaser.Math.Between(-18, 18),
          big ? 28 : 13,
          0xfffbd4,
          1,
        )
        .setDepth(9)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: core,
        scale: 2.3,
        alpha: 0,
        delay: k * 45,
        duration: 210,
        onComplete: () => core.destroy(),
      });
    }
    const ring = this.add.circle(x, y, 10, 0xffd18c, 0.7).setDepth(8);
    this.tweens.add({
      targets: ring,
      radius: big ? 150 : 55,
      alpha: 0,
      duration: big ? 650 : 280,
      onComplete: () => ring.destroy(),
    });
    audio.tone(big ? 70 : 130, big ? 0.5 : 0.15, "sawtooth", 0.3);
    if (big && this.save.screenShake) this.cameras.main.shake(240, 0.008);
  }
  spawnEnemy(kind: number, x: number, boss = false) {
    const mult = stages[this.stage].difficulty * this.difficulty;
    const hp = (boss ? 2300 + this.stage * 230 : 24 + kind * 9) * mult;
    const key = boss
      ? ["fortress", "ship", "mech"][stages[this.stage].boss]
      : kind === 7
        ? "ship"
        : kind === 8
          ? "tank"
          : kind === 6
            ? "turret"
            : "enemy";
    const s = this.add
      .image(x, boss ? -180 : -70, key)
      .setDisplaySize(
        boss ? (key === "ship" ? 310 : 450) : kind === 7 ? 90 : 54 + kind * 2,
        boss ? (key === "ship" ? 610 : 345) : kind === 7 ? 145 : 60 + kind * 2,
      )
      .setAngle(key === "enemy" ? 180 : 0)
      .setDepth(3)
      .setTint([0xffd2b5, 0xe8b295, 0x9db6a5, 0xc9a4d4][kind % 4]);
    this.enemies.push({
      s,
      hp,
      max: hp,
      kind,
      born: this.elapsed,
      fire: this.elapsed + 1.2,
      base: x,
      boss,
      phase: 1,
    });
  }
  ability(i: number) {
    if (
      this.ended ||
      this.paused ||
      !this.save.equipped.includes(i) ||
      this.cooldowns[i] > 0
    )
      return;
    const lv = this.save.deviceLevels[i];
    this.cooldowns[i] = [18, 22, 20, 16, 25][i] / (1 + lv * 0.05);
    if (i === 0) {
      for (let j = this.bullets.length - 1; j >= 0; j--)
        if (this.bullets[j].enemy) this.recycle(j);
      for (const e of this.enemies) e.hp -= 350 + lv * 90;
      this.explosion(this.player.x, 430, true);
      if (!this.save.reducedEffects)
        this.cameras.main.flash(220, 200, 230, 255);
    }
    if (i === 1) this.shield = 5 + lv;
    if (i === 2) this.laser = 3 + lv * 0.4;
    if (i === 3)
      for (let j = 0; j < 12; j++)
        this.bullet(
          this.player.x + (j % 2 ? 20 : -20),
          this.player.y,
          Math.sin(j) * 150,
          -360,
          false,
          65 + lv * 12,
          true,
        );
    if (i === 4)
      this.hp = Math.min(this.maxHp, this.hp + this.maxHp * (0.25 + lv * 0.04));
    audio.tone(600, 0.3, "triangle");
  }
  special() {
    if (
      this.save.selected !== 12 ||
      this.ended ||
      this.paused ||
      this.specialCooldown > 0
    )
      return;
    this.specialCooldown = 16;
    this.specialRemaining = 2;
    this.specialShot = this.elapsed;
    audio.tone(440, 0.3, "triangle", 0.2);
    audio.tone(660, 0.35, "sine", 0.1);
    if (!this.save.reducedEffects) this.cameras.main.flash(120, 25, 80, 35);
  }
  update(_t: number, ms: number) {
    if (this.ended || this.paused) return;
    const dt = Math.min(ms / 1000, 0.04);
    this.elapsed += dt;
    this.specialCooldown = Math.max(0, this.specialCooldown - dt);
    if (this.hp / this.maxHp < 0.25 && this.elapsed - this.lastAlert > 3) {
      audio.tone(260, 0.18, "triangle", 0.18);
      this.lastAlert = this.elapsed;
    }
    if (this.specialRemaining > 0) {
      this.specialRemaining = Math.max(0, this.specialRemaining - dt);
      if (this.elapsed > this.specialShot) {
        this.specialShot = this.elapsed + 0.065;
        for (let j = -2; j <= 2; j++)
          this.bullet(
            this.player.x + j * 8,
            this.player.y - 38,
            j * 75,
            -800,
            false,
            12 * (1 + (this.level - 1) * 0.16),
            false,
            j % 2 ? 0x6fff77 : 0xffe46a,
          );
      }
      if (this.specialRemaining === 0)
        for (const x of [-22, 22])
          this.bullet(
            this.player.x + x,
            this.player.y - 20,
            x * 3,
            -460,
            false,
            120 * (1 + (this.level - 1) * 0.16),
            true,
            0xb6ff8a,
          );
    }

    this.bg.tilePositionY -= dt * 65;
    this.clouds.tilePositionY -= dt * 110;
    this.cooldowns = this.cooldowns.map((c) => Math.max(0, c - dt));
    this.shield = Math.max(0, this.shield - dt);
    this.inv = Math.max(0, this.inv - dt);
    this.player.setAlpha(
      this.inv > 0 ? 0.5 + Math.sin(this.elapsed * 50) * 0.3 : 1,
    );
    let dx =
        Number(this.keys.D.isDown || this.keys.RIGHT.isDown) -
        Number(this.keys.A.isDown || this.keys.LEFT.isDown),
      dy =
        Number(this.keys.S.isDown || this.keys.DOWN.isDown) -
        Number(this.keys.W.isDown || this.keys.UP.isDown);
    if (dx || dy) {
      this.target = undefined;
      const len = Math.hypot(dx, dy);
      this.player.x += (dx / len) * planes[this.save.selected].speed * dt;
      this.player.y += (dy / len) * planes[this.save.selected].speed * dt;
    } else if (this.target) {
      dx = this.target.x - this.player.x;
      this.player.x += dx * Math.min(1, dt * 12 * this.save.sensitivity);
      this.player.y +=
        (this.target.y - this.player.y) *
        Math.min(1, dt * 12 * this.save.sensitivity);
    }
    this.player.x = Phaser.Math.Clamp(this.player.x, 45, 495);
    this.player.y = Phaser.Math.Clamp(this.player.y, 100, 890);
    const bank = this.target ? Phaser.Math.Clamp(dx * 0.08, -14, 14) : dx * 12;
    this.player.setAngle(
      Phaser.Math.Linear(this.player.angle, bank, Math.min(1, dt * 10)),
    );
    this.shadow
      .setPosition(this.player.x + 10, this.player.y + 18)
      .setAngle(this.player.angle)
      .setVisible(this.hp > 0);
    let prop = this.children.getByName("prop") as Phaser.GameObjects.Ellipse;
    if (!prop)
      prop = this.add
        .ellipse(0, 0, 58, 4, 0xeaffef, 0.45)
        .setName("prop")
        .setDepth(6);
    prop
      .setPosition(this.player.x, this.player.y - 37)
      .setAngle(this.player.angle)
      .setScale(0.6 + Math.abs(Math.sin(this.elapsed * 85)) * 0.4, 1)
      .setVisible(this.hp > 0 && planes[this.save.selected].propeller);
    if (Math.random() < (this.save.reducedEffects ? 0.05 : 0.25))
      this.fx.emitParticleAt(this.player.x, this.player.y + 37, 1);
    this.wing.forEach((w, i) => {
      w.x = Phaser.Math.Linear(w.x, this.player.x + (i ? 65 : -65), dt * 10);
      w.y = Phaser.Math.Linear(w.y, this.player.y + 35, dt * 10);
    });
    if (this.elapsed > this.shot) {
      this.shot =
        this.elapsed +
        Math.max(
          0.07,
          planes[this.save.selected].rate /
            1000 /
            (1 + (this.level - 1) * 0.06),
        );
      const dmg =
        planes[this.save.selected].damage * (1 + (this.level - 1) * 0.16);
      for (const x of [-13, 13])
        this.bullet(
          this.player.x + x,
          this.player.y - 35,
          0,
          -720,
          false,
          dmg,
          false,
          this.save.selected === 12 ? 0xa4ff6c : undefined,
        );
      if (this.save.selected % 3 === 1 || this.level >= 4)
        this.shadow = this.add
          .image(280, 805, "plane" + this.save.selected)
          .setDisplaySize(94, 94)
          .setDepth(2.5)
          .setTint(0x03151f)
          .setAlpha(0.3);
      for (const x of [-1, 1])
        this.bullet(
          this.player.x,
          this.player.y - 25,
          x * 160,
          -640,
          false,
          dmg * 0.65,
        );
      if (this.save.selected % 3 === 2 && Math.random() < 0.25)
        this.bullet(
          this.player.x,
          this.player.y,
          0,
          -430,
          false,
          dmg * 2,
          true,
        );
      this.wing.forEach((w) => {
        const damage = 5 + (this.save.wingLevels[this.save.wing] || 1) * 3;
        for (const vx of this.save.wing === 1 ? [-140, 0, 140] : [0])
          this.bullet(
            w.x,
            w.y - 20,
            vx,
            this.save.wing === 2 ? -950 : -640,
            false,
            damage,
            this.save.wing === 3,
            this.save.wing === 2 ? 0xbfa1ff : undefined,
            this.save.wing === 2,
          );
      });
      audio.tone(850, 0.035, "square", 0.025);
    }
    if (this.elapsed > this.secondaryShot && this.save.selected !== 12) {
      this.secondaryShot = this.elapsed + 4.8;
      const p = planes[this.save.selected];
      for (const x of [-25, 25])
        this.bullet(
          this.player.x + x,
          this.player.y - 15,
          x,
          -480,
          false,
          p.damage * (1 + (this.level - 1) * 0.16) * 2.2,
          p.id % 3 === 2,
          0xc1e9df,
        );
    }
    const stage = stages[this.stage];
    if (this.elapsed < this.spawn) {
    } else if (this.elapsed < stage.duration) {
      this.spawn = this.elapsed + Math.max(1.4, 2.8 - this.stage * 0.04);
      const wave = Math.floor(this.elapsed / 3) % 5;
      for (let j = 0; j < 4 + (this.stage > 8 ? 1 : 0); j++) {
        const kind = (Math.floor(this.elapsed / 4) + j + this.stage) % 12;
        const x =
          wave === 0
            ? 65 + j * 130
            : wave === 1
              ? 120 + j * 100
              : wave === 2
                ? 60 + j * 75
                : wave === 3
                  ? 480 - j * 70
                  : 60 + j * 125;
        this.spawnEnemy(kind, x);
      }
    } else if (!this.bossSpawned) {
      this.bossSpawned = true;
      audio.mode = "boss";
      this.spawnEnemy(9 + stage.boss, 270, true);
    }
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i],
        age = this.elapsed - e.born;
      if (e.boss) {
        e.s.y = Math.min(185, e.s.y + dt * 70);
        e.s.x = 270 + Math.sin(age * 0.65) * 120;
        e.phase = e.hp < e.max * 0.33 ? 3 : e.hp < e.max * 0.66 ? 2 : 1;
      } else {
        const speed = [95, 190, 65, 70, 55, 150, 40, 38, 42, 90, 100, 60][
          e.kind
        ];
        e.s.y += speed * dt;
        e.s.x =
          e.kind === 10
            ? Phaser.Math.Linear(e.s.x, this.player.x, dt * 0.65)
            : e.base +
              Math.sin(age * (e.kind === 1 ? 3 : 1.6)) * ((e.kind % 3) * 28);
      }
      if (this.elapsed > e.fire && e.s.y > 30) {
        e.fire =
          this.elapsed + (e.boss ? 1.1 / e.phase : 2.4) / this.difficulty;
        const count = e.boss
          ? 7 + e.phase * 3
          : e.kind >= 9
            ? 5
            : e.kind === 3
              ? 3
              : 1;
        const aim = Math.atan2(this.player.y - e.s.y, this.player.x - e.s.x);
        for (let j = 0; j < count; j++) {
          const angle =
            aim +
            (j - (count - 1) / 2) * (e.boss ? 0.19 : 0.16) +
            (e.boss ? Math.sin(age) * 0.35 : 0);
          const speed = (e.boss ? 165 + e.phase * 20 : 160) * this.difficulty;
          this.bullet(
            e.s.x,
            e.s.y + 30,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            true,
            e.boss ? 18 : 12,
          );
        }
      }
      if (
        this.laser > 0 &&
        Math.abs(e.s.x - this.player.x) < (e.boss ? 140 : 35)
      )
        e.hp -= dt * (170 + this.save.deviceLevels[2] * 45);
      if (e.hp <= 0) {
        this.explosion(e.s.x, e.s.y, e.boss);
        this.score += e.boss ? 5000 : 100 + e.kind * 20;
        this.kills++;
        if (e.boss) this.bosses++;
        const coins = e.boss ? 150 : 8 + e.kind;
        this.coins += coins;
        const coin = this.add
          .text(e.s.x, e.s.y, "+" + coins, {
            fontFamily: "monospace",
            fontSize: "20px",
            color: "#ffe8a2",
          })
          .setDepth(10);
        this.tweens.add({
          targets: coin,
          y: e.s.y - 60,
          alpha: 0,
          duration: 800,
          onComplete: () => coin.destroy(),
        });
        e.s.destroy();
        this.enemies.splice(i, 1);
        if (e.boss) {
          this.time.delayedCall(1000, () => this.finish(true));
        }
        continue;
      }
      if (e.s.y > 1060) {
        e.s.destroy();
        this.enemies.splice(i, 1);
        continue;
      }
      if (
        Phaser.Math.Distance.Between(
          e.s.x,
          e.s.y,
          this.player.x,
          this.player.y,
        ) < (e.boss ? 110 : 35)
      )
        this.hit(25);
    }
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      if (b.homing && this.enemies.length) {
        const e = this.enemies.reduce((a, c) =>
          Math.hypot(c.s.x - b.s.x, c.s.y - b.s.y) <
          Math.hypot(a.s.x - b.s.x, a.s.y - b.s.y)
            ? c
            : a,
        );
        const angle = Math.atan2(e.s.y - b.s.y, e.s.x - b.s.x);
        b.vx = Phaser.Math.Linear(b.vx, Math.cos(angle) * 450, dt * 5);
        b.vy = Phaser.Math.Linear(b.vy, Math.sin(angle) * 450, dt * 5);
      }
      b.s.x += b.vx * dt;
      b.s.y += b.vy * dt;
      b.s.rotation = Math.atan2(b.vx, -b.vy);
      if (b.s.y < -50 || b.s.y > 1010 || b.s.x < -50 || b.s.x > 590) {
        this.recycle(i);
        continue;
      }
      if (b.enemy) {
        if (
          Phaser.Math.Distance.Between(
            b.s.x,
            b.s.y,
            this.player.x,
            this.player.y,
          ) < (this.shield > 0 ? 50 : 19)
        ) {
          this.hit(b.damage);
          this.recycle(i);
        }
      } else {
        const e = this.enemies.find(
          (e) =>
            !b.hits?.includes(e) &&
            Math.abs(b.s.x - e.s.x) <
              (e.boss ? e.s.displayWidth * 0.43 : 25 + e.kind) &&
            Math.abs(b.s.y - e.s.y) <
              (e.boss ? e.s.displayHeight * 0.44 : 29 + e.kind),
        );
        if (e) {
          e.hp -= b.damage;
          e.s.setAlpha(0.55);
          this.tweens.add({ targets: e.s, alpha: 1, duration: 80 });
          this.fx.explode(2, b.s.x, b.s.y);
          if (b.hits) {
            b.hits.push(e);
            if (b.hits.length >= 3) this.recycle(i);
          } else this.recycle(i);
        }
      }
    }
    this.laser = Math.max(0, this.laser - dt);
    let beam = this.children.getByName("beam") as Phaser.GameObjects.Rectangle;
    if (!beam) {
      beam = this.add
        .rectangle(0, 0, 30, 960, 0x94f9ff, 0.45)
        .setName("beam")
        .setDepth(7);
    }
    beam
      .setVisible(this.laser > 0)
      .setPosition(this.player.x, this.player.y / 2)
      .setSize(25 + Math.sin(this.elapsed * 55) * 8, this.player.y);
    let shield = this.children.getByName("shield") as Phaser.GameObjects.Arc;
    if (!shield)
      shield = this.add
        .circle(0, 0, 50, 0x81e8ff, 0.1)
        .setStrokeStyle(2, 0x94efff, 0.8)
        .setName("shield")
        .setDepth(6);
    shield
      .setVisible(this.shield > 0)
      .setPosition(this.player.x, this.player.y);
    this.hud(this);
  }
  hit(d: number) {
    if (this.inv > 0 || this.shield > 0) return;
    this.hp = Math.max(0, this.hp - d);
    this.inv = 1.1;
    if (this.save.screenShake) this.cameras.main.shake(100, 0.004);
    audio.tone(90, 0.2, "sawtooth");
    if (this.hp <= 0) {
      this.explosion(this.player.x, this.player.y, true);
      this.player.setVisible(false);
      this.finish(false);
    }
  }
  finish(win: boolean) {
    if (this.ended) return;
    this.ended = true;
    this.done({
      win,
      score: this.score,
      coins: this.coins,
      kills: this.kills,
      hp: this.hp / this.maxHp,
      bosses: this.bosses,
    });
  }
}
