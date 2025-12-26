/**
 * Tests for Giphy API utilities
 */

import { describe, it, expect } from "vitest";
import { formatGifInsert } from "./api.ts";

describe("formatGifInsert", () => {
  const testUrl = "https://example.com/image.gif";

  describe("markdown format", () => {
    it("returns markdown image syntax", () => {
      const result = formatGifInsert(testUrl, "markdown", false);
      expect(result).toBe(`![](${testUrl})`);
    });

    it("wraps with centering when center is true", () => {
      const result = formatGifInsert(testUrl, "markdown", true);
      expect(result).toBe(`<p align="center">![](${testUrl})</p>`);
    });
  });

  describe("img format", () => {
    it("returns img tag syntax", () => {
      const result = formatGifInsert(testUrl, "img", false);
      expect(result).toBe(`<img src="${testUrl}" />`);
    });

    it("wraps with centering when center is true", () => {
      const result = formatGifInsert(testUrl, "img", true);
      expect(result).toBe(`<p align="center"><img src="${testUrl}" /></p>`);
    });
  });

  describe("img-fixed format", () => {
    it("returns img tag with width attribute", () => {
      const result = formatGifInsert(testUrl, "img-fixed", false);
      expect(result).toBe(`<img src="${testUrl}" width="350" />`);
    });

    it("wraps with centering when center is true", () => {
      const result = formatGifInsert(testUrl, "img-fixed", true);
      expect(result).toBe(`<p align="center"><img src="${testUrl}" width="350" /></p>`);
    });
  });

  describe("edge cases", () => {
    it("handles URL with special characters", () => {
      const specialUrl = "https://example.com/image?foo=bar&baz=qux";
      const result = formatGifInsert(specialUrl, "markdown", false);
      expect(result).toBe(`![](${specialUrl})`);
    });

    it("defaults to markdown for unknown format", () => {
      // @ts-expect-error - testing fallback behavior with invalid format
      const result = formatGifInsert(testUrl, "unknown", false);
      expect(result).toBe(`![](${testUrl})`);
    });
  });
});
