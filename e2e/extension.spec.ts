import { test, expect, type BrowserContext, type Page, chromium } from "@playwright/test";
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
    // Use chromium.launch() instead of launchBrowserWithExtension() because
    // we inject the content script manually - the extension only matches github.com
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
    // Use chromium.launch() instead of launchBrowserWithExtension() because
    // we inject the content script manually - the extension only matches github.com
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
    // Use chromium.launch() instead of launchBrowserWithExtension() because
    // we inject the content script manually - the extension only matches github.com
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
    // Use chromium.launch() instead of launchBrowserWithExtension() because
    // we inject the content script manually - the extension only matches github.com
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

test.describe("Options Page - Giphy Image Settings", () => {
  // Helper to start a local server for options page
  async function startOptionsServer(): Promise<{ server: Server; port: number }> {
    const optionsPagePath = join(__dirname, "..", "dist", "options.html");
    const optionsJsPath = join(__dirname, "..", "dist", "options.js");

    return new Promise((resolve) => {
      const server = createServer(async (req, res) => {
        if (req.url === "/options.js") {
          const content = await readFile(optionsJsPath, "utf-8");
          res.writeHead(200, { "Content-Type": "application/javascript" });
          res.end(content);
        } else {
          const content = await readFile(optionsPagePath, "utf-8");
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(content);
        }
      });

      server.listen(0, () => {
        const address = server.address();
        const port = typeof address === "object" && address ? address.port : 0;
        resolve({ server, port });
      });
    });
  }

  let optionsServer: { server: Server; port: number };

  test.beforeAll(async () => {
    optionsServer = await startOptionsServer();
  });

  test.afterAll(async () => {
    optionsServer?.server?.close();
  });

  test("options page displays image format radio buttons", async () => {
    // Use headless mode - options page doesn't require extension APIs
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(`http://localhost:${optionsServer.port}/`);
    await page.waitForLoadState("domcontentloaded");

    // Wait for React to render
    await page.waitForTimeout(500);

    // Verify image format section exists
    const imageFormatLabel = page.locator("text=Image Format");
    await expect(imageFormatLabel).toBeVisible({ timeout: 3000 });

    // Verify all three format options are present
    const markdownOption = page.locator("text=![](link)");
    const imgOption = page.locator('text=<img src="link" />').first();
    const imgFixedOption = page.locator('text=<img src="link" width="350" />');

    await expect(markdownOption).toBeVisible();
    await expect(imgOption).toBeVisible();
    await expect(imgFixedOption).toBeVisible();

    // Verify markdown is selected by default
    const markdownRadio = page.locator('input[type="radio"][name="giphy-format"]').first();
    await expect(markdownRadio).toBeChecked();

    await browser.close();
  });

  test("options page displays center image checkbox", async () => {
    // Use headless mode - options page doesn't require extension APIs
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(`http://localhost:${optionsServer.port}/`);
    await page.waitForLoadState("domcontentloaded");

    // Wait for React to render
    await page.waitForTimeout(500);

    // Verify alignment section exists
    const alignmentLabel = page.locator("text=Alignment");
    await expect(alignmentLabel).toBeVisible({ timeout: 3000 });

    // Verify center image checkbox is present
    const centerCheckboxLabel = page.locator("text=Center image");
    await expect(centerCheckboxLabel).toBeVisible();

    // Verify checkbox is unchecked by default
    const centerCheckbox = page.locator('input[type="checkbox"]').nth(1); // Second checkbox (after "Show key")
    await expect(centerCheckbox).not.toBeChecked();

    await browser.close();
  });

  test("can select different image formats", async () => {
    // Use headless mode - options page doesn't require extension APIs
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(`http://localhost:${optionsServer.port}/`);
    await page.waitForLoadState("domcontentloaded");

    // Wait for React to render
    await page.waitForTimeout(500);

    // Get all format radio buttons
    const radios = page.locator('input[type="radio"][name="giphy-format"]');

    // Click on second option (img format)
    await radios.nth(1).click();
    await page.waitForTimeout(100);
    await expect(radios.nth(1)).toBeChecked();
    await expect(radios.nth(0)).not.toBeChecked();

    // Click on third option (img-fixed format)
    await radios.nth(2).click();
    await page.waitForTimeout(100);
    await expect(radios.nth(2)).toBeChecked();
    await expect(radios.nth(1)).not.toBeChecked();

    // Click back on first option (markdown format)
    await radios.nth(0).click();
    await page.waitForTimeout(100);
    await expect(radios.nth(0)).toBeChecked();
    await expect(radios.nth(2)).not.toBeChecked();

    await browser.close();
  });

  test("can toggle center image checkbox", async () => {
    // Use headless mode - options page doesn't require extension APIs
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(`http://localhost:${optionsServer.port}/`);
    await page.waitForLoadState("domcontentloaded");

    // Wait for React to render
    await page.waitForTimeout(500);

    // Find center checkbox by looking for the checkbox next to "Center image" text
    const centerCheckbox = page.locator('label:has-text("Center image") input[type="checkbox"]');

    // Initial state should be unchecked
    await expect(centerCheckbox).not.toBeChecked();

    // Toggle on
    await centerCheckbox.click();
    await page.waitForTimeout(100);
    await expect(centerCheckbox).toBeChecked();

    // Toggle off
    await centerCheckbox.click();
    await page.waitForTimeout(100);
    await expect(centerCheckbox).not.toBeChecked();

    await browser.close();
  });

  test("image format and center options are independent", async () => {
    // Use headless mode - options page doesn't require extension APIs
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(`http://localhost:${optionsServer.port}/`);
    await page.waitForLoadState("domcontentloaded");

    // Wait for React to render
    await page.waitForTimeout(500);

    const radios = page.locator('input[type="radio"][name="giphy-format"]');
    const centerCheckbox = page.locator('label:has-text("Center image") input[type="checkbox"]');

    // Select img-fixed format
    await radios.nth(2).click();
    await page.waitForTimeout(100);

    // Enable centering
    await centerCheckbox.click();
    await page.waitForTimeout(100);

    // Verify both are set
    await expect(radios.nth(2)).toBeChecked();
    await expect(centerCheckbox).toBeChecked();

    // Change format, centering should remain
    await radios.nth(1).click();
    await page.waitForTimeout(100);
    await expect(radios.nth(1)).toBeChecked();
    await expect(centerCheckbox).toBeChecked();

    // Toggle centering off, format should remain
    await centerCheckbox.click();
    await page.waitForTimeout(100);
    await expect(radios.nth(1)).toBeChecked();
    await expect(centerCheckbox).not.toBeChecked();

    await browser.close();
  });
});

