# Claude Instructions for GitHub Slash Palette

## Project Context

GitHub Slash Palette is a Chrome extension that enhances GitHub's markdown textareas with slash command functionality. Users can type commands like `/giphy`, `/emoji`, `/font`, `/kbd`, `/link`, `/mention`, `/mermaid`, and `/now` to quickly insert content.

## Tech Stack & Tools

- **Runtime**: [Bun](https://bun.sh/) - All-in-one JavaScript runtime and package manager
- **Language**: TypeScript with JSX/TSX support
- **UI Framework**: React for complex components
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Code Quality**: ESLint + Prettier
- **Extension API**: Chrome Extension Manifest V3

## Code Style Guidelines

**Critical Style Rules:**
- **No semicolons** - Never add semicolons to statements
- **Double quotes** for strings
- **2-space indentation**
- **Trailing commas** in multi-line objects/arrays
- **No `any` types** - Always use proper TypeScript types
- **Type-only imports** - Use `import type` for types
- **Arrow function parameters** - Always wrap in parentheses, even single params

**Example:**
```typescript
import type { CommandSpec } from "./types"
import { getStorageValue } from "../utils/storage"

const myFunction = (param: string): Promise<void> => {
  const config = {
    key: "value",
    another: "item",
  }
  return doSomething(config)
}
```

## Architecture Overview

### File Organization

```
src/
├── content/            # Content scripts (injected into GitHub)
│   ├── commands/       # Slash command implementations
│   │   ├── <command>/  # Self-contained command modules
│   │   │   ├── api.ts       # Data fetching/external APIs
│   │   │   ├── api.test.ts  # API layer tests
│   │   │   ├── command.ts   # CommandSpec implementation
│   │   │   ├── command.test.ts
│   │   │   └── index.ts     # Barrel exports
│   │   └── registry.ts      # Global command registry
│   ├── picker/         # Picker UI (dropdown/modal)
│   └── types.ts        # Shared type definitions
├── options/            # Extension settings page
├── utils/              # Shared utilities
│   ├── dom.ts          # DOM manipulation
│   ├── storage.ts      # Chrome storage wrapper
│   └── theme.ts        # Theme detection
└── test/               # Test configuration
```

### Key Concepts

**Commands**: Each slash command is a self-contained module implementing the `CommandSpec` interface. Commands handle their own data fetching, UI rendering, and content insertion.

**Picker**: The dropdown/modal UI that appears when users type a slash command. It displays items, handles search/filtering, and manages keyboard navigation.

**Registry**: Central system for registering commands and options sections. Uses a registration pattern to keep modules decoupled.

**Storage**: Persistent settings stored via `chrome.storage.local` API, wrapped in async utilities.

## Working with Commands

### Understanding CommandSpec

The `CommandSpec` interface defines the command lifecycle:

```typescript
type CommandSpec = {
  // Initial setup check (e.g., verify API keys)
  preflight: () => Promise<PreflightResult>

  // Initial state when command is triggered
  getEmptyState: () => Promise<EmptyStateResult>

  // Search/filter results based on user query
  getResults: (query: string) => Promise<ResultsResult>

  // Optional autocomplete suggestions
  getSuggestions?: (query: string) => Promise<SuggestionsResult>

  // Render items in the picker
  renderItems: (items: PickerItem[], suggestTitle: string) => void

  // Render current selected item
  renderCurrent: () => void

  // Handle item selection and insertion
  onSelect: (item: PickerItem) => void

  // Custom "no results" message
  noResultsMessage?: string

  // Optional settings UI in picker
  renderSettings?: (container: HTMLElement) => void
}
```

### Adding a New Command

**Step-by-step process:**

1. **Create module structure**
   ```bash
   src/content/commands/<command>/
   ├── api.ts           # Data layer
   ├── api.test.ts      # API tests
   ├── command.ts       # CommandSpec implementation
   ├── command.test.ts  # Command tests
   └── index.ts         # Exports
   ```

2. **Implement CommandSpec** in `command.ts`
   - Start with `preflight()` - check prerequisites
   - Implement `getEmptyState()` - initial data
   - Implement `getResults()` - search logic
   - Implement `renderItems()` - UI rendering
   - Implement `onSelect()` - insertion logic

3. **Register the command**
   ```typescript
   import { registerCommand } from "../registry"

   registerCommand("mycommand", myCommandSpec)
   ```

4. **Export from barrel file** (`index.ts`)
   ```typescript
   export { myCommandSpec } from "./command"
   ```

5. **Add to main exports** in `src/content/commands/index.ts`

6. **Write E2E tests** in `e2e/extension.spec.ts`

7. **Add documentation** in `docs/commands/<command>/README.md`

### Adding Command Options

If your command needs configuration (API keys, settings):

1. **Create options component** in command folder
   ```typescript
   import { registerOptionsSection } from "../options-registry"
   import { getStorageValue, setStorageValue } from "../../../utils/storage"

   export function MyCommandOptionsSection() {
     // React component for settings UI
   }

   registerOptionsSection("mycommand", MyCommandOptionsSection)
   ```

2. **Store/retrieve settings**
   ```typescript
   const apiKey = await getStorageValue<string>("mycommand:apiKey", "")
   await setStorageValue("mycommand:apiKey", newKey)
   ```

## Testing Strategy

### Unit Tests (Vitest)

- **Location**: Colocated with source files (`.test.ts` suffix)
- **Purpose**: Test individual functions, API layers, utilities
- **Run**: `bun run test`

**Example:**
```typescript
import { describe, it, expect } from "vitest"
import { myFunction } from "./api"

describe("myFunction", () => {
  it("should return expected result", async () => {
    const result = await myFunction("input")
    expect(result).toBe("expected")
  })
})
```

### E2E Tests (Playwright)

- **Location**: `e2e/` directory
- **Purpose**: Test extension in real browser with GitHub
- **Run**: `bun run test:e2e`
- **Required for**: All new commands and features

**Test pattern:**
```typescript
test.describe("MyCommand Command", () => {
  test("/mycommand shows picker", async ({ page }) => {
    // Test picker visibility
  })

  test("/mycommand filtering works", async ({ page }) => {
    // Test search functionality
  })

  test("selecting item inserts content", async ({ page }) => {
    // Test insertion
  })
})
```

## Common Utilities

### Storage Operations

```typescript
import { getStorageValue, setStorageValue } from "../utils/storage"

// Read with default
const value = await getStorageValue<MyType>("key", defaultValue)

// Write
await setStorageValue("key", newValue)
```

### DOM Manipulation

```typescript
import { replaceRange, getCursorInfo, parseSlashCommand } from "../utils/dom"

// Replace text at cursor
const newText = replaceRange(text, start, end, replacement)

// Get cursor position and context
const cursorInfo = getCursorInfo(textarea)

// Parse slash command from text
const command = parseSlashCommand(text, cursorPos)
```

### Caching

```typescript
import { getCommandCache, setCommandCache, clearCommandCache } from "../../picker"

// Get cached data
const cached = getCommandCache<MyType>("mycommand:key")

// Set cache
setCommandCache("mycommand:key", data)

// Clear cache
clearCommandCache("mycommand:key")
```

## Development Workflow

### Commands

```bash
# Install dependencies
bun install

# Development mode (watch + rebuild)
bun run dev

# Production build
bun run build

# Run all quality checks
bun run check

# Individual checks
bun run typecheck      # TypeScript type checking
bun run lint           # ESLint
bun run format:check   # Prettier
bun run test           # Unit tests
bun run test:e2e       # E2E tests
```

### Git Workflow

- **Branch naming**: Features on `claude/feature-name-<session-id>`
- **Commits**: Clear, descriptive messages
- **Push**: Always use `git push -u origin <branch-name>`

## TypeScript Configuration

- **Target**: ES2022
- **Module**: ESNext with bundler resolution
- **Strict**: Enabled
- **Path alias**: `@/*` → `src/*`
- **JSX**: react-jsx (automatic runtime)
- **Extensions**: Must include `.ts`/`.tsx` in imports

## Important Considerations

### Chrome Extension Context

- Code runs as a content script in GitHub pages
- Access to Chrome Extension APIs via `chrome.*`
- Limited access to page's JavaScript context
- Must use message passing for background scripts

### GitHub DOM Integration

- Extension injects into GitHub's markdown textareas
- Must handle GitHub's dynamic DOM updates
- Should not interfere with GitHub's native functionality
- Respect user's theme (light/dark mode)

### Privacy & Security

- No data sent to external servers except necessary API calls
- API keys stored locally via `chrome.storage.local`
- User data never leaves the browser except for explicit API requests
- Always validate external API responses

### Performance

- Cache API responses when appropriate
- Debounce search/filter operations
- Lazy load heavy dependencies
- Minimize DOM manipulation

## Best Practices for Claude

### Before Making Changes

1. **Read existing code first** - Always read files before modifying
2. **Understand patterns** - Follow existing architectural patterns
3. **Check for similar implementations** - Look at existing commands for reference
4. **Verify type definitions** - Ensure type safety

### When Implementing Features

1. **Start with types** - Define TypeScript interfaces first
2. **Write tests early** - Add unit tests alongside implementation
3. **Follow code style** - Match existing formatting and conventions
4. **Keep it simple** - Avoid over-engineering or premature abstraction
5. **Test incrementally** - Run tests frequently during development

### Code Quality Checklist

- [ ] No semicolons added
- [ ] Double quotes used consistently
- [ ] Proper TypeScript types (no `any`)
- [ ] Type-only imports for types
- [ ] Unit tests added for new functions
- [ ] E2E tests added for new commands
- [ ] Code follows existing patterns
- [ ] No console.log statements left in code
- [ ] Error handling implemented
- [ ] Edge cases considered

### When Stuck

1. **Search codebase** - Use grep/glob to find similar patterns
2. **Read existing commands** - Reference working implementations
3. **Check utilities** - Utility functions may already exist
4. **Review types** - Type definitions often provide guidance
5. **Run tests** - Tests show expected behavior

## Common Tasks

### Fixing Type Errors

1. Read the file with the error
2. Check type definitions in `types.ts`
3. Ensure imports include `type` keyword for types
4. Verify function signatures match interfaces
5. Run `bun run typecheck` to verify fix

### Adding API Integration

1. Create `api.ts` in command folder
2. Define response types
3. Implement async API functions
4. Add error handling
5. Write `api.test.ts` with mocks
6. Use in `command.ts` via `getResults()` or `getEmptyState()`

### Updating UI/Rendering

1. Locate `renderItems()` in command implementation
2. Follow existing HTML/DOM patterns
3. Use theme-aware styles (check `utils/theme.ts`)
4. Test in both light and dark modes
5. Ensure keyboard navigation works

## Documentation Standards

### Code Comments

- Use comments sparingly - code should be self-documenting
- Comment "why" not "what"
- Document complex algorithms or non-obvious behavior
- Add JSDoc for public APIs

### User Documentation

- Add README.md in `docs/commands/<command>/`
- Include usage examples
- Document any required configuration
- Add screenshots if helpful

## Quality Standards

All code must pass:
- ✅ TypeScript type checking
- ✅ ESLint rules
- ✅ Prettier formatting
- ✅ Unit tests
- ✅ E2E tests (for commands)

Run `bun run check` before committing to verify all checks pass.

## Avoid Common Mistakes

- ❌ Adding semicolons
- ❌ Using single quotes
- ❌ Using `any` type
- ❌ Importing types without `type` keyword
- ❌ Creating new files when editing existing ones works
- ❌ Skipping tests
- ❌ Not following existing patterns
- ❌ Over-engineering simple features
- ❌ Adding unnecessary abstractions
- ❌ Leaving debug code in commits

## Success Criteria

A well-implemented feature:
- ✅ Follows all code style guidelines
- ✅ Has comprehensive test coverage
- ✅ Matches existing architectural patterns
- ✅ Includes proper TypeScript types
- ✅ Works in both light and dark themes
- ✅ Handles errors gracefully
- ✅ Has user documentation
- ✅ Passes all quality checks
- ✅ Performs well with large datasets
- ✅ Respects user privacy
