import { watch } from "fs";
import { cp, rm, mkdir, readFile, writeFile, stat } from "fs/promises";
import { join } from "path";
import { config } from "dotenv";
import { z } from "zod";
import { createEnv } from "@t3-oss/env-core";
import { execFile } from "node:child_process";

const isWatch = process.argv.includes("--watch");
const srcDir = "src";
const distDir = "dist";

// Load and validate environment variables using t3-env
function loadEnv() {
  // Load .env files first
  config({ path: ".env.local" });
  config({ path: ".env" });
  
  // Validate using t3-env with zod
  return createEnv({
    clientPrefix: "GIPHY_",
    client: {
      GIPHY_API_KEY: z.string().default(""),
    },
    runtimeEnv: {
      GIPHY_API_KEY: process.env.GIPHY_API_KEY ?? "",
    },
    emptyStringAsUndefined: false,
  });
}

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

async function bundleContentScript(envDefines: Record<string, string>) {
  const result = await Bun.build({
    entrypoints: [join(srcDir, "content", "index.ts")],
    outdir: distDir,
    naming: "content.js",
    minify: !isWatch,
    sourcemap: isWatch ? "inline" : "none",
    target: "browser",
    define: envDefines,
  });

  if (!result.success) {
    console.error("Content script build failed:");
    for (const log of result.logs) {
      console.error(log);
    }
    process.exit(1);
  }
}

async function bundleOptionsScript(envDefines: Record<string, string>) {
  const result = await Bun.build({
    entrypoints: [join(srcDir, "options", "options.ts")],
    outdir: distDir,
    naming: "options.js",
    minify: !isWatch,
    sourcemap: isWatch ? "inline" : "none",
    target: "browser",
    define: envDefines,
  });

  if (!result.success) {
    console.error("Options script build failed:");
    for (const log of result.logs) {
      console.error(log);
    }
    process.exit(1);
  }
}

async function buildOptionsCss(): Promise<void> {
  const inputPath = join(srcDir, "options", "options.css");
  const outputPath = join(distDir, "options.css");
  const args = [
    "@tailwindcss/cli",
    "-i", inputPath,
    "-o", outputPath,
  ];
  
  if (!isWatch) {
    args.push("--minify");
  }
  
  return new Promise((resolve, reject) => {
    execFile("npx", args, { maxBuffer: 10 * 1024 * 1024 }, (error, _stdout, stderr) => {
      if (error) {
        console.error("Tailwind CSS build failed:");
        console.error(stderr);
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

async function reportBundleSizes() {
  const contentSize = await getFileSize(join(distDir, "content.js"));
  const optionsSize = await getFileSize(join(distDir, "options.js"));
  const optionsCssSize = await getFileSize(join(distDir, "options.css"));

  console.log("\n📦 Bundle sizes:");
  console.log(`  content.js: ${formatSize(contentSize)}`);
  console.log(`  options.js: ${formatSize(optionsSize)}`);
  console.log(`  options.css: ${formatSize(optionsCssSize)}`);
}

async function build() {
  const start = performance.now();
  const version = await getVersion();
  
  // Load and validate environment variables using t3-env
  const env = loadEnv();
  
  // Create define map for build-time replacement
  const envDefines: Record<string, string> = {
    "process.env.GIPHY_API_KEY": JSON.stringify(env.GIPHY_API_KEY),
  };

  await cleanDist();
  await copyStaticAssets();
  await bundleContentScript(envDefines);
  await bundleOptionsScript(envDefines);
  await buildOptionsCss();

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