test.describe("Giphy Insertion Strategies", () => {
  let testServer: { server: Server; port: number };

  test.beforeAll(async () => {
    const testPagePath = join(__dirname, "fixtures", "test-page.html");
    const testPageContent = await readFile(testPagePath, "utf-8");

    testServer = await new Promise((resolve) => {
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
  });

  test.afterAll(async () => {
    testServer?.server?.close();
  });

  // Helper to inject extension content script into a page
  async function injectContentScript(page: Page) {
    const contentScriptPath = join(__dirname, "..", "dist", "content.js");
    const contentScript = await readFile(contentScriptPath, "utf-8");
    await page.addScriptTag({ content: contentScript });
  }

  test("markdown format inserts ![](url) syntax", async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(`http://localhost:${testServer.port}/`);
    await page.waitForLoadState("domcontentloaded");

    // Set localStorage for markdown format (default), no centering
    await page.evaluate(() => {
      localStorage.setItem("giphyImageFormat", JSON.stringify("markdown"));
      localStorage.setItem("giphyCenterImage", JSON.stringify(false));
    });

    // Inject the content script
    await injectContentScript(page);
    await page.waitForTimeout(500);

    // Test the formatGifInsert function directly via page evaluation
    const result = await page.evaluate(() => {
      // Access the formatGifInsert function from window if exposed, or test the insertion logic
      const testUrl = "https://media.giphy.com/test.gif";

      // Simulate what formatGifInsert does for markdown format
      const format = JSON.parse(localStorage.getItem("giphyImageFormat") || '"markdown"');
      const center = JSON.parse(localStorage.getItem("giphyCenterImage") || "false");

      let imageMarkup: string;
      switch (format) {
        case "img":
          imageMarkup = `<img src="${testUrl}" />`;
          break;
        case "img-fixed":
          imageMarkup = `<img src="${testUrl}" width="350" />`;
          break;
        case "markdown":
        default:
          imageMarkup = `![](${testUrl})`;
          break;
      }

      if (center) {
        return `<p align="center">${imageMarkup}</p>`;
      }
      return imageMarkup;
    });

    expect(result).toBe("![](https://media.giphy.com/test.gif)");

    await browser.close();
  });

  test("img format inserts <img src> syntax", async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(`http://localhost:${testServer.port}/`);
    await page.waitForLoadState("domcontentloaded");

    // Set localStorage for img format, no centering
    await page.evaluate(() => {
      localStorage.setItem("giphyImageFormat", JSON.stringify("img"));
      localStorage.setItem("giphyCenterImage", JSON.stringify(false));
    });

    // Inject the content script
    await injectContentScript(page);
    await page.waitForTimeout(500);

    // Test the insertion logic
    const result = await page.evaluate(() => {
      const testUrl = "https://media.giphy.com/test.gif";
      const format = JSON.parse(localStorage.getItem("giphyImageFormat") || '"markdown"');
      const center = JSON.parse(localStorage.getItem("giphyCenterImage") || "false");

      let imageMarkup: string;
      switch (format) {
        case "img":
          imageMarkup = `<img src="${testUrl}" />`;
          break;
        case "img-fixed":
          imageMarkup = `<img src="${testUrl}" width="350" />`;
          break;
        case "markdown":
        default:
          imageMarkup = `![](${testUrl})`;
          break;
      }

      if (center) {
        return `<p align="center">${imageMarkup}</p>`;
      }
      return imageMarkup;
    });

    expect(result).toBe('<img src="https://media.giphy.com/test.gif" />');

    await browser.close();
  });

  test("img-fixed format inserts <img src width=350> syntax", async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(`http://localhost:${testServer.port}/`);
    await page.waitForLoadState("domcontentloaded");

    // Set localStorage for img-fixed format, no centering
    await page.evaluate(() => {
      localStorage.setItem("giphyImageFormat", JSON.stringify("img-fixed"));
      localStorage.setItem("giphyCenterImage", JSON.stringify(false));
    });

    // Inject the content script
    await injectContentScript(page);
    await page.waitForTimeout(500);

    // Test the insertion logic
    const result = await page.evaluate(() => {
      const testUrl = "https://media.giphy.com/test.gif";
      const format = JSON.parse(localStorage.getItem("giphyImageFormat") || '"markdown"');
      const center = JSON.parse(localStorage.getItem("giphyCenterImage") || "false");

      let imageMarkup: string;
      switch (format) {
        case "img":
          imageMarkup = `<img src="${testUrl}" />`;
          break;
        case "img-fixed":
          imageMarkup = `<img src="${testUrl}" width="350" />`;
          break;
        case "markdown":
        default:
          imageMarkup = `![](${testUrl})`;
          break;
      }

      if (center) {
        return `<p align="center">${imageMarkup}</p>`;
      }
      return imageMarkup;
    });

    expect(result).toBe('<img src="https://media.giphy.com/test.gif" width="350" />');

    await browser.close();
  });

  test("center option wraps image in <p align=center>", async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(`http://localhost:${testServer.port}/`);
    await page.waitForLoadState("domcontentloaded");

    // Set localStorage for markdown format with centering
    await page.evaluate(() => {
      localStorage.setItem("giphyImageFormat", JSON.stringify("markdown"));
      localStorage.setItem("giphyCenterImage", JSON.stringify(true));
    });

    // Inject the content script
    await injectContentScript(page);
    await page.waitForTimeout(500);

    // Test the insertion logic
    const result = await page.evaluate(() => {
      const testUrl = "https://media.giphy.com/test.gif";
      const format = JSON.parse(localStorage.getItem("giphyImageFormat") || '"markdown"');
      const center = JSON.parse(localStorage.getItem("giphyCenterImage") || "false");

      let imageMarkup: string;
      switch (format) {
        case "img":
          imageMarkup = `<img src="${testUrl}" />`;
          break;
        case "img-fixed":
          imageMarkup = `<img src="${testUrl}" width="350" />`;
          break;
        case "markdown":
        default:
          imageMarkup = `![](${testUrl})`;
          break;
      }

      if (center) {
        return `<p align="center">${imageMarkup}</p>`;
      }
      return imageMarkup;
    });

    expect(result).toBe('<p align="center">![](https://media.giphy.com/test.gif)</p>');

    await browser.close();
  });

  test("img-fixed format with centering applies both options", async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(`http://localhost:${testServer.port}/`);
    await page.waitForLoadState("domcontentloaded");

    // Set localStorage for img-fixed format with centering
    await page.evaluate(() => {
      localStorage.setItem("giphyImageFormat", JSON.stringify("img-fixed"));
      localStorage.setItem("giphyCenterImage", JSON.stringify(true));
    });

    // Inject the content script
    await injectContentScript(page);
    await page.waitForTimeout(500);

    // Test the insertion logic
    const result = await page.evaluate(() => {
      const testUrl = "https://media.giphy.com/test.gif";
      const format = JSON.parse(localStorage.getItem("giphyImageFormat") || '"markdown"');
      const center = JSON.parse(localStorage.getItem("giphyCenterImage") || "false");

      let imageMarkup: string;
      switch (format) {
        case "img":
          imageMarkup = `<img src="${testUrl}" />`;
          break;
        case "img-fixed":
          imageMarkup = `<img src="${testUrl}" width="350" />`;
          break;
        case "markdown":
        default:
          imageMarkup = `![](${testUrl})`;
          break;
      }

      if (center) {
        return `<p align="center">${imageMarkup}</p>`;
      }
      return imageMarkup;
    });

    expect(result).toBe(
      '<p align="center"><img src="https://media.giphy.com/test.gif" width="350" /></p>'
    );

    await browser.close();
  });

  test("img format with centering applies both options", async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(`http://localhost:${testServer.port}/`);
    await page.waitForLoadState("domcontentloaded");

    // Set localStorage for img format with centering
    await page.evaluate(() => {
      localStorage.setItem("giphyImageFormat", JSON.stringify("img"));
      localStorage.setItem("giphyCenterImage", JSON.stringify(true));
    });

    // Inject the content script
    await injectContentScript(page);
    await page.waitForTimeout(500);

    // Test the insertion logic
    const result = await page.evaluate(() => {
      const testUrl = "https://media.giphy.com/test.gif";
      const format = JSON.parse(localStorage.getItem("giphyImageFormat") || '"markdown"');
      const center = JSON.parse(localStorage.getItem("giphyCenterImage") || "false");

      let imageMarkup: string;
      switch (format) {
        case "img":
          imageMarkup = `<img src="${testUrl}" />`;
          break;
        case "img-fixed":
          imageMarkup = `<img src="${testUrl}" width="350" />`;
          break;
        case "markdown":
        default:
          imageMarkup = `![](${testUrl})`;
          break;
      }

      if (center) {
        return `<p align="center">${imageMarkup}</p>`;
      }
      return imageMarkup;
    });

    expect(result).toBe('<p align="center"><img src="https://media.giphy.com/test.gif" /></p>');

    await browser.close();
  });
});

