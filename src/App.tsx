import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  MiniMap,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { TableNode } from './components/TableNode.tsx'
import { RelationEdge } from './components/RelationEdge.tsx'
import { TableDialog } from './components/TableDialog.tsx'
import { Toolbar } from './components/Toolbar.tsx'
import { JsonEditor } from './components/JsonEditor.tsx'
import { Header } from './components/Header.tsx'
import { ActionBar } from './components/ActionBar.tsx'
import { useDiagramStore } from './store/diagramStore.ts'
import { useThemeStore } from './store/themeStore.ts'
import type { Table, RelationType } from './models/types.ts'

const nodeTypes = { table: TableNode }
const edgeTypes = { relation: RelationEdge }

const MINI_HEADER = 8
const MINI_ROW = 6

function MiniMapNode({ id, x, y, width }: { id: string; x: number; y: number; width: number; [key: string]: unknown }) {
  const table = useDiagramStore((s) => s.tables.find((t) => t.id === id))
  const colCount = table?.columns.length ?? 1
  const h = MINI_HEADER + colCount * MINI_ROW

  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect width={width} height={MINI_HEADER} rx={2} fill="#2563eb" />
      <rect y={MINI_HEADER} width={width} height={colCount * MINI_ROW} fill="#dbeafe" stroke="#93c5fd" strokeWidth={0.5} />
      {Array.from({ length: colCount }, (_, i) => (
        <line key={i} x1={0} y1={MINI_HEADER + i * MINI_ROW} x2={width} y2={MINI_HEADER + i * MINI_ROW} stroke="#bfdbfe" strokeWidth={0.3} />
      ))}
      <rect width={width} height={h} rx={2} fill="none" stroke="#1d4ed8" strokeWidth={1} />
    </g>
  )
}

function DiagramCanvas() {
  const {
    tables, relations, nodePositions,
    addTable, updateTable, removeTable, setNodePosition,
    addRelation, undo, redo,
  } = useDiagramStore()
  const theme = useThemeStore((s) => s.theme)
  const { screenToFlowPosition } = useReactFlow()

  // Sync dark class to <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const [panMode, setPanMode] = useState(false)
  const [editorCollapsed, setEditorCollapsed] = useState(false)
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  // Sync store → React Flow nodes
  useEffect(() => {
    setNodes(
      tables.map((t) => ({
        id: t.id,
        type: 'table',
        position: nodePositions[t.id] ?? { x: 0, y: 0 },
        data: {
          physicalName: t.physicalName,
          logicalName: t.logicalName,
          columns: t.columns,
        },
      }))
    )
  }, [tables, nodePositions, setNodes])

  // Sync store → React Flow edges
  useEffect(() => {
    setEdges(
      relations.map((r) => ({
        id: r.id,
        source: r.sourceTableId,
        target: r.targetTableId,
        type: 'relation',
        data: { relationType: r.type },
      }))
    )
  }, [relations, setEdges])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo/Redo works everywhere
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) { e.preventDefault(); redo() }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') { e.preventDefault(); redo() }
      // Other shortcuts only outside inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'v' || e.key === 'V') setPanMode(false)
      if (e.key === 'h' || e.key === 'H') setPanMode(true)
      if (e.key === ' ') { e.preventDefault(); setPanMode(true) }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') setPanMode(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  const [dialogState, setDialogState] = useState<{
    open: boolean
    table: Table | null
    position?: { x: number; y: number }
  }>({ open: false, table: null })

  // Sync position changes back to store
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes)
      for (const change of changes) {
        if (change.type === 'position' && change.dragging === false && change.position) {
          setNodePosition(change.id, change.position)
        }
      }
    },
    [onNodesChange, setNodePosition]
  )

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes)
    },
    [onEdgesChange]
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return
      addRelation({
        id: crypto.randomUUID(),
        type: '1:N' as RelationType,
        sourceTableId: connection.source,
        sourceColumnId: '',
        targetTableId: connection.target,
        targetColumnId: '',
      })
    },
    [addRelation]
  )

  const lastPaneClickRef = useRef<number>(0)
  const onPaneClick = useCallback(
    (e: React.MouseEvent) => {
      const now = Date.now()
      if (now - lastPaneClickRef.current < 300) {
        const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
        setDialogState({ open: true, table: null, position })
      }
      lastPaneClickRef.current = now
    },
    [screenToFlowPosition]
  )

  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const table = tables.find((t) => t.id === node.id)
      if (table) {
        setDialogState({ open: true, table })
      }
    },
    [tables]
  )

  const handleSave = useCallback(
    (table: Table) => {
      if (dialogState.table) {
        updateTable(table.id, table)
      } else {
        addTable(table, dialogState.position)
      }
      setDialogState({ open: false, table: null })
    },
    [dialogState, addTable, updateTable]
  )

  const handleDelete = useCallback(
    (id: string) => {
      removeTable(id)
      setDialogState({ open: false, table: null })
    },
    [removeTable]
  )

  return (
    <div className="h-full w-full flex flex-col bg-white dark:bg-gray-950">
      <Header />
      <div className="flex-1 flex min-h-0">
        {/* JSON Editor Panel */}
        <JsonEditor collapsed={editorCollapsed} onCollapse={() => setEditorCollapsed(true)} />

        {/* Right: ActionBar + Canvas */}
        <div className="flex-1 flex flex-col min-w-0">
          <ActionBar
            onAddTable={() => setDialogState({ open: true, table: null, position: { x: 200, y: 200 } })}
            onAddRelation={() => {
              // TODO: relation dialog
            }}
            editorCollapsed={editorCollapsed}
            onToggleEditor={() => setEditorCollapsed(!editorCollapsed)}
          />

          {/* Canvas */}
          <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onPaneClick={onPaneClick}
          onNodeDoubleClick={onNodeDoubleClick}
          panOnDrag={panMode}
          nodesDraggable={!panMode}
          proOptions={{ hideAttribution: true }}
          colorMode={theme}
          fitView
        >
          <Background color={theme === 'dark' ? '#374151' : undefined} />
          <MiniMap
            nodeComponent={MiniMapNode}
            maskColor="rgba(0,0,0,0.1)"
            zoomable
            pannable
          />
        </ReactFlow>

        {/* Bottom toolbar */}
        <Toolbar panMode={panMode} onPanModeChange={setPanMode} />

        {dialogState.open && (
          <TableDialog
            table={dialogState.table}
            onSave={handleSave}
            onCancel={() => setDialogState({ open: false, table: null })}
            onDelete={dialogState.table ? handleDelete : undefined}
          />
        )}
      </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ReactFlowProvider>
      <DiagramCanvas />
    </ReactFlowProvider>
  )
}
