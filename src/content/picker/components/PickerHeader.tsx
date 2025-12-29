/**
 * Picker Header Component
 */

import React from "react"
import { Flex, Text, Badge, IconButton } from "@radix-ui/themes"
import { GearIcon } from "@radix-ui/react-icons"

export type PickerHeaderProps = {
  title: string
  subtitle: string
  onSettingsClick: () => void
}

export function PickerHeader({ title, subtitle, onSettingsClick }: PickerHeaderProps) {
  return (
    <Flex align="center" justify="between" className="px-2.5 pt-2.5 pb-2 h-11 box-border">
      <Flex direction="column" gap="1">
        <Text size="1" weight="bold" className="tracking-wide opacity-90">
          {title}
        </Text>
        <Text size="1" className="opacity-70">
          {subtitle}
        </Text>
      </Flex>

      <Flex align="center" gap="2">
        <Badge variant="soft" radius="full" size="1">
          Esc close
        </Badge>
        <IconButton
          variant="ghost"
          size="1"
          data-settings-btn="true"
          title="Settings"
          onClick={onSettingsClick}
          className="opacity-60 hover:opacity-100"
        >
          <GearIcon />
        </IconButton>
      </Flex>
    </Flex>
  )
}