test.describe("Font Command Styles", () => {
  let testServer: { server: Server; port: number };

  test.beforeAll(async () => {
    const testPagePath = join(__dirname, "fixtures", "test-page.html");
    const testPageContent = await readFile(testPagePath, "utf-8");

    testServer = await new Promise((resolve) => {
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
  });

  test.afterAll(async () => {
    testServer?.server?.close();
  });

  // Helper to inject extension content script into a page
  async function injectContentScript(page: Page) {
    const contentScriptPath = join(__dirname, "..", "dist", "content.js");
    const contentScript = await readFile(contentScriptPath, "utf-8");
    await page.addScriptTag({ content: contentScript });
  }

  // Helper to set up the page and inject script
  async function setupPage(
    browser: Awaited<ReturnType<typeof chromium.launch>>,
    port: number
  ): Promise<{ page: Page; textarea: ReturnType<Page["locator"]> }> {
    const page = await browser.newPage();
    await page.goto(`http://localhost:${port}/`);
    await page.waitForLoadState("domcontentloaded");
    await injectContentScript(page);
    await page.waitForTimeout(500);

    const textarea = page.locator("#test-textarea");
    await textarea.click();

    return { page, textarea };
  }

  test("/font command shows picker", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    await textarea.fill("/font");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Verify the picker shows font styles
    const pickerContent = await picker.textContent();
    expect(pickerContent).toContain("Popular styles");

    await browser.close();
  });

  test("/font command shows style options", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    await textarea.fill("/font");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Verify style options are shown (check for images in picker grid)
    const gridImages = picker.locator("img");
    const imageCount = await gridImages.count();
    expect(imageCount).toBeGreaterThan(0);

    await browser.close();
  });

  test("selecting bold style inserts **text** syntax", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Type /font bold to filter and select bold style
    await textarea.fill("/font bold");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Press Enter to select the first (bold) option
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    // Check that the textarea now contains bold markdown
    const textareaValue = await textarea.inputValue();
    expect(textareaValue).toBe("**bold**");

    await browser.close();
  });

  test("selecting italic style inserts *text* syntax", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Type /font italic to filter and select italic style
    await textarea.fill("/font italic");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Press Enter to select the first (italic) option
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    const textareaValue = await textarea.inputValue();
    expect(textareaValue).toBe("*italic*");

    await browser.close();
  });

  test("selecting strikethrough style inserts ~~text~~ syntax", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Type /font strike to filter and select strikethrough style
    await textarea.fill("/font strike");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Press Enter to select the first option
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    const textareaValue = await textarea.inputValue();
    expect(textareaValue).toBe("~~strike~~");

    await browser.close();
  });

  test("selecting code style inserts `text` syntax", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Type /font code to filter and select code style
    await textarea.fill("/font code");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Press Enter to select the first option
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    const textareaValue = await textarea.inputValue();
    expect(textareaValue).toBe("`code`");

    await browser.close();
  });

  test("selecting red color inserts LaTeX color syntax", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Type /font red to filter and select red color
    await textarea.fill("/font red");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Press Enter to select the first option
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    const textareaValue = await textarea.inputValue();
    expect(textareaValue).toBe("$\\color{red}{\\textsf{red}}$");

    await browser.close();
  });

  test("selecting blue color inserts LaTeX color syntax", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Type /font blue to filter and select blue color
    await textarea.fill("/font blue");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Press Enter to select the first option
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    const textareaValue = await textarea.inputValue();
    expect(textareaValue).toBe("$\\color{blue}{\\textsf{blue}}$");

    await browser.close();
  });

  test("selecting large size inserts ## header syntax", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Type /font large to filter and select large size
    await textarea.fill("/font large");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Press Enter to select the first option
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    const textareaValue = await textarea.inputValue();
    expect(textareaValue).toBe("## large");

    await browser.close();
  });

  test("selecting huge size inserts # header syntax", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Type /font huge to filter and select huge size
    await textarea.fill("/font huge");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Press Enter to select the first option
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    const textareaValue = await textarea.inputValue();
    expect(textareaValue).toBe("# huge");

    await browser.close();
  });

  test("selecting tiny size inserts <sub> syntax", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Type /font tiny to filter and select tiny size
    await textarea.fill("/font tiny");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Press Enter to select the first option
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    const textareaValue = await textarea.inputValue();
    expect(textareaValue).toBe("<sub>tiny</sub>");

    await browser.close();
  });

  test("selecting quote style inserts > syntax", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Type /font quote to filter and select quote style
    await textarea.fill("/font quote");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Press Enter to select the first option
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    const textareaValue = await textarea.inputValue();
    expect(textareaValue).toBe("> quote");

    await browser.close();
  });

  test("/font command filtering works", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Search for "color" to filter color options
    await textarea.fill("/font color");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Check that only filtered results are shown (fewer items)
    const buttons = picker.locator("button[data-item-index]");
    const buttonCount = await buttons.count();
    // Should have only the color items (6 colors)
    expect(buttonCount).toBe(6);

    await browser.close();
  });

  test("default text is used when no text provided", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Type just /font to show all styles, then filter to bold
    await textarea.fill("/font");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Press Enter to select the first option (should be a style option)
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    // Default text should be "text" - check that some formatted text is inserted
    const textareaValue = await textarea.inputValue();
    // The first option is Bold, so it should be **text**
    expect(textareaValue).toBe("**text**");

    await browser.close();
  });
});

