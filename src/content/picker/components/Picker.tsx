/**
 * Main Picker Component
 */

import React from "react"
import { Theme, Box, Flex, Card } from "@radix-ui/themes"
import { PickerHeader } from "./PickerHeader.tsx"
import { PickerHints } from "./PickerHints.tsx"
import { PickerFooter } from "./PickerFooter.tsx"
import { PickerGrid } from "./PickerGrid.tsx"
import { LoadingSkeleton } from "./LoadingSkeleton.tsx"
import { Message } from "./Message.tsx"
import { SettingsPanel } from "./SettingsPanel.tsx"
import { isDarkMode } from "../../../utils/theme.ts"
import type { PickerItem } from "../../types.ts"
import type { Position } from "../types.ts"
import type { SetupComponentProps } from "../../commands/registry.ts"

export type PickerView =
  | { type: "loading" }
  | { type: "message"; message: string }
  | { type: "grid"; items: PickerItem[]; suggestItems?: string[]; suggestTitle?: string }
  | { type: "settings" }
  | { type: "setup"; SetupComponent: React.ComponentType<SetupComponentProps> }

export type PickerProps = {
  visible: boolean
  title: string
  subtitle: string
  view: PickerView
  selectedIndex: number
  imgUrlFn: (item: PickerItem) => string
  onSelect: (item: PickerItem) => void
  onHover: (index: number) => void
  onSuggestPick: (term: string) => void
  onSettingsClick: () => void
  onSetupComplete: () => void
  position: Position
}

export function Picker({
  visible,
  title,
  subtitle,
  view,
  selectedIndex,
  imgUrlFn,
  onSelect,
  onHover,
  onSuggestPick,
  onSettingsClick,
  onSetupComplete,
  position,
}: PickerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const dark = isDarkMode()

  // Animate on show
  React.useEffect(() => {
    if (visible && containerRef.current) {
      try {
        containerRef.current.animate(
          [
            { opacity: 0, transform: "scale(0.98)" },
            { opacity: 1, transform: "scale(1)" },
          ],
          { duration: 120, fill: "both" }
        )
      } catch {
        // Animation not supported
      }
    }
  }, [visible])

  if (!visible) return null

  const renderBody = () => {
    switch (view.type) {
      case "loading":
        return <LoadingSkeleton />
      case "message":
        return <Message message={view.message} />
      case "grid":
        return (
          <PickerGrid
            items={view.items}
            selectedIndex={selectedIndex}
            imgUrlFn={imgUrlFn}
            onSelect={onSelect}
            onHover={onHover}
            suggestItems={view.suggestItems}
            suggestTitle={view.suggestTitle}
            onSuggestPick={onSuggestPick}
          />
        )
      case "settings":
        return <SettingsPanel />
      case "setup": {
        const SetupComponent = view.SetupComponent
        return (
          <Box className="overflow-auto flex-1 min-h-0 p-2.5">
            <SetupComponent onComplete={onSetupComplete} />
          </Box>
        )
      }
      default:
        return null
    }
  }

  return (
    <Theme
      appearance={dark ? "dark" : "light"}
      accentColor="blue"
      grayColor="slate"
      radius="medium"
      scaling="100%"
    >
      <Card
        ref={containerRef}
        id="slashPalettePicker"
        className="fixed z-[999999] w-[400px] h-[380px] max-h-[380px] backdrop-blur-xl shadow-2xl"
        style={{
          left: `${position.left}px`,
          top: `${position.top}px`,
        }}
      >
        <Flex direction="column" className="h-full">
          <PickerHeader title={title} subtitle={subtitle} onSettingsClick={onSettingsClick} />
          <PickerHints />
          {renderBody()}
          <PickerFooter />
        </Flex>
      </Card>
    </Theme>
  )
}
