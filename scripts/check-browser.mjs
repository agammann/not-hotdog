import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
const origin = "http://127.0.0.1:5392",
  out = "test-results/website";
await mkdir(out, { recursive: true });
const report = { checks: [], errors: [], status: "running" };
let app,
  browser,
  log = "";
const check = (name) => report.checks.push(name);
try {
  app = spawn(process.execPath, ["src/local.mjs"], {
    windowsHide: true,
    env: { ...process.env, PORT: "5392" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  app.stdout.on("data", (b) => (log += b));
  app.stderr.on("data", (b) => (log += b));
  const deadline = Date.now() + 20000;
  while (true) {
    try {
      if ((await fetch(origin)).status === 200) break;
    } catch {}
    assert.equal(app.exitCode, null, log);
    assert(Date.now() < deadline);
    await new Promise((r) => setTimeout(r, 100));
  }
  browser = await chromium.launch({
    headless: true,
    ...(process.env.NOT_HOTDOG_BROWSER_EXECUTABLE
      ? { executablePath: process.env.NOT_HOTDOG_BROWSER_EXECUTABLE }
      : { channel: "chrome" }),
  });
  report.browser = browser.version();
  const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      acceptDownloads: true,
    }),
    page = await context.newPage();
  page.setDefaultTimeout(20000);
  page.on("pageerror", (e) => report.errors.push(e.message));
  let posts = 0;
  page.on("request", (r) => {
    if (r.method() === "POST") posts++;
  });
  await page.goto(origin);
  assert.equal(await page.locator("#check-mode").inputValue(), "device");
  await page.locator('[data-sample="hotdog.jpg"]').click();
  assert.match(await page.locator("#status").innerText(), /Enable hover first/);
  assert.equal(posts, 0);
  check("Opening and selection require activation; no hosted call");
  await page.locator("#enable").click();
  for (const [name, expected] of [
    ["hotdog.jpg", "HOTDOG"],
    ["banana.jpg", "NOT HOTDOG"],
  ]) {
    const card = page.locator(`[data-sample="${name}"]`);
    await card.click();
    await page.waitForFunction(
      ({ name }) =>
        !!document.querySelector(`[data-sample="${name}"]`).dataset.verdict,
      { name },
      { timeout: 90000 },
    );
    assert.equal(await card.getAttribute("data-verdict"), expected);
  }
  assert.equal(posts, 0);
  check(
    "Actual bundled worker/model classify both published samples without uploads",
  );
  await page.keyboard.press("Escape");
  assert.equal(
    await page.locator("#enable").getAttribute("aria-pressed"),
    "false",
  );
  await page.locator("#clear").click();
  assert.equal(await page.locator("[data-verdict]").count(), 0);
  check("Escape pauses and Clear resets actual rendered results");
  await page.locator("#upload").setInputFiles({
    name: "bad.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("no image"),
  });
  assert.match(await page.locator("#status").innerText(), /PNG, JPEG, or WebP/);
  await page.locator("#upload").setInputFiles({
    name: "bad.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.from("invalid JPEG"),
  });
  await page.locator("#enable").click();
  await page.locator("[data-upload]").click();
  await page.waitForFunction(
    () =>
      document.querySelector("[data-upload] .verdict").textContent ===
      "TRY AGAIN",
  );
  assert.equal(
    await page.locator("[data-upload]").getAttribute("data-verdict"),
    null,
  );
  check("Unsupported and failed-decode images show errors, never a verdict");
  await page.locator("#upload").setInputFiles("public/samples/banana.jpg");
  await page.locator("[data-upload]").click();
  await page.waitForFunction(
    () => !!document.querySelector("[data-upload]").dataset.verdict,
    null,
    { timeout: 90000 },
  );
  assert.equal(
    await page.locator("[data-upload]").getAttribute("data-verdict"),
    "NOT HOTDOG",
  );
  check("Replacing a failed upload recovers with the actual model");
  await page.locator("#clear").click();
  await page.route("**/model/**", (route) => route.abort());
  await page.locator('[data-sample="hotdog.jpg"]').click();
  await page.waitForFunction(
    () =>
      document.querySelector('[data-sample="hotdog.jpg"] .verdict')
        .textContent === "TRY AGAIN",
    null,
    { timeout: 90000 },
  );
  assert.equal(
    await page
      .locator('[data-sample="hotdog.jpg"]')
      .getAttribute("data-verdict"),
    null,
  );
  await page.unroute("**/model/**");
  await page.locator("#clear").click();
  await page.locator('[data-sample="hotdog.jpg"]').click();
  await page.waitForFunction(
    () =>
      !!document.querySelector('[data-sample="hotdog.jpg"]').dataset.verdict,
    null,
    { timeout: 90000 },
  );
  assert.equal(
    await page
      .locator('[data-sample="hotdog.jpg"]')
      .getAttribute("data-verdict"),
    "HOTDOG",
  );
  check("Blocked model load gives an error; Clear and retry recover");
  await page.locator("#check-mode").selectOption("hosted");
  await page.locator("#visitor-key").fill("sk-" + "browser".repeat(8));
  await page.locator('[data-sample="hotdog.jpg"]').click();
  await page.locator('[data-sample="hotdog.jpg"]').hover();
  await page.waitForTimeout(750);
  assert.equal(posts, 0);
  check("Hosted selection/key entry/hover send nothing");
  let release;
  let markPending;
  const pendingResponse = new Promise((resolve) => {
    markPending = resolve;
  });
  await page.route("**/api/classify/visitor", async (route) => {
    await new Promise((r) => {
      release = r;
      markPending();
    });
    await route
      .fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          model: "gpt-5.4",
          value: { verdict: "HOTDOG" },
        }),
      })
      .catch(() => {});
  });
  await page.locator("#hosted-check").click();
  await Promise.race([
    pendingResponse,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(Error("Controlled response did not start")),
        10000,
      ),
    ),
  ]);
  await page.waitForFunction(() =>
    document.querySelector("#hosted-panel").hasAttribute("aria-busy"),
  );
  await page.locator("#hosted-cancel").click();
  assert.equal(
    await page.locator("#hosted-panel").getAttribute("aria-busy"),
    null,
  );
  release();
  await page.waitForTimeout(200);
  assert.equal(await page.locator("#hosted-result").isVisible(), false);
  await page.unroute("**/api/classify/visitor");
  check("Delayed controlled hosted response is canceled and discarded");
  for (const action of ["clear", "device", "reload"]) {
    await page.locator("#visitor-key").fill("sk-" + "browser".repeat(8));
    if (action === "clear") await page.locator("#clear").click();
    else if (action === "device") {
      await page.locator("#check-mode").selectOption("device");
      await page.locator("#check-mode").selectOption("hosted");
    } else {
      await page.reload();
      await page.locator("#check-mode").selectOption("hosted");
    }
    assert.equal(await page.locator("#visitor-key").inputValue(), "");
  }
  assert.deepEqual(
    await page.evaluate(async () => ({
      local: localStorage.length,
      session: sessionStorage.length,
      databases: (await indexedDB.databases()).length,
      caches: (await caches.keys()).length,
    })),
    { local: 0, session: 0, databases: 0, caches: 0 },
  );
  assert.deepEqual(await context.cookies(), []);
  check(
    "Clear, mode change and reload forget key; application storage is empty",
  );
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.screenshot({
      path: `${out}/layout-${width}.png`,
      fullPage: true,
    });
  }
  check(
    "Rendered device/hosted controls fit tested desktop and narrow viewports",
  );
  for (const route of [
    "/privacy",
    "/terms",
    "/credits",
    "/extension",
    "/health",
    "/not-hotdog-extension.zip",
  ])
    assert.equal((await fetch(origin + route)).status, 200);
  for (const route of ["/api/classify", "/mcp"])
    assert.equal(
      (await fetch(origin + route, { method: "POST", body: "{}" })).status,
      410,
    );
  assert.equal(
    (
      await fetch(origin + "/api/classify/visitor", {
        method: "POST",
        headers: { Origin: origin, "Content-Type": "application/json" },
        body: "{}",
      })
    ).status,
    401,
  );
  for (const route of ["/.env", "/package.json", "/src/local.mjs"])
    assert.equal((await fetch(origin + route)).status, 404);
  check(
    "Documented routes work; retired/private paths and missing key are rejected",
  );
  assert.deepEqual(report.errors, []);
  report.status = "passed";
} catch (e) {
  report.status = "failed";
  report.failure = e.stack;
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  if (app && app.exitCode === null) {
    if (process.platform === "win32")
      spawnSync("taskkill.exe", ["/PID", String(app.pid), "/T", "/F"], {
        windowsHide: true,
      });
    else app.kill("SIGTERM");
    await new Promise((r) =>
      app.exitCode !== null ? r() : app.once("exit", r),
    );
  }
  await writeFile(out + "/report.json", JSON.stringify(report, null, 2) + "\n");
  await writeFile(out + "/server.log", log);
  console.log(JSON.stringify(report));
}
