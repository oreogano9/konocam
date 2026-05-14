import { readFile, writeFile } from "node:fs/promises";

const configPath = new URL("../ios/App/App/capacitor.config.json", import.meta.url);
const pluginClass = "App.KonoNativeBridgePlugin";

const config = JSON.parse(await readFile(configPath, "utf8"));
const current = Array.isArray(config.packageClassList) ? config.packageClassList : [];
config.packageClassList = Array.from(new Set([...current, pluginClass]));

await writeFile(configPath, `${JSON.stringify(config, null, "\t")}\n`);
