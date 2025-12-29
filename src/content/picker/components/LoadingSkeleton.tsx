/**
 * Loading Skeleton Component - SolidJS version
 */

import { onMount, onCleanup, For } from "solid-js"
import type { JSX } from "solid-js"
import { getSkeletonStyles } from "../styles.ts"

export function LoadingSkeleton() {
  const skeletonStyles = getSkeletonStyles()

  return (
    <div
      style={{
        overflow: "auto",
        padding: "0 10px 10px 10px",
        flex: "1 1 auto",
        "min-height": "0",
      }}
    >
      <div
        style={{
          display: "grid",
          "grid-template-columns": "repeat(3, 1fr)",
          gap: "8px",
        }}
      >
        <For each={Array.from({ length: 12 })}>{() => <SkeletonBox styles={skeletonStyles} />}</For>
      </div>
    </div>
  )
}

function SkeletonBox(props: { styles: Partial<CSSStyleDeclaration> }) {
  let boxRef: HTMLDivElement | undefined
  let animation: Animation | undefined

  onMount(() => {
    if (!boxRef) return
    try {
      animation = boxRef.animate([{ opacity: 0.55 }, { opacity: 0.9 }, { opacity: 0.55 }], {
        duration: 900,
        iterations: Infinity,
      })
    } catch {
      // Animation not supported
    }
  })

  onCleanup(() => {
    if (animation) animation.cancel()
  })

  return <div ref={boxRef} style={props.styles as JSX.CSSProperties} />
}
