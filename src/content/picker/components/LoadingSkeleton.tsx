/**
 * Loading Skeleton Component
 */

import React from "react"
import { Box, Grid, ScrollArea, Skeleton } from "@radix-ui/themes"

export function LoadingSkeleton() {
  return (
    <ScrollArea className="flex-1 min-h-0">
      <Box className="px-2.5 pb-2.5">
        <Grid columns="3" gap="2">
          {Array.from({ length: 12 }).map((_, idx) => (
            <Skeleton key={idx} className="w-full h-[88px] rounded-xl" />
          ))}
        </Grid>
      </Box>
    </ScrollArea>
  )
}
