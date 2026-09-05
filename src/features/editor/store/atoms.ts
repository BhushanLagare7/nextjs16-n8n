import type { ReactFlowInstance } from "@xyflow/react"
import { atom } from "jotai"

/**
 * Global reference to the mounted React Flow editor instance.
 * Set via `onInit` in the `Editor` component; consumed by header actions
 * (e.g. Save) that need to read the current nodes/edges on demand.
 */
export const editorAtom = atom<ReactFlowInstance | null>(null)
