/**
 * 앱 메인 컴포넌트
 * - ReactFlow 캔버스 + 패널 레이아웃 관리
 * - 노드/엣지 동기화, 키보드 단축키, 모달/다이얼로그 제어
 */
import { useCallback, useEffect, useState } from 'react'
import {
  ReactFlow,
  Background,
  MiniMap,
  type Node,
  type Edge,
  type NodeChange,
  type Connection,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { TableProperties, Pencil, Trash2, ArrowLeftRight, Link } from 'lucide-react'
import { TableNode } from './canvas/TableNode.tsx'
import { RelationEdge } from './canvas/RelationEdge.tsx'
import { MiniMapNode } from './canvas/MiniMapNode.tsx'
import { Toolbar } from './components/Toolbar.tsx'
import { LeftPanel } from './components/LeftPanel.tsx'
import { ViewsPanel } from './components/ViewsPanel.tsx'
import { Header } from './components/Header.tsx'
import { ActionBar } from './components/ActionBar.tsx'
import { TableDialog } from './dialogs/TableDialog.tsx'
import { LinkingConfirmDialog, type LinkingConfirmState } from './dialogs/LinkingConfirmDialog.tsx'
import { DeleteConfirmDialog, type DeleteConfirmState } from './dialogs/DeleteConfirmDialog.tsx'
import { ContextMenu, type MenuItem } from './ui/ContextMenu.tsx'
import { Toast } from './ui/Toast.tsx'
import { useToast } from './store/toastStore.ts'
import { useDiagramStore } from './store/diagramStore.ts'
import { useThemeStore } from './store/themeStore.ts'
import { useI18n } from './i18n/index.ts'
import type { Table, RelationType } from './models/types.ts'

/** 관계 연결 시작을 나타내는 상수 (소스 테이블 선택 대기 상태) */
const LINKING_PICK = '__pick__'

const nodeTypes = { table: TableNode }
const edgeTypes = { relation: RelationEdge }

type ModalState =
  | { type: 'create'; position: { x: number; y: number } }
  | { type: 'edit'; tableId: string }
  | null

interface ContextMenuState {
  x: number
  y: number
  items: MenuItem[]
}

function DiagramCanvas() {
  const {
    tables, relations, nodePositions,
    addTable, updateTable, removeTable, setNodePosition,
    addRelation, removeRelation, setRelationIdentifying, updateRelationType, displaySettings, undo, redo,
  } = useDiagramStore()
  const theme = useThemeStore((s) => s.theme)
  const toast = useToast((s) => s.show)
  const { t } = useI18n()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  // UI 상태
  const [panMode, setPanMode] = useState(false)
  const [editorCollapsed, setEditorCollapsed] = useState(false)
  const [viewsOpen, setViewsOpen] = useState(true)
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [modalState, setModalState] = useState<ModalState>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [linkingSourceId, setLinkingSourceId] = useState<string | null>(null)
  const [linkingConfirm, setLinkingConfirm] = useState<LinkingConfirmState | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState | null>(null)

  // 스토어 → ReactFlow 노드 동기화
  useEffect(() => {
    setNodes(
      tables.map((tb) => ({
        id: tb.id,
        type: 'table',
        position: nodePositions[tb.id] ?? { x: 0, y: 0 },
        selected: tb.id === selectedTableId,
        data: {
          physicalName: tb.physicalName,
          logicalName: tb.logicalName,
          columns: tb.columns,
          displaySettings,
        },
      }))
    )
  }, [tables, nodePositions, selectedTableId, displaySettings, setNodes])

  // 스토어 → ReactFlow 엣지 동기화 (노드 위치에 따라 핸들 방향 결정)
  useEffect(() => {
    const NODE_WIDTH = 220
    const MIN_GAP = 50
    const posMap = new Map(nodes.map((n) => [n.id, n.position]))

    setEdges(
      relations.map((r) => {
        const isConnected = selectedTableId === r.sourceTableId || selectedTableId === r.targetTableId
        const srcX = posMap.get(r.sourceTableId)?.x ?? 0
        const tgtX = posMap.get(r.targetTableId)?.x ?? 0

        let srcSuffix: string
        let tgtSuffix: string

        if (srcX <= tgtX) {
          const gap = tgtX - (srcX + NODE_WIDTH)
          if (gap < MIN_GAP) { srcSuffix = '-l'; tgtSuffix = '-l' }
          else { srcSuffix = '-r'; tgtSuffix = '-l' }
        } else {
          const gap = srcX - (tgtX + NODE_WIDTH)
          if (gap < MIN_GAP) { srcSuffix = '-r'; tgtSuffix = '-r' }
          else { srcSuffix = '-l'; tgtSuffix = '-r' }
        }

        return {
          id: r.id,
          source: r.sourceTableId,
          sourceHandle: r.sourceColumnId + srcSuffix,
          target: r.targetTableId,
          targetHandle: r.targetColumnId + tgtSuffix,
          type: 'relation',
          animated: isConnected,
          data: { relationType: r.type, identifying: r.identifying },
        }
      })
    )
  }, [relations, nodes, selectedTableId, setEdges])

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) { e.preventDefault(); redo() }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') { e.preventDefault(); redo() }
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'Escape') setLinkingSourceId(null)
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

  // 노드 드래그 종료 시 위치 저장
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

  // 핸들 연결 시 관계 생성
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return
      const duplicate = relations.some(
        (r) =>
          (r.sourceTableId === connection.source && r.targetTableId === connection.target) ||
          (r.sourceTableId === connection.target && r.targetTableId === connection.source)
      )
      if (duplicate) {
        toast(t('toast.duplicateRelation'))
        return
      }
      addRelation({
        id: crypto.randomUUID(),
        type: '1:N' as RelationType,
        identifying: true,
        sourceTableId: connection.source,
        sourceColumnId: (connection.sourceHandle ?? '').replace(/-[lr]$/, ''),
        targetTableId: connection.target,
        targetColumnId: (connection.targetHandle ?? '').replace(/-[lr]$/, ''),
      })
    },
    [addRelation, relations, toast, t]
  )

  // 노드 클릭 — 관계 연결 모드일 때 소스/타겟 선택 처리
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (linkingSourceId === LINKING_PICK) {
        setLinkingSourceId(node.id)
        setSelectedTableId(node.id)
        setContextMenu(null)
        return
      }
      if (linkingSourceId && linkingSourceId !== node.id) {
        setLinkingConfirm({ sourceId: linkingSourceId, targetId: node.id, relationType: '1:N' })
        setLinkingSourceId(null)
      }
      setSelectedTableId(node.id)
      setContextMenu(null)
    },
    [linkingSourceId]
  )

  // 관계 연결 확인 — FK 컬럼 생성 + 관계 추가
  const handleLinkingConfirm = useCallback(
    (identifying: boolean) => {
      if (!linkingConfirm) return
      const { sourceId, targetId, relationType } = linkingConfirm
      const duplicate = relations.some(
        (r) =>
          (r.sourceTableId === sourceId && r.targetTableId === targetId) ||
          (r.sourceTableId === targetId && r.targetTableId === sourceId)
      )
      if (duplicate) {
        toast(t('toast.duplicateRelation'))
        setLinkingConfirm(null)
        return
      }
      const sourceTable = tables.find((tb) => tb.id === sourceId)
      const targetTable = tables.find((tb) => tb.id === targetId)
      if (!sourceTable || !targetTable) return

      const sourcePK = sourceTable.columns.find((c) => c.isPK)
      if (!sourcePK) return

      const fkColName = `${sourceTable.physicalName}_id`
      const existingCol = targetTable.columns.find((c) => c.name === fkColName)
      let targetColId: string

      if (existingCol) {
        targetColId = existingCol.id
        if (identifying && !existingCol.isFK) {
          updateTable(targetId, {
            columns: targetTable.columns.map((c) =>
              c.id === existingCol.id ? { ...c, isFK: true } : c
            ),
          })
        }
      } else {
        targetColId = crypto.randomUUID()
        updateTable(targetId, {
          columns: [
            ...targetTable.columns,
            { id: targetColId, name: fkColName, type: sourcePK.type, isPK: false, isFK: identifying, notNull: false },
          ],
        })
      }

      addRelation({
        id: crypto.randomUUID(),
        type: relationType,
        identifying,
        sourceTableId: sourceId,
        sourceColumnId: sourcePK.id,
        targetTableId: targetId,
        targetColumnId: targetColId,
      })

      toast(t('toast.relationCreated', { source: sourceTable.physicalName, target: targetTable.physicalName }))
      setLinkingConfirm(null)
    },
    [linkingConfirm, tables, addRelation, updateTable, toast, t]
  )

  const onPaneClick = useCallback(() => {
    setSelectedTableId(null)
    setLinkingSourceId(null)
    setLinkingConfirm(null)
    setContextMenu(null)
  }, [])

  // 캔버스 우클릭 → 테이블 추가 메뉴
  const onPaneContextMenu = useCallback(
    (e: MouseEvent | React.MouseEvent) => {
      e.preventDefault()
      setContextMenu({
        x: e.clientX, y: e.clientY,
        items: [{
          label: t('context.addTable'),
          icon: <TableProperties size={13} />,
          onClick: () => setModalState({ type: 'create', position: { x: e.clientX, y: e.clientY } }),
        }],
      })
    },
    [t]
  )

  // 테이블 노드 우클릭 → 수정/관계추가/삭제 메뉴
  const onNodeContextMenu = useCallback(
    (e: React.MouseEvent, node: Node) => {
      e.preventDefault()
      setSelectedTableId(node.id)
      setContextMenu({
        x: e.clientX, y: e.clientY,
        items: [
          { label: t('context.editTable'), icon: <Pencil size={13} />, onClick: () => setModalState({ type: 'edit', tableId: node.id }) },
          { label: t('context.addRelation'), icon: <ArrowLeftRight size={13} />, onClick: () => setLinkingSourceId(node.id) },
          {
            label: t('context.deleteTable'), icon: <Trash2 size={13} />, danger: true,
            onClick: () => {
              const tb = tables.find((tb) => tb.id === node.id)
              const relCount = relations.filter((r) => r.sourceTableId === node.id || r.targetTableId === node.id).length
              setDeleteConfirm({ tableId: node.id, name: tb?.physicalName ?? '', relationCount: relCount })
            },
          },
        ],
      })
    },
    [tables, relations, t]
  )

  // 엣지 우클릭 → 유형변경/식별변경/삭제 메뉴
  const onEdgeContextMenu = useCallback(
    (e: React.MouseEvent, edge: Edge) => {
      e.preventDefault()
      const relation = relations.find((r) => r.id === edge.id)
      const items: MenuItem[] = []

      for (const rt of ['1:1', '1:N', 'N:M'] as RelationType[]) {
        if (relation?.type !== rt) {
          items.push({ label: t('context.changeToType', { type: rt }), onClick: () => updateRelationType(edge.id, rt) })
        }
      }

      if (relation?.identifying) {
        items.push({ label: t('context.toNonIdentifying'), icon: <ArrowLeftRight size={13} />, onClick: () => setRelationIdentifying(edge.id, false) })
      } else {
        items.push({ label: t('context.toIdentifying'), icon: <ArrowLeftRight size={13} />, onClick: () => setRelationIdentifying(edge.id, true) })
      }

      items.push({ label: t('context.deleteRelation'), icon: <Trash2 size={13} />, danger: true, onClick: () => removeRelation(edge.id) })
      setContextMenu({ x: e.clientX, y: e.clientY, items })
    },
    [relations, removeRelation, setRelationIdentifying, updateRelationType, t]
  )

  // 테이블 모달 저장/삭제 핸들러
  const handleModalSave = useCallback(
    (table: Table) => {
      if (modalState?.type === 'create') {
        addTable(table, modalState.position)
        toast(t('toast.tableCreated', { name: table.physicalName }))
      } else if (modalState?.type === 'edit') {
        updateTable(table.id, table)
        toast(t('toast.tableUpdated', { name: table.physicalName }))
      }
      setModalState(null)
    },
    [modalState, addTable, updateTable, toast, t]
  )

  const handleModalDelete = useCallback(
    (id: string) => { removeTable(id); setSelectedTableId(null); setModalState(null) },
    [removeTable]
  )

  const editingTable = modalState?.type === 'edit'
    ? tables.find((tb) => tb.id === modalState.tableId) ?? null
    : null

  return (
    <div className="h-full w-full flex flex-col bg-white dark:bg-gray-950">
      <Header />
      <div className="flex-1 flex min-h-0">
        <LeftPanel collapsed={editorCollapsed} onCollapse={() => setEditorCollapsed(true)} />

        <div className="flex-1 flex flex-col min-w-0">
          <ActionBar
            onAddTable={() => setModalState({ type: 'create', position: { x: 200, y: 200 } })}
            onAddRelation={() => { if (tables.length < 2) return; setLinkingSourceId(LINKING_PICK) }}
            editorCollapsed={editorCollapsed}
            onToggleEditor={() => setEditorCollapsed(!editorCollapsed)}
            viewsOpen={viewsOpen}
            onToggleViews={() => setViewsOpen(!viewsOpen)}
          />

          <div className="flex-1 relative">
            <ReactFlow
              nodes={nodes} edges={edges}
              nodeTypes={nodeTypes} edgeTypes={edgeTypes}
              onNodesChange={handleNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              onPaneContextMenu={onPaneContextMenu}
              onNodeContextMenu={onNodeContextMenu}
              onEdgeContextMenu={onEdgeContextMenu}
              panOnDrag={panMode} nodesDraggable={!panMode}
              proOptions={{ hideAttribution: true }}
              colorMode={theme}
              defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            >
              <Background color={theme === 'dark' ? '#374151' : undefined} />
              <MiniMap nodeComponent={MiniMapNode} maskColor="rgba(0,0,0,0.1)" zoomable pannable />
            </ReactFlow>

            {/* 빈 캔버스 안내 메시지 */}
            {tables.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-sm text-gray-400 dark:text-gray-500">{t('empty.noTables')}</p>
              </div>
            )}

            {/* 관계 연결 모드 배너 */}
            {linkingSourceId && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-blue-500 text-white text-xs px-3 py-1.5 rounded-full shadow-lg">
                <Link size={12} />
                <span>
                  {linkingSourceId === LINKING_PICK
                    ? t('linking.pickSource')
                    : t('linking.pickTarget', { name: tables.find((tb) => tb.id === linkingSourceId)?.physicalName ?? '' })}
                </span>
                <button onClick={() => setLinkingSourceId(null)} className="ml-1 hover:bg-blue-600 rounded px-1">ESC</button>
              </div>
            )}

            <Toolbar panMode={panMode} onPanModeChange={setPanMode} />
          </div>
        </div>

        {viewsOpen && (
          <ViewsPanel
            selectedTableId={selectedTableId}
            onSelectTable={(id) => setSelectedTableId(id)}
            onClose={() => setViewsOpen(false)}
          />
        )}
      </div>

      {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} items={contextMenu.items} onClose={() => setContextMenu(null)} />}

      {linkingConfirm && (
        <LinkingConfirmDialog
          state={linkingConfirm}
          tables={tables}
          onChangeType={(rt) => setLinkingConfirm({ ...linkingConfirm, relationType: rt })}
          onConfirm={handleLinkingConfirm}
          onCancel={() => setLinkingConfirm(null)}
        />
      )}

      {deleteConfirm && (
        <DeleteConfirmDialog
          state={deleteConfirm}
          onConfirm={() => {
            removeTable(deleteConfirm.tableId)
            toast(t('toast.tableDeleted', { name: deleteConfirm.name }))
            setSelectedTableId(null)
            setDeleteConfirm(null)
          }}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {modalState && (
        <TableDialog
          table={modalState.type === 'edit' ? editingTable : null}
          existingNames={tables
            .filter((tb) => modalState.type !== 'edit' || tb.id !== modalState.tableId)
            .map((tb) => tb.physicalName)}
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
      <Toast />
    </ReactFlowProvider>
  )
}
