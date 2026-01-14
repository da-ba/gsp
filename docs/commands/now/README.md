# //now Command

Insert formatted date and timestamps into GitHub markdown fields.

## Usage

1. In any GitHub comment/review textarea, type:
   - `//now` to see all date formats
   - `//now iso` to filter to ISO formats
2. Navigate results:
   - Arrow keys to move selection
   - `Enter` or `Tab` to insert
   - `Esc` to close

## Available Formats

### ISO Formats
| Format | Example | Description |
|--------|---------|-------------|
| ISO 8601 | `2024-01-15T14:30:00.000Z` | Full ISO timestamp |
| ISO Date | `2024-01-15` | Date only (YYYY-MM-DD) |

### Local Formats
| Format | Example | Description |
|--------|---------|-------------|
| Local DateTime | `1/15/2024, 2:30:00 PM` | Local date and time |
| Local Date | `1/15/2024` | Local date only |
| Local Time | `2:30:00 PM` | Local time only |

### UTC Formats
| Format | Example | Description |
|--------|---------|-------------|
| UTC DateTime | `Mon, 15 Jan 2024 14:30:00 GMT` | UTC date and time |
| UTC Date | `01/15/2024` | UTC date only |
| UTC Time | `14:30:00` | UTC time only |

### Other Formats
| Format | Example | Description |
|--------|---------|-------------|
| Relative | `just now` | Relative time description |
| Unix Timestamp | `1705329000` | Seconds since Unix epoch |

## Examples

| Input | Description |
|-------|-------------|
| `//now` | Show all date formats |
| `//now iso` | Filter to ISO formats |
| `//now local` | Filter to local formats |
| `//now utc` | Filter to UTC formats |
| `//now unix` | Filter to Unix timestamp |

## What gets inserted

The selected format is inserted as plain text at the cursor position. For example:

- ISO 8601: `2024-01-15T14:30:00.000Z`
- Local Date: `1/15/2024`
- Unix: `1705329000`

## Notes

- Times are based on your local system time
- Local formats depend on your browser's locale settings
- Useful for logging timestamps, meeting notes, or date references

## Developer notes

Implementation files:

- Command: `src/content/commands/now/command.ts`
