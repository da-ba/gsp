import { defineConfig, build as viteBuild } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { resolve } from "path";
import { readFileSync, writeFileSync, cpSync, mkdirSync, rmSync, readdirSync } from "fs";
import type { Plugin, InlineConfig } from "vite";

const __dirname = import.meta.dirname;

// Read version from package.json (single source of truth)
function getVersion(): string {
  const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
  return pkg.version;
}

// Copy static assets for Chrome extension
function copyExtensionAssets(): void {
  const version = getVersion();
  const distDir = resolve(__dirname, "dist");

  // Ensure dist directory exists
  mkdirSync(distDir, { recursive: true });

  // Copy and update manifest.json with version from package.json
  const manifestSrc = resolve(__dirname, "src/manifest.json");
  const manifest = JSON.parse(readFileSync(manifestSrc, "utf-8"));
  manifest.version = version;
  writeFileSync(resolve(distDir, "manifest.json"), JSON.stringify(manifest, null, 2));

  // Copy icons
  const icons = ["icon16.png", "icon32.png", "icon48.png", "icon128.png"];
  for (const icon of icons) {
    try {
      cpSync(resolve(__dirname, "src/assets", icon), resolve(distDir, icon));
    } catch {
      // Icon might not exist
    }
  }

  // Copy options.html
  try {
    cpSync(resolve(__dirname, "src/options/options.html"), resolve(distDir, "options.html"));
  } catch {
    // File might not exist
  }
}

// Plugin that copies extension assets after build
function chromeExtensionPlugin(): Plugin {
  return {
    name: "chrome-extension-plugin",
    closeBundle() {
      copyExtensionAssets();
    },
  };
}

// Get base config for building a single entry point
function getEntryConfig(
  entry: "content" | "options",
  mode: string,
  emptyOutDir: boolean
): InlineConfig {
  const isDev = mode === "development";
  const entryFile =
    entry === "content"
      ? resolve(__dirname, "src/content/index.ts")
      : resolve(__dirname, "src/options/options.ts");

  return {
    configFile: false,
    plugins: [
      react(),
      // Only add extension plugin on the last entry (options)
      entry === "options" && chromeExtensionPlugin(),
      // Only include visualizer in production builds on last entry
      entry === "options" &&
        !isDev &&
        visualizer({
          filename: "stats.html",
          gzipSize: true,
          brotliSize: true,
          open: false,
        }),
    ].filter(Boolean),
    build: {
      outDir: "dist",
      sourcemap: isDev ? "inline" : false,
      minify: !isDev,
      emptyOutDir,
      rollupOptions: {
        input: entryFile,
        output: {
          entryFileNames: `${entry}.js`,
          chunkFileNames: "[name]-[hash].js",
          assetFileNames: "[name].[ext]",
          // Inline dynamic imports to prevent shared chunks
          inlineDynamicImports: true,
        },
      },
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
    },
    publicDir: false,
    logLevel: "info",
  };
}

// For CLI usage (vite build), export a default config that triggers multi-build
export default defineConfig(({ mode }) => {
  const isDev = mode === "development";

  // This config is only used for watch mode
  // Production builds use the buildExtension() function
  return {
    plugins: [
      react(),
      chromeExtensionPlugin(),
      !isDev &&
        visualizer({
          filename: "stats.html",
          gzipSize: true,
          brotliSize: true,
          open: false,
        }),
    ].filter(Boolean),
    build: {
      outDir: "dist",
      sourcemap: isDev ? "inline" : false,
      minify: !isDev,
      emptyOutDir: true,
      rollupOptions: {
        input: {
          content: resolve(__dirname, "src/content/index.ts"),
          options: resolve(__dirname, "src/options/options.ts"),
        },
        output: {
          entryFileNames: "[name].js",
          chunkFileNames: "[name]-[hash].js",
          assetFileNames: "[name].[ext]",
        },
      },
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
    },
    publicDir: false,
  };
});

// Export function for programmatic multi-build (used by scripts/build.ts)
export async function buildExtension(mode = "production"): Promise<void> {
  console.log("Building content script...");
  await viteBuild(getEntryConfig("content", mode, true));

  console.log("\nBuilding options page...");
  await viteBuild(getEntryConfig("options", mode, false));

  console.log("\n✓ Extension built successfully!");
}
