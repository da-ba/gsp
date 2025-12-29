/**
 * Suggest Chips Component
 */

import React from "react"
import { Flex, Text, Badge } from "@radix-ui/themes"

export type SuggestChipsProps = {
  items: string[]
  title: string
  onPick: (term: string) => void
}

export function SuggestChips({ items, title, onPick }: SuggestChipsProps) {
  if (!items.length) return null

  return (
    <Flex wrap="wrap" gap="1" className="mb-2.5">
      {title && (
        <Text size="1" className="opacity-70 w-full mb-1">
          {title}
        </Text>
      )}
      {items.slice(0, 8).map((term) => (
        <Badge
          key={term}
          variant="soft"
          radius="full"
          size="1"
          data-suggest-chip="true"
          onClick={(ev: React.MouseEvent) => {
            ev.preventDefault()
            ev.stopPropagation()
            onPick(term)
          }}
          className="cursor-pointer hover:scale-[1.03] transition-transform"
        >
          {term}
        </Badge>
      ))}
    </Flex>
  )
}
