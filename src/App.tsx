import { useCallback, useEffect, useState } from 'react'
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
  ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { TableProperties, Pencil, Trash2, ArrowLeftRight } from 'lucide-react'
import { TableNode } from './components/TableNode.tsx'
import { RelationEdge } from './components/RelationEdge.tsx'
import { Toolbar } from './components/Toolbar.tsx'
import { LeftPanel } from './components/LeftPanel.tsx'
import { ViewsPanel } from './components/ViewsPanel.tsx'
import { Header } from './components/Header.tsx'
import { ActionBar } from './components/ActionBar.tsx'
import { TableDialog } from './components/TableDialog.tsx'
import { ContextMenu, type MenuItem } from './components/ContextMenu.tsx'
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

// Modal state types
type ModalState =
  | { type: 'create'; position: { x: number; y: number } }
  | { type: 'edit'; tableId: string }
  | null

// Context menu state
interface ContextMenuState {
  x: number
  y: number
  items: MenuItem[]
}

function DiagramCanvas() {
  const {
    tables, relations, nodePositions,
    addTable, updateTable, removeTable, setNodePosition,
    addRelation, undo, redo,
  } = useDiagramStore()
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const [panMode, setPanMode] = useState(false)
  const [editorCollapsed, setEditorCollapsed] = useState(false)
  const [viewsOpen, setViewsOpen] = useState(true)
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [modalState, setModalState] = useState<ModalState>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)

  // Sync store → React Flow nodes
  useEffect(() => {
    setNodes(
      tables.map((t) => ({
        id: t.id,
        type: 'table',
        position: nodePositions[t.id] ?? { x: 0, y: 0 },
        selected: t.id === selectedTableId,
        data: {
          physicalName: t.physicalName,
          logicalName: t.logicalName,
          columns: t.columns,
        },
      }))
    )
  }, [tables, nodePositions, selectedTableId, setNodes])

  // Sync store → React Flow edges (테이블 선택 시 연결된 edge에 animated 전달)
  useEffect(() => {
    setEdges(
      relations.map((r) => {
        const isConnected = selectedTableId === r.sourceTableId || selectedTableId === r.targetTableId
        return {
          id: r.id,
          source: r.sourceTableId,
          sourceHandle: r.sourceColumnId,
          target: r.targetTableId,
          targetHandle: r.targetColumnId,
          type: 'relation',
          animated: isConnected,
          data: { relationType: r.type },
        }
      })
    )
  }, [relations, selectedTableId, setEdges])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) { e.preventDefault(); redo() }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') { e.preventDefault(); redo() }
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
        sourceColumnId: connection.sourceHandle ?? '',
        targetTableId: connection.target,
        targetColumnId: connection.targetHandle ?? '',
      })
    },
    [addRelation]
  )

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedTableId(node.id)
      setContextMenu(null)
    },
    []
  )

  const onPaneClick = useCallback(() => {
    setSelectedTableId(null)
    setContextMenu(null)
  }, [])

  // Right-click on empty canvas → Add Table
  const onPaneContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        items: [
          {
            label: 'Add Table',
            icon: <TableProperties size={13} />,
            onClick: () => {
              setModalState({ type: 'create', position: { x: e.clientX, y: e.clientY } })
            },
          },
        ],
      })
    },
    []
  )

  // Right-click on table → Edit / Delete / Add Relation
  const onNodeContextMenu = useCallback(
    (e: React.MouseEvent, node: Node) => {
      e.preventDefault()
      setSelectedTableId(node.id)
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        items: [
          {
            label: 'Edit Table',
            icon: <Pencil size={13} />,
            onClick: () => setModalState({ type: 'edit', tableId: node.id }),
          },
          {
            label: 'Add Relation',
            icon: <ArrowLeftRight size={13} />,
            onClick: () => {
              // TODO: relation creation flow
            },
          },
          {
            label: 'Delete Table',
            icon: <Trash2 size={13} />,
            danger: true,
            onClick: () => {
              removeTable(node.id)
              setSelectedTableId(null)
            },
          },
        ],
      })
    },
    [removeTable]
  )

  // Modal handlers
  const handleModalSave = useCallback(
    (table: Table) => {
      if (modalState?.type === 'create') {
        addTable(table, modalState.position)
      } else if (modalState?.type === 'edit') {
        updateTable(table.id, table)
      }
      setModalState(null)
    },
    [modalState, addTable, updateTable]
  )

  const handleModalDelete = useCallback(
    (id: string) => {
      removeTable(id)
      setSelectedTableId(null)
      setModalState(null)
    },
    [removeTable]
  )

  const handleAddTable = useCallback(() => {
    setModalState({ type: 'create', position: { x: 200, y: 200 } })
  }, [])

  // Get table for edit modal
  const editingTable = modalState?.type === 'edit'
    ? tables.find((t) => t.id === modalState.tableId) ?? null
    : null

  return (
    <div className="h-full w-full flex flex-col bg-white dark:bg-gray-950">
      <Header />
      <div className="flex-1 flex min-h-0">
        {/* Left Panel (JSON) */}
        <LeftPanel
          collapsed={editorCollapsed}
          onCollapse={() => setEditorCollapsed(true)}
        />

        {/* Center: ActionBar + Canvas */}
        <div className="flex-1 flex flex-col min-w-0">
          <ActionBar
            onAddTable={handleAddTable}
            onAddRelation={() => {
              // TODO: relation dialog
            }}
            editorCollapsed={editorCollapsed}
            onToggleEditor={() => setEditorCollapsed(!editorCollapsed)}
            viewsOpen={viewsOpen}
            onToggleViews={() => setViewsOpen(!viewsOpen)}
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
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              onPaneContextMenu={onPaneContextMenu}
              onNodeContextMenu={onNodeContextMenu}
              panOnDrag={panMode}
              nodesDraggable={!panMode}
              proOptions={{ hideAttribution: true }}
              colorMode={theme}
              defaultViewport={{ x: 0, y: 0, zoom: 1 }}
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
          </div>
        </div>

        {/* Right Panel (Views) */}
        {viewsOpen && (
          <ViewsPanel
            selectedTableId={selectedTableId}
            onSelectTable={(id) => setSelectedTableId(id)}
            onClose={() => setViewsOpen(false)}
          />
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Table Modal (Create / Edit) */}
      {modalState && (
        <TableDialog
          table={modalState.type === 'edit' ? editingTable : null}
          onSave={handleModalSave}
          onCancel={() => setModalState(null)}
          onDelete={modalState.type === 'edit' ? handleModalDelete : undefined}
        />
      )}
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
