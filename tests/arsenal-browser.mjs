import { chromium } from "@playwright/test";
import assert from "node:assert/strict";

const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || "/usr/bin/chromium";
const baseURL = process.env.SKY_STRIKE_DEV_URL || "http://127.0.0.1:5173";
const legacy = {
  version: 2,
  coins: 2000000,
  gems: 34,
  selected: 0,
  owned: [0, 1, 12],
  levels: { 0: 1, 1: 1, 12: 1 },
  stats: {
    kills: 42,
    wins: 8,
    bosses: 7,
    earned: 2000,
    upgrades: 3,
    perfect: 1,
  },
  stars: { 0: 3, 1: 2 },
  unlocked: 29,
  wing: 0,
  wingLevel: 1,
  wingLevels: { 0: 1, 1: 1, 2: 1, 3: 1 },
  deviceLevels: [1, 1, 1, 1, 1],
  equipped: [0, 1, 2],
  difficulty: "Normal",
  volume: 0.1,
  daily: "13/11/2026",
  claimed: ["kills"],
  favorites: [12],
  reducedEffects: true,
  screenShake: false,
  largeHud: false,
  touchOffset: 75,
  sensitivity: 1,
};
const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
try {
  const context = await browser.newContext({
    viewport: { width: 1366, height: 900 },
    hasTouch: true,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript((seed) => {
    if (localStorage.getItem("sky-strike") === null)
      localStorage.setItem("sky-strike", JSON.stringify(seed));
  }, legacy);
  await page.goto(baseURL);
  const readSave = () =>
    page.evaluate(() => JSON.parse(localStorage.getItem("sky-strike")));
  const migrated = await readSave();
  assert.equal(migrated.version, 3);
  for (const [key, value] of Object.entries(legacy).filter(
    ([key]) => key !== "version",
  ))
    assert.deepEqual(migrated[key], value, `migration changed ${key}`);
  const catalog = await page.evaluate(async () => {
    const a = await import("/src/arsenal.ts");
    return a.weapons;
  });
  assert.equal(catalog.filter((w) => w.category === "primary").length, 10);
  assert.equal(catalog.filter((w) => w.category === "secondary").length, 7);
  assert.equal(catalog.filter((w) => w.category === "special").length, 8);
  assert.equal(catalog.filter((w) => w.category === "tactical").length, 6);
  const action = async (name) => {
    const target = page.locator(`[data-action="${name}"]:visible`).first();
    await target.click();
  };
  const openArsenal = async () => {
    await page
      .locator(
        '[data-action="arsenal"]:visible,[data-action^="arsenal:"]:visible',
      )
      .first()
      .click();
    await page.locator('[data-action="arsenal-category:primary"]').waitFor();
  };
  await openArsenal();
  await action("arsenal-category:primary");
  const price = catalog.find((w) => w.id === "minigun").price;
  const beforePurchase = (await readSave()).coins;
  await action("weapon-buy:minigun");
  let state = await readSave();
  assert.ok(state.weaponOwned.includes("minigun"));
  assert.equal(state.coins, beforePurchase - price);
  await action("weapon-equip:minigun:primary");
  assert.equal((await readSave()).loadouts[0].primary, "minigun");
  for (let level = 2; level <= 5; level++) {
    await action("weapon-upgrade:minigun");
    assert.equal((await readSave()).weaponLevels.minigun, level);
  }
  const maxCoins = (await readSave()).coins;
  const maxButton = page.locator('[data-action="weapon-upgrade:minigun"]');
  if (await maxButton.count()) assert.equal(await maxButton.isDisabled(), true);
  assert.equal((await readSave()).coins, maxCoins);
  await action("arsenal-category:secondary");
  for (const [id, slot] of [
    ["bombs", "left"],
    ["homing", "right"],
  ]) {
    if (!(await readSave()).weaponOwned.includes(id))
      await action("weapon-buy:" + id);
    await action(`weapon-equip:${id}:${slot}`);
  }
  state = await readSave();
  assert.equal(state.loadouts[0].left, "bombs");
  assert.equal(state.loadouts[0].right, "homing");
  const loadout0 = structuredClone(state.loadouts[0]);
  await page.reload();
  await openArsenal();
  assert.deepEqual((await readSave()).loadouts[0], loadout0);
  await action("hangar");
  await action("plane:1");
  await action("equip:1");
  await openArsenal();
  assert.equal((await readSave()).selected, 1);
  assert.notEqual((await readSave()).loadouts[1].primary, "minigun");
  assert.deepEqual((await readSave()).loadouts[0], loadout0);
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
    "mobile arsenal overflow",
  );
  await page.screenshot({
    path: "artifacts/arsenal-mobile.png",
    fullPage: true,
  });
  // Training permits trying unowned gear and every level without changing the save.
  await action("arsenal-category:primary");
  const permanentBeforeTraining = await page.evaluate(() =>
    localStorage.getItem("sky-strike"),
  );
  await action("train-weapon:plasma");
  await page.waitForFunction(
    () => !!window.__skyGame?.scene.getScene("battle")?.training,
  );
  await page.locator("#training-weapon").selectOption("minigun");
  await page.locator("#training-level").selectOption("5");
  assert.equal(
    await page.evaluate(() =>
      window.__skyGame.scene.getScene("battle").weaponLevel("minigun"),
    ),
    5,
  );
  const projectileProof = await page.evaluate(async () => {
    const b = window.__skyGame.scene.getScene("battle");
    const { weapons } = await import("/src/arsenal.ts");
    const clear = () => {
      for (let i = b.bullets.length - 1; i >= 0; i--) b.recycle(i);
      for (const e of b.enemies) {
        for (const part of e.parts || []) part.s?.destroy();
        e.s.destroy();
      }
      b.enemies = [];
      b.spawn = Infinity;
      b.shot = Infinity;
      b.inv = 999;
      b.weapons.reset();
      b.specialRemaining = 0;
      b.laser = 0;
      for (const key of ["primaryAt", "leftAt", "rightAt", "wingAt"])
        b.weapons[key] = Infinity;
    };
    const target = (x = 270, y = 265) => {
      b.spawnEnemy(0, x);
      const e = b.enemies.at(-1);
      e.s.setPosition(x, y);
      e.base = x;
      e.hp = e.max = 100000;
      e.fire = Infinity;
      return e;
    };
    const hits = [];
    for (const w of weapons.filter(
      (w) => w.category === "primary" || w.category === "secondary",
    )) {
      clear();
      const e = target();
      b.weapons.fire(w.id, 1, 270, 310, 1);
      for (let k = 0; k < 12; k++) b.update(0, 16);
      const damage = e.max - e.hp;
      if (!(damage > 0)) throw Error("No real damage from " + w.id);
      hits.push({ id: w.id, damage });
    }
    clear();
    let e = target();
    b.weapons.fire("minigun", 1, 270, 310, 1);
    for (let k = 0; k < 6; k++) b.update(0, 16);
    const level1 = e.max - e.hp;
    clear();
    e = target();
    b.weapons.fire("minigun", 5, 270, 310, 1);
    for (let k = 0; k < 6; k++) b.update(0, 16);
    const level5 = e.max - e.hp;
    if (!(level5 > level1))
      throw Error("Weapon upgrade did not increase actual hit damage");
    clear();
    const a = target(),
      adjacent = target(305, 265);
    b.weapons.fire("plasma", 1, 270, 310, 1);
    for (let k = 0; k < 12; k++) b.update(0, 16);
    if (!(a.hp < a.max && adjacent.hp < adjacent.max))
      throw Error("Plasma splash failed");
    clear();
    const electric = target(),
      chain = target(350, 265);
    b.weapons.fire("electric", 1, 270, 310, 1);
    for (let k = 0; k < 12; k++) b.update(0, 16);
    if (!(electric.hp < electric.max && chain.hp < chain.max))
      throw Error("Electric chain failed");
    clear();
    const front = target(270, 265),
      behind = target(270, 215);
    b.weapons.fire("heavy", 1, 270, 310, 1);
    for (let k = 0; k < 18; k++) b.update(0, 16);
    if (!(front.hp < front.max && behind.hp < behind.max))
      throw Error("Piercing failed");
    return { hits, level1, level5 };
  });
  assert.equal(projectileProof.hits.length, 17);
  const specialProof = await page.evaluate(async () => {
    const b = window.__skyGame.scene.getScene("battle");
    const { weapons } = await import("/src/arsenal.ts");
    const reports = [];
    for (const w of weapons.filter((w) => w.category === "special")) {
      b.setTrainingWeapon(w.id, 5);
      for (let i = b.bullets.length - 1; i >= 0; i--) b.recycle(i);
      for (const e of b.enemies) {
        for (const p of e.parts || []) p.s?.destroy();
        e.s.destroy();
      }
      b.enemies = [];
      b.weapons.reset();
      b.specialRemaining = 0;
      b.laser = 0;
      for (const key of ["primaryAt", "leftAt", "rightAt", "wingAt"])
        b.weapons[key] = Infinity;
      b.spawn = Infinity;
      b.inv = 999;
      b.spawnEnemy(0, 270);
      const e = b.enemies.at(-1);
      e.s.setPosition(270, b.player.y - 90);
      e.hp = e.max = 100000;
      e.fire = Infinity;
      b.weapons.specialCooldown = 0;
      const before = e.hp;
      b.weapons.activateSpecial(w.id, 5);
      const cooldown = b.weapons.specialCooldown;
      if (!(cooldown > 0)) throw Error("No cooldown " + w.id);
      b.weapons.activateSpecial(w.id, 5);
      if (b.weapons.specialCooldown !== cooldown)
        throw Error("Repeated special bypassed cooldown " + w.id);
      for (let k = 0; k < 180; k++) b.update(0, 16);
      const damaged = e.hp < before,
        projectiles = b.bullets.some((x) => !x.enemy),
        control = b.weapons.stun > 0;
      if (!damaged && !projectiles && !control)
        throw Error("Special has no effect " + w.id);
      reports.push({ id: w.id, damaged, projectiles, control });
    }
    return reports;
  });
  assert.equal(specialProof.length, 8);
  const tacticalProof = await page.evaluate(async () => {
    const b = window.__skyGame.scene.getScene("battle");
    const { weapons } = await import("/src/arsenal.ts");
    const { planes } = await import("/src/catalog.ts");
    const planesSpeed = (s) => planes[s.save.selected].speed;
    const reports = [];
    for (const w of weapons.filter((w) => w.category === "tactical")) {
      b.setTrainingWeapon(w.id, 5);
      b.weapons.reset();
      for (const key of ["primaryAt", "leftAt", "rightAt", "wingAt"])
        b.weapons[key] = Infinity;
      b.specialRemaining = 0;
      b.hp = b.maxHp * 0.4;
      b.shield = 0;
      const before = b.hp;
      b.weapons.activateTactical(w.id, 5);
      if (!(b.weapons.tacticalCooldown > 0))
        throw Error("No tactical cooldown " + w.id);
      const effect =
        w.id === "repair"
          ? b.hp > before
          : w.id === "shield"
            ? b.shield > 0
            : w.id === "turbo"
              ? b.weapons.turbo > 0
              : w.id === "reflector"
                ? b.weapons.reflect > 0
                : w.id === "barrier"
                  ? b.weapons.barrier > 0
                  : b.weapons.slow > 0;
      if (!effect) throw Error("No tactical effect " + w.id);
      if (w.id === "reflector") {
        const round = b.bullet(b.player.x, b.player.y - 35, 0, 200, true, 10);
        for (let i = 0; i < 8; i++) b.update(0, 16);
        if (round.enemy || round.vy >= 0)
          throw Error("Reflector did not convert enemy bullet");
      }
      if (w.id === "barrier") {
        const round = b.bullet(b.player.x, b.player.y - 95, 0, 200, true, 10);
        for (let i = 0; i < 25; i++) b.update(0, 16);
        if (b.bullets.includes(round))
          throw Error("Barrier did not intercept bullet");
      }
      if (w.id === "slowfield") {
        const round = b.bullet(b.player.x, b.player.y - 300, 0, 200, true, 10);
        const start = round.s.y;
        for (let i = 0; i < 10; i++) b.update(0, 16);
        if (round.s.y - start >= 28)
          throw Error("Slow field did not slow enemy movement");
      }
      if (w.id === "turbo") {
        const start = b.player.x;
        b.player.x = 100;
        b.keys.D.isDown = true;
        for (let i = 0; i < 10; i++) b.update(0, 16);
        b.keys.D.isDown = false;
        if (b.player.x - 100 <= planesSpeed(b) * 0.16)
          throw Error("Turbo did not increase movement");
        b.player.x = start;
      }
      reports.push(w.id);
    }
    return reports;
  });
  assert.equal(tacticalProof.length, 6);
  const bossProof = await page.evaluate(() => {
    const b = window.__skyGame.scene.getScene("battle");
    for (const e of b.enemies) {
      for (const p of e.parts || []) p.s?.destroy();
      e.s.destroy();
    }
    b.enemies = [];
    for (let i = b.bullets.length - 1; i >= 0; i--) b.recycle(i);
    b.weapons.reset();
    b.specialRemaining = 0;
    b.laser = 0;
    for (const key of ["primaryAt", "leftAt", "rightAt", "wingAt"])
      b.weapons[key] = Infinity;
    b.spawnEnemy(9, 270, true);
    const e = b.enemies.at(-1);
    e.s.setPosition(270, 185);
    e.hp = e.max = 100000;
    const part = e.parts[0];
    if (!part) throw Error("Boss parts missing");
    // A beam only covers the visible segment from its origin to the top edge.
    // Align three live parts horizontally and put them behind the plane,
    // above the viewport, and inside the beam respectively.
    const offsets = e.parts.map((p) => ({ x: p.x, y: p.y }));
    const [behindPlane, aboveViewport, visiblePart] = e.parts;
    behindPlane.x = aboveViewport.x = visiblePart.x = 0;
    behindPlane.y = b.player.y + 60 - e.s.y;
    aboveViewport.y = -60 - e.s.y;
    visiblePart.y = 300 - e.s.y;
    const beamBefore = e.parts.map((p) => p.hp);
    b.weapons.fire("laser", 1, e.s.x, b.player.y - 35, 1);
    if (behindPlane.hp !== beamBefore[0])
      throw Error("Laser damaged a boss part behind the player");
    if (aboveViewport.hp !== beamBefore[1])
      throw Error("Laser damaged a boss part above the viewport");
    if (!(visiblePart.hp < beamBefore[2]))
      throw Error("Laser did not damage an aligned visible boss part");
    e.parts.forEach((p, i) => {
      p.x = offsets[i].x;
      p.y = offsets[i].y;
      p.hp = p.max;
    });
    e.s.y = -500;
    const offscreenCoreHP = e.hp;
    b.weapons.fire("laser", 1, e.s.x, b.player.y - 35, 1);
    if (e.hp !== offscreenCoreHP)
      throw Error("Laser damaged a boss core above the viewport");
    e.s.y = 185;
    const initialPartHP = part.hp,
      initialBodyHP = e.hp;
    b.weapons.fire("heavy", 1, e.s.x + part.x, e.s.y + part.y + 50, 1);
    for (let i = 0; i < 6; i++) b.update(0, 16);
    if (!(part.hp < initialPartHP))
      throw Error("Projectile did not damage boss part");
    if (e.hp !== initialBodyHP) throw Error("Part hit also damaged boss core");
    b.damagePart(e, part, part.max + 1);
    if (!part.destroyed) throw Error("Part destruction failed");
    const fired = part.shotsFired;
    for (let i = 0; i < 200; i++) b.update(0, 16);
    if (part.shotsFired !== fired)
      throw Error("Destroyed boss gun still fires");
    if (!e.parts.some((p) => !p.destroyed))
      throw Error("Destroying a part destroyed all guns");
    if (!e.parts.some((p) => !p.destroyed && p.shotsFired > 0))
      throw Error("Remaining boss gun did not keep firing");
    return { destroyed: part.id, stopped: true };
  });
  assert.equal(bossProof.stopped, true);
  await page.screenshot({ path: "artifacts/training-combat.png" });
  await action("abort");
  assert.equal(
    await page.evaluate(() => localStorage.getItem("sky-strike")),
    permanentBeforeTraining,
    "training changed persistent economy/progression",
  );
  const brazilRegions = [
    "amazon",
    "pantanal",
    "brasilia",
    "iguacu",
    "atlantic",
  ];
  for (let stage = 1; stage <= 5; stage++) {
    await action("campaign");
    await action("start:" + stage);
    await page.waitForFunction(
      () => !!window.__skyGame?.scene.getScene("battle")?.brazilWorld,
    );
    const expected = brazilRegions[stage - 1];
    assert.equal(
      await page.evaluate(
        () => window.__skyGame.scene.getScene("battle").brazilWorld.region,
      ),
      expected,
    );
    const route = [];
    for (const fraction of [0.05, 0.55, 0.95]) {
      await page.evaluate(async (p) => {
        const s = window.__skyGame.scene.getScene("battle");
        const { stages } = await import("/src/data.ts");
        s.elapsed = stages[s.stage].duration * p;
        s.inv = 999;
      }, fraction);
      await page.waitForTimeout(120);
      route.push(
        await page.evaluate(
          () =>
            window.__skyGame.scene.getScene("battle").brazilWorld.state.cameraY,
        ),
      );
    }
    assert.ok(
      route[0] > route[1] && route[1] > route[2],
      expected + " scenery did not progress",
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      expected + " mobile overflow",
    );
    await page.screenshot({ path: `artifacts/brazil-${expected}.png` });
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "VOLTAR À BASE" }).click();
  }
  assert.equal(
    await page.evaluate(() => localStorage.getItem("sky-strike")),
    permanentBeforeTraining,
    "map smoke tests changed progress on abort",
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: v2 migration, arsenal purchase/equip/upgrade1–5, loadout persistence, mobile UI, free training, all17 projectile weapons deal damage, splash/chain/piercing,8specials/6tactics cooldown effects, independent boss-part destruction and five progressing Brazilian maps.",
  );
  await context.close();
} finally {
  await browser.close();
}
