import { watch } from "fs";
import { cp, rm, mkdir, readFile, writeFile, stat } from "fs/promises";
import { join } from "path";
import { config } from "dotenv";
import { z } from "zod";
import { createEnv } from "@t3-oss/env-core";
import * as esbuild from "esbuild";
import { solidPlugin } from "esbuild-plugin-solid";

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
  await esbuild.build({
    entryPoints: [join(srcDir, "content", "index.ts")],
    outfile: join(distDir, "content.js"),
    bundle: true,
    minify: !isWatch,
    sourcemap: isWatch ? "inline" : false,
    target: "es2020",
    format: "iife",
    define: envDefines,
    plugins: [solidPlugin()],
  });
}

async function bundleOptionsScript(envDefines: Record<string, string>) {
  await esbuild.build({
    entryPoints: [join(srcDir, "options", "options.tsx")],
    outfile: join(distDir, "options.js"),
    bundle: true,
    minify: !isWatch,
    sourcemap: isWatch ? "inline" : false,
    target: "es2020",
    format: "iife",
    define: envDefines,
    plugins: [solidPlugin()],
  });
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
