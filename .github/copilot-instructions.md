# Copilot Instructions for GitHub Slash Palette

## Project Overview

GitHub Slash Palette is a Chrome extension that adds slash command functionality to GitHub markdown textareas. Users can type commands like `/giphy`, `/emoji`, `/font`, `/kbd`, `/link`, `/mention`, `/mermaid`, and `/now` to quickly insert content. Typing just `/` shows a list of all available commands.

## Tech Stack

- **Runtime & Build**: [Bun](https://bun.sh/) - Fast all-in-one JavaScript runtime
- **Language**: TypeScript with JSX/TSX support
- **UI Components**: React (for picker UI and settings)
- **Testing**: Vitest (unit tests) + Playwright (E2E tests)
- **Linting**: ESLint with typescript-eslint
- **Formatting**: Prettier

## Code Style

- **No semicolons** - Semicolons are not used at the end of statements
- **Double quotes** for strings (not single quotes)
- **2-space indentation**
- **Trailing commas** in ES5 contexts
- **No explicit `any`** - Use proper types; `@typescript-eslint/no-explicit-any` is set to warn
- **Consistent type imports** - Use `import type` for type-only imports
- **Arrow functions** should always use parentheses around parameters

## File Structure

```
src/
├── assets/             # Static assets (icons, images)
├── content/            # Content scripts injected into GitHub pages
│   ├── commands/       # Slash command implementations
│   │   ├── <command>/  # Each command in its own folder
│   │   │   ├── api.ts            # API/data layer
│   │   │   ├── api.test.ts       # API tests
│   │   │   ├── command.ts        # CommandSpec implementation
│   │   │   ├── <Cmd>OptionsSection.tsx # Options UI (if needed)
│   │   │   └── index.ts          # Barrel export
│   │   ├── grid-handlers.ts      # Factory for grid command handlers
│   │   ├── options-registry.ts   # Options section registry
│   │   ├── registry.ts           # Command registry
│   │   └── index.ts              # Command exports
│   ├── picker/         # Picker UI (React-based)
│   │   ├── components/ # React components (Picker, Header, Grid, List, etc.)
│   │   ├── picker-react.tsx      # Main picker React integration
│   │   ├── state.ts              # Picker state management
│   │   ├── styles.ts             # Theme-aware styles
│   │   └── index.ts              # Barrel exports
│   ├── index.ts        # Main content script entry
│   └── types.ts        # Shared types (PickerItem)
├── options/            # Extension options page
├── utils/              # Shared utilities
│   ├── dom.ts          # DOM manipulation helpers
│   ├── filter-sort.ts  # Generic filter/sort utilities
│   ├── math.ts         # Math utilities
│   ├── storage.ts      # Chrome storage utilities
│   ├── svg.ts          # SVG utilities
│   ├── theme.ts        # Theme detection and override
│   └── tile-builder.ts # SVG tile generation for picker items
└── test/               # Test setup files
```

## Adding New Commands

1. Create a new folder under `src/content/commands/<command>/`
2. Implement the `CommandSpec` interface in a `command.ts` file
3. Register the command using `registerCommand()` from `registry.ts`
4. Export the command from an `index.ts` barrel file
5. Add the command export to `src/content/commands/index.ts`
6. Add documentation under `docs/commands/<command>/README.md`
7. **If applicable**, add options component (API tokens, settings)
8. **Always** add E2E tests for the new command in `e2e/extension.spec.ts`

### Using Grid Handlers (Recommended for Grid Commands)

Most commands display items in a grid and use `createGridHandlers` to reduce boilerplate:

```typescript
import { registerCommand, type CommandSpec } from "../registry.ts"
import { createGridHandlers } from "../grid-handlers.ts"
import { insertTextAtCursor } from "../../picker/index.ts"
import type { PickerItem } from "../../types.ts"

type MyData = { value: string }

const myCommand: CommandSpec = {
  preflight: async () => ({ showSetup: false }),
  getEmptyState: async () => ({ items: [...], suggestTitle: "Title" }),
  getResults: async (query) => ({ items: [...], suggestTitle: "Results" }),

  // Use createGridHandlers for standard grid behavior
  ...createGridHandlers<MyData>((data) => {
    insertTextAtCursor(data.value)
  }),

  noResultsMessage: "No results found",
}

registerCommand("mycommand", myCommand)
```

### Adding Command Options

If your command requires configuration (API tokens, settings):

1. Create a React component in the command folder (e.g., `GiphyOptionsSection.tsx`)
2. Register it using `registerOptionsSection()` from `options-registry.ts`
3. Store settings via `getStorageValue`/`setStorageValue` from `utils/storage.ts`

```typescript
import { registerOptionsSection } from "../options-registry.ts"
import { getStorageValue, setStorageValue } from "../../../utils/storage.ts"

export function MyCommandOptionsSection() {
  // React component - appears in picker settings panel
}

registerOptionsSection("mycommand", MyCommandOptionsSection)
```

### Adding E2E Tests

E2E tests are **required** for all new commands:

```typescript
test.describe("MyCommand Command", () => {
  test("/mycommand shows picker", async () => {
    // Test picker appears
  })

  test("/mycommand filtering works", async () => {
    // Test search/filter functionality
  })

  test("selecting item inserts correct content", async () => {
    // Test selection and insertion
  })
})
```

### CommandSpec Interface

```typescript
type CommandSpec = {
  preflight: () => Promise<PreflightResult>       // Setup check (e.g., API keys)
  getEmptyState: () => Promise<EmptyStateResult>  // Initial state when command opens
  getResults: (query: string) => Promise<ResultsResult>  // Search results
  getSuggestions?: (query: string) => Promise<SuggestionsResult>  // Autocomplete
  renderItems: (items: PickerItem[], suggestTitle: string) => void
  renderCurrent?: () => void                       // Optional, deprecated
  onSelect: (item: PickerItem) => void            // Handle selection
  noResultsMessage?: string                        // Custom "no results" message
}
```

## Testing

### Unit Tests (Vitest)

- Test files use `.test.ts` suffix, colocated with source files
- Use `describe`, `it`, `expect` from Vitest globals
- Mock Chrome APIs using Vitest's `vi` module
- Run with: `bun run test`

### E2E Tests (Playwright)

- Located in `e2e/` directory
- Test the extension in a real browser context
- Run with: `bun run test:e2e`

## Common Patterns

### Storage Access

```typescript
import { getStorageValue, setStorageValue } from "../../../utils/storage.ts"

const value = await getStorageValue<MyType>("myKey", defaultValue)
await setStorageValue("myKey", newValue)
```

### Text Insertion

```typescript
import { insertTextAtCursor } from "../../picker/index.ts"

// Insert text at cursor, replacing the slash command
insertTextAtCursor("inserted text ")
```

### Caching

```typescript
import { getCommandCache, setCommandCache, clearCommandCache } from "../../picker/index.ts"

const cached = getCommandCache<MyType>("mycommand:cacheKey")
setCommandCache("mycommand:cacheKey", value)
clearCommandCache("mycommand:cacheKey")
```

### Creating Picker Tiles

```typescript
import { createSmallTile } from "../../../utils/tile-builder.ts"

const tile = createSmallTile({
  id: "unique-id",
  mainText: "Display text",
  mainFontSize: 42,
  category: "Category",
  categoryColor: "#f59e0b",
})
```

### Filtering and Sorting

```typescript
import { filterItems, sortByCategory, matchesQuery } from "../../../utils/filter-sort.ts"

const filtered = filterItems({
  items: allItems,
  query: searchQuery,
  searchFields: [(item) => item.name, (item) => item.description],
})
```

## Build & Development

```bash
bun install          # Install dependencies
bun run dev          # Development with watch mode
bun run build        # Production build
bun run check        # Run all checks (typecheck, lint, format, test)
bun run typecheck    # TypeScript type checking
bun run lint         # ESLint check
bun run format:check # Prettier check
bun run test         # Unit tests
bun run test:e2e     # E2E tests
```

## TypeScript Configuration

- Target: ES2022
- Module: ESNext with bundler resolution
- Strict mode enabled
- Path alias: `@/*` maps to `src/*`
- JSX: react-jsx (automatic runtime)
- File extensions: `.ts`/`.tsx` imports must include extension

## Important Notes

- **Chrome Extension Context**: Code runs as a content script with access to Chrome APIs
- **GitHub DOM**: The extension injects into GitHub's markdown textareas
- **API Keys**: Some commands (e.g., `/giphy`, `/link artifact`) require API keys stored via `chrome.storage.local`
- **Privacy**: No data is sent to external servers except necessary API calls (Giphy, GitHub)
- **Theme Support**: Picker styling aligns with GitHub's native UI and supports light/dark themes

## Documentation

- User documentation goes in `docs/commands/<command>/README.md`
- Options documentation goes in `docs/options/<feature>/README.md`
- Main README.md provides project overview and quick start
