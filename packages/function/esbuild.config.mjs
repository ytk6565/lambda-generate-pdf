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
  banner: `
    import { createRequire } from "module";
    const require = createRequire(import.meta.url);
  `,
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
