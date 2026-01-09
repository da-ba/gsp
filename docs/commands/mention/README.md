# /mention Command

The `/mention` command provides context-aware mention autocomplete for GitHub issues and pull requests.

## Usage

1. In any GitHub markdown field (issue, PR comment, etc.), type `/mention`
2. The picker will show participants from the current page:
   - **Author** - The creator of the issue/PR
   - **Reviewers** - Assigned reviewers on PRs
   - **Assignees** - Assigned users
   - **Participants** - Users who have commented
   - **Teams** - Teams mentioned in the discussion
   - **Recent** - Your recently mentioned users
3. Use arrow keys to navigate and Enter to select
4. Type to filter participants by username

## Features

- **Context-aware**: Automatically discovers participants from the current GitHub page
- **Recent mentions**: Remembers your recently mentioned users across sessions
- **Team support**: Can mention GitHub teams like `@org/team-name`
- **Quick filtering**: Type to filter the list of participants

## Examples

- `/mention` - Show all participants and recent mentions
- `/mention john` - Filter to users containing "john"
- `/mention team` - Show team mentions

## Participant Types

| Type | Description | Badge Color |
|------|-------------|-------------|
| Author | Issue/PR creator | Purple |
| Reviewer | PR reviewers | Blue |
| Assignee | Assigned users | Green |
| Participant | Commenters | Gray |
| Team | GitHub teams | Amber |
| Recent | Your recent mentions | Pink |

## Notes

- The command extracts participants from the visible page content
- Recently mentioned users are stored locally and persist across sessions
- Teams are detected from existing mentions in the discussion

## Developer notes

Implementation files:

- Command: `src/content/commands/mention/command.ts`
- Participant extraction: `src/content/commands/mention/api.ts`
- Storage utilities: `src/utils/storage.ts`
