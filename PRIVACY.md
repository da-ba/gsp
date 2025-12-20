
# Privacy Policy

Last updated: 2025-12-20

## Overview

GitHub Slash Palette is a Chrome extension that adds slash commands to GitHub markdown text fields. It currently supports `/giphy` to search for GIFs and insert them as markdown.

## Data We Process

### 1. Search Queries
When you use `/giphy`, the text you type after the command is sent to the Giphy API to fetch GIF search results and previews.

### 2. Giphy API Key
If you enter a Giphy API key, it is stored locally in your browser so the extension can call the Giphy API on your behalf.

## Where Data Is Stored

- The Giphy API key is stored locally on your device using `chrome.storage.local`.
- We do not store your API key or queries on any developer server.

## Data Sharing and Third Parties

### Giphy
When you use `/giphy`, your search query is sent to Giphy to retrieve results.
No other third party services are contacted by the extension.

## Remote Code

The extension does not download or execute remote code.
It only fetches data and media from the Giphy API endpoints needed for search results and GIF previews.

## Analytics and Tracking

The extension does not use analytics, tracking pixels, advertising identifiers, or any profiling.

## Data Retention and Deletion

Your Giphy API key remains stored until you remove it in the extension options or uninstall the extension.
Search queries are not stored by the extension.

## Permissions Explanation

- **storage**: Used to save local settings, including the user provided Giphy API key.
- **Host permission**: `https://api.giphy.com` — Used to send `/giphy` search requests and load GIF previews.

## Contact

If you have questions about this Privacy Policy, contact: info@da-ba.de
