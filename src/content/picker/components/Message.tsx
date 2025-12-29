/**
 * Message Component
 */

import React from "react"
import { Box, Card, Text, ScrollArea } from "@radix-ui/themes"

export type MessageProps = {
  message: string
}

export function Message({ message }: MessageProps) {
  return (
    <ScrollArea className="flex-1 min-h-0">
      <Box className="px-2.5 pb-2.5">
        <Card variant="surface">
          <Text size="2">{message}</Text>
        </Card>
      </Box>
    </ScrollArea>
  )
}
