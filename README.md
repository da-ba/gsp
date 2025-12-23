# GitHub Slash Palette

Slash commands for GitHub markdown fields. Includes `/giphy` GIF search and insert.

## Latest Release In Chrome Web Store

[GitHub Slash Palette](https://chromewebstore.google.com/detail/kkcajoojbaidfdnjecjnbeaheepknkpf?utm_source=item-share-cb)

---

## Features

- Adds slash command palette to GitHub markdown textareas
- `/giphy` to search and insert GIFs
- Easily extensible with new commands

---

## Available Commands

See [docs/commands/README.md](docs/commands/README.md) for a full list and usage details.

---

## Screenshots

![Example](src/assets/example.png)

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- npm (comes with Node.js)

### Setup

```bash
npm install
npm run build
```

### Local Installation

1. Build: `npm install && npm run build`
2. Open `chrome://extensions`
3. Enable Developer mode
4. Click **Load unpacked**
5. Select the `dist` folder

---

## Usage

1. Go to GitHub
2. Open an issue or PR comment field
3. Type `/giphy cats` (or `/gsp` for command list)
4. Use arrow keys to navigate
5. Press Enter to insert
6. Press Esc to close

---

## Development

### Watch Mode (HMR)

For development with hot module replacement:

```bash
npm run dev
```

This starts Vite in watch mode. Reload the extension in Chrome to see changes.

### Bundle Analysis

To analyze bundle sizes:

```bash
npm run analyze
```

This generates a `stats.html` file with interactive bundle visualization.

### End-to-End Tests

Run Playwright E2E tests:

```bash
npm run test:e2e
```

---

## Project Structure

```
src/
├── api/                # API clients (e.g., giphy.ts)
├── assets/             # Static assets (icons, images)
├── content/            # Content scripts
│   ├── commands/       # Slash command implementations
│   │   ├── giphy.ts
│   │   ├── gsp.ts
│   │   ├── index.ts
│   │   ├── registry.ts
│   │   └── registry.test.ts
│   ├── picker/         # Picker UI
│   │   ├── picker.ts
│   │   ├── state.ts
│   │   └── styles.ts
│   ├── index.ts        # Content entry
│   └── types.ts
├── utils/              # Shared utilities
│   ├── dom.ts
│   ├── dom.test.ts
│   ├── math.ts
│   ├── math.test.ts
│   ├── storage.ts
│   ├── storage.test.ts
│   └── theme.ts
dist/                   # Build output (load in Chrome)
docs/                   # Documentation
│   └── commands/       # Per-command docs
│       ├── README.md
│       ├── giphy/README.md
│       └── gsp/README.md
e2e/                    # End-to-end tests (Playwright)
scripts/                # Build scripts
│   └── build.ts
PRIVACY.md              # Privacy policy
package.json            # Project metadata & scripts
tsconfig.json           # TypeScript config
vite.config.ts          # Vite build config
vitest.config.ts        # Test config
playwright.config.ts    # E2E test config
```

---

## Scripts

| Script                | Description                        |
|-----------------------|------------------------------------|
| `npm run build`       | Production build to `dist/`        |
| `npm run dev`         | Watch mode for development (HMR)   |
| `npm run typecheck`   | TypeScript type checking           |
| `npm run lint`        | ESLint check                       |
| `npm run lint:fix`    | ESLint auto-fix                    |
| `npm run format`      | Format with Prettier               |
| `npm run format:check`| Check Prettier formatting          |
| `npm run test`        | Run unit tests (Vitest)            |
| `npm run test:e2e`    | Run E2E tests (Playwright)         |
| `npm run analyze`     | Build and generate bundle analysis |
| `npm run check`       | Run all checks (type, lint, format, test) |
| `npm run clean`       | Remove `dist/` folder              |

---

## Adding New Commands

1. Create a new file in `src/content/commands/` and implement your command.
2. Register it in `src/content/commands/registry.ts` and import in `src/content/index.ts`.
3. Add end-user docs under `docs/commands/<command>/README.md`.

Example skeleton:

```typescript
import { registerCommand, type CommandSpec } from "./registry.ts";

const myCommand: CommandSpec = {
  preflight: async () => ({ showSetup: false }),
  getEmptyState: async () => ({ items: [] }),
  getResults: async (query) => ({ items: [] }),
  renderItems: (items, suggestTitle) => { /* ... */ },
  renderCurrent: () => { /* ... */ },
  onSelect: (item) => { /* ... */ },
};

registerCommand("mycommand", myCommand);
```

---

## Giphy API Key Setup

### Option 1: In picker
1. Type `/giphy`
2. Paste your key in the setup panel
3. Press **Test** to verify
4. Press **Save**

### Option 2: In options page
1. Open `chrome://extensions`
2. Find GitHub Slash Palette
3. Click **Details**
4. Click **Extension options**
5. Paste the key and Save

**Where is the key stored?**
> The key is stored using `chrome.storage.local` on your device only.

---

## Tech Stack

- **Build Tool**: [Vite](https://vitejs.dev/) - Fast build tool with HMR support
- **Testing**: [Vitest](https://vitest.dev/) (unit tests) + [Playwright](https://playwright.dev/) (E2E tests)
- **Language**: TypeScript
- **Linting**: ESLint + Prettier
- **Bundle Analysis**: rollup-plugin-visualizer

---

## Privacy

See [PRIVACY.md](PRIVACY.md) for the privacy policy.
