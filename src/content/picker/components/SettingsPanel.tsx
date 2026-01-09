/**
 * Settings Panel Component
 */

import React from "react"
import { isDarkMode, setThemeOverride } from "../../../utils/theme.ts"
import {
  getThemePreference,
  setThemePreference,
  type ThemePreference,
} from "../../../utils/storage.ts"
import { getOptionsSections } from "../../commands/options-registry.ts"
import { getCardStyles, getBadgeStyles, applyPickerStyles } from "../styles.ts"
import { state } from "../state.ts"

const THEMES: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
]

const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M7.78 12.53a.75.75 0 0 1-1.06 0L2.47 8.28a.75.75 0 0 1 0-1.06l4.25-4.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L4.81 7h7.44a.75.75 0 0 1 0 1.5H4.81l2.97 2.97a.75.75 0 0 1 0 1.06Z" />
  </svg>
)

export type SettingsPanelProps = {
  onBackClick: () => void
}

export function SettingsPanel({ onBackClick }: SettingsPanelProps) {
  const [currentTheme, setCurrentTheme] = React.useState<ThemePreference>("system")
  const [isHovered, setIsHovered] = React.useState(false)
  const cardStyles = getCardStyles()
  const badgeStyles = getBadgeStyles()
  const dark = isDarkMode()

  // Get all registered options sections
  const sections = getOptionsSections()

  // Load current theme preference
  React.useEffect(() => {
    getThemePreference().then(setCurrentTheme)
  }, [])

  const handleThemeChange = async (value: ThemePreference) => {
    await setThemePreference(value)
    setThemeOverride(value)
    setCurrentTheme(value)
    // Refresh picker styles
    if (state.pickerEl) {
      applyPickerStyles(state.pickerEl)
    }
  }

  return (
    <div
      style={{
        overflow: "auto",
        padding: "0 10px 10px 10px",
        flex: "1 1 auto",
        minHeight: 0,
      }}
    >
      {/* Back Button */}
      <div style={{ marginBottom: "10px" }}>
        <button
          type="button"
          data-settings-action="true"
          title="Back"
          onClick={onBackClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px 8px",
            opacity: isHovered ? 1 : 0.72,
            display: "flex",
            alignItems: "center",
            gap: "4px",
            color: dark ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.88)",
            fontSize: "12px",
            fontWeight: 500,
          }}
        >
          <BackIcon />
          Back
        </button>
      </div>

      <div
        style={{
          ...(cardStyles as React.CSSProperties),
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        {/* Theme Section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ fontWeight: 600 }}>Theme</div>
          <div style={{ display: "flex", gap: "6px" }}>
            {THEMES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                data-settings-action="true"
                onClick={(ev) => {
                  ev.preventDefault()
                  ev.stopPropagation()
                  handleThemeChange(value)
                }}
                style={{
                  ...(badgeStyles as React.CSSProperties),
                  cursor: "pointer",
                  padding: "6px 12px",
                  opacity: value === currentTheme ? 1 : undefined,
                  fontWeight: value === currentTheme ? 600 : undefined,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Options Sections from Registry */}
        {sections.map(({ name, component: Component }) => (
          <Component key={name} />
        ))}
      </div>
    </div>
  )
}
