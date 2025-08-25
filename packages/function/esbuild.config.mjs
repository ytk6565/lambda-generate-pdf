import { build } from "esbuild";

/** @type {import('esbuild').BuildOptions} */
const options = {
  platform: "node",
  format: "esm",
  target: "es2020",
  outdir: "dist",
  outExtension: { ".js": ".mjs" },
  entryPoints: ["index.ts"],
  bundle: true,
  banner: {
    js: `
      import path from 'node:path';
      import { fileURLToPath } from 'node:url';
      import { createRequire as topLevelCreateRequire } from 'node:module';
      const require = topLevelCreateRequire(import.meta.url);
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
    `,
  },
  define: {
    "process.env.WEB_BASE_URL": JSON.stringify(process.env.WEB_BASE_URL),
  },
  plugins: [
    {
      name: "external-output",
      setup(build) {
        // Match an import called "./.output" and mark it as external
        build.onResolve({ filter: /^\.\/\.output/ }, () => ({
          external: true,
        }));
      },
    },
  ],
};

build(options).catch((err) => {
  process.stderr.write(err.stderr);
  process.exit(1);
});
