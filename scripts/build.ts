import { watch } from "fs";
import { cp, rm, mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

const isWatch = process.argv.includes("--watch");
const srcDir = "src";
const distDir = "dist";

// Read version from package.json (single source of truth)
async function getVersion(): Promise<string> {
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  return pkg.version;
}

async function cleanDist() {
  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });
}

async function copyStaticAssets() {
  // Read manifest and inject version from package.json
  const version = await getVersion();
  const manifest = JSON.parse(await readFile(join(srcDir, "manifest.json"), "utf-8"));
  manifest.version = version;
  await writeFile(join(distDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  
  // Copy icons from assets folder
  const icons = ["icon16.png", "icon32.png", "icon48.png", "icon128.png"];
  for (const icon of icons) {
    try {
      await cp(join(srcDir, "assets", icon), join(distDir, icon));
    } catch {
      console.warn(`Warning: ${icon} not found`);
    }
  }
  
  // Copy options.html
  await cp(join(srcDir, "options", "options.html"), join(distDir, "options.html"));
}

async function bundleContentScript() {
  const result = await Bun.build({
    entrypoints: [join(srcDir, "content", "index.ts")],
    outdir: distDir,
    naming: "content.js",
    minify: !isWatch,
    sourcemap: isWatch ? "inline" : "none",
    target: "browser",
  });

  if (!result.success) {
    console.error("Content script build failed:");
    for (const log of result.logs) {
      console.error(log);
    }
    process.exit(1);
  }
}

async function bundleOptionsScript() {
  const result = await Bun.build({
    entrypoints: [join(srcDir, "options", "index.ts")],
    outdir: distDir,
    naming: "options.js",
    minify: !isWatch,
    sourcemap: isWatch ? "inline" : "none",
    target: "browser",
  });

  if (!result.success) {
    console.error("Options script build failed:");
    for (const log of result.logs) {
      console.error(log);
    }
    process.exit(1);
  }
}

async function build() {
  const start = performance.now();
  const version = await getVersion();
  
  await cleanDist();
  await copyStaticAssets();
  await bundleContentScript();
  await bundleOptionsScript();
  
  const duration = (performance.now() - start).toFixed(0);
  console.log(`✓ Built gsp-${version} in ${duration}ms → ${distDir}/`);
}

// Initial build
await build();

// Watch mode
if (isWatch) {
  console.log("\nWatching for changes...\n");
  
  const watcher = watch(srcDir, { recursive: true }, async (event, filename) => {
    if (!filename) return;
    console.log(`\n${event}: ${filename}`);
    await build();
  });

  process.on("SIGINT", () => {
    watcher.close();
    process.exit(0);
  });
}
