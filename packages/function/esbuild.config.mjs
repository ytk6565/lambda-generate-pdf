import { build } from "esbuild";
import path from "node:path";

/** @type {import('esbuild').Plugin} */
const jsToMjs = {
  name: "js-to-mjs",
  setup(build) {
    // src を含むパスの拡張子を .mjs に変更する
    build.onResolve({ filter: /.*\/src\/.*\.ts/ }, (args) => {
      return {
        path: path.join(args.resolveDir, args.path + ".mjs"),
      };
    });
  },
};

/** @type {import('esbuild').BuildOptions} */
const options = {
  platform: "node",
  format: "esm",
  target: "es2020",
  outdir: "dist",
  outExtension: { ".js": ".mjs" },
  packages: "external",
  entryPoints: ["index.ts"],
  packages: "external",
  bundle: true,
  plugins: [jsToMjs],
};

build(options).catch((err) => {
  process.stderr.write(err.stderr);
  process.exit(1);
});
