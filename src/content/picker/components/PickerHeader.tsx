/**
 * Picker Header Component
 */

import React from "react"
import { isDarkMode } from "../../../utils/theme.ts"

export type PickerHeaderProps = {
  title: string
  subtitle: string
  onSettingsClick: () => void
  onClose: () => void
}

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z" />
    <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z" />
  </svg>
)

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
  </svg>
)

export function PickerHeader({ title, subtitle, onSettingsClick, onClose }: PickerHeaderProps) {
  const [settingsHovered, setSettingsHovered] = React.useState(false)
  const [closeHovered, setCloseHovered] = React.useState(false)
  const dark = isDarkMode()

  const iconButtonStyle = (isHovered: boolean): React.CSSProperties => ({
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "4px",
    opacity: isHovered ? 1 : 0.62,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: dark ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.88)",
  })

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

      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <button
          type="button"
          data-settings-btn="true"
          title="Settings"
          onClick={onSettingsClick}
          onMouseEnter={() => setSettingsHovered(true)}
          onMouseLeave={() => setSettingsHovered(false)}
          style={iconButtonStyle(settingsHovered)}
        >
          <SettingsIcon />
        </button>
        <button
          type="button"
          data-close-btn="true"
          title="Close (Esc)"
          onClick={onClose}
          onMouseEnter={() => setCloseHovered(true)}
          onMouseLeave={() => setCloseHovered(false)}
          style={iconButtonStyle(closeHovered)}
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  )
}
