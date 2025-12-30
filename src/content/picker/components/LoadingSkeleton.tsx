/**
 * Loading Skeleton Component
 */

import React from "react"
import { getSkeletonStyles } from "../styles.ts"

export function LoadingSkeleton() {
  const skeletonStyles = getSkeletonStyles()

  return (
    <div
      style={{
        overflow: "auto",
        padding: "0 10px 10px 10px",
        flex: "1 1 auto",
        minHeight: 0,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "8px",
        }}
      >
        {Array.from({ length: 12 }).map((_, idx) => (
          <SkeletonBox key={idx} styles={skeletonStyles} />
        ))}
      </div>
    </div>
  )
}

function SkeletonBox({ styles }: { styles: Partial<CSSStyleDeclaration> }) {
  const boxRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const el = boxRef.current
    if (!el) return

    try {
      const animation = el.animate([{ opacity: 0.55 }, { opacity: 0.9 }, { opacity: 0.55 }], {
        duration: 900,
        iterations: Infinity,
      })
      return () => animation.cancel()
    } catch {
      // Animation not supported
    }
  }, [])

  return <div ref={boxRef} style={styles as React.CSSProperties} />
}
