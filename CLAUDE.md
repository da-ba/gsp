# Claude Instructions for GitHub Slash Palette

## Project Context

GitHub Slash Palette is a Chrome extension that enhances GitHub's markdown textareas with slash command functionality. Users can type commands like `/giphy`, `/emoji`, `/font`, `/kbd`, `/link`, `/mention`, `/mermaid`, and `/now` to quickly insert content. Typing just `/` shows a list of all available commands.

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
│   │   │   ├── api.ts            # Data fetching/external APIs
│   │   │   ├── api.test.ts       # API layer tests
│   │   │   ├── command.ts        # CommandSpec implementation
│   │   │   ├── <Cmd>OptionsSection.tsx  # Options UI (if needed)
│   │   │   └── index.ts          # Barrel exports
│   │   ├── grid-handlers.ts      # Factory for grid command handlers
│   │   ├── options-registry.ts   # Options section registry
│   │   ├── registry.ts           # Command registry and types
│   │   └── index.ts              # Command exports
│   ├── picker/         # Picker UI (React-based)
│   │   ├── components/ # React components
│   │   │   ├── Picker.tsx        # Main picker container
│   │   │   ├── PickerHeader.tsx  # Header with title, settings, close
│   │   │   ├── PickerGrid.tsx    # Grid view for items
│   │   │   ├── PickerList.tsx    # List view for items
│   │   │   ├── GridItem.tsx      # Individual grid item
│   │   │   ├── ListItem.tsx      # Individual list item
│   │   │   ├── SettingsPanel.tsx # Settings UI (theme, options)
│   │   │   └── ...               # Other components
│   │   ├── picker-react.tsx      # React integration and rendering
│   │   ├── state.ts              # State management and helpers
│   │   ├── styles.ts             # Theme-aware style utilities
│   │   └── index.ts              # Barrel exports
│   ├── index.ts        # Main content script entry
│   └── types.ts        # Shared types (PickerItem)
├── options/            # Extension options page
├── utils/              # Shared utilities
│   ├── dom.ts          # DOM manipulation (replaceRange, getCursorInfo)
│   ├── filter-sort.ts  # Generic filter/sort utilities
│   ├── math.ts         # Math utilities
│   ├── storage.ts      # Chrome storage wrapper
│   ├── svg.ts          # SVG escape utilities
│   ├── theme.ts        # Theme detection and override
│   └── tile-builder.ts # SVG tile generation for picker items
└── test/               # Test configuration
```

### Key Concepts

**Commands**: Each slash command is a self-contained module implementing the `CommandSpec` interface. Commands handle their own data fetching, UI rendering, and content insertion.

**Picker**: The React-based dropdown UI that appears when users type a slash command. Supports grid view (for images/tiles) and list view (for text items). Includes settings panel with theme selection.

**Registry**: Central system for registering commands (`registerCommand`) and options sections (`registerOptionsSection`). Uses a registration pattern to keep modules decoupled.

**State**: Picker state management in `state.ts` provides helpers like `insertTextAtCursor()`, caching functions, and state reset utilities.

**Storage**: Persistent settings stored via `chrome.storage.local` API, wrapped in async utilities with theme preference support.

## Working with Commands

### Understanding CommandSpec

The `CommandSpec` interface defines the command lifecycle:

```typescript
type CommandSpec = {
  // Initial setup check (e.g., verify API keys)
  // Can return renderSetup callback for custom setup UI
  preflight: () => Promise<PreflightResult>

  // Initial state when command is triggered
  getEmptyState: () => Promise<EmptyStateResult>

  // Search/filter results based on user query
  getResults: (query: string) => Promise<ResultsResult>

  // Optional autocomplete suggestions
  getSuggestions?: (query: string) => Promise<SuggestionsResult>

  // Render items in the picker (use renderGrid or renderList)
  renderItems: (items: PickerItem[], suggestTitle: string) => void

  // Handle item selection and insertion
  onSelect: (item: PickerItem) => void

  // Custom "no results" message
  noResultsMessage?: string

  // Optional: re-render current items (deprecated, rarely needed)
  renderCurrent?: () => void
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
   └── index.ts         # Exports
   ```

2. **Implement CommandSpec** in `command.ts`
   - Start with `preflight()` - check prerequisites
   - Implement `getEmptyState()` - initial data
   - Implement `getResults()` - search logic
   - Use `createGridHandlers` for standard grid behavior (recommended)
   - Or implement custom `renderItems()` and `onSelect()`

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

### Using Grid Handlers (Recommended)

Most commands display items in a grid. Use `createGridHandlers` to reduce boilerplate:

```typescript
import { registerCommand, type CommandSpec } from "../registry.ts"
import { createGridHandlers } from "../grid-handlers.ts"
import { insertTextAtCursor } from "../../picker/index.ts"
import type { PickerItem } from "../../types.ts"

type MyData = { value: string }

const myCommand: CommandSpec = {
  preflight: async () => ({ showSetup: false }),

  getEmptyState: async () => ({
    items: myItems.map(makePickerItem),
    suggest: ["suggestion1", "suggestion2"],
    suggestTitle: "Popular items",
  }),

  getResults: async (query) => ({
    items: searchItems(query).map(makePickerItem),
    suggestTitle: query ? "Search results" : "All items",
  }),

  // createGridHandlers provides renderItems and onSelect
  ...createGridHandlers<MyData>((data) => {
    insertTextAtCursor(data.value + " ")
  }),

  noResultsMessage: "No items found. Try different search terms.",
}

registerCommand("mycommand", myCommand)
```

### Adding Command Options

If your command needs configuration (API keys, settings):

1. **Create options component** in command folder (e.g., `GiphyOptionsSection.tsx`)
   ```typescript
   import React from "react"
   import { registerOptionsSection } from "../options-registry.ts"
   import { getStorageValue, setStorageValue } from "../../../utils/storage.ts"

   export function MyCommandOptionsSection() {
     // React component - appears in picker settings panel
     const [apiKey, setApiKey] = React.useState("")

     React.useEffect(() => {
       getStorageValue<string>("mycommand:apiKey", "").then(setApiKey)
     }, [])

     const handleSave = async (value: string) => {
       await setStorageValue("mycommand:apiKey", value)
       setApiKey(value)
     }

     return (
       <div>
         <label>API Key</label>
         <input value={apiKey} onChange={(e) => handleSave(e.target.value)} />
       </div>
     )
   }

   registerOptionsSection("mycommand", MyCommandOptionsSection)
   ```

2. **Import in command's index.ts** to ensure registration
   ```typescript
   export { myCommand } from "./command"
   import "./MyCommandOptionsSection.tsx"  // Side-effect import for registration
   ```

Options sections appear in the unified settings panel (gear icon in picker header).

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

### Text Insertion

```typescript
import { insertTextAtCursor } from "../../picker/index.ts"

// Insert text at cursor position, replacing the slash command
// Returns true if successful, false otherwise
insertTextAtCursor("inserted text ")
```

### Storage Operations

```typescript
import { getStorageValue, setStorageValue } from "../utils/storage.ts"

// Read with default
const value = await getStorageValue<MyType>("key", defaultValue)

// Write
await setStorageValue("key", newValue)

// Theme preference (system, light, dark)
import { getThemePreference, setThemePreference } from "../utils/storage.ts"
const pref = await getThemePreference()
```

### DOM Manipulation

```typescript
import { replaceRange, getCursorInfo, parseSlashCommand } from "../utils/dom.ts"

// Replace text in a string range
const newText = replaceRange(text, start, end, replacement)

// Get cursor position and context
const cursorInfo = getCursorInfo(textarea)

// Parse slash command from text
const command = parseSlashCommand(text, cursorPos)
```

### Caching

```typescript
import { getCommandCache, setCommandCache, clearCommandCache } from "../../picker/index.ts"

// Get cached data (returns null if not found)
const cached = getCommandCache<MyType>("mycommand:key")

// Set cache
setCommandCache("mycommand:key", data)

// Clear cache
clearCommandCache("mycommand:key")
```

### Creating Picker Tiles

```typescript
import { createSmallTile, createStandardTile } from "../../../utils/tile-builder.ts"

// Small tile (for emoji, font, etc.)
const tile = createSmallTile({
  id: "unique-id",
  mainText: "Display",
  mainFontSize: 42,
  category: "Category",
  categoryColor: "#f59e0b",
})

// Standard tile (for images with badge)
const tile = createStandardTile({
  id: "unique-id",
  badge: { label: "Label", color: "#3b82f6" },
})
```

### Filtering and Sorting

```typescript
import { filterItems, sortByCategory, matchesQuery } from "../../../utils/filter-sort.ts"

// Filter items by query
const filtered = filterItems({
  items: allItems,
  query: searchQuery,
  searchFields: [(item) => item.name, (item) => item.keywords.join(" ")],
})

// Simple query matching
if (matchesQuery(query, item.name, item.description)) {
  // item matches
}
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
- Picker styling aligns with GitHub's native slash commands UI
- Must handle GitHub's dynamic DOM updates
- Should not interfere with GitHub's native functionality
- Respect user's theme (light/dark mode) with System/Light/Dark options

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

1. Use `renderGrid()` or `renderList()` from picker for standard views
2. For grid commands, use `createGridHandlers()` factory
3. Use theme-aware styles from `picker/styles.ts` (e.g., `getCardStyles`, `getBadgeStyles`)
4. Check `utils/theme.ts` for `isDarkMode()` when needed
5. Test in both light and dark modes (use settings panel theme toggle)
6. Ensure keyboard navigation works

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
