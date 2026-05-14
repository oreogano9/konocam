import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const distDir = path.resolve(process.env.ALTSTORE_DIST_DIR || path.join(repoRoot, "dist", "altstore"));
const archivePath = path.resolve(process.env.ALTSTORE_ARCHIVE_PATH || path.join(distDir, "KONO-CAM.xcarchive"));
const payloadDir = path.join(distDir, "Payload");
const ipaPath = path.resolve(process.env.ALTSTORE_IPA_PATH || path.join(distDir, "KONO-CAM.ipa"));
const projectPath = process.env.ALTSTORE_XCODE_PROJECT || path.join(repoRoot, "ios", "App", "App.xcodeproj");
const scheme = process.env.ALTSTORE_SCHEME || "App";
const configuration = process.env.ALTSTORE_CONFIGURATION || "Release";

mkdirSync(distDir, { recursive: true });

run("npm", ["run", "ios:sync"]);

if (existsSync(archivePath)) {
  rmSync(archivePath, { recursive: true, force: true });
}

run("xcodebuild", [
  "-project",
  projectPath,
  "-scheme",
  scheme,
  "-configuration",
  configuration,
  "-destination",
  "generic/platform=iOS",
  "-archivePath",
  archivePath,
  "archive",
]);

const appPath = path.join(archivePath, "Products", "Applications", "App.app");
if (!existsSync(appPath)) {
  console.error(`Archive succeeded, but App.app was not found at ${appPath}`);
  process.exit(1);
}

rmSync(payloadDir, { recursive: true, force: true });
mkdirSync(payloadDir, { recursive: true });
run("ditto", [appPath, path.join(payloadDir, "App.app")]);

if (existsSync(ipaPath)) {
  rmSync(ipaPath, { force: true });
}

run("ditto", ["-c", "-k", "--sequesterRsrc", "--keepParent", "Payload", ipaPath], { cwd: distDir });
rmSync(payloadDir, { recursive: true, force: true });

console.log(`Wrote AltStore IPA: ${ipaPath}`);

function run(command, args, options = {}) {
  console.log(`$ ${command} ${args.join(" ")}`);
  execFileSync(command, args, {
    cwd: options.cwd || repoRoot,
    stdio: "inherit",
    env: process.env,
  });
}
