/**
 * Settings Panel Component - SolidJS version
 */

import { createSignal, onMount, For } from "solid-js"
import type { JSX } from "solid-js"
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
  const [currentTheme, setCurrentTheme] = createSignal<ThemePreference>("system")
  let commandSettingsRef: HTMLDivElement | undefined
  const cardStyles = getCardStyles()
  const badgeStyles = getBadgeStyles()

  // Load current theme preference
  onMount(() => {
    getThemePreference().then(setCurrentTheme)
  })

  // Render command settings
  onMount(() => {
    if (!commandSettingsRef) return
    commandSettingsRef.innerHTML = ""
    const commands = listCommands()
    for (const cmdName of commands) {
      const cmd = getCommand(cmdName)
      if (cmd?.renderSettings) {
        cmd.renderSettings(commandSettingsRef)
      }
    }
  })

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
        "min-height": "0",
      }}
    >
      <div
        style={{
          ...(cardStyles as JSX.CSSProperties),
          display: "flex",
          "flex-direction": "column",
          gap: "14px",
        }}
      >
        {/* Theme Section */}
        <div style={{ display: "flex", "flex-direction": "column", gap: "8px" }}>
          <div style={{ "font-weight": "600" }}>Theme</div>
          <div style={{ display: "flex", gap: "6px" }}>
            <For each={THEMES}>
              {(theme) => (
                <button
                  type="button"
                  data-settings-action="true"
                  onClick={(ev) => {
                    ev.preventDefault()
                    ev.stopPropagation()
                    handleThemeChange(theme.value)
                  }}
                  style={{
                    ...(badgeStyles as JSX.CSSProperties),
                    cursor: "pointer",
                    padding: "6px 12px",
                    opacity: theme.value === currentTheme() ? "1" : undefined,
                    "font-weight": theme.value === currentTheme() ? "600" : undefined,
                  }}
                >
                  {theme.label}
                </button>
              )}
            </For>
          </div>
        </div>

        {/* Command Settings Container */}
        <div ref={commandSettingsRef} />
      </div>
    </div>
  )
}
