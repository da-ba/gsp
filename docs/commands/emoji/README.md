# /emoji Command

Search and insert emojis into GitHub markdown textareas with an emoji picker.

## Usage

1. In any GitHub comment/review textarea, type:
   - `/emoji` to see popular and recently used emojis
   - `/emoji smile` to search for emojis matching "smile"
2. Navigate results:
   - Arrow keys to move selection
   - `Enter` or `Tab` to insert
   - `Esc` to close

## Features

- **Search**: Find emojis by name or category
- **Recently used**: Your recently inserted emojis appear first
- **Categories**: Emojis are organized by category (smileys, people, nature, food, activities, travel, objects, symbols)

## Examples

| Input | Description |
|-------|-------------|
| `/emoji` | Show popular and recent emojis |
| `/emoji heart` | Search for heart-related emojis |
| `/emoji cat` | Search for cat emojis |
| `/emoji nature` | Show emojis in the nature category |

## What gets inserted

The command inserts the emoji character directly:

- `😀` (emoji character followed by a space)

## Notes

- Recently used emojis are stored locally and persist across sessions
- The picker shows up to 24 results at a time
- Categories are color-coded for easy identification

## Developer notes

Implementation files:

- Command: `src/content/commands/emoji/command.ts`
- Emoji data and API: `src/content/commands/emoji/api.ts`
- Storage utilities: `src/utils/storage.ts`
