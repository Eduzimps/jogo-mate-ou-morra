import { chromium } from "@playwright/test";
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const baseURL = process.env.SKY_STRIKE_TEST_URL || "http://127.0.0.1:4173";
const context = await browser.newContext();
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(baseURL);
await page.evaluate(() => navigator.serviceWorker.ready);
await page.reload();
await page.waitForTimeout(1000);
await context.setOffline(true);
await page.reload();
await page.getByRole("button", { name: /INICIAR MISSÃO/ }).click();
await page.locator('[data-action="start:0"]').click();
await page.waitForTimeout(3000);
await page.locator("#hud progress").first().waitFor();
if (!(await page.locator("canvas").count())) throw Error("No offline battle");
if (errors.length) throw Error(errors.join("\n"));
console.log("PASS: production menu, cached reload and battle work offline");
await browser.close();
