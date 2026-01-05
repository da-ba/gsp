# /

Show an overview of all registered slash commands and insert one into the current textarea.

## Usage

- Type `/` to see all commands.
- Type `/ <filter>` to filter commands by name.

Navigation

- Arrow keys: move selection
- `Enter` or `Tab`: insert the selected command into the textarea
- `Esc`: close

## What gets inserted

Selecting a command replaces the current line up to the cursor with:

- `/<command> `

If you used a filter term (e.g. `/ cats`) it will be forwarded:

- Selecting `/giphy` results in `
  /giphy cats
  `

## Developer notes

- Source: `src/content/commands/commands-list/command.ts`
- Registry: `src/content/commands/registry.ts`
