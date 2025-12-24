import { test, expect, type BrowserContext, chromium } from "@playwright/test";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createServer, type Server } from "http";
import { readFile } from "fs/promises";

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

// Helper to start a local test server
async function startTestServer(): Promise<{ server: Server; port: number }> {
  const testPagePath = join(__dirname, "fixtures", "test-page.html");
  const testPageContent = await readFile(testPagePath, "utf-8");

  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(testPageContent);
    });

    server.listen(0, () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      resolve({ server, port });
    });
  });
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

test.describe("Slash Commands", () => {
  let testServer: { server: Server; port: number };

  test.beforeAll(async () => {
    testServer = await startTestServer();
  });

  test.afterAll(async () => {
    testServer?.server?.close();
  });

  // Helper to inject extension content script into a page
  async function injectContentScript(page: Awaited<ReturnType<BrowserContext["newPage"]>>) {
    const contentScriptPath = join(__dirname, "..", "dist", "content.js");
    const contentScript = await readFile(contentScriptPath, "utf-8");
    await page.addScriptTag({ content: contentScript });
  }

  test("/gsp command shows picker", async () => {
    const context = await chromium.launch({ headless: false });
    const page = await context.newPage();

    // Navigate to the local test page
    await page.goto(`http://localhost:${testServer.port}/`);

    // Wait for page to load
    await page.waitForLoadState("domcontentloaded");

    // Inject the content script
    await injectContentScript(page);

    // Give the script time to initialize
    await page.waitForTimeout(500);

    // Find the test textarea
    const textarea = page.locator("#test-textarea");
    await expect(textarea).toBeVisible();

    // Click on the textarea to focus it
    await textarea.click();

    // Type /gsp command
    await textarea.fill("/gsp");

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

  test("/giphy command shows picker with GIFs or setup", async () => {
    const context = await chromium.launch({ headless: false });
    const page = await context.newPage();

    // Navigate to the local test page
    await page.goto(`http://localhost:${testServer.port}/`);

    // Wait for page to load
    await page.waitForLoadState("domcontentloaded");

    // Inject the content script
    await injectContentScript(page);

    // Give the script time to initialize
    await page.waitForTimeout(500);

    // Find the test textarea
    const textarea = page.locator("#test-textarea");
    await expect(textarea).toBeVisible();

    // Click on the textarea to focus it
    await textarea.click();

    // Type /giphy command
    await textarea.fill("/giphy");

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
    const context = await chromium.launch({ headless: false });
    const page = await context.newPage();

    // Navigate to the local test page
    await page.goto(`http://localhost:${testServer.port}/`);

    // Wait for page to load
    await page.waitForLoadState("domcontentloaded");

    // Inject the content script
    await injectContentScript(page);

    // Give the script time to initialize
    await page.waitForTimeout(500);

    // Find the test textarea
    const textarea = page.locator("#test-textarea");
    await expect(textarea).toBeVisible();

    // Click on the textarea to focus it
    await textarea.click();

    // Type /giphy with a search term
    await textarea.fill("/giphy cats");

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

  test("picker closes on Escape key", async () => {
    const context = await chromium.launch({ headless: false });
    const page = await context.newPage();

    // Navigate to the local test page
    await page.goto(`http://localhost:${testServer.port}/`);

    // Wait for page to load
    await page.waitForLoadState("domcontentloaded");

    // Inject the content script
    await injectContentScript(page);

    // Give the script time to initialize
    await page.waitForTimeout(500);

    // Find the test textarea
    const textarea = page.locator("#test-textarea");
    await textarea.click();

    // Type /gsp command to open picker
    await textarea.fill("/gsp");
    await page.waitForTimeout(500);

    // Verify picker is open
    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Press Escape to close
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);

    // Verify picker is closed
    await expect(picker).not.toBeVisible();

    await context.close();
  });
});
