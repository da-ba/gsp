# GitHub API Options

Shared GitHub API token configuration for commands that require GitHub API access.

## Features that require a token

- [`//link artifact`](../../commands/link/README.md) – Link to CI artifacts
- [`//link job`](../../commands/link/README.md) – Link to CI jobs

## Token Setup

### Option 1: In picker settings

1. Type `//link artifact` or click the settings gear icon in any picker
2. Find the **GitHub Token** section
3. Paste your Personal Access Token
4. Click **Save**

### Option 2: Extension options page

1. Open `chrome://extensions`
2. Find **GitHub Slash Palette** → **Details**
3. Click **Extension options**
4. Find **GitHub API** section
5. Paste your token and click **Save**

## Creating a Personal Access Token

1. Go to [GitHub Settings → Personal Access Tokens](https://github.com/settings/tokens/new)
2. Give it a description like "GitHub Slash Palette"
3. Select the appropriate scope:
   - **public_repo** – For public repositories only
   - **repo** – For both public and private repositories
4. Click **Generate token**
5. Copy the token and paste it in the extension settings

**Note**: The `repo` scope provides access to private repository data. Only use it if you need CI links for private repos.

## Token Storage

- The token is stored using `chrome.storage.local` on your device only
- It is never sent to any server other than GitHub's API
- You can clear the token at any time from the settings

## Testing the Token

Click the **Test** button in settings to verify your token is valid. The extension will make a simple API request to check authentication.

## Privacy

When using features that require the GitHub token:

- API requests are made directly to `api.github.com`
- Only data from the current repository context is fetched
- No data is stored externally or shared with third parties

See the main [Privacy Policy](../../../PRIVACY.md) for more information.

## Developer Notes

Implementation files:

- API client: `src/options/github/api.ts`
- Options UI: `src/options/github/GitHubOptionsSection.tsx`
- Storage utilities: `src/utils/storage.ts`

### API Functions

```typescript
// Get the stored token
getGitHubToken(): Promise<string>

// Set the token
setGitHubToken(token: string): Promise<void>

// Test if a token is valid
testGitHubToken(token: string): Promise<{ valid: boolean; error?: string }>

// Get current repo context from URL
getRepoContext(): { owner: string; repo: string } | null

// Search for CI resources (jobs and artifacts)
searchCIResources(token, owner, repo, query): Promise<CILinkSuggestion[]>
```
