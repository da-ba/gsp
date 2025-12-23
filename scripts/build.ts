import { watch } from "fs";
import { cp, rm, mkdir, readFile, writeFile, stat } from "fs/promises";
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

  // Copy options page HTML
  try {
    await cp(join(srcDir, "options", "options.html"), join(distDir, "options.html"));
  } catch {
    console.warn("Warning: options.html not found");
  }
}

// Format file size in human-readable format
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  return `${kb.toFixed(2)} kB`;
}

// Get file size
async function getFileSize(path: string): Promise<number> {
  try {
    const stats = await stat(path);
    return stats.size;
  } catch {
    return 0;
  }
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
    entrypoints: [join(srcDir, "options", "options.ts")],
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

async function reportBundleSizes() {
  const contentSize = await getFileSize(join(distDir, "content.js"));
  const optionsSize = await getFileSize(join(distDir, "options.js"));

  console.log("\n📦 Bundle sizes:");
  console.log(`  content.js: ${formatSize(contentSize)}`);
  console.log(`  options.js: ${formatSize(optionsSize)}`);
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

  // Report bundle sizes in non-watch mode
  if (!isWatch) {
    await reportBundleSizes();
  }
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
