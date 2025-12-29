/**
 * Picker Header Component
 */

import { useState } from "preact/hooks"
import type { JSX } from "preact"
import { isDarkMode } from "../../../utils/theme.ts"
import { getBadgeStyles } from "../styles.ts"

export type PickerHeaderProps = {
  title: string
  subtitle: string
  onSettingsClick: () => void
}

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z" />
    <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z" />
  </svg>
)

export function PickerHeader({ title, subtitle, onSettingsClick }: PickerHeaderProps) {
  const [isHovered, setIsHovered] = useState(false)
  const dark = isDarkMode()
  const badgeStyles = getBadgeStyles()

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 10px 8px 10px",
        height: "44px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <div
          style={{
            fontWeight: 700,
            letterSpacing: "0.4px",
            fontSize: "12px",
            opacity: 0.92,
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: "12px", opacity: 0.72 }}>{subtitle}</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={badgeStyles as JSX.CSSProperties}>Esc close</div>
        <button
          type="button"
          data-settings-btn="true"
          title="Settings"
          onClick={onSettingsClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            opacity: isHovered ? 1 : 0.62,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: dark ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.88)",
          }}
        >
          <SettingsIcon />
        </button>
      </div>
    </div>
  )
}
