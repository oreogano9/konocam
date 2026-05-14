import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const githubRepo = process.env.ALTSTORE_GITHUB_REPO || "oreogano9/konocam";
const distDir = path.resolve(process.env.ALTSTORE_DIST_DIR || path.join(repoRoot, "dist", "altstore"));
const ipaPath = path.resolve(process.env.ALTSTORE_IPA_PATH || path.join(distDir, "KONO-CAM.ipa"));
const sourcePath = path.resolve(process.env.ALTSTORE_OUTPUT || path.join(distDir, "source.json"));
const iconPath = path.resolve(process.env.ALTSTORE_ICON_PATH || path.join(distDir, "icon.png"));
const baseURL = `https://github.com/${githubRepo}/releases/latest/download`;

ensureCommand("gh");

if (!existsSync(ipaPath)) {
  run("npm", ["run", "altstore:ipa"]);
}

run("node", ["scripts/generate-altstore-source.mjs"], {
  env: {
    ...process.env,
    ALTSTORE_BASE_URL: baseURL,
    ALTSTORE_IPA_PATH: ipaPath,
    ALTSTORE_OUTPUT: sourcePath,
  },
});

const source = JSON.parse(readFileSync(sourcePath, "utf8"));
const app = source.apps?.[0];
const version = app?.versions?.[0];

if (!app || !version) {
  console.error(`Invalid generated AltStore source at ${sourcePath}`);
  process.exit(1);
}

const tag = sanitizeTag(`altstore-v${version.version}-${version.buildVersion}`);
const title = app.name;
const notes = [
  `${app.name} AltStore build.`,
  "",
  `Source URL: ${baseURL}/source.json`,
  `IPA URL: ${baseURL}/${path.basename(ipaPath)}`,
].join("\n");

const releaseExists = commandSucceeds("gh", ["release", "view", tag, "--repo", githubRepo]);

if (releaseExists) {
  run("gh", ["release", "upload", tag, ipaPath, sourcePath, iconPath, "--repo", githubRepo, "--clobber"]);
  run("gh", ["release", "edit", tag, "--repo", githubRepo, "--title", title, "--notes", notes, "--latest"]);
} else {
  run("gh", [
    "release",
    "create",
    tag,
    ipaPath,
    sourcePath,
    iconPath,
    "--repo",
    githubRepo,
    "--target",
    "main",
    "--title",
    title,
    "--notes",
    notes,
    "--latest",
  ]);
}

console.log(`Published AltStore source to GitHub: ${baseURL}/source.json`);

function run(command, args, options = {}) {
  console.log(`$ ${command} ${args.join(" ")}`);
  execFileSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
    env: options.env || process.env,
  });
}

function commandSucceeds(command, args) {
  try {
    execFileSync(command, args, { cwd: repoRoot, stdio: "ignore", env: process.env });
    return true;
  } catch {
    return false;
  }
}

function ensureCommand(command) {
  if (!commandSucceeds(command, ["--version"])) {
    console.error(`${command} is required.`);
    process.exit(1);
  }
}

function sanitizeTag(value) {
  return value.replace(/[^A-Za-z0-9._-]+/g, "-");
}
