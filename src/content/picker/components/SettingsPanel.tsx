/**
 * Settings Panel Component
 */

import React from "react"
import { Box, Flex, Card, Text, ScrollArea, SegmentedControl } from "@radix-ui/themes"
import { setThemeOverride } from "../../../utils/theme.ts"
import {
  getThemePreference,
  setThemePreference,
  type ThemePreference,
} from "../../../utils/storage.ts"
import { listCommands, getCommand } from "../../commands/registry.ts"

const THEMES: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
]

export function SettingsPanel() {
  const [currentTheme, setCurrentTheme] = React.useState<ThemePreference>("system")
  const commandSettingsRef = React.useRef<HTMLDivElement>(null)

  // Load current theme preference
  React.useEffect(() => {
    getThemePreference().then(setCurrentTheme)
  }, [])

  // Render command settings
  React.useEffect(() => {
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

  const handleThemeChange = async (value: string) => {
    const themeValue = value as ThemePreference
    await setThemePreference(themeValue)
    setThemeOverride(themeValue)
    setCurrentTheme(themeValue)
  }

  return (
    <ScrollArea className="flex-1 min-h-0">
      <Box className="px-2.5 pb-2.5">
        <Card variant="surface">
          <Flex direction="column" gap="4">
            {/* Theme Section */}
            <Flex direction="column" gap="2">
              <Text size="2" weight="bold">
                Theme
              </Text>
              <SegmentedControl.Root
                value={currentTheme}
                onValueChange={handleThemeChange}
                size="1"
              >
                {THEMES.map(({ value, label }) => (
                  <SegmentedControl.Item key={value} value={value} data-settings-action="true">
                    {label}
                  </SegmentedControl.Item>
                ))}
              </SegmentedControl.Root>
            </Flex>

            {/* Command Settings Container */}
            <Box ref={commandSettingsRef} />
          </Flex>
        </Card>
      </Box>
    </ScrollArea>
  )
}
