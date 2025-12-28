/**
 * Mention API - extracts participants from GitHub pages
 */

import { getStorageValue, setStorageValue } from "../../../utils/storage.ts"

// Storage key for recently mentioned users
const STORAGE_KEY_RECENT_MENTIONS = "recentMentions"

/** Maximum number of recent mentions to store */
const MAX_RECENT_MENTIONS = 16

/** Participant type */
export type ParticipantType = "author" | "participant" | "reviewer" | "assignee" | "team" | "recent"

/** Mention item */
export type MentionItem = {
  username: string
  displayName?: string
  avatarUrl?: string
  type: ParticipantType
}

/** Type display labels */
export const TYPE_LABELS: Record<ParticipantType, string> = {
  author: "Author",
  participant: "Participant",
  reviewer: "Reviewer",
  assignee: "Assignee",
  team: "Team",
  recent: "Recent",
}

/**
 * Extract username from a GitHub user link or element
 */
function extractUsername(element: Element): string | null {
  // Try to get from href attribute
  const link = element.closest("a[href]") || element.querySelector("a[href]")
  if (link) {
    const href = link.getAttribute("href") || ""
    // Match GitHub user profile links like /username or github.com/username
    const match = href.match(/^\/([a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)$/)
    if (match && match[1]) return match[1]
    // Also check for team links like /orgs/org/teams/team-name
    const teamMatch = href.match(/^\/orgs\/[^/]+\/teams\/([a-zA-Z0-9-]+)$/)
    if (teamMatch && teamMatch[1]) return teamMatch[1]
  }

  // Try to get from data attributes
  const username =
    element.getAttribute("data-hovercard-url")?.match(/\/users\/([^/]+)/)?.[1] ||
    element.getAttribute("data-octo-click")?.match(/user_([a-zA-Z0-9-]+)/)?.[1]

  return username || null
}

/**
 * Extract avatar URL from user element
 */
function extractAvatarUrl(element: Element): string | null {
  const img = element.querySelector("img.avatar, img.avatar-user, .avatar img")
  if (img) {
    const src = img.getAttribute("src")
    if (src) return src
  }
  return null
}

/**
 * Get the PR/Issue author
 */
function getAuthor(): MentionItem | null {
  // Try to find author in PR/Issue header
  const authorSelectors = [
    // PR author
    '.gh-header-meta a[data-hovercard-type="user"]',
    // Issue author
    '.timeline-comment-header a[data-hovercard-type="user"]',
    // Generic author link
    ".author",
    '[rel="author"]',
  ]

  for (const selector of authorSelectors) {
    const authorEl = document.querySelector(selector)
    if (authorEl) {
      const username = extractUsername(authorEl) || authorEl.textContent?.trim()
      if (username) {
        return {
          username,
          avatarUrl: extractAvatarUrl(authorEl) || undefined,
          type: "author",
        }
      }
    }
  }

  return null
}

/**
 * Get PR reviewers
 */
function getReviewers(): MentionItem[] {
  const reviewers: MentionItem[] = []
  const seen = new Set<string>()

  // Look for reviewer badges in PR sidebar
  const reviewerSelectors = [
    '.sidebar-assignee a[data-hovercard-type="user"]',
    '#reviewers-select-menu a[data-hovercard-type="user"]',
    '.reviewers-status-list a[data-hovercard-type="user"]',
    '.review-status-item a[data-hovercard-type="user"]',
  ]

  for (const selector of reviewerSelectors) {
    const elements = document.querySelectorAll(selector)
    elements.forEach((el) => {
      const username = extractUsername(el) || el.textContent?.trim()
      if (username && !seen.has(username.toLowerCase())) {
        seen.add(username.toLowerCase())
        reviewers.push({
          username,
          avatarUrl: extractAvatarUrl(el) || undefined,
          type: "reviewer",
        })
      }
    })
  }

  return reviewers
}

/**
 * Get assignees
 */
function getAssignees(): MentionItem[] {
  const assignees: MentionItem[] = []
  const seen = new Set<string>()

  const assigneeSelectors = [
    '#assignees-select-menu a[data-hovercard-type="user"]',
    '.sidebar-assignee a[data-hovercard-type="user"]',
    '.js-issue-assignees a[data-hovercard-type="user"]',
  ]

  for (const selector of assigneeSelectors) {
    const elements = document.querySelectorAll(selector)
    elements.forEach((el) => {
      const username = extractUsername(el) || el.textContent?.trim()
      if (username && !seen.has(username.toLowerCase())) {
        seen.add(username.toLowerCase())
        assignees.push({
          username,
          avatarUrl: extractAvatarUrl(el) || undefined,
          type: "assignee",
        })
      }
    })
  }

  return assignees
}

/**
 * Get participants from timeline comments
 */
function getParticipants(): MentionItem[] {
  const participants: MentionItem[] = []
  const seen = new Set<string>()

  // Look for comment authors in timeline
  const participantSelectors = [
    '.timeline-comment-header a[data-hovercard-type="user"]',
    '.comment-body a[data-hovercard-type="user"]',
    '.TimelineItem a[data-hovercard-type="user"]',
    ".participant-avatar",
    ".js-discussion a.author",
  ]

  for (const selector of participantSelectors) {
    const elements = document.querySelectorAll(selector)
    elements.forEach((el) => {
      const username = extractUsername(el) || el.textContent?.trim()
      if (username && !seen.has(username.toLowerCase())) {
        seen.add(username.toLowerCase())
        participants.push({
          username,
          avatarUrl: extractAvatarUrl(el) || undefined,
          type: "participant",
        })
      }
    })
  }

  // Also look for participants in the sidebar
  const sidebarParticipants = document.querySelectorAll(
    ".participation-avatars a, .participation a"
  )
  sidebarParticipants.forEach((el) => {
    const username = extractUsername(el) || el.getAttribute("aria-label")?.replace("@", "")
    if (username && !seen.has(username.toLowerCase())) {
      seen.add(username.toLowerCase())
      participants.push({
        username,
        avatarUrl: extractAvatarUrl(el) || undefined,
        type: "participant",
      })
    }
  })

  return participants
}

/**
 * Get teams mentioned or available
 */
function getTeams(): MentionItem[] {
  const teams: MentionItem[] = []
  const seen = new Set<string>()

  // Look for team mentions in comments
  const teamMentions = document.querySelectorAll('a[href*="/orgs/"][href*="/teams/"]')
  teamMentions.forEach((el) => {
    const href = el.getAttribute("href") || ""
    const match = href.match(/\/orgs\/([^/]+)\/teams\/([^/]+)/)
    if (match) {
      const teamName = `${match[1]}/${match[2]}`
      if (!seen.has(teamName.toLowerCase())) {
        seen.add(teamName.toLowerCase())
        teams.push({
          username: teamName,
          type: "team",
        })
      }
    }
  })

  return teams
}

/**
 * Get all participants from the current page
 */
export function getAllParticipants(): MentionItem[] {
  const all: MentionItem[] = []
  const seen = new Set<string>()

  const addUnique = (item: MentionItem) => {
    const key = item.username.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      all.push(item)
    }
  }

  // Get author first (highest priority)
  const author = getAuthor()
  if (author) addUnique(author)

  // Get assignees
  getAssignees().forEach(addUnique)

  // Get reviewers
  getReviewers().forEach(addUnique)

  // Get participants
  getParticipants().forEach(addUnique)

  // Get teams
  getTeams().forEach(addUnique)

  return all
}

