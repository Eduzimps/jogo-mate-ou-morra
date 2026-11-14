import { chromium } from "@playwright/test";
import assert from "node:assert/strict";

// Authentic v1 progress must survive the new route, restarting, and other stages.
const legacy = {
  version: 1,
  coins: 28755,
  gems: 34,
  selected: 1,
  owned: [0, 1, 12],
  levels: { 0: 4, 1: 4, 12: 3 },
  stats: {
    kills: 3421,
    wins: 64,
    bosses: 55,
    earned: 48000,
    upgrades: 32,
    perfect: 7,
  },
  stars: { 0: 3, 1: 2, 29: 1 },
  unlocked: 29,
  wing: 3,
  wingLevel: 6,
  wingLevels: { 0: 2, 1: 4, 2: 5, 3: 6 },
  deviceLevels: [3, 2, 4, 5, 6],
  equipped: [1, 3, 4],
  difficulty: "Normal",
  volume: 0.35,
  daily: "13/11/2026",
  claimed: ["wins", "kills"],
};
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    hasTouch: true,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript((seed) => {
    if (localStorage.getItem("sky-strike") === null)
      localStorage.setItem("sky-strike", JSON.stringify(seed));
  }, legacy);
  await page.goto("http://127.0.0.1:5173");
  const before = await page.evaluate(() => localStorage.getItem("sky-strike"));
  const migrated = JSON.parse(before);
  assert.equal(migrated.version, 2);
  for (const key of Object.keys(legacy).filter((key) => key !== "version"))
    assert.deepEqual(migrated[key], legacy[key], key);

  const stages = await page.evaluate(
    async () => (await import("/src/data.ts")).stages,
  );
  assert.equal(stages.length, 30);
  assert.equal(stages[0].id, 0);
  assert.equal(stages[0].name, "Operação Guanabara");
  assert.equal(stages[0].duration, 48);
  assert.equal(stages[0].reward, 350);
  assert.equal(stages[0].boss, 0);
  const oldNames = [
    "Operação Aurora",
    "Arquipélago Hostil",
    "Asas de Aço",
    "Linha de Fogo",
    "Comboio Fantasma",
    "Céu Partido",
  ];
  for (const stage of stages.slice(1)) {
    assert.equal(stage.id, stages.indexOf(stage));
    assert.equal(stage.name, oldNames[stage.id % 6]);
    assert.equal(stage.reward, 350 + stage.id * 90);
    assert.equal(stage.duration, 48 + Math.min(stage.id, 12) * 2);
  }
  const duration = stages[0].duration;
  await page.getByRole("button", { name: /INICIAR MISSÃO/ }).click();
  await page.locator('[data-action="start:0"]').click();
  await page.waitForFunction(
    () => !!window.__skyGame?.scene.getScene("battle")?.rioWorld,
  );
  await page.waitForFunction(
    () => !!window.__skyGame.scene.getScene("battle").player,
  );
  await page.evaluate(() => {
    window.__skyGame.scene.getScene("battle").inv = 10000;
  });

  const state = () =>
    page.evaluate(() => {
      const scene = window.__skyGame.scene.getScene("battle"),
        world = scene.rioWorld;
      return {
        elapsed: scene.elapsed,
        bossSpawned: scene.bossSpawned,
        playerY: scene.player.y,
        playerDepth: scene.player.depth,
        shadowCount: scene.children.list.filter(
          (child) => child.type === "Image" && child.texture?.key === "plane1",
        ).length,
        cameraScrollY: scene.cameras.main.scrollY,
        route: world ? { ...world.state } : undefined,
        landmarkDepth: world?.landmarkDepth,
        flyoverComplete: world?.flyoverComplete,
        terrainY: world?.terrainContainer.y,
      };
    });
  const sample = async (progress, expectedSection, screenshot) => {
    await page.evaluate((elapsed) => {
      const scene = window.__skyGame.scene.getScene("battle");
      scene.elapsed = elapsed;
    }, duration * progress);
    await page.waitForFunction(
      (section) =>
        window.__skyGame.scene.getScene("battle").rioWorld.state.section ===
        section,
      expectedSection,
    );
    const result = await state();
    assert.equal(
      result.cameraScrollY,
      0,
      "combat camera must remain in screen space",
    );
    assert.ok(
      Math.abs(result.terrainY + result.route.cameraY) < 0.1,
      "only scenery should scroll",
    );
    if (progress < 1)
      assert.equal(
        result.bossSpawned,
        false,
        "boss appeared before the route ended",
      );
    if (screenshot) await page.screenshot({ path: `artifacts/${screenshot}` });
    return result;
  };
  await sample(0.02, "ocean", "rio-ocean.png");
  const textureSizes = await page.evaluate(() =>
    Object.values(window.__skyGame.textures.list).flatMap((texture) =>
      texture.source.map((source) => ({
        key: texture.key,
        width: source.width,
        height: source.height,
      })),
    ),
  );
  for (const texture of textureSizes) {
    assert.ok(
      texture.width > 0 && texture.width <= 2048,
      `Oversized texture ${texture.key}: ${texture.width}px wide`,
    );
    assert.ok(
      texture.height > 0 && texture.height <= 2048,
      `Oversized texture ${texture.key}: ${texture.height}px high`,
    );
  }

  await sample(0.26, "coast", "rio-coast.png");
  await sample(0.5, "hills");
  const approach = await sample(0.69, "christ");
  assert.ok(
    approach.route.landmarkScreenY < approach.playerY,
    "landmark must approach the plane from above",
  );
  const crossing = await sample(0.845, "christ", "rio-christ.png");
  assert.ok(
    crossing.route.landmarkScreenY >= crossing.playerY,
    "landmark did not pass beneath the plane",
  );
  assert.ok(
    crossing.landmarkDepth < crossing.playerDepth,
    "landmark must render below the player",
  );
  assert.equal(crossing.bossSpawned, false);
  const final = await sample(0.92, "finale", "rio-final.png");
  assert.ok(
    final.route.landmarkScreenY > 960,
    "monument should be behind the flight before the boss",
  );
  assert.equal(final.flyoverComplete, true);

  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "CONTINUAR" }).waitFor();
  const paused = await state();
  await page.waitForTimeout(300);
  const stillPaused = await state();
  assert.equal(stillPaused.elapsed, paused.elapsed);
  assert.equal(
    stillPaused.route.cameraY,
    paused.route.cameraY,
    "world moved while paused",
  );
  await page.getByRole("button", { name: "CONTINUAR" }).click();
  await sample(1.01, "finale");
  await page.waitForFunction(
    () => window.__skyGame.scene.getScene("battle").bossSpawned,
  );
  assert.equal((await state()).flyoverComplete, true);
  await page.getByRole("button", { name: "ABORTAR MISSÃO" }).click();
  assert.equal(
    await page.evaluate(() => localStorage.getItem("sky-strike")),
    before,
    "aborting the flight changed permanent progress",
  );

  // Other 29 missions keep the previous scenery and combat flow.
  await page.getByRole("button", { name: /INICIAR MISSÃO/ }).click();
  await page.locator('[data-action="start:1"]').click();
  await page.waitForFunction(
    () => !!window.__skyGame?.scene.getScene("battle")?.player,
  );
  const legacyWorld = await page.evaluate(() => {
    const scene = window.__skyGame.scene.getScene("battle");
    return { hasRio: !!scene.rioWorld, scroll: scene.bg.tilePositionY };
  });
  assert.equal(legacyWorld.hasRio, false);
  await page.waitForTimeout(150);
  const moved = await page.evaluate(
    () => window.__skyGame.scene.getScene("battle").bg.tilePositionY,
  );
  assert.ok(moved < legacyWorld.scroll, "other missions stopped scrolling");

  // Regression for an existing firing bug: repeated volleys must not allocate shadows.
  const countBefore = (await state()).shadowCount;
  assert.equal(countBefore, 2, "expected exactly one plane and one shadow");
  await page.evaluate(() => {
    const scene = window.__skyGame.scene.getScene("battle");
    for (let i = 0; i < 100; i++) {
      scene.shot = -1;
      scene.update(0, 16);
    }
  });
  assert.equal(
    (await state()).shadowCount,
    countBefore,
    "shadow count grew while firing",
  );
  await page.getByRole("button", { name: "ABORTAR MISSÃO" }).click();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: /INICIAR MISSÃO/ }).click();
  await page.locator('[data-action="start:0"]').click();
  await page.waitForFunction(
    () => !!window.__skyGame?.scene.getScene("battle")?.rioWorld,
  );
  await page.waitForFunction(
    () => !!window.__skyGame.scene.getScene("battle").player,
  );
  await page.evaluate(() => {
    window.__skyGame.scene.getScene("battle").inv = 10000;
  });
  await sample(0.74, "christ");
  await page.screenshot({ path: "artifacts/rio-mobile.png" });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
    "mobile overflow",
  );
  const field = await page.locator("#field").boundingBox();
  await page.mouse.move(
    field.x + field.width * 0.75,
    field.y + field.height * 0.75,
  );
  await page.waitForFunction(
    () => window.__skyGame.scene.getScene("battle").player.x > 330,
  );
  // Abort remains available via pause when side controls are hidden on mobile.
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "VOLTAR À BASE" }).click();
  await page.reload();
  assert.equal(
    await page.evaluate(() => localStorage.getItem("sky-strike")),
    before,
    "reopen changed permanent progress",
  );
  // A missing artwork request must fail clearly, preserve save data, and recover via Retry.
  const failureContext = await browser.newContext({
    viewport: { width: 1366, height: 768 },
  });
  const failurePage = await failureContext.newPage();
  const retryErrors = [];
  failurePage.on("pageerror", (error) => retryErrors.push(error.message));
  await failurePage.addInitScript((seed) => {
    if (localStorage.getItem("sky-strike") === null)
      localStorage.setItem("sky-strike", JSON.stringify(seed));
  }, legacy);
  await failurePage.route("**/assets/rio/*.webp", (route) =>
    route.abort("failed"),
  );
  await failurePage.goto("http://127.0.0.1:5173");
  const beforeFailure = await failurePage.evaluate(() =>
    localStorage.getItem("sky-strike"),
  );
  await failurePage.getByRole("button", { name: /INICIAR MISSÃO/ }).click();
  await failurePage.locator('[data-action="start:0"]').click();
  await failurePage
    .getByText("CENÁRIO NÃO CARREGADO", { exact: false })
    .waitFor();
  const retry = failurePage.getByRole("button", {
    name: "TENTAR CARREGAR NOVAMENTE",
  });
  assert.equal(await retry.isVisible(), true);
  assert.equal(
    await failurePage.evaluate(() => localStorage.getItem("sky-strike")),
    beforeFailure,
    "failed world load overwrote progress",
  );
  await failurePage.unroute("**/assets/rio/*.webp");
  await retry.click();
  await failurePage.waitForFunction(() => {
    const scene = window.__skyGame?.scene.getScene("battle");
    return !!scene?.player && !!scene.rioWorld;
  });
  await failurePage.waitForFunction(
    () => !!document.querySelector("#hp-value")?.textContent.includes("HP"),
  );
  assert.equal(await failurePage.locator("#hp-value").isVisible(), true);
  assert.equal(await failurePage.locator("#loading").count(), 0);
  assert.equal(
    await failurePage.evaluate(() => localStorage.getItem("sky-strike")),
    beforeFailure,
    "retry changed permanent progress",
  );
  assert.deepEqual(retryErrors, []);
  await failureContext.close();
  assert.deepEqual(errors, []);
  console.log(
    "PASS: five Rio sections, Christ below player before boss, fixed camera, pause, shadow allocation regression, legacy mission scenery, v1 progress preservation, desktop/mobile layout, bounded textures, pointer control and missing-asset retry without save loss.",
  );
} finally {
  await browser.close();
}
