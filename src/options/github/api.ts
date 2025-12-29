/**
 * Shared GitHub API options
 *
 * This module provides storage and retrieval of GitHub API token
 * that can be used by various commands requiring GitHub API access.
 */

import { getStorageValue, setStorageValue } from "../../utils/storage.ts"

// Storage keys for GitHub options
const STORAGE_KEY_GITHUB_TOKEN = "githubApiToken"

/**
 * Get GitHub API token from storage
 */
export async function getGitHubToken(): Promise<string> {
  return getStorageValue<string>(STORAGE_KEY_GITHUB_TOKEN, "")
}

/**
 * Set GitHub API token in storage
 */
export async function setGitHubToken(value: string): Promise<void> {
  await setStorageValue(STORAGE_KEY_GITHUB_TOKEN, value.trim())
}

/**
 * Test if a GitHub API token is valid by making a simple API request
 */
export async function testGitHubToken(token: string): Promise<{ valid: boolean; error?: string }> {
  if (!token) {
    return { valid: false, error: "No token provided" }
  }

  try {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    })

    if (response.ok) {
      return { valid: true }
    }

    if (response.status === 401) {
      return { valid: false, error: "Invalid or expired token" }
    }

    return { valid: false, error: `GitHub API error: ${response.status}` }
  } catch {
    return { valid: false, error: "Network error while connecting to GitHub" }
  }
}

/**
 * Extract owner and repo from the current GitHub page URL
 */
export function getRepoContext(): { owner: string; repo: string } | null {
  // Check if we're on a GitHub page
  if (typeof window === "undefined" || !window.location) {
    return null
  }

  const url = window.location.href
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/)
  if (match && match[1] && match[2]) {
    return { owner: match[1], repo: match[2] }
  }

  return null
}

/** GitHub workflow run data */
export type GitHubWorkflowRun = {
  id: number
  name: string
  head_branch: string
  status: string
  conclusion: string | null
  html_url: string
  created_at: string
}

/** GitHub workflow job data */
export type GitHubWorkflowJob = {
  id: number
  run_id: number
  name: string
  status: string
  conclusion: string | null
  html_url: string
}

/** GitHub artifact data */
export type GitHubArtifact = {
  id: number
  name: string
  archive_download_url: string
  expired: boolean
  created_at: string
}

/** Result type for GitHub API operations */
export type GitHubApiResult<T> = {
  data?: T
  error?: string
}

/**
 * Fetch recent workflow runs for a repository
 */
export async function getWorkflowRuns(
  token: string,
  owner: string,
  repo: string,
  limit = 5
): Promise<GitHubApiResult<GitHubWorkflowRun[]>> {
  if (!token) {
    return { error: "GitHub token not configured" }
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    )

    if (!response.ok) {
      if (response.status === 401) {
        return { error: "Invalid GitHub token" }
      }
      if (response.status === 404) {
        return { error: "Repository not found or no workflow runs" }
      }
      return { error: `GitHub API error: ${response.status}` }
    }

    const json = await response.json()
    return { data: json.workflow_runs || [] }
  } catch {
    return { error: "Network error while fetching workflow runs" }
  }
}

/**
 * Fetch jobs for a specific workflow run
 */
export async function getWorkflowJobs(
  token: string,
  owner: string,
  repo: string,
  runId: number
): Promise<GitHubApiResult<GitHubWorkflowJob[]>> {
  if (!token) {
    return { error: "GitHub token not configured" }
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}/jobs`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    )

    if (!response.ok) {
      if (response.status === 401) {
        return { error: "Invalid GitHub token" }
      }
      return { error: `GitHub API error: ${response.status}` }
    }

    const json = await response.json()
    return { data: json.jobs || [] }
  } catch {
    return { error: "Network error while fetching workflow jobs" }
  }
}

/**
 * Fetch artifacts for a specific workflow run
 */
export async function getWorkflowArtifacts(
  token: string,
  owner: string,
  repo: string,
  runId: number
): Promise<GitHubApiResult<GitHubArtifact[]>> {
  if (!token) {
    return { error: "GitHub token not configured" }
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}/artifacts`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    )

    if (!response.ok) {
      if (response.status === 401) {
        return { error: "Invalid GitHub token" }
      }
      return { error: `GitHub API error: ${response.status}` }
    }

    const json = await response.json()
    return { data: json.artifacts || [] }
  } catch {
    return { error: "Network error while fetching artifacts" }
  }
}

/**
 * Search for CI jobs and artifacts matching a query
 */
export type CILinkSuggestion = {
  type: "job" | "artifact"
  name: string
  url: string
  runName: string
  runId: number
}

/**
 * Fuzzy match a query against a string
 */
export function fuzzyMatch(query: string, target: string): boolean {
  const q = query.toLowerCase()
  const t = target.toLowerCase()
  return t.includes(q)
}

/**
 * Search for CI resources (jobs and artifacts) matching a query
 */
export async function searchCIResources(
  token: string,
  owner: string,
  repo: string,
  query: string
): Promise<GitHubApiResult<CILinkSuggestion[]>> {
  if (!token) {
    return { error: "GitHub token not configured" }
  }

  const suggestions: CILinkSuggestion[] = []
  const searchQuery = query.trim().toLowerCase()

  // Get recent workflow runs
  const runsResult = await getWorkflowRuns(token, owner, repo, 5)
  if (runsResult.error) {
    return { error: runsResult.error }
  }

  const runs = runsResult.data || []

  // For each run, get jobs and artifacts
  for (const run of runs) {
    // Get jobs for this run
    const jobsResult = await getWorkflowJobs(token, owner, repo, run.id)
    if (jobsResult.data) {
      for (const job of jobsResult.data) {
        if (!searchQuery || fuzzyMatch(searchQuery, job.name)) {
          suggestions.push({
            type: "job",
            name: job.name,
            url: job.html_url,
            runName: run.name,
            runId: run.id,
          })
        }
      }
    }

    // Get artifacts for this run
    const artifactsResult = await getWorkflowArtifacts(token, owner, repo, run.id)
    if (artifactsResult.data) {
      for (const artifact of artifactsResult.data) {
        if (!artifact.expired && (!searchQuery || fuzzyMatch(searchQuery, artifact.name))) {
          // Construct a browser-friendly URL for the artifact
          // The archive_download_url requires authentication, so we link to the Actions page instead
          const artifactUrl = `https://github.com/${owner}/${repo}/actions/runs/${run.id}/artifacts/${artifact.id}`
          suggestions.push({
            type: "artifact",
            name: artifact.name,
            url: artifactUrl,
            runName: run.name,
            runId: run.id,
          })
        }
      }
    }
  }

  return { data: suggestions }
}
