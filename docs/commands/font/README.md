# //font Command

Apply font styling (sizes, colors, styles) to text using HTML and markdown formatting that works in GitHub markdown.

## Usage

1. In any GitHub comment/review textarea, type:
   - `//font` to see all available font styles
   - `//font bold` to filter to bold style
   - `//font your text` to apply style to "your text"
2. Navigate results:
   - Arrow keys to move selection
   - `Enter` or `Tab` to insert
   - `Esc` to close

## Available Styles

### Sizes

| Style | Template | Output |
|-------|----------|--------|
| Tiny | `<sub>text</sub>` | <sub>text</sub> |
| Small | `<sup>text</sup>` | <sup>text</sup> |
| Large | `## text` | Heading level 2 |
| Huge | `# text` | Heading level 1 |

### Colors

| Style | Template |
|-------|----------|
| Red | `$\color{red}{\textsf{text}}$` |
| Blue | `$\color{blue}{\textsf{text}}$` |
| Green | `$\color{green}{\textsf{text}}$` |
| Orange | `$\color{orange}{\textsf{text}}$` |
| Purple | `$\color{purple}{\textsf{text}}$` |
| Gray | `$\color{gray}{\textsf{text}}$` |

### Text Styles

| Style | Template | Output |
|-------|----------|--------|
| Bold | `**text**` | **text** |
| Italic | `*text*` | *text* |
| Bold Italic | `***text***` | ***text*** |
| Strikethrough | `~~text~~` | ~~text~~ |
| Code | `` `text` `` | `text` |
| Quote | `> text` | Blockquote |

## Examples

| Input | Description |
|-------|-------------|
| `//font` | Show all font styles |
| `//font bold` | Filter to bold style |
| `//font red` | Filter to red color |
| `//font large` | Filter to large size |

## What gets inserted

Text after `//font` is used as the content. If no text is provided, "text" is used as a placeholder.

For example, `//font Hello World` with Bold selected inserts:
- `**Hello World**`

## Notes

- Colors use LaTeX syntax which GitHub renders in markdown
- Size styles use HTML tags or markdown headers
- Text styles use standard markdown syntax

## Developer notes

Implementation files:

- Command: `src/content/commands/font/command.ts`
