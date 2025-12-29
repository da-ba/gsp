/**
 * Picker Footer Component
 */

import React from "react"
import { Flex, Text, Separator } from "@radix-ui/themes"

export function PickerFooter() {
  return (
    <>
      <Separator size="4" />
      <Flex align="center" justify="between" className="px-2.5 py-2.5 h-11 box-border">
        <Text size="1" className="opacity-60">
          Tip: type /gsp to list commands
        </Text>
      </Flex>
    </>
  )
}