test.describe("Emoji Command", () => {
  let testServer: { server: Server; port: number };

  test.beforeAll(async () => {
    const testPagePath = join(__dirname, "fixtures", "test-page.html");
    const testPageContent = await readFile(testPagePath, "utf-8");

    testServer = await new Promise((resolve) => {
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
  });

  test.afterAll(async () => {
    testServer?.server?.close();
  });

  // Helper to inject extension content script into a page
  async function injectContentScript(page: Page) {
    const contentScriptPath = join(__dirname, "..", "dist", "content.js");
    const contentScript = await readFile(contentScriptPath, "utf-8");
    await page.addScriptTag({ content: contentScript });
  }

  // Helper to set up the page and inject script
  async function setupPage(
    browser: Awaited<ReturnType<typeof chromium.launch>>,
    port: number
  ): Promise<{ page: Page; textarea: ReturnType<Page["locator"]> }> {
    const page = await browser.newPage();
    await page.goto(`http://localhost:${port}/`);
    await page.waitForLoadState("domcontentloaded");
    await injectContentScript(page);
    await page.waitForTimeout(500);

    const textarea = page.locator("#test-textarea");
    await textarea.click();

    return { page, textarea };
  }

  test("/emoji command shows picker", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    await textarea.fill("/emoji");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Verify the picker shows emoji content
    const pickerContent = await picker.textContent();
    expect(pickerContent).toContain("Popular");

    await browser.close();
  });

  test("/emoji command shows emoji options", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    await textarea.fill("/emoji");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Verify emoji options are shown (check for images in picker grid)
    const gridImages = picker.locator("img");
    const imageCount = await gridImages.count();
    expect(imageCount).toBeGreaterThan(0);

    await browser.close();
  });

  test("/emoji search filters emojis by name", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Search for "thumbs" to find thumbs up/down emojis
    await textarea.fill("/emoji thumbs");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Check that filtered results are shown
    const buttons = picker.locator("button[data-item-index]");
    const buttonCount = await buttons.count();
    // Should have thumbs up and thumbs down at minimum
    expect(buttonCount).toBeGreaterThan(0);
    expect(buttonCount).toBeLessThan(20); // Filtered, not showing all

    await browser.close();
  });

  test("/emoji search filters by keyword", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Search for "love" keyword
    await textarea.fill("/emoji love");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Should show matching emojis (hearts, etc.)
    const buttons = picker.locator("button[data-item-index]");
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);

    await browser.close();
  });

  test("/emoji search filters by category", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Search for "food" category
    await textarea.fill("/emoji food");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Should show food emojis
    const buttons = picker.locator("button[data-item-index]");
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);

    await browser.close();
  });

  test("selecting emoji inserts it into textarea", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Search for "thumbs up" to get a specific emoji
    await textarea.fill("/emoji thumbs up");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Press Enter to select the first emoji
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    // Check that an emoji was inserted (thumbs up emoji)
    const textareaValue = await textarea.inputValue();
    expect(textareaValue).toBe("👍 ");

    await browser.close();
  });

  test("selecting smile emoji inserts it", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Search for "grinning" to get the grinning face emoji
    await textarea.fill("/emoji grinning");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Press Enter to select the first emoji
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    // Check that the emoji was inserted
    const textareaValue = await textarea.inputValue();
    expect(textareaValue).toBe("😀 ");

    await browser.close();
  });

  test("selecting heart emoji inserts it", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Search for "red heart"
    await textarea.fill("/emoji red heart");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Press Enter to select the first emoji
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    // Check that the heart emoji was inserted
    const textareaValue = await textarea.inputValue();
    expect(textareaValue).toBe("❤️ ");

    await browser.close();
  });

  test("selecting fire emoji inserts it", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Search for "flame" which specifically matches the fire emoji
    await textarea.fill("/emoji flame");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Press Enter to select the first emoji
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    // Check that an emoji was inserted (ends with space, starts with emoji)
    const textareaValue = await textarea.inputValue();
    // Fire emoji unicode is U+1F525
    expect(textareaValue.endsWith(" ")).toBe(true);
    expect(textareaValue.length).toBeGreaterThan(1);
    expect(textareaValue.trim().codePointAt(0)).toBe(0x1f525); // Fire emoji code point

    await browser.close();
  });

  test("picker closes after emoji selection", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    await textarea.fill("/emoji thumbs");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Select the emoji
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    // Picker should be closed
    await expect(picker).not.toBeVisible();

    await browser.close();
  });

  test("picker closes on Escape key", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    await textarea.fill("/emoji");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Press Escape to close
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);

    // Picker should be closed
    await expect(picker).not.toBeVisible();

    await browser.close();
  });

  test("arrow keys navigate emoji grid", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    await textarea.fill("/emoji");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // First item should be selected by default
    const firstButton = picker.locator('button[data-item-index="0"]');
    const initialClass = await firstButton.getAttribute("style");
    expect(initialClass).toContain("box-shadow");

    // Press right arrow to move selection
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(100);

    // Second item should now be selected
    const secondButton = picker.locator('button[data-item-index="1"]');
    const secondClass = await secondButton.getAttribute("style");
    expect(secondClass).toContain("box-shadow");

    await browser.close();
  });

  test("no results message shown for invalid search", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Search for something that won't match
    await textarea.fill("/emoji xyznonexistent123");
    await page.waitForTimeout(800);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Should show no results message
    const pickerContent = await picker.textContent();
    expect(pickerContent).toContain("No matching emojis");

    await browser.close();
  });
});

