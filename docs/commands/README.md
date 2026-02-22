# Commands

This folder contains end-user and developer documentation for each registered slash command.

## Available commands

- [//](commands-list/README.md) – show and insert available commands
- [//giphy](giphy/README.md) – search and insert GIFs via Giphy
- [//emoji](emoji/README.md) – search and insert emojis with recently used favorites
- [//font](font/README.md) – apply font styling (sizes, colors, styles) to text
- [//kbd](kbd/README.md) – format keyboard shortcuts with `<kbd>` tags
- [//link](link/README.md) – insert markdown links with auto-generated titles
  - `//link ci` – link to CI jobs and artifacts (requires [GitHub token](../options/github/README.md))
- [//mention](mention/README.md) – context-aware mention autocomplete for participants
- [//mermaid](mermaid/README.md) – insert Mermaid diagram templates
- [//now](now/README.md) – insert formatted date and timestamps
- [//color](color/README.md) – open a color picker and insert hex color codes

## Options

Some commands require API keys or tokens:

- [GitHub API Options](../options/github/README.md) – Personal Access Token for `//link ci` and other GitHub API features

## Developer notes

When adding a new slash command:

- Register it via `registerCommand(name, spec, metadata)` and provide `icon` + `description` metadata so it appears automatically in the `//` command list.
- Keep command-specific data loading in small helpers (e.g. cache loaders) to minimize boilerplate in `command.ts`.
