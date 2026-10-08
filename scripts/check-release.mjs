import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { unzipSync } from "fflate";
const pkg = JSON.parse(readFileSync("package.json", "utf8")),
  manifest = JSON.parse(readFileSync("extension/manifest.json", "utf8")),
  plugin = JSON.parse(readFileSync(".codex-plugin/plugin.json", "utf8"));
assert.equal(pkg.version, "1.0.0");
assert.equal(pkg.license, "MIT");
assert.equal(pkg.packageManager, "pnpm@11.19.0");
assert.equal(manifest.version, pkg.version);
assert.deepEqual(manifest.permissions, ["activeTab", "scripting", "storage"]);
assert.equal(manifest.host_permissions, undefined);
assert.equal(plugin.version, "0.2.2");
assert.equal(plugin.mcpServers, undefined);
const archived = unzipSync(readFileSync("public/not-hotdog-extension.zip"));
for (const name of [
  "manifest.json",
  "content.js",
  "popup.js",
  "popup.html",
  "background.js",
  "LICENSE",
  "THIRD_PARTY_NOTICES.md",
  "licenses/TENSORFLOW-LICENSE.txt",
  "licenses/SEEDRANDOM-LICENSE.txt",
  "licenses/LONG-LICENSE.txt",
  "MODEL.lock.json",
  "model/v1-100/model.json",
  "model/v1-100/weights.bin",
])
  assert.deepEqual(
    Buffer.from(archived[name]),
    readFileSync("extension/" + name),
    name,
  );
assert.equal(statSync("extension/model/v1-100/weights.bin").size, 17_015_456);
assert(
  readFileSync("extension/popup.html", "utf8").includes('id="toggle" disabled'),
);
assert(
  !Object.keys(archived).some(
    (x) => x.includes("node_modules") || x.startsWith(".env"),
  ),
);
console.log(
  JSON.stringify({
    status: "passed",
    website: pkg.version,
    companion: manifest.version,
    chatPlugin: plugin.version,
    companionFiles: Object.keys(archived).length,
    weightSha256: createHash("sha256")
      .update(archived["model/v1-100/weights.bin"])
      .digest("hex"),
  }),
);
