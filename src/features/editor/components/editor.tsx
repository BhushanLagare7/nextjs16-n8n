"use client"
import "@xyflow/react/dist/style.css"

import { useCallback, useState } from "react"
import { useTheme } from "next-themes"

import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  type ColorMode,
  type Connection,
  Controls,
  type Edge,
  type EdgeChange,
  MiniMap,
  type Node,
  type NodeChange,
  Panel,
  ReactFlow,
} from "@xyflow/react"
import { useSetAtom } from "jotai"

import { ErrorView, LoadingView } from "@/components/entity-components"
import { nodeComponents } from "@/config/node-components"
import { useSuspenseWorkflow } from "@/features/workflows/hooks/use-workflows"

import { editorAtom } from "../store/atoms"

import { AddNodeButton } from "./add-node-button"

/** Fallback shown while the editor's suspense boundary is resolving */
export function EditorLoading() {
  return <LoadingView message="Loading editor..." />
}

/** Fallback shown when the editor's error boundary catches an error */
export function EditorError() {
  return <ErrorView message="Error loading editor" />
}

/**
 * Main workflow editor: a React Flow canvas seeded with the workflow's
 * nodes/edges. State is local for now — persistence is triggered from the
 * header's save button, which reads via `editorAtom`.
 */
export function Editor({ workflowId }: { workflowId: string }) {
  const { data: workflow } = useSuspenseWorkflow(workflowId)

  // Publish the React Flow instance to a global atom for other components
  const setEditor = useSetAtom(editorAtom)

  const { theme, resolvedTheme } = useTheme()

  // Prefer the resolved theme so "system" maps to an actual light/dark value
  const colorMode = (resolvedTheme || theme || "system") as ColorMode

  // Local canvas state, initialized from the server payload
  const [nodes, setNodes] = useState<Node[]>(workflow.nodes)
  const [edges, setEdges] = useState<Edge[]>(workflow.edges)

  // Standard controlled-flow handlers; React Flow computes the diffs for us
  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    []
  )
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    []
  )
  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    []
  )

  return (
    <div className="size-full">
      <ReactFlow
        colorMode={colorMode}
        edges={edges}
        fitView
        nodes={nodes}
        nodeTypes={nodeComponents}
        // Drag = selection box; scroll = pan (Figma-like interaction)
        panOnDrag={false}
        panOnScroll
        proOptions={{ hideAttribution: true }}
        selectionOnDrag
        snapGrid={[10, 10]}
        snapToGrid
        onConnect={onConnect}
        onEdgesChange={onEdgesChange}
        onInit={setEditor}
        onNodesChange={onNodesChange}
      >
        <Background />
        <Controls />
        <MiniMap />
        <Panel position="top-right">
          <AddNodeButton />
        </Panel>
      </ReactFlow>
    </div>
  )
}
