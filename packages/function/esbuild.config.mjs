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
      import { createRequire as topLevelCreateRequire } from 'node:module';
      import { fileURLToPath as urlFileURLToPath } from 'node:url';
      import { dirname as pathDirname } from 'node:path';
      const require = topLevelCreateRequire(import.meta.url);
      const __filename = urlFileURLToPath(import.meta.url);
      const __dirname = pathDirname(__filename);
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