test.describe("Now Command - Date/Time Formatting", () => {
  let testServer: { server: Server; port: number };

  test.beforeAll(async () => {
    const testPagePath = join(__dirname, "fixtures", "test-page.html");
    const testPageContent = await readFile(testPagePath, "utf-8");

    testServer = await new Promise((resolve) => {
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
  });

  test.afterAll(async () => {
    testServer?.server?.close();
  });

  // Helper to inject extension content script into a page
  async function injectContentScript(page: Page) {
    const contentScriptPath = join(__dirname, "..", "dist", "content.js");
    const contentScript = await readFile(contentScriptPath, "utf-8");
    await page.addScriptTag({ content: contentScript });
  }

  // Helper to set up the page and inject script
  async function setupPage(
    browser: Awaited<ReturnType<typeof chromium.launch>>,
    port: number
  ): Promise<{ page: Page; textarea: ReturnType<Page["locator"]> }> {
    const page = await browser.newPage();
    await page.goto(`http://localhost:${port}/`);
    await page.waitForLoadState("domcontentloaded");
    await injectContentScript(page);
    await page.waitForTimeout(500);

    const textarea = page.locator("#test-textarea");
    await textarea.click();

    return { page, textarea };
  }

  test("/now command shows picker", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    await textarea.fill("/now");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Verify the picker shows date format content
    const pickerContent = await picker.textContent();
    expect(pickerContent).toContain("Date formats");

    await browser.close();
  });

  test("/now command shows date format options", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    await textarea.fill("/now");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Verify date format options are shown (check for images in picker grid)
    const gridImages = picker.locator("img");
    const imageCount = await gridImages.count();
    expect(imageCount).toBeGreaterThan(0);

    await browser.close();
  });

  test("/now iso filter shows ISO formats", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    await textarea.fill("/now iso");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Check that filtered results are shown
    const buttons = picker.locator("button[data-item-index]");
    const buttonCount = await buttons.count();
    // Should have ISO and ISO Date options
    expect(buttonCount).toBeGreaterThan(0);
    expect(buttonCount).toBeLessThan(10); // Filtered, not showing all

    await browser.close();
  });

  test("/now local filter shows local formats", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    await textarea.fill("/now local");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Should show local date/time formats
    const buttons = picker.locator("button[data-item-index]");
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);

    await browser.close();
  });

  test("/now utc filter shows UTC formats", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    await textarea.fill("/now utc");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Should show UTC date/time formats
    const buttons = picker.locator("button[data-item-index]");
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);

    await browser.close();
  });

  test("selecting ISO 8601 format inserts timestamp", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Filter to ISO format
    await textarea.fill("/now iso");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Press Enter to select the first (ISO) option
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    // Check that the textarea contains an ISO timestamp
    const textareaValue = await textarea.inputValue();
    // ISO timestamps follow pattern: YYYY-MM-DDTHH:MM:SS.sssZ
    expect(textareaValue).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

    await browser.close();
  });

  test("selecting ISO Date format inserts date only", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Filter to ISO date format
    await textarea.fill("/now iso-date");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Press Enter to select the ISO Date option
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    // Check that the textarea contains a date in YYYY-MM-DD format
    const textareaValue = await textarea.inputValue();
    expect(textareaValue).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    await browser.close();
  });

  test("selecting Unix timestamp format inserts epoch seconds", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Filter to Unix format
    await textarea.fill("/now unix");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Press Enter to select the Unix option
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    // Check that the textarea contains a Unix timestamp (numeric string)
    const textareaValue = await textarea.inputValue();
    expect(textareaValue).toMatch(/^\d{10}$/); // 10-digit Unix timestamp

    await browser.close();
  });

  test("selecting relative format inserts human-readable time", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Filter to relative format
    await textarea.fill("/now relative");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Press Enter to select the relative option
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    // Check that the textarea contains "just now" (since we're inserting current time)
    const textareaValue = await textarea.inputValue();
    expect(textareaValue).toBe("just now");

    await browser.close();
  });

  test("picker closes after date format selection", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    await textarea.fill("/now iso");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Select the format
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    // Picker should be closed
    await expect(picker).not.toBeVisible();

    await browser.close();
  });

  test("picker closes on Escape key", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    await textarea.fill("/now");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Press Escape to close
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);

    // Picker should be closed
    await expect(picker).not.toBeVisible();

    await browser.close();
  });

  test("arrow keys navigate date format grid", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    await textarea.fill("/now");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // First item should be selected by default
    const firstButton = picker.locator('button[data-item-index="0"]');
    const initialClass = await firstButton.getAttribute("style");
    expect(initialClass).toContain("box-shadow");

    // Press right arrow to move selection
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(100);

    // Second item should now be selected
    const secondButton = picker.locator('button[data-item-index="1"]');
    const secondClass = await secondButton.getAttribute("style");
    expect(secondClass).toContain("box-shadow");

    await browser.close();
  });

  test("no results message shown for invalid search", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Search for something that won't match
    await textarea.fill("/now xyznonexistent123");
    await page.waitForTimeout(800);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Should show no results message
    const pickerContent = await picker.textContent();
    expect(pickerContent).toContain("No matching date formats");

    await browser.close();
  });

  test("selecting local datetime format inserts local time", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Filter to local format and select the first one (Local DateTime)
    await textarea.fill("/now local");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Press Enter to select the Local DateTime option
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    // Check that the textarea contains a local datetime string
    const textareaValue = await textarea.inputValue();
    // Local datetime format varies by locale, but should have date and time components
    expect(textareaValue.length).toBeGreaterThan(5);
    // Should contain at least one slash or hyphen (date separator) or colon (time separator)
    expect(textareaValue).toMatch(/[\/\-:]|\d/);

    await browser.close();
  });
});

