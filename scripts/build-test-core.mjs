import { mkdirSync, rmSync } from "node:fs";
import { build } from "esbuild";

rmSync(".test-dist", { recursive: true, force: true });
mkdirSync(".test-dist", { recursive: true });

await build({
  entryPoints: ["src/password-core.ts"],
  outfile: ".test-dist/password-core.js",
  format: "esm",
  platform: "neutral",
  target: ["es2022"],
  bundle: true,
  sourcemap: false,
});

console.log("Built .test-dist/password-core.js");
