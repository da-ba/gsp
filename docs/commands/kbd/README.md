# /kbd Command

Format keyboard shortcuts with `<kbd>` tags for GitHub markdown.

## Usage

1. In any GitHub comment/review textarea, type:
   - `/kbd` to see common shortcuts
   - `/kbd copy` to filter shortcuts
   - `/kbd ctrl+p` to create a custom shortcut
2. Navigate results:
   - Arrow keys to move selection
   - `Enter` or `Tab` to insert
   - `Esc` to close

## Features

- **Common shortcuts**: Pre-defined shortcuts for editing, navigation, and system commands
- **Custom shortcuts**: Type any key combination to create custom keyboard formatting
- **Platform-aware**: Recognizes both Windows/Linux (Ctrl, Alt, Win) and Mac (Cmd, Opt) modifiers
- **Flexible input**: Supports various formats like `ctrl + p`, `Ctrl+P`, or `cmd+shift+s`

## Input Formats

The command accepts multiple input formats:

| Input | Output |
|-------|--------|
| `ctrl + p` | `<kbd>⌃</kbd><kbd>P</kbd>` |
| `Ctrl+P` | `<kbd>⌃</kbd><kbd>P</kbd>` |
| `cmd+shift+s` | `<kbd>⌘</kbd><kbd>⇧</kbd><kbd>S</kbd>` |
| `Win+D` | `<kbd>Win</kbd><kbd>D</kbd>` |

## Key Aliases

| Alias | Display |
|-------|---------|
| cmd, command | ⌘ |
| opt, option | ⌥ |
| ctrl, control | ⌃ |
| shift | ⇧ |
| win, windows | Win |
| alt | Alt |
| arrowleft, left | ← |
| arrowright, right | → |
| arrowup, up | ↑ |
| arrowdown, down | ↓ |
| enter, return | Enter/Return |
| tab | Tab |
| esc, escape | Esc |
| backspace | ⌫ |
| delete, del | Del |

## Common Shortcuts

### Editing
- Copy, Paste, Cut, Undo, Redo, Select All, Save, Find

### Navigation
- New Tab, Close Tab, Refresh, Go Back, Go Forward, Home

### System
- Task Manager, Lock Screen, Show Desktop, Run, Settings, Screenshot

## Examples

| Input | Description |
|-------|-------------|
| `/kbd` | Show common shortcuts |
| `/kbd copy` | Filter to copy shortcut |
| `/kbd ctrl+alt+del` | Create custom shortcut |
| `/kbd cmd+shift+s` | Mac-style shortcut |

## What gets inserted

```html
<kbd>Ctrl</kbd><kbd>P</kbd>
```

Which renders as: <kbd>Ctrl</kbd><kbd>P</kbd>

## Developer notes

Implementation files:

- Command: `src/content/commands/kbd/command.ts`
