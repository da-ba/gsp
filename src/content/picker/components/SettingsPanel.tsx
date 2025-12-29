/**
 * Settings Panel Component
 */

import { useState, useEffect, useRef } from "preact/hooks"
import type { JSX } from "preact"
import { setThemeOverride } from "../../../utils/theme.ts"
import {
  getThemePreference,
  setThemePreference,
  type ThemePreference,
} from "../../../utils/storage.ts"
import { listCommands, getCommand } from "../../commands/registry.ts"
import { getCardStyles, getBadgeStyles, applyPickerStyles } from "../styles.ts"
import { state } from "../state.ts"

const THEMES: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
]

export function SettingsPanel() {
  const [currentTheme, setCurrentTheme] = useState<ThemePreference>("system")
  const commandSettingsRef = useRef<HTMLDivElement>(null)
  const cardStyles = getCardStyles()
  const badgeStyles = getBadgeStyles()

  // Load current theme preference
  useEffect(() => {
    getThemePreference().then(setCurrentTheme)
  }, [])

  // Render command settings
  useEffect(() => {
    const container = commandSettingsRef.current
    if (!container) return

    container.innerHTML = ""
    const commands = listCommands()
    for (const cmdName of commands) {
      const cmd = getCommand(cmdName)
      if (cmd?.renderSettings) {
        cmd.renderSettings(container)
      }
    }
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
      <div
        style={{
          ...(cardStyles as JSX.CSSProperties),
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
                  ...(badgeStyles as JSX.CSSProperties),
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

        {/* Command Settings Container */}
        <div ref={commandSettingsRef} />
      </div>
    </div>
  )
}
