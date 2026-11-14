import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";

const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const context = await browser.newContext({
  viewport: { width: 1366, height: 768 },
  hasTouch: true,
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const url = process.env.SKY_STRIKE_DEV_URL || "http://127.0.0.1:5173";
await page.goto(url);

async function attachAudio() {
  await page.evaluate(async () => {
    // Import the exact resource URL the app loaded (including Vite's HMR query)
    // so this observes its existing singleton rather than creating a second one.
    const resource = performance
      .getEntriesByType("resource")
      .find((entry) => new URL(entry.name).pathname.endsWith("/src/audio.ts"));
    if (!resource) throw Error("Audio module resource was not loaded");
    window.__presentationAudio = (await import(resource.name)).audio;
  });
}
async function showroomReady() {
  await page.locator(".showroom-plane").evaluate((image) => image.decode());
  await expect
    .poll(() =>
      page
        .locator(".showroom-plane")
        .evaluate((image) => getComputedStyle(image).opacity),
    )
    .toBe("1");
}
async function mode() {
  return page.evaluate(() => window.__presentationAudio.mode);
}
async function navigate(action) {
  await page.locator(`button[data-action="${action}"]`).first().click();
}

await attachAudio();
assert.equal(await mode(), "menu");
await page.locator(".ultimate-hero").waitFor();
assert.match(
  await page
    .locator(".ultimate-hero")
    .evaluate((el) => getComputedStyle(el).backgroundImage),
  /brazil-hangar\.webp/,
);
const art = await page.request.get(
  new URL("assets/hangar/brazil-hangar.webp", page.url()).href,
);
assert.equal(art.status(), 200);
await page.screenshot({ path: "artifacts/presentation-lobby-desktop.png" });
await page.getByRole("button", { name: "EXPLORAR HANGAR" }).click();
assert.equal(await mode(), "hangar");
await expect
  .poll(() => page.evaluate(() => window.__presentationAudio.ctx?.state))
  .toBe("running");
assert.match(
  await page
    .locator(".showroom")
    .evaluate((el) => getComputedStyle(el).backgroundImage),
  /brazil-hangar\.webp/,
);
await showroomReady();
await page.screenshot({ path: "artifacts/presentation-hangar-desktop.png" });

const accent = await page.evaluate(async () => {
  const engine = window.__presentationAudio;
  const before = [
    engine.volume,
    engine.musicVolume,
    engine.effectsVolume,
    engine.uiVolume,
  ];
  const originalSet = AudioParam.prototype.setValueAtTime;
  const originalRamp = AudioParam.prototype.exponentialRampToValueAtTime;
  let active = false,
    values = [];
  function capture(value) {
    if (active && value > 0.001 && value < 1) values.push(value);
  }
  AudioParam.prototype.setValueAtTime = function (value, time) {
    capture(value);
    return originalSet.call(this, value, time);
  };
  AudioParam.prototype.exponentialRampToValueAtTime = function (value, time) {
    capture(value);
    return originalRamp.call(this, value, time);
  };
  const peaks = [];
  try {
    for (const level of [1, 5, 999]) {
      await new Promise((resolve) => setTimeout(resolve, 90));
      values = [];
      active = true;
      engine.play("gun", level);
      active = false;
      peaks.push(Math.max(...values));
    }
  } finally {
    active = false;
    AudioParam.prototype.setValueAtTime = originalSet;
    AudioParam.prototype.exponentialRampToValueAtTime = originalRamp;
  }
  return {
    before,
    after: [
      engine.volume,
      engine.musicVolume,
      engine.effectsVolume,
      engine.uiVolume,
    ],
    peaks,
  };
});
assert.ok(
  accent.peaks[1] > accent.peaks[0],
  "Level5 should schedule a stronger weapon accent",
);
assert.ok(
  accent.peaks[1] / accent.peaks[0] <= 1.33,
  "Accent stays modest and bounded",
);
assert.equal(
  accent.peaks[2],
  accent.peaks[1],
  "Out-of-range weapon level is clamped",
);
assert.deepEqual(
  accent.after,
  accent.before,
  "Weapon accent cannot mutate persisted audio channels",
);

assert.equal(
  await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
  false,
);

await page.setViewportSize({ width: 390, height: 844 });
await navigate("home");
await page.screenshot({
  path: "artifacts/presentation-lobby-mobile.png",
  fullPage: true,
});
assert.equal(
  await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
  false,
);
await page.getByRole("button", { name: "EXPLORAR HANGAR" }).click();
await showroomReady();
await page.screenshot({ path: "artifacts/presentation-hangar-mobile.png" });
assert.equal(
  await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
  false,
);
await navigate("campaign");
assert.equal(await mode(), "campaign");
await page.locator('[data-action="start:0"]').click();
await page.waitForFunction(
  () => !!window.__skyGame?.scene.getScene("battle")?.player,
);
assert.equal(await mode(), "battle");
await page.keyboard.press("Escape");
assert.equal(
  await page.evaluate(() => window.__presentationAudio.paused),
  true,
);
await page.getByRole("button", { name: "CONTINUAR", exact: true }).click();
assert.equal(
  await page.evaluate(() => window.__presentationAudio.paused),
  false,
);
await page.evaluate(() =>
  window.__skyGame.scene.getScene("battle").finish(true),
);
await page.getByText("Missão cumprida.", { exact: true }).waitFor();
assert.equal(await mode(), "victory");
await page
  .getByRole("button", { name: "VOLTAR AO HANGAR", exact: true })
  .click();
assert.equal(await mode(), "hangar");
await page.locator('[data-action^="arsenal"]').first().click();
await page.locator('[data-action="train"]').click();
await page.waitForFunction(
  () => !!window.__skyGame?.scene.getScene("battle")?.player,
);
assert.equal(await mode(), "training");
await page.locator('[data-action="abort"]').filter({ hasText: "SAIR" }).click();

await navigate("settings");
const values = {
  volume: 0.4,
  musicVolume: 0.2,
  effectsVolume: 0.6,
  uiVolume: 0.3,
};
for (const [id, value] of Object.entries(values)) {
  await page.locator("#" + id).evaluate((input, v) => {
    input.value = String(v);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
}
assert.deepEqual(
  await page.evaluate(() => {
    const e = window.__presentationAudio;
    return {
      volume: e.volume,
      musicVolume: e.musicVolume,
      effectsVolume: e.effectsVolume,
      uiVolume: e.uiVolume,
    };
  }),
  values,
);
const saved = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("sky-strike")),
);
for (const [id, value] of Object.entries(values))
  assert.equal(saved[id], value);
await page.reload();
await attachAudio();
await navigate("settings");
for (const [id, value] of Object.entries(values))
  assert.equal(Number(await page.locator("#" + id).inputValue()), value);

const install = page.locator('[data-action="install-game"]');
assert.ok(!(await install.isVisible()) || !(await install.isEnabled()));
await page.evaluate(() => {
  window.__installCalls = 0;
  const event = new Event("beforeinstallprompt", { cancelable: true });
  event.prompt = async () => {
    window.__installCalls++;
  };
  window.dispatchEvent(event);
});
await expect(install).toBeEnabled();
await expect(install).toBeVisible();
await install.click();
assert.equal(await page.evaluate(() => window.__installCalls), 1);

const manifestURL = await page
  .locator('link[rel="manifest"]')
  .getAttribute("href");
const response = await page.request.get(new URL(manifestURL, page.url()).href);
assert.equal(response.status(), 200);
const manifest = await response.json();
assert.equal(manifest.display, "standalone");
assert.equal(manifest.start_url, "./");
assert.equal(manifest.scope, "./");
for (const icon of manifest.icons) {
  const iconResponse = await page.request.get(
    new URL(icon.src, response.url()).href,
  );
  assert.equal(iconResponse.status(), 200, icon.src);
}
const iconSizes = await page.evaluate(async (manifestHref) => {
  const manifest = await fetch(manifestHref).then((r) => r.json());
  return Promise.all(
    manifest.icons
      .filter((i) => i.type === "image/png")
      .map(async (icon) => {
        const image = new Image();
        image.src = new URL(
          icon.src,
          new URL(manifestHref, location.href),
        ).href;
        await image.decode();
        return [image.naturalWidth, image.naturalHeight];
      }),
  );
}, manifestURL);
assert.deepEqual(iconSizes, [
  [192, 192],
  [512, 512],
]);
assert.deepEqual(errors, []);
console.log(
  "PASS: original hangar art desktop/mobile, audio unlock/modes/pause, independent persisted channel volumes, install-prompt interaction, manifest and real 192/512 icons.",
);
await context.close();
await browser.close();
