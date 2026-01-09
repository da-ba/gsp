
# Privacy Policy

Last updated: 2026-01-09

## Overview

GitHub Slash Palette is a Chrome extension that adds slash commands to GitHub markdown text fields. Available commands include `/giphy`, `/emoji`, `/font`, `/kbd`, `/link`, `/mention`, `/mermaid`, and `/now`.

## Data We Process

### 1. Search Queries

- **`/giphy`**: Your search text is sent to the Giphy API to fetch GIF results.
- **`/link ci`**: Your GitHub token is used to fetch CI job and artifact data from the GitHub API for the current repository only.

### 2. API Keys and Tokens

- **Giphy API Key**: If you enter a Giphy API key, it is stored locally in your browser so the extension can call the Giphy API on your behalf.
- **GitHub Personal Access Token**: If you enter a GitHub token for `/link ci`, it is stored locally in your browser to authenticate with the GitHub API.

### 3. Local Preferences

The extension stores some preferences locally to improve your experience:

- **Recently used emojis** (`/emoji`): Stored locally to show your favorites first.
- **Recently mentioned users** (`/mention`): Stored locally to suggest frequently mentioned users.

## Where Data Is Stored

- All settings, API keys, tokens, and preferences are stored locally on your device using `chrome.storage.local`.
- We do not store any of your data on developer servers.

## Data Sharing and Third Parties

### Giphy

When you use `/giphy`, your search query (and your API key) is sent to Giphy to retrieve results.

### GitHub

When you use `/link ci`, your token is sent to GitHub's API (`api.github.com`) to fetch CI job and artifact data for the current repository.

No other third-party services are contacted by the extension.

## Remote Code

The extension does not download or execute remote code.
It only fetches data and media from the Giphy and GitHub API endpoints as needed.

## Analytics and Tracking

The extension does not use analytics, tracking pixels, advertising identifiers, or any profiling.

## Data Retention and Deletion

- API keys and tokens remain stored until you remove them in the extension options or uninstall the extension.
- Recently used emojis and mentions remain stored until you uninstall the extension.
- Search queries are not stored by the extension.

## Permissions Explanation

- **storage**: Used to save local settings, including API keys, tokens, and recently used items.
- **Host permission `https://api.giphy.com`**: Used for `/giphy` search requests and GIF previews.
- **Host permission `https://api.github.com`**: Used for `/link ci` to fetch CI job and artifact data.

## Contact

If you have questions about this Privacy Policy, contact: info@da-ba.de