/**
 * Get recently mentioned users from storage
 */
export async function getRecentMentions(): Promise<string[]> {
  return getStorageValue<string[]>(STORAGE_KEY_RECENT_MENTIONS, [])
}

/**
 * Add a user to recently mentioned list
 */
export async function addRecentMention(username: string): Promise<void> {
  const recent = await getRecentMentions()
  // Remove if already exists (to move it to front)
  const filtered = recent.filter((u) => u.toLowerCase() !== username.toLowerCase())
  // Add to front
  filtered.unshift(username)
  // Limit size
  const limited = filtered.slice(0, MAX_RECENT_MENTIONS)
  await setStorageValue(STORAGE_KEY_RECENT_MENTIONS, limited)
}

/**
 * Search mentions by query
 */
export function searchMentions(mentions: MentionItem[], query: string): MentionItem[] {
  const q = (query || "").toLowerCase().trim()
  if (!q) return mentions

  return mentions.filter((item) => {
    // Match username
    if (item.username.toLowerCase().includes(q)) return true
    // Match display name
    if (item.displayName?.toLowerCase().includes(q)) return true
    // Match type
    if (item.type.toLowerCase().includes(q)) return true
    if (TYPE_LABELS[item.type].toLowerCase().includes(q)) return true
    return false
  })
}

/**
 * Get suggestion terms for autocomplete
 */
export function getMentionSuggestions(mentions: MentionItem[]): string[] {
  // Return first few usernames as suggestions
  return mentions.slice(0, 6).map((m) => m.username)
}
