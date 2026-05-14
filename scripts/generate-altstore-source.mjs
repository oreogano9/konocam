import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const configPath = path.join(repoRoot, "altstore", "source.config.json");
const packagePath = path.join(repoRoot, "package.json");
const pbxprojPath = path.join(repoRoot, "ios", "App", "App.xcodeproj", "project.pbxproj");
const infoPlistPath = path.join(repoRoot, "ios", "App", "App", "Info.plist");
const appIconPath = path.join(
  repoRoot,
  "ios",
  "App",
  "App",
  "Assets.xcassets",
  "AppIcon.appiconset",
  "AppIcon-512@2x.png",
);

const distDir = path.resolve(process.env.ALTSTORE_DIST_DIR || path.join(repoRoot, "dist", "altstore"));
const config = JSON.parse(readFileSync(configPath, "utf8"));
const pkg = JSON.parse(readFileSync(packagePath, "utf8"));
const pbxproj = readFileSync(pbxprojPath, "utf8");
const infoPlist = readFileSync(infoPlistPath, "utf8");

const baseURL = trimTrailingSlash(process.env.ALTSTORE_BASE_URL || "");
const sourceOutputPath = path.resolve(
  process.env.ALTSTORE_OUTPUT || path.join(distDir, config.files.sourceName || "source.json"),
);
const ipaPath = path.resolve(
  process.env.ALTSTORE_IPA_PATH || path.join(distDir, config.files.ipaName || "KONO-CAM.ipa"),
);

if (!baseURL) {
  fail("ALTSTORE_BASE_URL is required, for example: ALTSTORE_BASE_URL=https://example.com/kono npm run altstore:source");
}

if (!existsSync(ipaPath)) {
  fail(`IPA not found at ${ipaPath}. Run npm run altstore:ipa first, or set ALTSTORE_IPA_PATH.`);
}

mkdirSync(path.dirname(sourceOutputPath), { recursive: true });
copyIconToDist();

const bundleIdentifier = firstPbxValue("PRODUCT_BUNDLE_IDENTIFIER") || "com.konocam.app";
const marketingVersion = firstPbxValue("MARKETING_VERSION") || pkg.version || "1.0.0";
const buildVersion = firstPbxValue("CURRENT_PROJECT_VERSION") || "1";
const minOSVersion = config.app.minOSVersion || firstPbxValue("IPHONEOS_DEPLOYMENT_TARGET") || "15.0";
const releaseDate = process.env.ALTSTORE_RELEASE_DATE || new Date().toISOString();
const ipaSize = statSync(ipaPath).size;
const iconURL = process.env.ALTSTORE_ICON_URL || `${baseURL}/${config.files.iconName || "icon.png"}`;
const downloadURL = process.env.ALTSTORE_DOWNLOAD_URL || `${baseURL}/${path.basename(ipaPath)}`;
const sourceURL = process.env.ALTSTORE_SOURCE_URL || `${baseURL}/${path.basename(sourceOutputPath)}`;

const source = {
  name: config.source.name,
  subtitle: config.source.subtitle,
  description: config.source.description,
  iconURL,
  website: config.source.website,
  tintColor: config.source.tintColor,
  featuredApps: [bundleIdentifier],
  apps: [
    {
      name: config.app.name,
      bundleIdentifier,
      developerName: config.app.developerName,
      subtitle: config.app.subtitle,
      localizedDescription: config.app.localizedDescription,
      iconURL,
      tintColor: config.app.tintColor || config.source.tintColor,
      category: config.app.category || "photo-video",
      versions: [
        {
          version: marketingVersion,
          buildVersion,
          marketingVersion: `${marketingVersion} (${buildVersion})`,
          date: releaseDate,
          localizedDescription: config.app.releaseNotes,
          downloadURL,
          size: ipaSize,
          minOSVersion,
        },
      ],
      appPermissions: {
        entitlements: [],
        privacy: privacyUsageDescriptions(),
      },
    },
  ],
  news: [
    {
      title: `${config.app.name} ${marketingVersion}`,
      identifier: `${bundleIdentifier}.${marketingVersion}.${buildVersion}`,
      caption: config.app.releaseNotes,
      date: releaseDate,
      tintColor: config.source.tintColor,
      appID: bundleIdentifier,
    },
  ],
};

writeFileSync(sourceOutputPath, `${JSON.stringify(source, null, 2)}\n`);

console.log(`Wrote AltStore source: ${sourceOutputPath}`);
console.log(`IPA: ${ipaPath} (${ipaSize} bytes)`);
console.log(`Upload these files to: ${baseURL}`);
console.log(`- ${path.basename(sourceOutputPath)} -> ${sourceURL}`);
console.log(`- ${path.basename(ipaPath)} -> ${downloadURL}`);
console.log(`- ${config.files.iconName || "icon.png"} -> ${iconURL}`);

function copyIconToDist() {
  const iconOutputPath = path.join(distDir, config.files.iconName || "icon.png");
  if (!existsSync(appIconPath)) {
    fail(`App icon not found at ${appIconPath}`);
  }

  mkdirSync(distDir, { recursive: true });
  copyFileSync(appIconPath, iconOutputPath);
}

function firstPbxValue(key) {
  const match = pbxproj.match(new RegExp(`${key} = ([^;]+);`));
  return match?.[1]?.trim().replace(/^"|"$/g, "");
}

function privacyUsageDescriptions() {
  const keys = [
    "NSCameraUsageDescription",
    "NSPhotoLibraryAddUsageDescription",
    "NSPhotoLibraryUsageDescription",
  ];
  const privacy = {};

  for (const key of keys) {
    const value = plistStringValue(key);
    if (value) {
      privacy[key] = value;
    }
  }

  return privacy;
}

function plistStringValue(key) {
  try {
    return execFileSync("/usr/libexec/PlistBuddy", ["-c", `Print :${key}`, infoPlistPath], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = infoPlist.match(new RegExp(`<key>${escapedKey}</key>\\s*<string>([^<]+)</string>`));
    return match?.[1]?.trim() || "";
  }
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
