import { build } from "esbuild";
import path from "node:path";

/** @type {import('esbuild').Plugin} */
const jsToMjs = {
  name: "js-to-mjs",
  setup(build) {
    // Find all relative imports (starting with ".") that ends with ".js" and
    // replace the file extension with ".mjs"
    build.onResolve({ filter: /^..+\.js$/ }, (args) => {
      return {
        path: path.join(args.resolveDir, args.path.slice(0, -3) + ".mjs"),
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
  packages: "external",
  entryPoints: ["index.ts", "src/**/*.ts"],
  bundle: false,
  plugins: [jsToMjs],
};

build(options).catch((err) => {
  process.stderr.write(err.stderr);
  process.exit(1);
});
