import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { build } from "esbuild";

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist", { recursive: true });

const appBundle = await build({
  entryPoints: ["src/app.ts"],
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  write: false,
  minify: false,
});

const inlineScript = appBundle.outputFiles[0].text;
const inlineStyles = readFileSync("src/styles.css", "utf8").trim();
const template = readFileSync("src/template.html", "utf8");
const output = template
  .replace("/*__INLINE_STYLES__*/", inlineStyles)
  .replace("/*__INLINE_APP_SCRIPT__*/", inlineScript);

writeFileSync("dist/index.html", output, "utf8");
console.log("Built dist/index.html");