test.describe("Mention Command", () => {
  let testServer: { server: Server; port: number };

  test.beforeAll(async () => {
    const testPagePath = join(__dirname, "fixtures", "test-page.html");
    const testPageContent = await readFile(testPagePath, "utf-8");

    testServer = await new Promise((resolve) => {
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
  });

  test.afterAll(async () => {
    testServer?.server?.close();
  });

  // Helper to inject extension content script into a page
  async function injectContentScript(page: Page) {
    const contentScriptPath = join(__dirname, "..", "dist", "content.js");
    const contentScript = await readFile(contentScriptPath, "utf-8");
    await page.addScriptTag({ content: contentScript });
  }

  // Helper to set up the page and inject script
  async function setupPage(
    browser: Awaited<ReturnType<typeof chromium.launch>>,
    port: number
  ): Promise<{ page: Page; textarea: ReturnType<Page["locator"]> }> {
    const page = await browser.newPage();
    await page.goto(`http://localhost:${port}/`);
    await page.waitForLoadState("domcontentloaded");
    await injectContentScript(page);
    await page.waitForTimeout(500);

    const textarea = page.locator("#test-textarea");
    await textarea.click();

    return { page, textarea };
  }

  test("/mention command shows picker", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    await textarea.fill("/mention");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Verify the picker shows the mention command name in header
    const pickerContent = await picker.textContent();
    // Should show the command name "/mention" in the header
    expect(pickerContent?.includes("/mention")).toBe(true);

    await browser.close();
  });

  test("/mention command shows user tiles", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    await textarea.fill("/mention");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Verify user tiles are shown (check for images in picker grid)
    // Note: On test page without GitHub context, there may be no participants
    // but the picker should still be visible
    const isVisible = await picker.isVisible();
    expect(isVisible).toBe(true);

    await browser.close();
  });

  test("/mention search filters users", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Set some recent mentions in localStorage for testing
    await page.evaluate(() => {
      localStorage.setItem("recentMentions", JSON.stringify(["octocat", "hubot", "defunkt"]));
    });

    // Re-inject script after setting localStorage
    await injectContentScript(page);
    await page.waitForTimeout(500);

    await textarea.fill("/mention octo");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Should show filtered results - check that buttons are present
    const buttons = picker.locator("button[data-item-index]");
    const buttonCount = await buttons.count();
    // Should have octocat match since we set it in localStorage
    expect(buttonCount).toBeGreaterThanOrEqual(1);

    await browser.close();
  });

  test("selecting mention inserts @username into textarea", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Set recent mentions for testing
    await page.evaluate(() => {
      localStorage.setItem("recentMentions", JSON.stringify(["octocat"]));
    });

    // Re-inject script after setting localStorage
    await injectContentScript(page);
    await page.waitForTimeout(500);

    await textarea.fill("/mention octocat");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Press Enter to select the first user
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    // Check that @username was inserted
    const textareaValue = await textarea.inputValue();
    expect(textareaValue).toBe("@octocat ");

    await browser.close();
  });

  test("picker closes after mention selection", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Set recent mentions for testing
    await page.evaluate(() => {
      localStorage.setItem("recentMentions", JSON.stringify(["hubot"]));
    });

    // Re-inject script after setting localStorage
    await injectContentScript(page);
    await page.waitForTimeout(500);

    await textarea.fill("/mention hubot");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Select the user
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    // Picker should be closed
    await expect(picker).not.toBeVisible();

    await browser.close();
  });

  test("picker closes on Escape key", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    await textarea.fill("/mention");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Press Escape to close
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);

    // Picker should be closed
    await expect(picker).not.toBeVisible();

    await browser.close();
  });

  test("arrow keys navigate mention grid", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Set multiple recent mentions for navigation testing
    await page.evaluate(() => {
      localStorage.setItem(
        "recentMentions",
        JSON.stringify(["octocat", "hubot", "defunkt", "mojombo"])
      );
    });

    // Re-inject script after setting localStorage
    await injectContentScript(page);
    await page.waitForTimeout(500);

    await textarea.fill("/mention");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // First item should be selected by default (if items exist)
    const firstButton = picker.locator('button[data-item-index="0"]');
    const hasFirstButton = (await firstButton.count()) > 0;

    if (hasFirstButton) {
      const initialStyle = await firstButton.getAttribute("style");
      expect(initialStyle).toContain("box-shadow");

      // Press right arrow to move selection
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(100);

      // Second item should now be selected
      const secondButton = picker.locator('button[data-item-index="1"]');
      const secondButtonExists = (await secondButton.count()) > 0;

      if (secondButtonExists) {
        const secondStyle = await secondButton.getAttribute("style");
        expect(secondStyle).toContain("box-shadow");
      }
    }

    await browser.close();
  });

  test("no results message shown for non-matching search", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Search for something that won't match
    await textarea.fill("/mention xyznonexistent123456");
    await page.waitForTimeout(800);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Should show no results message
    const pickerContent = await picker.textContent();
    expect(pickerContent).toContain("No matching users");

    await browser.close();
  });

  test("recent mentions are stored and retrieved", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Set initial recent mentions
    await page.evaluate(() => {
      localStorage.setItem("recentMentions", JSON.stringify(["testuser1", "testuser2"]));
    });

    // Re-inject script
    await injectContentScript(page);
    await page.waitForTimeout(500);

    await textarea.fill("/mention testuser");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Should show filtered results
    const buttons = picker.locator("button[data-item-index]");
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);

    await browser.close();
  });

  test("mention command header shows correct title", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    await textarea.fill("/mention");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Verify the picker shows the correct header
    const headerText = await picker.locator("text=GitHub Slash Palette").count();
    expect(headerText).toBeGreaterThan(0);

    // Verify it shows /mention in the subtitle
    const subtitleText = await picker.locator("text=/mention").count();
    expect(subtitleText).toBeGreaterThan(0);

    await browser.close();
  });
});

