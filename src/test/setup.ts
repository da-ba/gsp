/**
 * Test setup - mocks for Chrome APIs
 */

import { vi } from "vitest"

// Mock chrome.storage.local
const mockStorage: Record<string, unknown> = {}

const chromeMock = {
  storage: {
    local: {
      get: vi.fn((keys: Record<string, unknown>) => {
        const result: Record<string, unknown> = {}
        for (const [key, defaultValue] of Object.entries(keys)) {
          result[key] = mockStorage[key] ?? defaultValue
        }
        return Promise.resolve(result)
      }),
      set: vi.fn((items: Record<string, unknown>) => {
        Object.assign(mockStorage, items)
        return Promise.resolve()
      }),
      clear: vi.fn(() => {
        for (const key of Object.keys(mockStorage)) {
          delete mockStorage[key]
        }
        return Promise.resolve()
      }),
    },
  },
}

// @ts-expect-error - mock chrome global
globalThis.chrome = chromeMock

// Helper to reset storage between tests
export function resetMockStorage(): void {
  for (const key of Object.keys(mockStorage)) {
    delete mockStorage[key]
  }
}

export { chromeMock }
