import { test, expect, type BrowserContext, chromium } from "@playwright/test";
import { join } from "path";

/**
 * End-to-end tests for the GitHub Slash Palette extension.
 *
 * These tests load the extension in Chromium and verify basic functionality.
 * Note: Most tests require a built extension in the dist/ folder.
 */

// Helper to launch browser with extension
async function launchBrowserWithExtension(): Promise<BrowserContext> {
  const pathToExtension = join(__dirname, "..", "dist");
  const context = await chromium.launchPersistentContext("", {
    headless: false,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
      "--no-sandbox",
    ],
  });
  return context;
}

test.describe("Extension Build", () => {
  test("extension builds successfully", async () => {
    // Verify dist folder contains required files
    const fs = await import("fs/promises");
    const distDir = join(__dirname, "..", "dist");

    const files = await fs.readdir(distDir);
    expect(files).toContain("manifest.json");
    expect(files).toContain("content.js");
    expect(files).toContain("options.js");
    expect(files).toContain("options.html");
  });

  test("manifest.json has correct structure", async () => {
    const fs = await import("fs/promises");
    const manifestPath = join(__dirname, "..", "dist", "manifest.json");

    const manifest = JSON.parse(await fs.readFile(manifestPath, "utf-8"));

    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toBe("GitHub Slash Palette");
    expect(manifest.content_scripts).toBeDefined();
    expect(manifest.content_scripts[0].matches).toContain("https://github.com/*");
  });
});

test.describe("Extension Loading", () => {
  // Skip in CI as headless Chrome can't load extensions
  test.skip(!!process.env.CI, "Skipping extension loading tests in CI");

  test("extension loads without errors", async () => {
    const context = await launchBrowserWithExtension();

    // Check for any console errors during extension load
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    // Give extension time to initialize
    await page.waitForTimeout(1000);

    // Filter out known non-critical errors
    const criticalErrors = errors.filter((e) => !e.includes("net::ERR_"));
    expect(criticalErrors.length).toBe(0);

    await context.close();
  });
});
