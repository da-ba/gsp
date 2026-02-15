import { getCommandCache, setCommandCache } from "../picker/index.ts"

/**
 * Returns a cached command value or loads and stores it.
 */
export async function getOrLoadCommandCache<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const cached = getCommandCache<T>(key)
  if (cached !== null) {
    return cached
  }

  const loaded = await loader()
  setCommandCache(key, loaded)
  return loaded
}

/**
 * Handles non-critical async side effects without surfacing errors.
 */
export function runNonBlocking(task: Promise<unknown>): void {
  task.catch(() => {
    // non-critical side effect; intentionally ignored
  })
}
