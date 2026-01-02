# Copilot Instructions for GitHub Slash Palette

## Project Overview

GitHub Slash Palette is a Chrome extension that adds slash command functionality to GitHub markdown textareas. Users can type commands like `/giphy`, `/emoji`, `/font`, `/kbd`, `/link`, `/mention`, `/mermaid`, and `/now` to quickly insert content.

## Tech Stack

- **Runtime & Build**: [Bun](https://bun.sh/) - Fast all-in-one JavaScript runtime
- **Language**: TypeScript with JSX/TSX support
- **UI Components**: React (for complex UI components)
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
│   │   │   ├── api.ts       # API/data layer
│   │   │   ├── api.test.ts  # API tests
│   │   │   ├── command.ts   # Command implementation
│   │   │   ├── command.test.ts # Command tests (if applicable)
│   │   │   └── index.ts     # Barrel export
│   │   ├── registry.ts     # Command registry
│   │   └── index.ts        # Command exports
│   ├── picker/         # Picker UI components
│   └── types.ts        # Shared content script types
├── options/            # Extension options page
├── utils/              # Shared utilities
│   ├── dom.ts          # DOM manipulation helpers
│   ├── math.ts         # Math utilities
│   ├── storage.ts      # Chrome storage utilities
│   └── theme.ts        # Theme utilities
└── test/               # Test setup files
```

## Adding New Commands

1. Create a new folder under `src/content/commands/<command>/`
2. Implement the `CommandSpec` interface in a `command.ts` file
3. Register the command using `registerCommand()` from `registry.ts`
4. Export the command from an `index.ts` barrel file
5. Add the command export to `src/content/commands/index.ts`
6. Add documentation under `docs/commands/<command>/README.md`

### CommandSpec Interface

```typescript
type CommandSpec = {
  preflight: () => Promise<PreflightResult>     // Setup check (e.g., API keys)
  getEmptyState: () => Promise<EmptyStateResult> // Initial state when command opens
  getResults: (query: string) => Promise<ResultsResult> // Search results
  getSuggestions?: (query: string) => Promise<SuggestionsResult> // Autocomplete
  renderItems: (items: PickerItem[], suggestTitle: string) => void
  renderCurrent: () => void
  onSelect: (item: PickerItem) => void          // Handle selection
  noResultsMessage?: string                      // Custom "no results" message
  renderSettings?: (container: HTMLElement) => void // Optional settings UI
}
```

## Testing

### Unit Tests (Vitest)

- Test files use `.test.ts` suffix
- Tests are colocated with source files
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

// Reading a value with a default
const value = await getStorageValue<MyType>("myKey", defaultValue)

// Writing a value
await setStorageValue("myKey", newValue)
```

### DOM Manipulation

```typescript
import { replaceRange, getCursorInfo, parseSlashCommand } from "../../../utils/dom.ts"

// Replace text in a string range
const newValue = replaceRange(text, startPos, endPos, replacement)
```

### React Components in Picker

- TSX files are supported for complex UI components
- Use functional components with hooks
- Components should follow the existing picker styling patterns

### Caching

Commands use a per-command cache system:

```typescript
import { getCommandCache, setCommandCache, clearCommandCache } from "../../picker/index.ts"

// Get cached value
const cached = getCommandCache<MyType>("mycommand:cacheKey")

// Set cached value
setCommandCache("mycommand:cacheKey", value)

// Clear cached value
clearCommandCache("mycommand:cacheKey")
```

## Build & Development

```bash
# Install dependencies
bun install

# Development with watch mode
bun run dev

# Production build
bun run build

# Run all checks (typecheck, lint, format, test)
bun run check

# Individual checks
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
- File extensions: `.ts` imports must include `.ts` extension

## Important Notes

- **Chrome Extension Context**: Code runs as a content script with access to Chrome APIs
- **GitHub DOM**: The extension manipulates GitHub's textarea elements
- **API Keys**: Some commands (e.g., `/giphy`, `/link ci`) require API keys stored via `chrome.storage.local`
- **Privacy**: No data is sent to external servers except necessary API calls (Giphy, GitHub)

## Documentation

- User documentation goes in `docs/commands/<command>/README.md`
- Options documentation goes in `docs/options/<feature>/README.md`
- Main README.md provides project overview and quick start
