![Build Status](https://img.shields.io/github/check-runs/da-ba/gsp/main?label=main) ![GitHub Release Date](https://img.shields.io/github/release-date/da-ba/gsp?logo=github) <a href="https://chromewebstore.google.com/detail/kkcajoojbaidfdnjecjnbeaheepknkpf">![Chrome Web Store Release Date](https://img.shields.io/chrome-web-store/last-updated/kkcajoojbaidfdnjecjnbeaheepknkpf?logo=chromewebstore)</a> <a href="https://chromewebstore.google.com/detail/kkcajoojbaidfdnjecjnbeaheepknkpf">![Chrome Web Store Version](https://img.shields.io/chrome-web-store/v/kkcajoojbaidfdnjecjnbeaheepknkpf?logo=chromewebstore)</a>

# GitHub Slash Palette

Slash commands for GitHub markdown fields. Includes GIF search, emoji picker, Mermaid diagrams, and more.

## Latest Release In Chrome Web Store

[GitHub Slash Palette](https://chromewebstore.google.com/detail/kkcajoojbaidfdnjecjnbeaheepknkpf?utm_source=item-share-cb)

## Live Demo

Try the extension without installing it: **[Live Demo](https://da-ba.github.io/gsp/main/)**

All deployments (main + PR previews): **[Deployments Index](https://da-ba.github.io/gsp/)**

---

## Features

- Adds slash command palette to GitHub markdown textareas
- `/giphy` to search and insert GIFs
- `/emoji` to search and insert emojis
- `/font` to style text with sizes, colors, and formatting
- `/kbd` to format keyboard shortcuts
- `/link` to insert markdown links with auto-generated titles
- `/link ci` to link to CI jobs and artifacts (requires GitHub token)
- `/mention` for context-aware participant mentions
- `/mermaid` to insert diagram templates
- `/now` to insert formatted timestamps
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

- [Bun](https://bun.sh/) (v1.0+)

### Setup

```bash
bun install
bun run build
```

### Local Installation

1. Build: `bun install && bun run build`
2. Open `chrome://extensions`
3. Enable Developer mode
4. Click **Load unpacked**
5. Select the `dist` folder

---

## Usage

1. Go to GitHub
2. Open an issue or PR comment field
3. Type `/` to see all commands, or `/giphy cats` to search GIFs
4. Use arrow keys to navigate
5. Press Enter to insert
6. Press Esc to close

---

## Development

### Watch Mode

For development with automatic rebuilding:

```bash
bun run dev
```

This starts Bun in watch mode. Reload the extension in Chrome to see changes.

### Bundle Analysis

To check bundle sizes:

```bash
bun run analyze
```

This reports the size of each bundle after building.

### End-to-End Tests

Run Playwright E2E tests:

```bash
bun run test:e2e
```

---

## Project Structure

```
src/
├── assets/             # Static assets (icons, images)
├── content/            # Content scripts
│   ├── commands/       # Slash command implementations
│   │   ├── emoji/      # Emoji picker command
│   │   ├── font/       # Font styling command
│   │   ├── giphy/      # GIF search command
│   │   ├── kbd/        # Keyboard shortcut command
│   │   ├── link/       # Link insertion command (includes CI links)
│   │   ├── mention/    # Mention autocomplete command
│   │   ├── mermaid/    # Diagram templates command
│   │   ├── now/        # Timestamp command
│   │   ├── selector/   # Internal command selector (triggered by /)
│   │   ├── index.ts    # Command exports
│   │   └── registry.ts # Command registry
│   ├── picker/         # Picker UI (supports .tsx files)
│   │   ├── picker.ts
│   │   ├── state.ts
│   │   └── styles.ts
│   ├── index.ts        # Content entry
│   └── types.ts
├── options/            # Options page and shared options
│   └── github/         # Shared GitHub API options
├── utils/              # Shared utilities
│   ├── dom.ts
│   ├── math.ts
│   ├── storage.ts
│   └── theme.ts
dist/                   # Build output (load in Chrome)
docs/                   # Documentation
│   ├── commands/       # Per-command docs
│   │   ├── README.md   # Command list
│   │   ├── emoji/      # /emoji docs
│   │   ├── font/       # /font docs
│   │   ├── giphy/      # /giphy docs
│   │   ├── kbd/        # /kbd docs
│   │   ├── link/       # /link docs
│   │   ├── mention/    # /mention docs
│   │   ├── mermaid/    # /mermaid docs
│   │   └── now/        # /now docs
│   └── options/        # Options documentation
│       └── github/     # GitHub API options docs
e2e/                    # End-to-end tests (Playwright)
scripts/                # Build scripts
│   └── build.ts
PRIVACY.md              # Privacy policy
package.json            # Project metadata & scripts
tsconfig.json           # TypeScript config
vitest.config.ts        # Test config
playwright.config.ts    # E2E test config
```

---

## Scripts

| Script                | Description                        |
|-----------------------|------------------------------------|
| `bun run build`       | Production build to `dist/`        |
| `bun run dev`         | Watch mode for development         |
| `bun run typecheck`   | TypeScript type checking           |
| `bun run lint`        | ESLint check                       |
| `bun run lint:fix`    | ESLint auto-fix                    |
| `bun run format`      | Format with Prettier               |
| `bun run format:check`| Check Prettier formatting          |
| `bun run test`        | Run unit tests (Vitest)            |
| `bun run test:e2e`    | Run E2E tests (Playwright)         |
| `bun run analyze`     | Build and report bundle sizes      |
| `bun run check`       | Run all checks (type, lint, format, test) |
| `bun run clean`       | Remove `dist/` folder              |

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

## GitHub API Token Setup

Some features require a GitHub Personal Access Token (PAT):

- `/link ci` - Link to CI jobs and artifacts

### Option 1: In picker settings
1. Type `/link ci` or click the settings gear
2. Find **GitHub Token** section
3. Paste your token and click **Save**

### Option 2: In options page
1. Open `chrome://extensions`
2. Find GitHub Slash Palette → **Details**
3. Click **Extension options**
4. Find **GitHub API** section
5. Paste the token and Save

**Token requirements:**
- Create a [Personal Access Token](https://github.com/settings/tokens/new)
- For public repos: `public_repo` scope
- For private repos: `repo` scope

**Where is the token stored?**
> The token is stored using `chrome.storage.local` on your device only.

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

- **Build Tool**: [Bun](https://bun.sh/) - Fast all-in-one JavaScript runtime
- **UI Support**: React/JSX available for components
- **Testing**: [Vitest](https://vitest.dev/) (unit tests) + [Playwright](https://playwright.dev/) (E2E tests)
- **Language**: TypeScript with JSX support
- **Linting**: ESLint + Prettier

---

## Privacy

See [PRIVACY.md](PRIVACY.md) for the privacy policy.

## License

See [LICENSE](LICENSE).
