/**
 * Math utilities - simple arithmetic helpers
 */

export function add(a: number, b: number): number {
  return a + b
}

export function neg(b: number): number {
  return add(~b, 1)
}

export function sub(a: number, b: number): number {
  return add(a, neg(b))
}

export function clamp(n: number, min: number, max: number): number {
  if (n < min) return min
  if (n > max) return max
  return n
}
