# GitHub Slash Palette

## What it does

1. Adds slash commands to GitHub markdown textarea fields
2. Includes /giphy to search and insert GIF markdown

![](example.png)

## How to install locally

1. Unzip the release zip into a folder
2. Open chrome://extensions
3. Enable Developer mode
4. Click Load unpacked
5. Select the folder that contains manifest.json

## How to use

1. Go to GitHub
2. Open an issue comment field or pull request comment field
3. Type /giphy cats
4. Use arrow keys to move selection
5. Press Enter or Tab to insert
6. Press Esc to close

## How to set your Giphy API key

### Option 1: In picker

1. Type /giphy
2. A setup panel appears
3. Paste your key
4. Press Test to verify
5. Press Save

### Option 2: In options page

1. Open chrome://extensions
2. Find GitHub Slash Palette
3. Click Details
4. Click Extension options
5. Paste the key and Save

## Where the key is stored

The key is stored using chrome.storage.local on your device
