import { zipSync } from "fflate";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const git = (args) =>
  execFileSync("git", args, { encoding: "utf8", windowsHide: true }).trim();
if (resolve(git(["rev-parse", "--show-toplevel"])) !== process.cwd())
  throw new Error("Run packaging from the repository root.");
if (git(["status", "--porcelain", "--untracked-files=normal"]))
  throw new Error("Source packaging requires a clean committed tree.");
const metadata = JSON.parse(readFileSync("package.json", "utf8"));
const version = metadata.version;
if (
  !/^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/.test(version) ||
  metadata.name !== "not-hotdog" ||
  metadata.license !== "MIT"
)
  throw new Error("Expected stable not-hotdog version and MIT metadata.");
const commit = git(["rev-parse", "HEAD"]);
if (process.env.GITHUB_SHA && process.env.GITHUB_SHA !== commit)
  throw new Error("Checkout differs from the workflow commit.");
const directory = resolve("release-artifacts");
mkdirSync(directory, { recursive: true });
const filename = `not-hotdog_${version}_source.zip`;
const output = resolve(directory, filename);
execFileSync(
  "git",
  [
    "-c",
    "core.autocrlf=false",
    "archive",
    "--format=zip",
    `--prefix=not-hotdog-${version}/`,
    `--output=${output}`,
    "HEAD",
  ],
  { windowsHide: true },
);
const digest = (data) => createHash("sha256").update(data).digest("hex");
const lines = [];
function save(name, data) {
  writeFileSync(resolve(directory, name), data);
  const checksum = digest(data) + "  " + name + "\n";
  writeFileSync(resolve(directory, name + ".sha256"), checksum);
  lines.push(checksum);
}
save(filename, readFileSync(output));
save(
  `not-hotdog_${version}_extension.zip`,
  readFileSync("public/not-hotdog-extension.zip"),
);
const plugin = JSON.parse(readFileSync(".codex-plugin/plugin.json", "utf8"));
if (plugin.version !== "0.2.2")
  throw Error("Expected existing approved plugin identity.");
const pluginFiles = {};
for (const name of git(["ls-files"]).split("\n"))
  if (
    name.startsWith(".codex-plugin/") ||
    name.startsWith("skills/") ||
    name.startsWith("assets/") ||
    name === "LICENSE"
  )
    pluginFiles[name] = [
      new Uint8Array(
        execFileSync("git", ["show", "HEAD:" + name], { windowsHide: true }),
      ),
      { mtime: new Date("2000-01-01T00:00:00Z") },
    ];
save("not-hotdog_plugin_0.2.2.zip", zipSync(pluginFiles, { level: 6 }));
writeFileSync(resolve(directory, "SHA256SUMS"), lines.join(""));
console.log(`Packaged source, companion and chat skill from ${commit}`);
