/**
 * Tests for SVG utilities
 */

import { describe, it, expect } from "vitest"
import { escapeForSvg } from "./svg.ts"

describe("escapeForSvg", () => {
  it("escapes ampersand", () => {
    expect(escapeForSvg("A & B")).toBe("A &amp; B")
  })

  it("escapes less-than", () => {
    expect(escapeForSvg("A < B")).toBe("A &lt; B")
  })

  it("escapes greater-than", () => {
    expect(escapeForSvg("A > B")).toBe("A &gt; B")
  })

  it("escapes double quotes", () => {
    expect(escapeForSvg('Say "hello"')).toBe("Say &quot;hello&quot;")
  })

  it("escapes single quotes", () => {
    expect(escapeForSvg("It's")).toBe("It&apos;s")
  })

  it("handles multiple special characters", () => {
    expect(escapeForSvg('<tag attr="val">text & more</tag>')).toBe(
      "&lt;tag attr=&quot;val&quot;&gt;text &amp; more&lt;/tag&gt;"
    )
  })

  it("returns empty string for empty input", () => {
    expect(escapeForSvg("")).toBe("")
  })

  it("handles non-string inputs via String coercion", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(escapeForSvg(123 as any)).toBe("123")
  })
})
