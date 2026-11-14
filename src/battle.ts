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
import { RioWorld } from "./world/RioWorld";
import { BrazilWorld } from "./world/BrazilWorld";
import { brazilRegionForStage } from "./world/brazilRegions";
import {
  getWeapon,
  getWeaponStats,
  defaultLoadout,
  type Loadout,
} from "./arsenal";
import { WeaponSystem } from "./combat/WeaponSystem";
export type Bullet = {
  s: Phaser.GameObjects.Image;
  vx: number;
  vy: number;
  damage: number;
  enemy: boolean;
  homing: boolean;
  hits?: Enemy[];
  pierce?: number;
  blastRadius?: number;
  expires?: number;
  weapon?: string;
};
export type BossPart = {
  id: string;
  name: string;
  hp: number;
  max: number;
  x: number;
  y: number;
  s: Phaser.GameObjects.Image;
  destroyed: boolean;
  shotsFired: number;
};
export type Enemy = {
  s: Phaser.GameObjects.Image;
  hp: number;
  max: number;
  kind: number;
  born: number;
  fire: number;
  base: number;
  boss: boolean;
  phase: number;
  parts?: BossPart[];
  warningUntil?: number;
  warningAngle?: number;
  shadow?: Phaser.GameObjects.Image;
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
  rioWorld?: RioWorld;
  brazilWorld?: BrazilWorld;
  weapons!: WeaponSystem;
  training = false;
  trainingLevels: Record<string, number> = {};
  loadout!: Loadout;
  damageDealt = 0;
  greenLevel = 1;
  private warnings!: Phaser.GameObjects.Graphics;
  private mounts: Phaser.GameObjects.Container[] = [];
  private smoke!: Phaser.GameObjects.Particles.ParticleEmitter;
  private smokeAt = 0;
  get lowEffects() {
    return this.save.reducedEffects || this.save.quality === "low";
  }
  get speedBoost() {
    return this.weapons?.turbo > 0
      ? getWeaponStats(
          this.loadout.tactical,
          this.weaponLevel(this.loadout.tactical),
        ).strength
      : 1;
  }
  private rioSection = "";
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
    training?: boolean;
    trainingWeapon?: string;
    trainingLevel?: number;
  }) {
    this.save = d.save;
    this.stage = d.stage;
    this.done = d.done;
    this.hud = d.hud;
    this.training = !!d.training;
    this.loadout = {
      ...(this.save.loadouts[this.save.selected] ??
        defaultLoadout(this.save.selected)),
    };
    if (d.trainingWeapon)
      this.setTrainingWeapon(d.trainingWeapon, d.trainingLevel ?? 1);
  }
  preload() {
    if (!this.training && this.stage === 0) RioWorld.preload(this);
    const region = brazilRegionForStage(this.stage);
    if (!this.training && region) BrazilWorld.preload(this, region);
    const p = planes[this.save.selected];
    this.load.svg("plane" + p.id, svgUrl(aircraft(p.color, p.id)), {
      width: 160,
      height: 160,
    });
    this.load.svg("wing", svgUrl(companionArt(this.save.wing)), {
      width: 80,
      height: 84,
    });
    this.load.svg("enemy", svgUrl(aircraft("#d78a73", 2)), {
      width: 120,
      height: 120,
    });
    for (const id of [0, 3, 5, 10, 11])
      this.load.svg(
        "enemy" + id,
        svgUrl(aircraft(["#a3b29b", "#bd7a64", "#8c8d94"][id % 3], id)),
        { width: 130, height: 130 },
      );
    this.load.svg("ship", svgUrl(warship()));
    this.load.svg("fortress", svgUrl(fortress()));
    this.load.svg("mech", svgUrl(fortress(true)));
    this.load.svg("tank", svgUrl(ground(8)));
    this.load.svg("turret", svgUrl(ground(6)));
  }
  create() {
    const region = brazilRegionForStage(this.stage);
    if (
      !this.training &&
      ((this.stage === 0 && !RioWorld.hasAssets(this)) ||
        (region && !BrazilWorld.hasAssets(this, region)))
    ) {
      this.ended = true;
      this.game.events.emit("world-load-error");
      return;
    }
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
    if (this.training) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x152c36);
      g.fillRect(0, 0, 540, 960);
      g.lineStyle(1, 0x5a8b88, 0.2);
      for (let x = 0; x < 540; x += 45) g.lineBetween(x, 0, x, 960);
      for (let y = 0; y < 960; y += 45) g.lineBetween(0, y, 540, y);
      g.lineStyle(3, 0xdeb973, 0.25);
      g.strokeCircle(270, 280, 130);
      g.strokeCircle(270, 280, 70);
      g.generateTexture("practice-floor", 540, 960);
      g.destroy();
      this.bg = this.add.tileSprite(270, 480, 540, 960, "practice-floor");
    } else if (this.stage === 0)
      this.rioWorld = new RioWorld(
        this,
        this.save.reducedEffects || this.save.quality === "low",
      );
    else if (region)
      this.brazilWorld = new BrazilWorld(
        this,
        region,
        this.save.reducedEffects || this.save.quality === "low",
      );
    else {
      this.makeTerrain();
      this.bg = this.add.tileSprite(270, 480, 540, 960, "terrain");
      this.clouds = this.add
        .tileSprite(270, 480, 540, 960, "cloud")
        .setAlpha(0.24)
        .setDepth(2);
    }
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
    this.smoke = this.add
      .particles(0, 0, "spark", {
        emitting: false,
        speed: { min: 8, max: 25 },
        angle: { min: 70, max: 110 },
        lifespan: 850,
        scale: { start: 2.5, end: 7 },
        alpha: { start: 0.2, end: 0 },
        tint: [0x11242e, 0x3a3f3f],
        maxAliveParticles: 60,
      })
      .setDepth(4.5);
    this.level = this.training ? 1 : this.save.levels[this.save.selected] || 1;
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
    this.weapons = new WeaponSystem(this);
    this.warnings = this.add.graphics().setDepth(3.8);
    for (const offset of [-1, 1]) {
      const mount = this.add.container(0, 0).setDepth(5.1);
      mount.add(
        this.add.rectangle(0, 0, 7, 25, 0xaac6b7).setStrokeStyle(1, 0x1b3441),
      );
      mount.add(this.add.rectangle(0, -12, 5, 8, 0xe8bf72));
      this.mounts.push(mount);
    }
    this.keys = this.input.keyboard!.addKeys(
      "W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,T,ONE,TWO,THREE,FOUR,FIVE,ESC",
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
    this.input.keyboard!.on("keydown-T", () => this.tactical());
    ["ONE", "TWO", "THREE", "FOUR", "FIVE"].forEach((k, i) =>
      this.input.keyboard!.on("keydown-" + k, () => this.ability(i)),
    );
    this.game.events.on("blur", this.onBlur, this);
    this.events.once("shutdown", () => {
      this.game.events.off("blur", this.onBlur, this);
      this.bullets = [];
      this.enemies = [];
      this.pool = [];
      this.rioWorld?.destroy();
      this.brazilWorld?.destroy();
    });
    audio.mode = this.training ? "training" : "battle";
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
    if (this.bullets.length >= 650) return undefined;
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
    const projectile: Bullet = {
      s,
      vx,
      vy,
      enemy,
      damage,
      homing,
      hits: piercing ? [] : undefined,
      pierce: piercing ? 3 : 1,
      expires: this.elapsed + 6,
    };
    this.bullets.push(projectile);
    return projectile;
  }
  recycle(i: number) {
    const [b] = this.bullets.splice(i, 1);
    b.s.setVisible(false).setActive(false);
    this.pool.push(b.s);
  }
  explosion(x: number, y: number, big = false) {
    const density = this.lowEffects
      ? 0.22
      : this.save.quality === "high"
        ? 1
        : 0.65;
    this.fx.explode(Math.ceil((big ? 85 : 28) * density), x, y);
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
    audio.play(big ? "boss-explosion" : "explosion");
    if (big && this.save.screenShake) this.cameras.main.shake(240, 0.008);
  }
  spawnEnemy(kind: number, x: number, boss = false) {
    const mult = this.training
      ? 1
      : stages[this.stage].difficulty * this.difficulty;
    const hp = (boss ? 2300 + this.stage * 230 : 24 + kind * 9) * mult;
    const key = boss
      ? ["fortress", "ship", "mech"][stages[this.stage].boss]
      : kind === 7
        ? "ship"
        : kind === 8
          ? "tank"
          : kind === 6
            ? "turret"
            : [
                "enemy0",
                "enemy3",
                "enemy5",
                "enemy5",
                "enemy",
                "enemy10",
                "enemy",
                "enemy",
                "enemy",
                "enemy3",
                "enemy3",
                "enemy11",
              ][kind] || "enemy";
    const s = this.add
      .image(x, boss ? -180 : -70, key)
      .setDisplaySize(
        boss ? (key === "ship" ? 310 : 450) : kind === 7 ? 90 : 54 + kind * 2,
        boss ? (key === "ship" ? 610 : 345) : kind === 7 ? 145 : 60 + kind * 2,
      )
      .setAngle(key.startsWith("enemy") ? 180 : 0)
      .setDepth(3)
      .setTint([0xffd2b5, 0xe8b295, 0x9db6a5, 0xc9a4d4][kind % 4]);
    const enemy: Enemy = {
      s,
      hp,
      max: hp,
      kind,
      born: this.elapsed,
      fire: this.elapsed + 1.2,
      base: x,
      boss,
      phase: 1,
    };
    if (boss) {
      enemy.parts = [
        [-0.31, 0.08, "Canhão esquerdo"],
        [0.31, 0.08, "Canhão direito"],
        [0, 0.27, "Reator"],
      ].map(([x, y, name], i) => ({
        id: String(i),
        name: String(name),
        hp: hp * 0.12,
        max: hp * 0.12,
        x: Number(x) * s.displayWidth,
        y: Number(y) * s.displayHeight,
        s: this.add
          .image(0, 0, "turret")
          .setDisplaySize(i === 2 ? 37 : 44, i === 2 ? 44 : 55)
          .setDepth(4),
        destroyed: false,
        shotsFired: 0,
      }));
    }
    enemy.shadow = this.add
      .image(s.x + 12, s.y + 20, key)
      .setDisplaySize(s.displayWidth, s.displayHeight)
      .setAngle(s.angle)
      .setTint(0x051b29)
      .setAlpha(0.25)
      .setDepth(1.5);
    this.enemies.push(enemy);
    return enemy;
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
      this.damageArea(270, 450, 350 + lv * 90, 650);
      this.explosion(this.player.x, 430, true);
      if (!this.lowEffects) this.cameras.main.flash(220, 200, 230, 255);
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
      this.weapons.activateSpecial(
        this.loadout.special,
        this.weaponLevel(this.loadout.special),
      )
    )
      this.specialCooldown = this.weapons.specialCooldown;
  }
  tactical() {
    return this.weapons.activateTactical(
      this.loadout.tactical,
      this.weaponLevel(this.loadout.tactical),
    );
  }
  weaponLevel(id: string) {
    return this.training
      ? (this.trainingLevels[id] ?? 1)
      : (this.save.weaponLevels[id] ?? 1);
  }
  setTrainingWeapon(id: string, level: number) {
    if (!this.training) return;
    const w = getWeapon(id);
    if (!w) return;
    this.trainingLevels[id] = Math.max(1, Math.min(5, Math.floor(level)));
    if (w.category === "primary") this.loadout.primary = id;
    else if (w.category === "secondary") {
      this.loadout.left = id;
      this.loadout.right = null;
    } else if (w.category === "special") this.loadout.special = id;
    else this.loadout.tactical = id;
    this.weapons?.reset();
  }
  resetTraining() {
    if (!this.training) return;
    for (const e of this.enemies) {
      e.parts?.forEach((p) => p.s.destroy());
      e.shadow?.destroy();
      e.s.destroy();
    }
    this.enemies = [];
    for (let i = this.bullets.length - 1; i >= 0; i--) this.recycle(i);
    this.hp = this.maxHp;
    this.elapsed = 0;
    this.spawn = 0;
    this.ended = false;
    this.player?.setVisible(true);
    this.kills = this.score = this.damageDealt = 0;
    this.cooldowns.fill(0);
    this.specialRemaining = 0;
    this.shield = this.laser = 0;
    this.weapons.reset();
  }
  clearHostileBullets() {
    for (let i = this.bullets.length - 1; i >= 0; i--)
      if (this.bullets[i].enemy) this.recycle(i);
  }
  damagePart(e: Enemy, part: BossPart, amount: number) {
    if (part.destroyed || amount <= 0) return;
    part.hp = Math.max(0, part.hp - amount);
    this.damageDealt += amount;
    if (part.hp === 0) {
      part.destroyed = true;
      part.s.setTint(0x202e37).setAlpha(0.5);
      e.hp -= e.max * 0.065;
      this.explosion(e.s.x + part.x, e.s.y + part.y);
      this.score += 200;
      if (!this.training) this.coins += 15;
    }
  }
  damageEnemy(e: Enemy, amount: number, x = e.s.x, y = e.s.y) {
    if (e.hp <= 0 || amount <= 0) return;
    const part = e.parts?.find(
      (p) =>
        !p.destroyed &&
        Math.abs(x - (e.s.x + p.x)) < 27 &&
        Math.abs(y - (e.s.y + p.y)) < 34,
    );
    if (part) {
      this.damagePart(e, part, amount);
      return;
    }
    e.hp -= amount;
    this.damageDealt += amount;
    e.s.setAlpha(0.6);
    this.tweens.add({ targets: e.s, alpha: 1, duration: 65 });
  }
  damageArea(
    x: number,
    y: number,
    damage: number,
    radius: number,
    except?: Enemy,
  ) {
    for (const e of this.enemies) {
      if (e === except || e.hp <= 0) continue;
      if (Math.hypot(e.s.x - x, e.s.y - y) < radius + (e.boss ? 90 : 15))
        this.damageEnemy(e, damage);
      for (const p of e.parts ?? [])
        if (
          !p.destroyed &&
          Math.hypot(e.s.x + p.x - x, e.s.y + p.y - y) < radius
        )
          this.damagePart(e, p, damage * 0.7);
    }
  }
  private collidesEnemy(e: Enemy, x: number, y: number) {
    if (!e.boss)
      return (
        Math.abs(x - e.s.x) < 25 + Math.min(e.kind, 11) &&
        Math.abs(y - e.s.y) < 29 + Math.min(e.kind, 11)
      );
    const aligned = e.parts?.find(
      (p) => !p.destroyed && Math.abs(x - e.s.x - p.x) < 28,
    );
    if (aligned) return Math.abs(y - e.s.y - aligned.y) < 35;
    return (
      Math.abs(x - e.s.x) < e.s.displayWidth * 0.18 &&
      Math.abs(y - e.s.y) < e.s.displayHeight * 0.3
    );
  }
  private updateBoss(e: Enemy) {
    for (const p of e.parts ?? []) p.s.setPosition(e.s.x + p.x, e.s.y + p.y);
    if (e.s.y < 90 || this.weapons.stun > 0) return;
    if (!e.warningUntil && this.elapsed > e.fire) {
      e.warningAngle = Math.atan2(this.player.y - e.s.y, this.player.x - e.s.x);
      e.warningUntil = this.elapsed + 0.65;
    }
    if (e.warningUntil) {
      const a = e.warningAngle!;
      this.warnings.lineStyle(2, 0xffb877, 0.35);
      this.warnings.lineBetween(
        e.s.x,
        e.s.y,
        e.s.x + Math.cos(a) * 900,
        e.s.y + Math.sin(a) * 900,
      );
      this.warnings.lineStyle(2, 0xffca75, 0.7);
      for (const p of e.parts ?? [])
        if (!p.destroyed)
          this.warnings.strokeCircle(e.s.x + p.x, e.s.y + p.y, 26);
      if (this.elapsed >= e.warningUntil) {
        e.warningUntil = 0;
        e.fire =
          this.elapsed + Math.max(0.85, 2.2 - e.phase * 0.35) / this.difficulty;
        const emit = (
          x: number,
          y: number,
          count: number,
          spread: number,
          angle: number,
        ) => {
          for (let i = 0; i < count; i++) {
            const an = angle + (i - (count - 1) / 2) * spread;
            this.bullet(
              x,
              y,
              Math.cos(an) * (135 + e.phase * 22) * this.difficulty,
              Math.sin(an) * (135 + e.phase * 22) * this.difficulty,
              true,
              16,
            );
          }
        };
        emit(e.s.x, e.s.y + 20, 3, 0.18, a);
        for (const p of e.parts ?? [])
          if (!p.destroyed) {
            p.shotsFired++;
            const base = e.phase === 3 ? a + Math.sin(this.elapsed) * 0.5 : a;
            emit(e.s.x + p.x, e.s.y + p.y, 2 + e.phase, 0.17, base);
          }
        audio.play("cannon");
      }
    }
  }
  update(_t: number, ms: number) {
    if (this.ended || this.paused) return;
    const dt = Math.min(ms / 1000, 0.04);
    this.elapsed += dt;
    this.specialCooldown = this.weapons.specialCooldown;
    if (this.hp / this.maxHp < 0.25 && this.elapsed - this.lastAlert > 3) {
      audio.play("critical");
      this.lastAlert = this.elapsed;
    }
    if (this.specialRemaining > 0) {
      this.specialRemaining = Math.max(0, this.specialRemaining - dt);
      if (this.elapsed > this.specialShot) {
        this.specialShot =
          this.elapsed +
          getWeaponStats("green-storm", this.greenLevel).interval / 1000;
        for (let j = -2; j <= 2; j++)
          this.bullet(
            this.player.x + j * 8,
            this.player.y - 38,
            j * 75,
            -800,
            false,
            getWeaponStats("green-storm", this.greenLevel).damage *
              this.weapons.damageScale,
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
            120 * (1 + (this.greenLevel - 1) * 0.22) * this.weapons.damageScale,
            true,
            0xb6ff8a,
          );
    }

    if (this.rioWorld) {
      this.rioWorld.update(this.elapsed, stages[this.stage].duration, dt);
      const section = this.rioWorld.state.section;
      if (section !== this.rioSection) {
        this.rioSection = section;
        if (section === "christ") {
          audio.mode = "landmark";
          // A quiet, readable scenic passage: no new waves, existing aircraft
          // remain targets but hostile rounds are cleared once on entry.
          for (let i = this.bullets.length - 1; i >= 0; i--)
            if (this.bullets[i].enemy) this.recycle(i);
        } else if (!this.bossSpawned) audio.mode = "battle";
      }
    } else if (this.brazilWorld) {
      this.brazilWorld.update(this.elapsed, stages[this.stage].duration, dt);
    } else {
      this.bg.tilePositionY -= dt * (this.training ? 12 : 65);
      if (this.clouds) this.clouds.tilePositionY -= dt * 110;
    }
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
      this.player.x +=
        (dx / len) * planes[this.save.selected].speed * dt * this.speedBoost;
      this.player.y +=
        (dy / len) * planes[this.save.selected].speed * dt * this.speedBoost;
    } else if (this.target) {
      dx = this.target.x - this.player.x;
      this.player.x +=
        dx * Math.min(1, dt * 12 * this.save.sensitivity * this.speedBoost);
      this.player.y +=
        (this.target.y - this.player.y) *
        Math.min(1, dt * 12 * this.save.sensitivity * this.speedBoost);
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
    if (
      Math.random() <
      (this.lowEffects ? 0.05 : this.save.quality === "high" ? 0.25 : 0.15)
    )
      this.fx.emitParticleAt(this.player.x, this.player.y + 37, 1);
    this.wing.forEach((w, i) => {
      w.x = Phaser.Math.Linear(w.x, this.player.x + (i ? 65 : -65), dt * 10);
      w.y = Phaser.Math.Linear(w.y, this.player.y + 35, dt * 10);
    });
    this.mounts.forEach((mount, i) => {
      const id = i === 0 ? this.loadout.left : this.loadout.right;
      mount
        .setPosition(this.player.x + (i === 0 ? -29 : 29), this.player.y - 4)
        .setAngle(this.player.angle)
        .setVisible(!!id);
    });
    if (this.elapsed > this.smokeAt) {
      this.smokeAt =
        this.elapsed +
        (this.lowEffects ? 0.3 : this.save.quality === "high" ? 0.12 : 0.2);
      if (this.hp / this.maxHp < 0.4)
        this.smoke.emitParticleAt(this.player.x, this.player.y + 27, 1);
      for (const e of this.enemies)
        if (e.hp > 0 && e.hp / e.max < 0.35)
          this.smoke.emitParticleAt(e.s.x, e.s.y, 1);
    }
    this.weapons.update(dt);
    const stage = stages[this.stage];
    if (this.training) {
      if (this.enemies.length < 3 && this.elapsed >= this.spawn) {
        this.spawn = this.elapsed + 1;
        const e = this.spawnEnemy(2, 110 + this.enemies.length * 160);
        e.s.y = 240 + this.enemies.length * 50;
        e.hp = e.max = 500;
      }
    } else if (this.elapsed < this.spawn) {
    } else if (this.elapsed < stage.duration) {
      if (this.rioWorld?.state.section !== "christ") {
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
      }
    } else if (
      !this.bossSpawned &&
      (!this.rioWorld ||
        (this.rioWorld.state.bossReady && this.rioWorld.flyoverComplete))
    ) {
      this.bossSpawned = true;
      audio.mode = "boss";
      this.spawnEnemy(9 + stage.boss, 270, true);
    }
    this.warnings.clear();
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i],
        age = this.elapsed - e.born;
      if (this.training) {
        e.s.x = e.base + Math.sin(age) * 20;
      } else if (e.boss) {
        e.s.y = Math.min(185, e.s.y + dt * 70);
        e.s.x = 270 + Math.sin(age * 0.65) * 120;
        e.phase = e.hp < e.max * 0.33 ? 3 : e.hp < e.max * 0.66 ? 2 : 1;
      } else {
        const speed = [95, 190, 65, 70, 55, 150, 40, 38, 42, 90, 100, 60][
          e.kind
        ];
        e.s.y +=
          speed *
          dt *
          (this.weapons.stun > 0
            ? 0
            : this.weapons.slow > 0
              ? Math.max(
                  0.2,
                  1 -
                    getWeaponStats(
                      this.loadout.tactical,
                      this.weaponLevel(this.loadout.tactical),
                    ).strength,
                )
              : 1);
        e.s.x =
          e.kind === 10
            ? Phaser.Math.Linear(e.s.x, this.player.x, dt * 0.65)
            : e.base +
              Math.sin(age * (e.kind === 1 ? 3 : 1.6)) * ((e.kind % 3) * 28);
      }
      e.shadow?.setPosition(e.s.x + 12, e.s.y + 20);
      if (e.boss) this.updateBoss(e);
      if (
        !this.training &&
        !e.boss &&
        this.weapons.stun <= 0 &&
        this.elapsed > e.fire &&
        e.s.y > 30
      ) {
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
        this.damageEnemy(
          e,
          dt * (170 + this.save.deviceLevels[2] * 45),
          this.player.x,
          e.s.y,
        );
      if (e.hp <= 0) {
        this.explosion(e.s.x, e.s.y, e.boss);
        this.score += e.boss ? 5000 : 100 + e.kind * 20;
        this.kills++;
        if (e.boss) this.bosses++;
        const coins = e.boss ? 150 : 8 + e.kind;
        if (!this.training) this.coins += coins;
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
        e.parts?.forEach((p) => p.s.destroy());
        e.shadow?.destroy();
        e.s.destroy();
        this.enemies.splice(i, 1);
        if (e.boss) {
          this.inv = 2;
          this.clearHostileBullets();
          this.weapons.stun = 2;
          this.time.delayedCall(1000, () => this.finish(true));
        }
        continue;
      }
      if (e.s.y > 1060) {
        e.parts?.forEach((p) => p.s.destroy());
        e.shadow?.destroy();
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
      const slow =
        b.enemy && this.weapons.slow > 0
          ? Math.max(
              0.2,
              1 -
                getWeaponStats(
                  this.loadout.tactical,
                  this.weaponLevel(this.loadout.tactical),
                ).strength,
            )
          : 1;
      b.s.x += b.vx * dt * slow;
      b.s.y += b.vy * dt * slow;
      if (b.expires !== undefined && this.elapsed > b.expires) {
        if (b.blastRadius) {
          this.damageArea(b.s.x, b.s.y, b.damage, b.blastRadius);
          this.explosion(b.s.x, b.s.y);
        }
        this.recycle(i);
        continue;
      }
      b.s.rotation = Math.atan2(b.vx, -b.vy);
      if (b.s.y < -50 || b.s.y > 1010 || b.s.x < -50 || b.s.x > 590) {
        this.recycle(i);
        continue;
      }
      if (b.enemy) {
        if (
          this.weapons.reflect > 0 &&
          Math.hypot(b.s.x - this.player.x, b.s.y - this.player.y) < 65
        ) {
          b.enemy = false;
          b.vy = -Math.abs(b.vy) * 1.5;
          b.damage = Math.max(
            b.damage,
            getWeaponStats(
              this.loadout.tactical,
              this.weaponLevel(this.loadout.tactical),
            ).damage,
          );
          b.s.setTint(0xb8eaff);
          continue;
        }
        if (
          this.weapons.barrier > 0 &&
          Math.abs(b.s.x - this.player.x) <
            getWeaponStats(
              this.loadout.tactical,
              this.weaponLevel(this.loadout.tactical),
            ).strength &&
          Math.abs(b.s.y - (this.player.y - 70)) < 16
        ) {
          this.fx.explode(2, b.s.x, b.s.y);
          this.recycle(i);
          continue;
        }
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
          (e) => !b.hits?.includes(e) && this.collidesEnemy(e, b.s.x, b.s.y),
        );
        if (e) {
          this.damageEnemy(e, b.damage, b.s.x, b.s.y);
          if (b.blastRadius) {
            this.damageArea(b.s.x, b.s.y, b.damage * 0.65, b.blastRadius, e);
            this.explosion(b.s.x, b.s.y);
          }
          e.s.setAlpha(0.55);
          this.tweens.add({ targets: e.s, alpha: 1, duration: 80 });
          this.fx.explode(2, b.s.x, b.s.y);
          if (b.hits) {
            b.hits.push(e);
            if (b.hits.length >= (b.pierce ?? 3)) this.recycle(i);
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
    if (this.training) {
      this.hp = Math.max(1, this.hp - d);
      return;
    }
    if (this.inv > 0 || this.shield > 0) return;
    this.hp = Math.max(0, this.hp - d);
    this.inv = 1.1;
    if (this.save.screenShake) this.cameras.main.shake(100, 0.004);
    audio.play("damage");
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
