/**
 * Options Page App Component
 */

import React from "react"
import { Theme, Container, Heading, Box } from "@radix-ui/themes"
import { getOptionsSections } from "../../content/commands/options-registry.ts"

export function OptionsApp() {
  const sections = getOptionsSections()

  return (
    <Theme accentColor="blue" grayColor="slate" radius="medium" scaling="100%">
      <Box className="min-h-screen bg-gray-1 py-6">
        <Container size="2" className="px-4">
          <Heading size="5" className="mb-6">
            GitHub Slash Palette
          </Heading>
          <div className="space-y-4">
            {sections.map(({ name, component: Component }) => (
              <Component key={name} />
            ))}
          </div>
        </Container>
      </Box>
    </Theme>
  )
}
