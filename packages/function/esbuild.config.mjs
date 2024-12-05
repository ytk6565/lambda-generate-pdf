import { build } from "esbuild";

/** @type {import('esbuild').BuildOptions} */
const options = {
  platform: "node",
  format: "esm",
  target: "es2020",
  outdir: "dist",
  outExtension: { ".js": ".mjs" },
  packages: "external",
  entryPoints: ["index.ts"],
  bundle: true,
};

build(options).catch((err) => {
  process.stderr.write(err.stderr);
  process.exit(1);
});
