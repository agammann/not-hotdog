import { chromium } from "playwright";
import { unzipSync } from "fflate";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import assert from "node:assert/strict";
const channel = process.argv[2] || "chrome";
const output = resolve("test-results", "extension-" + channel);
await mkdir(output, { recursive: true });
const hotdog = await readFile("public/samples/hotdog.jpg"),
  banana = await readFile("public/samples/banana.jpg");
const html =
  '<!doctype html><title>Extension verification fixture</title><style>body{font:18px sans-serif}img{width:300px;height:200px;object-fit:contain;margin:18px}</style><h1>Fictional extension test</h1><img id="broken" src="/missing.jpg"><img id="hotdog" src="/hotdog.jpg"><img id="banana" src="/banana.jpg"><img id="cross" src="http://127.0.0.1:5394/hotdog.jpg">';
const serve = (req, res) => {
  if (req.url === "/missing.jpg") {
    res.statusCode = 404;
    res.end();
    return;
  }
  res.setHeader(
    "Content-Type",
    req.url.endsWith(".jpg") ? "image/jpeg" : "text/html",
  );
  res.end(
    req.url.endsWith("hotdog.jpg")
      ? hotdog
      : req.url.endsWith("banana.jpg")
        ? banana
        : html,
  );
};
const a = createServer(serve),
  b = createServer(serve);