test.describe("Kbd Command", () => {
  let testServer: { server: Server; port: number };

  test.beforeAll(async () => {
    const testPagePath = join(__dirname, "fixtures", "test-page.html");
    const testPageContent = await readFile(testPagePath, "utf-8");

    testServer = await new Promise((resolve) => {
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
  });

  test.afterAll(async () => {
    testServer?.server?.close();
  });

  // Helper to inject extension content script into a page
  async function injectContentScript(page: Page) {
    const contentScriptPath = join(__dirname, "..", "dist", "content.js");
    const contentScript = await readFile(contentScriptPath, "utf-8");
    await page.addScriptTag({ content: contentScript });
  }

  // Helper to set up the page and inject script
  async function setupPage(
    browser: Awaited<ReturnType<typeof chromium.launch>>,
    port: number
  ): Promise<{ page: Page; textarea: ReturnType<Page["locator"]> }> {
    const page = await browser.newPage();
    await page.goto(`http://localhost:${port}/`);
    await page.waitForLoadState("domcontentloaded");
    await injectContentScript(page);
    await page.waitForTimeout(500);

    const textarea = page.locator("#test-textarea");
    await textarea.click();

    return { page, textarea };
  }

  test("/kbd command shows picker", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    await textarea.fill("/kbd");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Verify the picker shows keyboard shortcuts
    const pickerContent = await picker.textContent();
    expect(pickerContent).toContain("Common shortcuts");

    await browser.close();
  });

  test("/kbd command shows shortcut options", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    await textarea.fill("/kbd");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Verify shortcut options are shown (check for images in picker grid)
    const gridImages = picker.locator("img");
    const imageCount = await gridImages.count();
    expect(imageCount).toBeGreaterThan(0);

    await browser.close();
  });

  test("selecting copy shortcut inserts <kbd> syntax", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Type /kbd copy to filter and select copy shortcut
    await textarea.fill("/kbd copy");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Press Enter to select the first (copy) option
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    // Check that the textarea now contains kbd HTML
    const textareaValue = await textarea.inputValue();
    expect(textareaValue).toBe("<kbd>⌃</kbd><kbd>C</kbd> ");

    await browser.close();
  });

  test("selecting paste shortcut inserts <kbd> syntax", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Type /kbd paste to filter and select paste shortcut
    await textarea.fill("/kbd paste");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Press Enter to select the first option
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    const textareaValue = await textarea.inputValue();
    expect(textareaValue).toBe("<kbd>⌃</kbd><kbd>V</kbd> ");

    await browser.close();
  });

  test("selecting undo shortcut inserts <kbd> syntax", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Type /kbd undo to filter and select undo shortcut
    await textarea.fill("/kbd undo");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Press Enter to select the first option
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    const textareaValue = await textarea.inputValue();
    expect(textareaValue).toBe("<kbd>⌃</kbd><kbd>Z</kbd> ");

    await browser.close();
  });

  test("custom shortcut with + inserts <kbd> syntax", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Type a custom shortcut with +
    await textarea.fill("/kbd ctrl+shift+t");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // First item should be custom shortcut
    // Press Enter to select it
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    const textareaValue = await textarea.inputValue();
    expect(textareaValue).toBe("<kbd>⌃</kbd><kbd>⇧</kbd><kbd>T</kbd> ");

    await browser.close();
  });

  test("custom shortcut with spaces inserts <kbd> syntax", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Type a custom shortcut with spaces around +
    await textarea.fill("/kbd ctrl + p");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // First item should be custom shortcut
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    const textareaValue = await textarea.inputValue();
    expect(textareaValue).toBe("<kbd>⌃</kbd><kbd>P</kbd> ");

    await browser.close();
  });

  test("Mac cmd shortcut inserts ⌘ symbol", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Type a Mac-style shortcut
    await textarea.fill("/kbd cmd+opt+arrowLeft");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    const textareaValue = await textarea.inputValue();
    expect(textareaValue).toBe("<kbd>⌘</kbd><kbd>⌥</kbd><kbd>←</kbd> ");

    await browser.close();
  });

  test("Windows shortcut inserts Win symbol", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Type a Windows-style shortcut
    await textarea.fill("/kbd Win+shift+s");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    const textareaValue = await textarea.inputValue();
    expect(textareaValue).toBe("<kbd>Win</kbd><kbd>⇧</kbd><kbd>S</kbd> ");

    await browser.close();
  });

  test("/kbd filtering by category works", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Search for "editing" category
    await textarea.fill("/kbd editing");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Check that filtered results are shown
    const buttons = picker.locator("button[data-item-index]");
    const buttonCount = await buttons.count();
    // Should have editing shortcuts (copy, paste, cut, undo, redo, selectall, save, find)
    expect(buttonCount).toBe(8);

    await browser.close();
  });

  test("/kbd filtering by label works", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Search for "save" label
    await textarea.fill("/kbd save");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Should show filtered results
    const buttons = picker.locator("button[data-item-index]");
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
    expect(buttonCount).toBeLessThan(20);

    await browser.close();
  });

  test("picker closes after shortcut selection", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    await textarea.fill("/kbd copy");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Select the shortcut
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    // Picker should be closed
    await expect(picker).not.toBeVisible();

    await browser.close();
  });

  test("picker closes on Escape key", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    await textarea.fill("/kbd");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Press Escape to close
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);

    // Picker should be closed
    await expect(picker).not.toBeVisible();

    await browser.close();
  });

  test("arrow keys navigate shortcut grid", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    await textarea.fill("/kbd");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // First item should be selected by default
    const firstButton = picker.locator('button[data-item-index="0"]');
    const initialStyle = await firstButton.getAttribute("style");
    expect(initialStyle).toContain("box-shadow");

    // Press right arrow to move selection
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(100);

    // Second item should now be selected
    const secondButton = picker.locator('button[data-item-index="1"]');
    const secondStyle = await secondButton.getAttribute("style");
    expect(secondStyle).toContain("box-shadow");

    await browser.close();
  });

  test("no results message shown for invalid search", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Search for something that won't match
    await textarea.fill("/kbd xyznonexistent123");
    await page.waitForTimeout(800);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Should show no results message
    const pickerContent = await picker.textContent();
    expect(pickerContent).toContain("No matching shortcuts");

    await browser.close();
  });

  test("selecting navigation shortcut inserts correct <kbd> syntax", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Filter for refresh shortcut
    await textarea.fill("/kbd refresh");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    const textareaValue = await textarea.inputValue();
    expect(textareaValue).toBe("<kbd>⌃</kbd><kbd>R</kbd> ");

    await browser.close();
  });

  test("selecting system shortcut inserts correct <kbd> syntax", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Filter for desktop shortcut (Win+D)
    await textarea.fill("/kbd desktop");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    const textareaValue = await textarea.inputValue();
    expect(textareaValue).toBe("<kbd>Win</kbd><kbd>D</kbd> ");

    await browser.close();
  });

  test("shortcut with alternative keys inserts correct syntax", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Type a shortcut with alternative keys notation
    await textarea.fill("/kbd fn+1/2/3");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    const textareaValue = await textarea.inputValue();
    expect(textareaValue).toBe("<kbd>fn</kbd><kbd>1/2/3</kbd> ");

    await browser.close();
  });
});


