import { describe, expect, it, vi } from "vitest"
import { getOrLoadCommandCache, runNonBlocking } from "./command-helpers.ts"
import * as picker from "../picker/index.ts"

describe("command helpers", () => {
  it("returns cached value when present", async () => {
    vi.spyOn(picker, "getCommandCache").mockReturnValue("cached")
    const setSpy = vi.spyOn(picker, "setCommandCache")

    const loader = vi.fn().mockResolvedValue("loaded")
    const value = await getOrLoadCommandCache("test:key", loader)

    expect(value).toBe("cached")
    expect(loader).not.toHaveBeenCalled()
    expect(setSpy).not.toHaveBeenCalled()
  })

  it("loads and caches when value is missing", async () => {
    vi.spyOn(picker, "getCommandCache").mockReturnValue(null)
    const setSpy = vi.spyOn(picker, "setCommandCache")

    const loader = vi.fn().mockResolvedValue("loaded")
    const value = await getOrLoadCommandCache("test:key", loader)

    expect(value).toBe("loaded")
    expect(loader).toHaveBeenCalledOnce()
    expect(setSpy).toHaveBeenCalledWith("test:key", "loaded")
  })

  it("ignores runNonBlocking errors", async () => {
    runNonBlocking(Promise.reject(new Error("boom")))
    await Promise.resolve()
    expect(true).toBe(true)
  })
})
