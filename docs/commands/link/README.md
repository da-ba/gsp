# /link Command

Insert markdown links with auto-generated titles.

## Usage

```
/link                           – Opens the link picker with empty state
/link example.com               – Prefills with URL, auto-generates title from domain
/link example.com "My Title"    – Prefills URL and custom title
/link https://example.com/path  – Works with full URLs
```

## Features

- **Auto-generated titles**: When you type a URL without a title, the domain is automatically extracted and used as the link title
- **Custom titles**: Add a title in quotes after the URL to override the auto-generated title
- **Protocol handling**: URLs without a protocol get `https://` added automatically
- **Preview**: See a preview of the link before inserting

## Examples

| Input | Output |
|-------|--------|
| `/link google.com` | `[google.com](https://google.com)` |
| `/link github.com/repo "GitHub Repo"` | `[GitHub Repo](https://github.com/repo)` |
| `/link https://docs.example.com` | `[docs.example.com](https://docs.example.com)` |
| `/link www.example.com` | `[example.com](https://www.example.com)` |

## How it works

1. Type `/link` followed by a URL
2. The picker shows a preview of the markdown link
3. Press Enter to insert the link at the cursor position
4. Optionally add a custom title in quotes after the URL
