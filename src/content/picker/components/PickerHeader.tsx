/**
 * Picker Header Component
 */

import React from "react"
import { isDarkMode } from "../../../utils/theme.ts"

export type PickerHeaderProps = {
  title: string
  subtitle: string
  onSettingsClick: () => void
  onCloseClick: () => void
}

const CodeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v12.5A1.75 1.75 0 0 1 14.25 16H1.75A1.75 1.75 0 0 1 0 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25Zm7.47 3.97a.75.75 0 0 1 1.06 0l2.5 2.5a.75.75 0 0 1 0 1.06l-2.5 2.5a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734L11.69 8 9.22 5.53a.75.75 0 0 1 0-1.06Zm-4.94 0a.75.75 0 0 1 1.06 1.06L2.81 8l2.47 2.47a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215l-2.5-2.5a.75.75 0 0 1 0-1.06Z" />
  </svg>
)

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z" />
    <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z" />
  </svg>
)

export function PickerHeader({
  title,
  subtitle,
  onSettingsClick,
}: PickerHeaderProps) {
  const [hoveredBtn, setHoveredBtn] = React.useState<"settings" | null>(null)
  const dark = isDarkMode()

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 12px",
        borderBottom: dark ? "1px solid #3d444d" : "1px solid #d0d7de",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ color: dark ? "#8d96a0" : "#656d76", display: "flex" }}>
          <CodeIcon />
        </span>
        <span
          style={{
            fontWeight: 600,
            fontSize: "14px",
            color: dark ? "#e6edf3" : "#1f2328",
          }}
        >
          {title}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span
          style={{
            fontSize: "12px",
            color: dark ? "#8d96a0" : "#656d76",
          }}
        >
          {subtitle}
        </span>
        <button
          type="button"
          data-settings-btn="true"
          title="Settings"
          onClick={onSettingsClick}
          onMouseEnter={() => setHoveredBtn("settings")}
          onMouseLeave={() => setHoveredBtn(null)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            borderRadius: "4px",
            opacity: hoveredBtn === "settings" ? 1 : 0.6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: dark ? "#8d96a0" : "#656d76",
          }}
        >
          <SettingsIcon />
        </button>
      </div>
    </div>
  )
}
