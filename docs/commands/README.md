# Commands

This folder contains end-user and developer documentation for each registered slash command.

## Available commands

- [/](commands-list/README.md) – show and insert available commands
- [/giphy](giphy/README.md) – search and insert GIFs via Giphy
- [/emoji](emoji/README.md) – search and insert emojis with recently used favorites
- [/font](font/README.md) – apply font styling (sizes, colors, styles) to text
- [/kbd](kbd/README.md) – format keyboard shortcuts with `<kbd>` tags
- [/link](link/README.md) – insert markdown links with auto-generated titles
  - `/link ci` – link to CI jobs and artifacts (requires [GitHub token](../options/github/README.md))
- [/mention](mention/README.md) – context-aware mention autocomplete for participants
- [/mermaid](mermaid/README.md) – insert Mermaid diagram templates
- [/now](now/README.md) – insert formatted date and timestamps

## Options

Some commands require API keys or tokens:

- [GitHub API Options](../options/github/README.md) – Personal Access Token for `/link ci` and other GitHub API features
