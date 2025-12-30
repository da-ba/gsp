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

  // Load current theme preference
  React.useEffect(() => {
    getThemePreference().then(setCurrentTheme)
  }, [])

  const handleThemeChange = async (value: string) => {
    const themeValue = value as ThemePreference
    await setThemePreference(themeValue)
    setThemeOverride(themeValue)
    setCurrentTheme(themeValue)
  }

  // Get all command settings components
  const commandSettings = React.useMemo(() => {
    const commands = listCommands()
    const settings: { name: string; Component: React.ComponentType }[] = []
    for (const cmdName of commands) {
      const cmd = getCommand(cmdName)
      if (cmd?.SettingsComponent) {
        settings.push({ name: cmdName, Component: cmd.SettingsComponent })
      }
    }
    return settings
  }, [])

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

            {/* Command Settings Components */}
            {commandSettings.map(({ name, Component }) => (
              <Component key={name} />
            ))}
          </Flex>
        </Card>
      </Box>
    </ScrollArea>
  )
}
