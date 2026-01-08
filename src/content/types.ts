/**
 * Shared types for picker items (decoupled from any specific command)
 */

export type PickerItem = {
  id: string
  previewUrl: string
  /** Command-specific data passed to onSelect */
  data?: unknown
  /** Title text for list view display */
  title?: string
  /** Subtitle text for list view display */
  subtitle?: string
}
