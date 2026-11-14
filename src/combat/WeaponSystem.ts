import Phaser from "phaser";
import { getWeapon, getWeaponStats } from "../arsenal";
import type { Battle } from "../battle";
import { audio } from "../audio";
import { planes } from "../catalog";
/** Shared combat implementation for campaign and free training. */
export class WeaponSystem {
  specialCooldown = 0;
  tacticalCooldown = 0;
  reflect = 0;
  barrier = 0;
  slow = 0;
  turbo = 0;
  stun = 0;
  private primaryAt = 0;
  private leftAt = 0;
  private rightAt = 0;
  private wingAt = 0;
  private pulseUntil = 0;
  private pulseAt = 0;
  private pulseId = "";
  private pulseLevel = 1;
  private lines: {
    x: number;
    y: number;
    tx: number;
    ty: number;
    color: number;
    width: number;
    until: number;
  }[] = [];
  private graphics: Phaser.GameObjects.Graphics;
  private drones: Phaser.GameObjects.Image[] = [];
  constructor(private b: Battle) {
    this.graphics = b.add.graphics().setDepth(6);
    for (let i = 0; i < 2; i++)
      this.drones.push(
        b.add
          .image(0, 0, "wing")
          .setDisplaySize(28, 30)
          .setTint(0x9cecd6)
          .setDepth(4)
          .setVisible(false),
      );
  }
  get damageScale() {
    return (
      (1 + (this.b.level - 1) * 0.16) *
      (this.b.training ? 1 : planes[this.b.save.selected].damage / 12)
    );
  }
  update(dt: number) {
    const b = this.b;
    for (const key of [
      "specialCooldown",
      "tacticalCooldown",
      "reflect",
      "barrier",
      "slow",
      "turbo",
      "stun",
    ] as const)
      this[key] = Math.max(0, this[key] - dt);
    if (b.elapsed >= this.primaryAt) {
      const id = b.loadout.primary,
        stats = getWeaponStats(id, b.weaponLevel(id));
      this.primaryAt =
        b.elapsed + stats.interval / 1000 / (1 + (b.level - 1) * 0.06);
      this.fire(
        id,
        b.weaponLevel(id),
        b.player.x,
        b.player.y - 34,
        this.damageScale,
      );
    }
    for (const slot of ["left", "right"] as const) {
      const id = b.loadout[slot],
        key = slot === "left" ? "leftAt" : "rightAt";
      if (id && b.elapsed >= this[key]) {
        const lv = b.weaponLevel(id);
        this[key] = b.elapsed + getWeaponStats(id, lv).interval / 1000;
        this.fire(
          id,
          lv,
          b.player.x + (slot === "left" ? -30 : 30),
          b.player.y - 8,
          this.damageScale,
        );
      }
    }
    if (b.elapsed >= this.wingAt) {
      this.wingAt = b.elapsed + 0.27;
      for (const w of b.wing) {
        const dmg = 5 + (b.save.wingLevels[b.save.wing] || 1) * 3;
        for (const vx of b.save.wing === 1 ? [-140, 0, 140] : [0])
          b.bullet(
            w.x,
            w.y - 20,
            vx,
            b.save.wing === 2 ? -950 : -640,
            false,
            dmg,
            b.save.wing === 3,
            b.save.wing === 2 ? 0xbfa1ff : undefined,
            b.save.wing === 2,
          );
      }
    }
    if (this.pulseUntil > b.elapsed && b.elapsed >= this.pulseAt) {
      const st = getWeaponStats(this.pulseId, this.pulseLevel);
      this.pulseAt = b.elapsed + st.interval / 1000;
      if (this.pulseId === "superlaser")
        this.beam(b.player.x, st.damage * this.damageScale, st.color, 38);
      else if (this.pulseId === "orbital") {
        const targets = b.enemies.filter((e) => e.hp > 0);
        const e =
          targets[Math.floor(b.elapsed * 3) % Math.max(1, targets.length)];
        if (e) {
          b.damageArea(
            e.s.x,
            e.s.y,
            st.damage * this.damageScale,
            st.blastRadius,
          );
          this.line(e.s.x, 0, e.s.x, e.s.y, st.color, 15, 0.28);
          b.explosion(e.s.x, e.s.y);
        }
      } else b.damageArea(270, 400, st.damage * this.damageScale, 650);
    }
    const hasDrone =
      b.loadout.left === "drones" || b.loadout.right === "drones";
    this.drones.forEach((s, i) => {
      s.setVisible(hasDrone).setPosition(
        b.player.x + Math.sin(b.elapsed * 2 + i * Math.PI) * 95,
        b.player.y + Math.cos(b.elapsed * 2 + i * Math.PI) * 22,
      );
    });
    this.draw();
  }
  fire(id: string, level: number, x: number, y: number, scale = 1) {
    const weapon = getWeapon(id);
    if (!weapon) return;
    const s = getWeaponStats(weapon, level),
      b = this.b;
    if (s.continuous) {
      this.beam(x, s.damage * scale, s.color, 8 + level * 2);
      audio.play("laser", level);
      return;
    }
    if (s.chain > 1) {
      const candidates = b.enemies
        .filter((e) => e.hp > 0 && e.s.y < y + 60)
        .sort(
          (a, c) =>
            Math.hypot(a.s.x - x, a.s.y - y) - Math.hypot(c.s.x - x, c.s.y - y),
        );
      let from = { x, y };
      for (const e of candidates.slice(0, s.chain)) {
        b.damageEnemy(e, s.damage * scale, e.s.x, e.s.y);
        this.line(from.x, from.y, e.s.x, e.s.y, s.color, 2 + level * 0.3, 0.17);
        from = { x: e.s.x, y: e.s.y };
      }
      if (!candidates.length) this.line(x, y, x, y - 350, s.color, 2, 0.1);
      audio.play("electric", level);
      return;
    }
    for (let i = 0; i < s.count; i++) {
      const centered = i - (s.count - 1) / 2,
        angle = centered * s.spread;
      const projectile = b.bullet(
        x + (s.spread === 0 ? centered * 14 : 0),
        y,
        Math.sin(angle) * s.speed,
        -Math.cos(angle) * s.speed,
        false,
        s.damage * scale,
        s.homing,
        s.color,
        s.pierce > 1,
      );
      if (projectile) {
        projectile.weapon = id;
        projectile.blastRadius = s.blastRadius;
        projectile.pierce = s.pierce;
        projectile.s.setScale(
          id === "heavy"
            ? 1.5
            : id === "quantum"
              ? 1.8
              : 1 + (level - 1) * 0.08,
          id === "plasma" || id === "side-plasma" ? 1.15 : 1,
        );
        if (id === "bombs") {
          projectile.expires = b.elapsed + 0.95;
          projectile.s.setScale(1.7, 1.3);
        }
        if (id === "drones")
          projectile.s.setTexture("wing").setDisplaySize(21, 24);
      }
    }
    audio.play(weapon.sound, level);
  }
  private beam(x: number, damage: number, color: number, width: number) {
    const b = this.b;
    this.line(x, b.player.y - 35, x, 0, color, width, 0.13);
    for (const e of b.enemies) {
      if (e.hp <= 0) continue;
      if (
        e.s.y >= 0 &&
        e.s.y < b.player.y &&
        Math.abs(e.s.x - x) <
          (e.boss ? e.s.displayWidth * 0.43 : 30) + width / 2
      )
        b.damageEnemy(e, damage, x, e.s.y);
      for (const p of e.parts ?? [])
        if (
          !p.destroyed &&
          e.s.y + p.y >= 0 &&
          e.s.y + p.y < b.player.y - 35 &&
          Math.abs(e.s.x + p.x - x) < width / 2 + 20
        )
          b.damagePart(e, p, damage * 0.6);
    }
  }
  private line(
    x: number,
    y: number,
    tx: number,
    ty: number,
    color: number,
    width: number,
    duration: number,
  ) {
    if (this.lines.length > 30) this.lines.shift();
    this.lines.push({
      x,
      y,
      tx,
      ty,
      color,
      width,
      until: this.b.elapsed + duration,
    });
  }
  activateSpecial(id: string, level: number) {
    const b = this.b,
      w = getWeapon(id);
    if (
      !w ||
      w.category !== "special" ||
      b.ended ||
      b.paused ||
      this.specialCooldown > 0
    )
      return false;
    const s = getWeaponStats(w, level);
    this.specialCooldown = s.cooldown;
    if (["bomb", "emp", "shockwave", "omega"].includes(id)) {
      b.clearHostileBullets();
      b.damageArea(
        id === "shockwave" ? b.player.x : 270,
        id === "shockwave" ? b.player.y : 420,
        s.damage * this.damageScale,
        id === "shockwave" ? 290 : s.blastRadius || 650,
      );
      b.explosion(
        id === "shockwave" ? b.player.x : 270,
        id === "shockwave" ? b.player.y : 380,
        true,
      );
    }
    if (id === "emp") {
      this.stun = s.duration;
      for (const e of b.enemies) {
        e.warningUntil = 0;
        e.fire = b.elapsed + s.duration + 0.7;
      }
    }
    if (["omega", "orbital", "superlaser"].includes(id)) {
      this.pulseId = id;
      this.pulseLevel = level;
      this.pulseUntil = b.elapsed + s.duration;
      this.pulseAt = b.elapsed + 0.2;
    }
    if (id === "green-storm") {
      b.specialRemaining = s.duration;
      b.specialShot = b.elapsed;
      b.greenLevel = level;
    }
    if (id === "barrage")
      for (let j = 0; j < s.count; j++) {
        const p = b.bullet(
          b.player.x + (j % 2 ? 22 : -22),
          b.player.y,
          Math.sin(j) * 160,
          -s.speed,
          false,
          s.damage * this.damageScale,
          true,
          s.color,
        );
        if (p) {
          p.weapon = id;
          p.blastRadius = 25;
        }
      }
    audio.play(w.sound, level);
    return true;
  }
  activateTactical(id: string, level: number) {
    const b = this.b,
      w = getWeapon(id);
    if (
      !w ||
      w.category !== "tactical" ||
      b.ended ||
      b.paused ||
      this.tacticalCooldown > 0
    )
      return false;
    const s = getWeaponStats(w, level);
    this.tacticalCooldown = s.cooldown;
    if (id === "shield") b.shield = Math.max(b.shield, s.duration);
    if (id === "repair") b.hp = Math.min(b.maxHp, b.hp + b.maxHp * s.strength);
    if (id === "turbo") this.turbo = s.duration;
    if (id === "reflector") this.reflect = s.duration;
    if (id === "barrier") this.barrier = s.duration;
    if (id === "slowfield") this.slow = s.duration;
    audio.play(w.sound, level);
    return true;
  }
  private draw() {
    const b = this.b,
      g = this.graphics;
    g.clear();
    this.lines = this.lines.filter((l) => l.until > b.elapsed);
    for (const l of this.lines) {
      g.lineStyle(l.width + 5, l.color, 0.12);
      g.lineBetween(l.x, l.y, l.tx, l.ty);
      g.lineStyle(l.width, l.color, 0.6);
      g.lineBetween(l.x, l.y, l.tx, l.ty);
      g.lineStyle(Math.max(1, l.width * 0.25), 0xf6ffff, 0.9);
      g.lineBetween(l.x, l.y, l.tx, l.ty);
    }
    if (this.reflect > 0) {
      g.lineStyle(3, 0xc8a4ff, 0.8);
      g.strokeCircle(b.player.x, b.player.y, 64);
    }
    if (this.barrier > 0) {
      g.lineStyle(6, 0x7af4dd, 0.7);
      g.lineBetween(
        b.player.x -
          getWeaponStats(b.loadout.tactical, b.weaponLevel(b.loadout.tactical))
            .strength,
        b.player.y - 70,
        b.player.x +
          getWeaponStats(b.loadout.tactical, b.weaponLevel(b.loadout.tactical))
            .strength,
        b.player.y - 70,
      );
    }
    if (this.slow > 0) {
      g.lineStyle(2, 0x94a9f7, 0.2);
      for (let i = 0; i < 4; i++)
        g.strokeCircle(
          b.player.x,
          b.player.y,
          95 + i * 35 + Math.sin(b.elapsed) * 10,
        );
    }
  }
  reset() {
    this.specialCooldown = 0;
    this.tacticalCooldown = 0;
    this.primaryAt = 0;
    this.leftAt = 0;
    this.rightAt = 0;
    this.wingAt = 0;
    this.reflect = this.barrier = this.slow = this.stun = this.turbo = 0;
    this.pulseUntil = 0;
    this.lines = [];
  }
}
