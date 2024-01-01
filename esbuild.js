import * as esbuild from "esbuild";
// import postcss from "esbuild-postcss";
import fg from "fast-glob";
import fse from "fs-extra";
import { watch } from "chokidar";
import postcss from "postcss";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import fs from "fs";

/**
 * @type {import('tailwindcss').Config}
 */
const tailwindConfig = {
  // content: ["./src/**/*.{html,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};

/**
 *
 * @param {import('tailwindcss').Config} tailwindConfig
 * @returns {import('esbuild').Plugin}
 */
const myPlugin = (tailwindConfig) => ({
  name: "my-plugin",
  setup(build) {
    build.onLoad({ filter: /\.css$/ }, async (args) => {
      const css = await fs.readFileSync(args.path, "utf8");
      const result = await postcss([
        tailwindcss(tailwindConfig),
        autoprefixer(),
      ]).process(css, { from: args.path });
      return { contents: result.css, loader: "css" };
    });
  },
});

async function build() {
  for (const src of await fg(["./src/**/*"], {
    ignore: ["./src/**/*.{ts,tsx,css}"],
    onlyFiles: true,
  })) {
    await fse.copy(src, src.replace(/^\.\/src\//, "./dist/"));
  }

  const tasks = [];

  tasks.push(
    esbuild.build({
      entryPoints: ["./src/popup/popup.tsx"],
      outdir: "./dist/popup",
      bundle: true,
      minify: false,
      // plugins: [myPlugin],
    })
  );

  tasks.push(
    esbuild.build({
      entryPoints: ["./src/popup/popup.css"],
      outdir: "./dist/popup",
      bundle: true,
      minify: false,
      plugins: [
        myPlugin({
          ...tailwindConfig,
          content: ["./src/popup/**/*.{html,tsx}"],
        }),
      ],
    })
  );

  tasks.push(
    esbuild.build({
      entryPoints: ["./src/content/content.tsx"],
      outdir: "./dist/content",
      bundle: true,
      minify: false,
    })
  );

  tasks.push(
    esbuild.build({
      entryPoints: ["./src/content/content.css"],
      outdir: "./dist/content",
      bundle: true,
      minify: false,
      plugins: [
        myPlugin({
          ...tailwindConfig,
          content: ["./src/content/**/*.{html,tsx}"],
        }),
      ],
    })
  );

  tasks.push(
    esbuild.build({
      entryPoints: ["./src/background.ts"],
      outdir: "./dist",
      bundle: true,
      minify: false,
    })
  );

  await Promise.all(tasks);
}

await build();

if (process.argv.includes("--watch")) {
  watch("./src/**/*.*", {
    persistent: true,
  }).on("all", async (event) => {
    if (event === "change" || event === "unlink") {
      try {
        console.log("Rebuilding...");
        await build();
        console.log("Done!");
      } catch (e) {
        console.error(e);
      }
    }
  });
}
