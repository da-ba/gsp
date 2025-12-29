/**
 * Picker Hints Component
 */

import React from "react"
import { Flex, Badge } from "@radix-ui/themes"

const HINTS = ["Arrows move", "Enter insert", "Esc close"]

export function PickerHints() {
  return (
    <Flex wrap="wrap" gap="1" className="px-2.5 pb-2.5 h-8 box-border">
      {HINTS.map((hint) => (
        <Badge key={hint} variant="soft" radius="full" size="1">
          {hint}
        </Badge>
      ))}
    </Flex>
  )
}
