import { build } from "../.ds-sync/node_modules/esbuild/lib/main.js";
import { execSync } from "node:child_process";
import { copyFileSync, mkdirSync } from "node:fs";
mkdirSync("dist", { recursive: true });
await build({ entryPoints: ["src/index.tsx"], bundle: true, format: "esm", outfile: "dist/index.js", external: ["react", "react-dom", "react/jsx-runtime"], jsx: "automatic", target: "es2020" });
copyFileSync("src/styles.css", "dist/styles.css");
execSync("npx tsc -p tsconfig.json", { stdio: "inherit", cwd: process.cwd() });
console.log("built dist/");
