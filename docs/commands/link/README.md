# //link Command

Insert markdown links with auto-generated titles.

## Usage

```
//link                           – Opens the link picker with empty state
//link example.com               – Prefills with URL, auto-generates title from domain
//link example.com "My Title"    – Prefills URL and custom title
//link https://example.com/path  – Works with full URLs
```

## Features

- **Auto-generated titles**: When you type a URL without a title, the domain is automatically extracted and used as the link title
- **Custom titles**: Add a title in quotes after the URL to override the auto-generated title
- **Protocol handling**: URLs without a protocol get `https://` added automatically
- **Preview**: See a preview of the link before inserting

## Examples

| Input | Output |
|-------|--------|
| `//link google.com` | `[google.com](https://google.com)` |
| `//link github.com/repo "GitHub Repo"` | `[GitHub Repo](https://github.com/repo)` |
| `//link https://docs.example.com` | `[docs.example.com](https://docs.example.com)` |
| `//link www.example.com` | `[example.com](https://www.example.com)` |

## How it works

1. Type `//link` followed by a URL
2. The picker shows a preview of the markdown link
3. Press Enter to insert the link at the cursor position
4. Optionally add a custom title in quotes after the URL

---

# //link ci Subcommand

Link to CI jobs and artifacts from the current repository.

## Requirements

This subcommand requires a GitHub Personal Access Token. See [GitHub API Options](../../options/github/README.md) for setup instructions.

## Usage

```
//link ci                        – Shows recent CI jobs and artifacts
//link ci <query>                – Fuzzy search for matching jobs/artifacts
//link ci e2e                    – Links to jobs containing "e2e"
//link ci report                 – Links to artifacts containing "report"
```

## Features

- **Job links**: Shows recent workflow jobs with status indicators
- **Artifact links**: Shows available artifacts from recent runs
- **Fuzzy matching**: Search by partial name across job and artifact names
- **Quick setup**: Click the "GitHub token required" tile to open settings

## Examples

| Input | Output |
|-------|--------|
| `//link ci` | Shows all recent CI jobs and artifacts |
| `//link ci build` | Links to jobs/artifacts containing "build" |
| `//link ci test-report` | Links to artifacts containing "test-report" |

## Token Setup

1. Type `//link ci` - if no token is configured, you'll see a setup tile
2. Click the setup tile to open settings
3. Paste your GitHub Personal Access Token
4. Click Save

Alternatively, configure the token in [extension options](../../options/github/README.md).

## What gets inserted

The command inserts standard Markdown link syntax:

- Jobs: `[job-name](https://github.com/owner/repo/actions/runs/123/job/456)`
- Artifacts: `[artifact-name](https://github.com/owner/repo/actions/runs/123)`

## Privacy

- The GitHub token is stored locally via `chrome.storage.local`
- When you use `//link ci`, your token is used to fetch workflow data from GitHub's API
- Only data from the current repository is fetched

## Developer notes

Implementation files:

- Command: `src/content/commands/link/command.ts`
- Link API: `src/content/commands/link/api.ts`
- GitHub API client: `src/options/github/api.ts`
- GitHub options: `src/options/github/GitHubOptionsSection.tsx`
