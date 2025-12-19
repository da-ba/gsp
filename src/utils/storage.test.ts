/**
 * Tests for storage utilities
 */

import { describe, it, expect, beforeEach } from "vitest";
import { getGiphyKey, setGiphyKey } from "./storage.ts";
import { resetMockStorage } from "../test/setup.ts";

describe("storage utilities", () => {
  beforeEach(() => {
    resetMockStorage();
  });

  describe("getGiphyKey", () => {
    it("returns empty string when no key is stored", async () => {
      const key = await getGiphyKey();
      expect(key).toBe("");
    });

    it("returns stored key", async () => {
      await setGiphyKey("test-api-key");
      const key = await getGiphyKey();
      expect(key).toBe("test-api-key");
    });

    it("trims whitespace from key", async () => {
      await setGiphyKey("  spaced-key  ");
      const key = await getGiphyKey();
      expect(key).toBe("spaced-key");
    });
  });

  describe("setGiphyKey", () => {
    it("stores a key", async () => {
      await setGiphyKey("my-api-key");
      const key = await getGiphyKey();
      expect(key).toBe("my-api-key");
    });

    it("overwrites existing key", async () => {
      await setGiphyKey("first-key");
      await setGiphyKey("second-key");
      const key = await getGiphyKey();
      expect(key).toBe("second-key");
    });

    it("handles empty string", async () => {
      await setGiphyKey("some-key");
      await setGiphyKey("");
      const key = await getGiphyKey();
      expect(key).toBe("");
    });
  });
});