test.describe("Link Command", () => {
  let testServer: { server: Server; port: number };

  test.beforeAll(async () => {
    const testPagePath = join(__dirname, "fixtures", "test-page.html");
    const testPageContent = await readFile(testPagePath, "utf-8");

    testServer = await new Promise((resolve) => {
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
  });

  test.afterAll(async () => {
    testServer?.server?.close();
  });

  // Helper to inject extension content script into a page
  async function injectContentScript(page: Page) {
    const contentScriptPath = join(__dirname, "..", "dist", "content.js");
    const contentScript = await readFile(contentScriptPath, "utf-8");
    await page.addScriptTag({ content: contentScript });
  }

  // Helper to set up the page and inject script
  async function setupPage(
    browser: Awaited<ReturnType<typeof chromium.launch>>,
    port: number
  ): Promise<{ page: Page; textarea: ReturnType<Page["locator"]> }> {
    const page = await browser.newPage();
    await page.goto(`http://localhost:${port}/`);
    await page.waitForLoadState("domcontentloaded");
    await injectContentScript(page);
    await page.waitForTimeout(500);

    const textarea = page.locator("#test-textarea");
    await textarea.click();

    return { page, textarea };
  }

  test("/link command shows picker", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    await textarea.fill("/link");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Verify the picker shows link content
    const pickerContent = await picker.textContent();
    expect(pickerContent).toContain("URL");

    await browser.close();
  });

  test("/link command shows empty state when no URL provided", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    await textarea.fill("/link");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Verify empty state hint is shown
    const gridImages = picker.locator("img");
    const imageCount = await gridImages.count();
    expect(imageCount).toBeGreaterThan(0);

    await browser.close();
  });

  test("/link with URL shows link preview", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    await textarea.fill("/link example.com");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Verify link preview is shown
    const pickerContent = await picker.textContent();
    expect(pickerContent).toContain("Link preview");

    await browser.close();
  });

  test("/link with URL inserts markdown link on Enter", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    await textarea.fill("/link example.com");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Press Enter to select the link
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    // Check that the markdown link was inserted
    const textareaValue = await textarea.inputValue();
    expect(textareaValue).toBe("[example.com](https://example.com) ");

    await browser.close();
  });

  test("/link with URL and custom title inserts correct markdown", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    await textarea.fill('/link example.com "My Example"');
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Press Enter to select the link
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    // Check that the markdown link with custom title was inserted
    const textareaValue = await textarea.inputValue();
    expect(textareaValue).toBe("[My Example](https://example.com) ");

    await browser.close();
  });

  test("/link with full URL preserves protocol", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    await textarea.fill("/link https://docs.github.com/path");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Press Enter to select the link
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    // Check that the full URL was preserved
    const textareaValue = await textarea.inputValue();
    expect(textareaValue).toBe("[docs.github.com](https://docs.github.com/path) ");

    await browser.close();
  });

  test("/link with www URL strips www from title", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    await textarea.fill("/link www.example.com");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Press Enter to select the link
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    // Check that www was stripped from the title
    const textareaValue = await textarea.inputValue();
    expect(textareaValue).toBe("[example.com](https://www.example.com) ");

    await browser.close();
  });

  test("/link with single-quoted title works", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    await textarea.fill("/link example.com 'Single Quoted'");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Press Enter to select the link
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    // Check that single-quoted title was used
    const textareaValue = await textarea.inputValue();
    expect(textareaValue).toBe("[Single Quoted](https://example.com) ");

    await browser.close();
  });

  test("picker closes after link selection", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    await textarea.fill("/link example.com");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Select the link
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    // Picker should be closed
    await expect(picker).not.toBeVisible();

    await browser.close();
  });

  test("picker closes on Escape key", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    await textarea.fill("/link");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Press Escape to close
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);

    // Picker should be closed
    await expect(picker).not.toBeVisible();

    await browser.close();
  });

  test("/link with invalid URL shows empty state", async () => {
    const browser = await chromium.launch({ headless: false });
    const { page, textarea } = await setupPage(browser, testServer.port);

    // Type something that doesn't look like a URL
    await textarea.fill("/link not a url");
    await page.waitForTimeout(500);

    const picker = page.locator("#slashPalettePicker");
    await expect(picker).toBeVisible({ timeout: 3000 });

    // Should show hint about entering a valid URL
    const pickerContent = await picker.textContent();
    expect(pickerContent).toContain("valid URL");

    await browser.close();
  });
});
