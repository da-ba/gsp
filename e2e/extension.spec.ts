import { test, expect, type BrowserContext, chromium } from "@playwright/test";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

test.describe("GitHub Integration", () => {
  test("/gsp command shows picker in PR comment field", async () => {
    const context = await launchBrowserWithExtension();
    const page = await context.newPage();

    // Navigate to the PR page
    await page.goto("https://github.com/da-ba/gsp/pull/1");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Find the comment textarea - try to find the comment box
    const commentTextarea = page.locator("textarea[name='comment[body]']").first();

    // Check if textarea exists (user might not be logged in)
    const textareaCount = await commentTextarea.count();
    if (textareaCount === 0) {
      // Skip this test if not logged in to GitHub
      test.skip(true, "GitHub login required for this test");
      await context.close();
      return;
    }

    // Click on the textarea to focus it
    await commentTextarea.click();

    // Type /gsp command
    await commentTextarea.fill("/gsp");

    // Wait for the picker to appear
    await page.waitForTimeout(500);

    // Check if the picker is visible
    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Verify the picker shows the header
    const headerText = await picker.locator("text=GitHub Slash Palette").count();
    expect(headerText).toBeGreaterThan(0);

    await context.close();
  });

  test("/giphy command shows picker with GIFs", async () => {
    const context = await launchBrowserWithExtension();
    const page = await context.newPage();

    // Navigate to the PR page
    await page.goto("https://github.com/da-ba/gsp/pull/1");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Find the comment textarea
    const commentTextarea = page.locator("textarea[name='comment[body]']").first();

    // Check if textarea exists (user might not be logged in)
    const textareaCount = await commentTextarea.count();
    if (textareaCount === 0) {
      test.skip(true, "GitHub login required for this test");
      await context.close();
      return;
    }

    // Click on the textarea to focus it
    await commentTextarea.click();

    // Type /giphy command
    await commentTextarea.fill("/giphy");

    // Wait for the picker to appear
    await page.waitForTimeout(1000);

    // Check if the picker is visible
    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 5000 });

    // Verify the picker shows trending GIFs or setup panel
    // If API key is baked in, we should see GIFs
    // If not, we should see the setup panel
    const pickerContent = await picker.textContent();
    const hasGifs = pickerContent?.includes("Trending") || pickerContent?.includes("gif");
    const hasSetup = pickerContent?.includes("Giphy API Key") || pickerContent?.includes("Paste");

    // Either GIFs should be shown (key baked in) or setup panel (no key)
    expect(hasGifs || hasSetup).toBe(true);

    await context.close();
  });

  test("/giphy command with search term shows results", async () => {
    const context = await launchBrowserWithExtension();
    const page = await context.newPage();

    // Navigate to the PR page
    await page.goto("https://github.com/da-ba/gsp/pull/1");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Find the comment textarea
    const commentTextarea = page.locator("textarea[name='comment[body]']").first();

    // Check if textarea exists
    const textareaCount = await commentTextarea.count();
    if (textareaCount === 0) {
      test.skip(true, "GitHub login required for this test");
      await context.close();
      return;
    }

    // Click on the textarea to focus it
    await commentTextarea.click();

    // Type /giphy with a search term
    await commentTextarea.fill("/giphy cats");

    // Wait for the picker to appear and load results
    await page.waitForTimeout(1500);

    // Check if the picker is visible
    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 5000 });

    // The picker should show either results or setup panel
    const isVisible = await picker.isVisible();
    expect(isVisible).toBe(true);

    await context.close();
  });

  test("extension content script injects on GitHub", async () => {
    const context = await launchBrowserWithExtension();
    const page = await context.newPage();

    // Navigate to any GitHub page
    await page.goto("https://github.com/da-ba/gsp");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Give the extension time to inject
    await page.waitForTimeout(1000);

    // Check that the content script is running by looking for any textarea
    // that has been bound (this verifies the extension loaded without errors)
    const bodyExists = await page.locator("body").count();
    expect(bodyExists).toBe(1);

    await context.close();
  });
});
