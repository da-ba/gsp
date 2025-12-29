/**
 * Tests for the GitHub API module
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// Mock chrome storage API
vi.stubGlobal("chrome", {
  storage: {
    local: {
      get: vi.fn().mockImplementation((defaults) => Promise.resolve(defaults)),
      set: vi.fn().mockResolvedValue(undefined),
    },
  },
})

// Import after mocking chrome
import {
  getGitHubToken,
  setGitHubToken,
  testGitHubToken,
  getRepoContext,
  fuzzyMatch,
  type GitHubWorkflowRun,
  type GitHubWorkflowJob,
  type GitHubArtifact,
} from "./api.ts"

// Helper to mock fetch
function mockFetch(response: object, status = 200) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(response),
  } as Response)
}

describe("GitHub Token Storage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("getGitHubToken returns empty string when no token is stored", async () => {
    chrome.storage.local.get = vi.fn().mockResolvedValue({ githubApiToken: "" })

    const token = await getGitHubToken()
    expect(token).toBe("")
  })

  it("getGitHubToken returns stored token", async () => {
    chrome.storage.local.get = vi.fn().mockResolvedValue({ githubApiToken: "test-token-123" })

    const token = await getGitHubToken()
    expect(token).toBe("test-token-123")
  })

  it("setGitHubToken stores token", async () => {
    const mockSet = vi.fn().mockResolvedValue(undefined)
    chrome.storage.local.set = mockSet

    await setGitHubToken("new-token-456")

    expect(mockSet).toHaveBeenCalledWith({ githubApiToken: "new-token-456" })
  })

  it("setGitHubToken trims whitespace", async () => {
    const mockSet = vi.fn().mockResolvedValue(undefined)
    chrome.storage.local.set = mockSet

    await setGitHubToken("  token-with-spaces  ")

    expect(mockSet).toHaveBeenCalledWith({ githubApiToken: "token-with-spaces" })
  })
})

describe("testGitHubToken", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("returns invalid for empty token", async () => {
    const result = await testGitHubToken("")
    expect(result.valid).toBe(false)
    expect(result.error).toBe("No token provided")
  })

  it("returns valid for successful API response", async () => {
    const fetchMock = mockFetch({ login: "testuser" }, 200)

    const result = await testGitHubToken("valid-token")

    expect(result.valid).toBe(true)
    expect(fetchMock).toHaveBeenCalledWith("https://api.github.com/user", {
      headers: {
        Authorization: "Bearer valid-token",
        Accept: "application/vnd.github.v3+json",
      },
    })
  })

  it("returns invalid for 401 response", async () => {
    mockFetch({}, 401)

    const result = await testGitHubToken("invalid-token")

    expect(result.valid).toBe(false)
    expect(result.error).toBe("Invalid or expired token")
  })

  it("returns invalid for other error responses", async () => {
    mockFetch({}, 500)

    const result = await testGitHubToken("some-token")

    expect(result.valid).toBe(false)
    expect(result.error).toBe("GitHub API error: 500")
  })

  it("handles network errors", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"))

    const result = await testGitHubToken("some-token")

    expect(result.valid).toBe(false)
    expect(result.error).toBe("Network error while connecting to GitHub")
  })
})

describe("getRepoContext", () => {
  const originalWindow = globalThis.window

  beforeEach(() => {
    // Reset window mock
    vi.stubGlobal("window", {
      location: {
        href: "",
      },
    })
  })

  afterEach(() => {
    vi.stubGlobal("window", originalWindow)
  })

  it("returns null when window is undefined", () => {
    vi.stubGlobal("window", undefined)
    const result = getRepoContext()
    expect(result).toBeNull()
  })

  it("returns null for non-GitHub URLs", () => {
    window.location.href = "https://example.com/something"
    const result = getRepoContext()
    expect(result).toBeNull()
  })

  it("extracts owner and repo from GitHub repo URL", () => {
    window.location.href = "https://github.com/owner/repo"
    const result = getRepoContext()
    expect(result).toEqual({ owner: "owner", repo: "repo" })
  })

  it("extracts owner and repo from GitHub issue URL", () => {
    window.location.href = "https://github.com/owner/repo/issues/123"
    const result = getRepoContext()
    expect(result).toEqual({ owner: "owner", repo: "repo" })
  })

  it("extracts owner and repo from GitHub PR URL", () => {
    window.location.href = "https://github.com/owner/repo/pull/456"
    const result = getRepoContext()
    expect(result).toEqual({ owner: "owner", repo: "repo" })
  })

  it("extracts owner and repo from GitHub actions URL", () => {
    window.location.href = "https://github.com/owner/repo/actions/runs/789"
    const result = getRepoContext()
    expect(result).toEqual({ owner: "owner", repo: "repo" })
  })
})

describe("fuzzyMatch", () => {
  it("returns true for exact match", () => {
    expect(fuzzyMatch("test", "test")).toBe(true)
  })

  it("returns true for substring match", () => {
    expect(fuzzyMatch("e2e", "e2e-tests")).toBe(true)
  })

  it("returns true for case-insensitive match", () => {
    expect(fuzzyMatch("TEST", "test")).toBe(true)
    expect(fuzzyMatch("test", "TEST")).toBe(true)
  })

  it("returns false for non-matching strings", () => {
    expect(fuzzyMatch("xyz", "abc")).toBe(false)
  })

  it("returns true for empty query", () => {
    expect(fuzzyMatch("", "anything")).toBe(true)
  })
})

describe("GitHub API Types", () => {
  it("GitHubWorkflowRun has expected structure", () => {
    const run: GitHubWorkflowRun = {
      id: 123,
      name: "CI",
      head_branch: "main",
      status: "completed",
      conclusion: "success",
      html_url: "https://github.com/owner/repo/actions/runs/123",
      created_at: "2024-01-01T00:00:00Z",
    }

    expect(run.id).toBe(123)
    expect(run.name).toBe("CI")
  })

  it("GitHubWorkflowJob has expected structure", () => {
    const job: GitHubWorkflowJob = {
      id: 456,
      run_id: 123,
      name: "build",
      status: "completed",
      conclusion: "success",
      html_url: "https://github.com/owner/repo/actions/runs/123/jobs/456",
    }

    expect(job.id).toBe(456)
    expect(job.run_id).toBe(123)
  })

  it("GitHubArtifact has expected structure", () => {
    const artifact: GitHubArtifact = {
      id: 789,
      name: "test-report",
      archive_download_url: "https://api.github.com/artifacts/789/zip",
      expired: false,
      created_at: "2024-01-01T00:00:00Z",
    }

    expect(artifact.id).toBe(789)
    expect(artifact.name).toBe("test-report")
  })
})
