# GitHub Slash Palette

## What it does

1. Adds slash commands to GitHub markdown textarea fields
2. Includes /giphy to search and insert GIF markdown

**Available commands:** see [docs/commands/README.md](docs/commands/README.md)

![](src/assets/example.png)

## Development

### Prerequisites

- [Bun](https://bun.sh/) (v1.0+)

### Setup

```bash
# Install dependencies
bun install

# Build the extension
bun run build

# Build in watch mode (for development)
bun run dev
```

### Scripts

| Script | Description |
|--------|-------------|
| `bun run build` | Production build to `dist/` |
| `bun run dev` | Watch mode for development |
| `bun run typecheck` | TypeScript type checking |
| `bun run lint` | ESLint check |
| `bun run lint:fix` | ESLint auto-fix |
| `bun run format` | Format with Prettier |
| `bun run format:check` | Check Prettier formatting |
| `bun run check` | Run all checks (typecheck + lint + format) |
| `bun run clean` | Remove `dist/` folder |

### Project Structure

```
src/
├── api/              # External API clients
│   └── giphy.ts      # Giphy API
├── assets/           # Static assets (icons, images)
├── content/          # Content script
│   ├── commands/     # Slash command implementations
│   │   ├── giphy.ts
│   │   └── registry.ts
│   ├── picker/       # Picker UI component
│   │   ├── Picker.ts
│   │   ├── state.ts
│   │   └── styles.ts
│   └── index.ts      # Entry point
├── options/          # Extension options page
│   ├── index.ts
│   └── options.html
├── utils/            # Shared utilities
│   ├── dom.ts
│   ├── math.ts
│   ├── storage.ts
│   └── theme.ts
└── manifest.json

dist/                 # Build output (load this in Chrome)
```

## How to install locally

1. Run `bun install && bun run build`
2. Open `chrome://extensions`
3. Enable Developer mode
4. Click Load unpacked
5. Select the `dist` folder

## How to use

1. Go to GitHub
2. Open an issue comment field or pull request comment field
3. Type `/giphy cats`
4. Use arrow keys to move selection
5. Press Enter or Tab to insert
6. Press Esc to close

## Commands

See [docs/commands/README.md](docs/commands/README.md) for per-command documentation.

- [/giphy](docs/commands/giphy/README.md) – search and insert GIFs

## How to set your Giphy API key

### Option 1: In picker

1. Type `/giphy`
2. A setup panel appears
3. Paste your key
4. Press Test to verify
5. Press Save

### Option 2: In options page

1. Open `chrome://extensions`
2. Find GitHub Slash Palette
3. Click Details
4. Click Extension options
5. Paste the key and Save

## Where the key is stored

The key is stored using `chrome.storage.local` on your device

## Adding New Commands

Create a new file in `src/content/commands/` and register your command:

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

Then import it in `src/content/index.ts`.

Documentation

- Add end-user docs under `docs/commands/<command>/README.md`.
