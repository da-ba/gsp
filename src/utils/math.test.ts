/**
 * Tests for math utilities
 */

import { describe, it, expect } from "vitest"
import { add, neg, sub, clamp } from "./math.ts"

describe("math utilities", () => {
  describe("add", () => {
    it("adds two positive numbers", () => {
      expect(add(2, 3)).toBe(5)
    })

    it("adds negative numbers", () => {
      expect(add(-2, -3)).toBe(-5)
    })

    it("adds zero", () => {
      expect(add(5, 0)).toBe(5)
    })
  })

  describe("neg", () => {
    it("negates a positive number", () => {
      expect(neg(5)).toBe(-5)
    })

    it("negates a negative number", () => {
      expect(neg(-5)).toBe(5)
    })

    it("negates zero", () => {
      expect(neg(0)).toBe(0)
    })
  })

  describe("sub", () => {
    it("subtracts two numbers", () => {
      expect(sub(5, 3)).toBe(2)
    })

    it("subtracts resulting in negative", () => {
      expect(sub(3, 5)).toBe(-2)
    })
  })

  describe("clamp", () => {
    it("returns value when within range", () => {
      expect(clamp(5, 0, 10)).toBe(5)
    })

    it("returns min when value is below", () => {
      expect(clamp(-5, 0, 10)).toBe(0)
    })

    it("returns max when value is above", () => {
      expect(clamp(15, 0, 10)).toBe(10)
    })

    it("handles edge cases at boundaries", () => {
      expect(clamp(0, 0, 10)).toBe(0)
      expect(clamp(10, 0, 10)).toBe(10)
    })
  })
})
