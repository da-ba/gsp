# /giphy

Search and insert GIFs into GitHub markdown textareas.

## Usage

1. In any GitHub comment/review textarea, type:
   - `/giphy cats`
2. Navigate results:
   - Arrow keys to move selection
   - `Enter` or `Tab` to insert
   - `Esc` to close

## API key setup

Giphy requires an API key.

### Option 1: In picker

1. Type `/giphy`
2. Paste your key
3. Click **Test**
4. Click **Save**

### Option 2: Extension options

1. Open `chrome://extensions`
2. Find **GitHub Slash Palette** → **Details**
3. Open **Extension options**
4. Paste the key and click **Save**

## What gets inserted

The command inserts standard Markdown image syntax:

- `![](https://media.giphy.com/media/...)`

## Privacy

- The API key is stored locally via `chrome.storage.local`.
- When you use `/giphy`, your query (and the key) are sent directly to Giphy’s API.

## Developer notes

Implementation files:

- Command: `src/content/commands/giphy/command.ts`
- Giphy API client: `src/content/commands/giphy/api.ts`
- Key storage: `src/utils/storage.ts`