await new Promise((r) => a.listen(5393, "127.0.0.1", r));
await new Promise((r) => b.listen(5394, "127.0.0.1", r));
const packed = await readFile(
  process.env.NOT_HOTDOG_EXTENSION_ARCHIVE || "public/not-hotdog-extension.zip",
);
const extracted = resolve(output, "downloaded-extension");
await mkdir(extracted, { recursive: true });
for (const [name, bytes] of Object.entries(unzipSync(packed))) {
  assert(
    !/[\\:]/.test(name) &&
      name.split("/").every((part) => part && part !== "." && part !== ".."),
  );
  const p = resolve(extracted, name);
  await mkdir(resolve(p, ".."), { recursive: true });
  await writeFile(p, bytes);
}
const context = await chromium.launchPersistentContext(
  resolve(output, "profile"),
  {
    ...(process.env.NOT_HOTDOG_BROWSER_EXECUTABLE
      ? { executablePath: process.env.NOT_HOTDOG_BROWSER_EXECUTABLE }
      : { channel }),
    headless: true,
    ignoreDefaultArgs: ["--disable-extensions"],
    args: ["--enable-unsafe-extension-debugging"],
    viewport: { width: 1280, height: 900 },
  },
);
const report = {
  browser: context.browser().version(),
  channel,
  archiveSha256: createHash("sha256").update(packed).digest("hex"),
  checks: [],
  pageErrors: [],
};
const cdp = await context.browser().newBrowserCDPSession();
let rpcId = 0;
const pending = new Map();
cdp.on("Target.receivedMessageFromTarget", (event) => {
  const r = JSON.parse(event.message);
  if (r.id && pending.has(r.id)) {
    const p = pending.get(r.id);
    pending.delete(r.id);
    r.error ? p.reject(Error(r.error.message)) : p.resolve(r.result);
  }
});
function remote(sessionId, method, params = {}) {
  const id = ++rpcId;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(Error("Extension testing response timed out."));
    }, 10000);
    pending.set(id, {
      resolve(value) {
        clearTimeout(timer);
        resolve(value);
      },
      reject(error) {
        clearTimeout(timer);
        reject(error);
      },
    });
    cdp
      .send("Target.sendMessageToTarget", {
        sessionId,
        message: JSON.stringify({ id, method, params }),
      })
      .catch((error) => {
        clearTimeout(timer);
        pending.delete(id);
        reject(error);
      });
  });
}
try {
  const installed = await cdp.send("Extensions.loadUnpacked", {
    path: extracted,
  });
  report.extension = installed.id;
  const page = await context.newPage();
  page.on("pageerror", (e) => report.pageErrors.push(e.message));
  await page.goto("http://127.0.0.1:5393/");
  await page.bringToFront();
  const pageCdp = await context.newCDPSession(page);
  async function texts() {
    return (await pageCdp.send("Accessibility.getFullAXTree")).nodes
      .filter((n) => !n.ignored)
      .map((n) => n.name?.value || "");
  }
  async function verdict(expected) {
    for (let i = 0; i < 150; i++) {
      if ((await texts()).includes(expected)) return;
      await page.waitForTimeout(200);
    }
    throw Error(`Missing ${expected}: ${JSON.stringify(await texts())}`);
  }
  async function popup() {
    const tabs = (
      await cdp.send("Target.getTargets", { filter: [{ type: "tab" }] })
    ).targetInfos;
    await cdp.send("Extensions.triggerAction", {
      id: installed.id,
      targetId: tabs.find((t) => t.url === "http://127.0.0.1:5393/").targetId,
    });
    let target;
    for (let i = 0; i < 50; i++) {
      target = (await cdp.send("Target.getTargets")).targetInfos.find(
        (t) => t.url === `chrome-extension://${installed.id}/popup.html`,
      );
      if (target) break;
      await page.waitForTimeout(100);
    }
    assert.ok(target, "No extension popup target");
    const { sessionId } = await cdp.send("Target.attachToTarget", {
      targetId: target.targetId,
      flatten: false,
    });
    async function evaluate(expression) {
      const r = await remote(sessionId, "Runtime.evaluate", {
        expression,
        returnByValue: true,
        userGesture: true,
      });
      if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails));
      return r.result.value;
    }
    for (let i = 0; i < 50; i++) {
      if (
        await evaluate(
          '!!document.querySelector("#toggle") && !document.querySelector("#toggle").disabled',
        )
      )
        break;
      await page.waitForTimeout(100);
    }
    return {
      text: () => evaluate('document.querySelector("#toggle").textContent'),
      async enable() {
        assert.equal(await this.text(), "Enable on this tab");
        await evaluate('document.querySelector("#toggle").click()');
        for (let i = 0; i < 50; i++) {
          const s = await evaluate(
            'document.querySelector("#status").textContent',
          );
          if (s.startsWith("Enabled for this tab.")) return;
          await page.waitForTimeout(100);
        }
        throw Error(await evaluate("document.body.innerText"));
      },
      close: async () => {
        await evaluate("window.close()");
        for (let i = 0; i < 50; i++) {
          if (
            !(await cdp.send("Target.getTargets")).targetInfos.some(
              (t) => t.targetId === target.targetId,
            )
          )
            return;
          await page.waitForTimeout(100);
        }
        throw Error("Popup did not close");
      },
    };
  }
  await page.locator("#hotdog").hover();
  await page.waitForTimeout(850);
  assert.ok(!(await texts()).includes("HOTDOG"));
  report.checks.push("No classification before explicit activation");
  let p = await popup();
  await p.enable();
  await p.close();
  await page.bringToFront();
  await page.mouse.move(20, 20);
  await page.locator("#broken").hover();
  await verdict("Wait for the image to finish loading.");
  report.checks.push("Broken image reports an error without a verdict");
  await page.locator("#hotdog").hover();
  await verdict("HOTDOG");
  await page.screenshot({ path: resolve(output, "same-origin.png") });
  report.checks.push(
    "Actual toolbar activation and same-origin hotdog inference",
  );
  console.log(report.checks.at(-1));
  await page.locator("#banana").hover();
  await verdict("NOT HOTDOG");
  report.checks.push("Banana inference returns NOT HOTDOG");
  const tainted = await page.locator("#cross").evaluate((img) => {
    const c = document.createElement("canvas");
    c.getContext("2d").drawImage(img, 0, 0);
    try {
      c.toDataURL();
      return false;
    } catch (e) {
      return e.name === "SecurityError";
    }
  });
  assert.equal(tainted, true);
  await page.locator("#cross").hover();
  await verdict("HOTDOG");
  await page.screenshot({ path: resolve(output, "cross-origin.png") });
  report.checks.push(
    "Cross-origin canvas is blocked; real browser screenshot crop classifies HOTDOG",
  );
  console.log(report.checks.at(-1));
  await page.keyboard.press("Escape");
  await page.mouse.move(20, 20);
  await page.locator("#banana").hover();
  await page.waitForTimeout(850);
  assert.ok(!(await texts()).includes("NOT HOTDOG"));
  p = await popup();
  assert.equal(await p.text(), "Enable on this tab");
  await p.close();
  report.checks.push("Escape pauses hover and clears activation state");
  const sw = context
    .serviceWorkers()
    .find((w) => w.url().includes(installed.id));
  p = await popup();
  await p.enable();
  await p.close();
  await page.reload();
  await page.bringToFront();
  await page.waitForTimeout(500);
  p = await popup();
  assert.equal(await p.text(), "Enable on this tab");
  await p.close();
  report.checks.push("Navigation resets activation");
  await page.goto(
    channel === "msedge" ? "edge://settings/" : "chrome://settings/",
  );
  await page.bringToFront();
  const settingsTab = (
    await cdp.send("Target.getTargets", { filter: [{ type: "tab" }] })
  ).targetInfos.find((t) => /^(chrome|edge):\/\/settings/.test(t.url));
  assert(settingsTab);
  await cdp.send("Extensions.triggerAction", {
    id: installed.id,
    targetId: settingsTab.targetId,
  });
  let protectedTarget;
  for (let i = 0; i < 50; i++) {
    protectedTarget = (await cdp.send("Target.getTargets")).targetInfos.find(
      (t) => t.url === `chrome-extension://${installed.id}/popup.html`,
    );
    if (protectedTarget) break;
    await page.waitForTimeout(100);
  }
  assert(protectedTarget);
  const protectedSession = (
    await cdp.send("Target.attachToTarget", {
      targetId: protectedTarget.targetId,
      flatten: false,
    })
  ).sessionId;
  for (let i = 0; i < 50; i++) {
    const ready = await remote(protectedSession, "Runtime.evaluate", {
      expression:
        '!!document.querySelector("#toggle")&&!document.querySelector("#toggle").disabled',
      returnByValue: true,
    });
    if (ready.result.value) break;
    await page.waitForTimeout(100);
  }
  await remote(protectedSession, "Runtime.evaluate", {
    expression: 'document.querySelector("#toggle").click()',
    userGesture: true,
  });
  await page.waitForTimeout(200);
  const blocked = await remote(protectedSession, "Runtime.evaluate", {
    expression: 'document.querySelector("#status").textContent',
    returnByValue: true,
  });
  assert.match(blocked.result.value, /regular webpage.*protected/);
  report.checks.push(
    "Real settings page is blocked with an understandable popup message",
  );
  assert.deepEqual(report.pageErrors, []);
  report.status = "PASS";
  await writeFile(
    resolve(output, "extension-report.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report));
} catch (e) {
  report.status = "FAIL";
  report.error = e.stack;
  await writeFile(
    resolve(output, "extension-report.json"),
    JSON.stringify(report, null, 2),
  );
  throw e;
} finally {
  await context.close();
  await new Promise((r) => a.close(r));
  await new Promise((r) => b.close(r));
}
