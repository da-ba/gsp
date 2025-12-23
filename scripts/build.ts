/**
 * Build script for Chrome extension using Vite
 *
 * This script builds content script and options page as separate bundles
 * to ensure each is self-contained (no shared chunks) for Chrome extension compatibility.
 *
 * Usage:
 *   npm run build       - Production build
 *   npm run dev         - Watch mode for development
 */

import { buildExtension } from "../vite.config.ts";

const isWatch = process.argv.includes("--watch");
const isDev = process.argv.includes("--dev") || isWatch;

async function main() {
  if (isWatch) {
    // For watch mode, use vite build --watch directly (from package.json)
    console.log("For watch mode, use: npm run dev");
    process.exit(0);
  }

  const start = performance.now();

  await buildExtension(isDev ? "development" : "production");

  const duration = (performance.now() - start).toFixed(0);
  console.log(`\nTotal build time: ${duration}ms`);
}

main().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
