/**
 * Tests for storage utilities
 */

import { describe, it, expect, beforeEach } from "vitest"
import { getStorageValue, setStorageValue } from "./storage.ts"
import { resetMockStorage } from "../test/setup.ts"

describe("storage utilities", () => {
  beforeEach(() => {
    resetMockStorage()
  })

  describe("getStorageValue", () => {
    it("returns default value when no key is stored", async () => {
      const val = await getStorageValue<string>("testKey", "default")
      expect(val).toBe("default")
    })

    it("returns stored value", async () => {
      await setStorageValue("testKey", "test-value")
      const val = await getStorageValue<string>("testKey", "")
      expect(val).toBe("test-value")
    })

    it("returns stored object", async () => {
      await setStorageValue("objKey", { foo: "bar" })
      const val = await getStorageValue<{ foo: string }>("objKey", { foo: "" })
      expect(val).toEqual({ foo: "bar" })
    })
  })

  describe("setStorageValue", () => {
    it("stores a value", async () => {
      await setStorageValue("myKey", "my-value")
      const val = await getStorageValue<string>("myKey", "")
      expect(val).toBe("my-value")
    })

    it("overwrites existing value", async () => {
      await setStorageValue("key", "first")
      await setStorageValue("key", "second")
      const val = await getStorageValue<string>("key", "")
      expect(val).toBe("second")
    })

    it("handles empty string", async () => {
      await setStorageValue("key", "some-value")
      await setStorageValue("key", "")
      const val = await getStorageValue<string>("key", "default")
      expect(val).toBe("")
    })
  })
})
