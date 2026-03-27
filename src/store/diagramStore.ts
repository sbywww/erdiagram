/**
 * 다이어그램 상태 관리 스토어 (Zustand + localStorage 영속성)
 * - 테이블/관계 CRUD, 노드 위치, 그룹, 디스플레이 설정
 * - Undo/Redo 히스토리 (스냅샷 기반, 최대 50단계)
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Table, Relation, DisplaySettings } from '../models/types.ts'
import { DEFAULT_DISPLAY_SETTINGS } from '../models/types.ts'

interface NodePosition {
  x: number
  y: number
}

interface Snapshot {
  tables: Table[]
  relations: Relation[]
  nodePositions: Record<string, NodePosition>
  tableGroups: Record<string, string[]>
}

interface DiagramState {
  tables: Table[]
  relations: Relation[]
  nodePositions: Record<string, NodePosition>
  tableGroups: Record<string, string[]> // groupName → tableIds
  displaySettings: DisplaySettings
  past: Snapshot[]
  future: Snapshot[]
  canUndo: boolean
  canRedo: boolean
  addTable: (table: Table, position?: NodePosition) => void
  updateTable: (id: string, table: Partial<Table>) => void
  removeTable: (id: string) => void
  setNodePosition: (id: string, position: NodePosition) => void
  addRelation: (relation: Relation) => void
  removeRelation: (id: string) => void
  setRelationIdentifying: (relationId: string, identifying: boolean) => void
  updateRelationType: (relationId: string, type: import('../models/types.ts').RelationType) => void
  setDiagram: (tables: Table[], relations: Relation[]) => void
  addTableGroup: (name: string) => void
  removeTableGroup: (name: string) => void
  renameTableGroup: (oldName: string, newName: string) => void
  moveTableToGroup: (tableId: string, groupName: string | null) => void
  setDisplaySettings: (settings: Partial<DisplaySettings>) => void
  undo: () => void
  redo: () => void
}

const demoTables: Table[] = [
  {
    id: 'demo-teams',
    physicalName: 'teams',
    logicalName: '팀',
    columns: [
      { id: 't1', name: 'id', type: 'bigint', isPK: true, isFK: false, notNull: true, comment: '팀 ID' },
      { id: 't2', name: 'name', type: 'varchar(100)', isPK: false, isFK: false, notNull: true, comment: '팀명' },
    ],
  },
  {
    id: 'demo-users',
    physicalName: 'users',
    logicalName: '사용자',
    columns: [
      { id: 'u1', name: 'id', type: 'bigint', isPK: true, isFK: false, notNull: true, comment: '사용자 ID' },
      { id: 'u2', name: 'name', type: 'varchar(100)', isPK: false, isFK: false, notNull: true, comment: '이름' },
      { id: 'u3', name: 'email', type: 'varchar(255)', isPK: false, isFK: false, notNull: true, comment: '이메일' },
      { id: 'u4', name: 'team_id', type: 'bigint', isPK: false, isFK: true, notNull: false, comment: '소속팀' },
    ],
  },
  {
    id: 'demo-posts',
    physicalName: 'posts',
    logicalName: '게시글',
    columns: [
      { id: 'p1', name: 'id', type: 'bigint', isPK: true, isFK: false, notNull: true, comment: '게시글 ID' },
      { id: 'p2', name: 'title', type: 'varchar(200)', isPK: false, isFK: false, notNull: true, comment: '제목' },
      { id: 'p3', name: 'content', type: 'text', isPK: false, isFK: false, notNull: false, comment: '내용' },
      { id: 'p4', name: 'author_id', type: 'bigint', isPK: false, isFK: true, notNull: true, comment: '작성자' },
      { id: 'p5', name: 'created_at', type: 'timestamp', isPK: false, isFK: false, notNull: true, default: 'now()', comment: '작성일' },
    ],
  },
]

const demoRelations: Relation[] = [
  { id: 'r1', type: '1:N', identifying: true, sourceTableId: 'demo-teams', sourceColumnId: 't1', targetTableId: 'demo-users', targetColumnId: 'u4' },
  { id: 'r2', type: '1:N', identifying: true, sourceTableId: 'demo-users', sourceColumnId: 'u1', targetTableId: 'demo-posts', targetColumnId: 'p4' },
]

const demoPositions: Record<string, NodePosition> = {
  'demo-teams': { x: 50, y: 50 },
  'demo-users': { x: 350, y: 50 },
  'demo-posts': { x: 650, y: 50 },
}

const MAX_HISTORY = 50

/** 현재 상태의 스냅샷 생성 (Undo/Redo용) */
function snapshot(state: DiagramState): Snapshot {
  return { tables: state.tables, relations: state.relations, nodePositions: state.nodePositions, tableGroups: state.tableGroups }
}

/** 변경 전 상태를 히스토리에 저장하고 future 초기화 */
function withHistory(state: DiagramState): Partial<DiagramState> {
  const past = [...state.past, snapshot(state)].slice(-MAX_HISTORY)
  return { past, future: [], canUndo: true, canRedo: false }
}

export const useDiagramStore = create<DiagramState>()(persist((set) => ({
  tables: demoTables,
  relations: demoRelations,
  nodePositions: demoPositions,
  tableGroups: {},
  displaySettings: DEFAULT_DISPLAY_SETTINGS,
  past: [],
  future: [],
  canUndo: false,
  canRedo: false,

  addTable: (table, position) =>
    set((state) => ({
      ...withHistory(state),
      tables: [...state.tables, table],
      nodePositions: {
        ...state.nodePositions,
        [table.id]: position ?? { x: 100, y: 100 },
      },
    })),

  updateTable: (id, updates) =>
    set((state) => {
      let tables = state.tables.map((t) => (t.id === id ? { ...t, ...updates } : t))
      let relations = state.relations

      const oldTable = state.tables.find((t) => t.id === id)

      if (updates.columns) {
        const updatedColIds = new Set(updates.columns.map((c) => c.id))
        relations = relations.map((r) => {
          if (r.identifying && r.targetTableId === id && !updatedColIds.has(r.targetColumnId)) {
            return { ...r, identifying: false }
          }
          return r
        })

        // PK가 추가/변경되면 이 테이블을 source로 하는 식별 관계의 FK 컬럼 타입 동기화
        const newPKs = updates.columns.filter((c) => c.isPK)
        const oldPKIds = new Set(oldTable?.columns.filter((c) => c.isPK).map((c) => c.id))
        const addedPKs = newPKs.filter((pk) => !oldPKIds.has(pk.id))

        if (addedPKs.length > 0) {
          const sourceRelations = relations.filter((r) => r.identifying && r.sourceTableId === id)
          for (const rel of sourceRelations) {
            const sourcePK = addedPKs[0]
            tables = tables.map((t) => {
              if (t.id !== rel.targetTableId) return t
              const hasFK = t.columns.some((c) => c.id === rel.targetColumnId)
              if (hasFK) {
                return { ...t, columns: t.columns.map((c) => c.id === rel.targetColumnId ? { ...c, type: sourcePK.type } : c) }
              }
              return t
            })
          }
        }
      }

      // FK 이름 동기화: 테이블 이름 변경 시 관례적 FK 이름도 업데이트
      if (updates.physicalName && oldTable && updates.physicalName !== oldTable.physicalName) {
        const oldFKName = `${oldTable.physicalName}_id`
        const newFKName = `${updates.physicalName}_id`
        const sourceRelations = relations.filter((r) => r.identifying && r.sourceTableId === id)
        for (const rel of sourceRelations) {
          tables = tables.map((t) => {
            if (t.id !== rel.targetTableId) return t
            return {
              ...t,
              columns: t.columns.map((c) =>
                c.id === rel.targetColumnId && c.name === oldFKName
                  ? { ...c, name: newFKName }
                  : c
              ),
            }
          })
        }
      }

      return { ...withHistory(state), tables, relations }
    }),

  removeTable: (id) =>
    set((state) => ({
      ...withHistory(state),
      tables: state.tables.filter((t) => t.id !== id),
      relations: state.relations.filter(
        (r) => r.sourceTableId !== id && r.targetTableId !== id
      ),
      nodePositions: Object.fromEntries(
        Object.entries(state.nodePositions).filter(([k]) => k !== id)
      ),
    })),

  setNodePosition: (id, position) =>
    set((state) => ({
      nodePositions: { ...state.nodePositions, [id]: position },
    })),

  addRelation: (relation) =>
    set((state) => ({
      ...withHistory(state),
      relations: [...state.relations, relation],
    })),

  /** 관계 삭제 시 식별 관계이면 대상 테이블의 FK 컬럼도 함께 제거 */
  removeRelation: (id) =>
    set((state) => {
      const relation = state.relations.find((r) => r.id === id)
      let tables = state.tables
      if (relation?.identifying) {
        tables = tables.map((t) =>
          t.id === relation.targetTableId
            ? { ...t, columns: t.columns.filter((c) => c.id !== relation.targetColumnId) }
            : t
        )
      }
      return {
        ...withHistory(state),
        tables,
        relations: state.relations.filter((r) => r.id !== id),
      }
    }),

  /** 관계의 식별/비식별 전환 시 대상 테이블 FK 플래그 동기화 */
  setRelationIdentifying: (relationId, identifying) =>
    set((state) => {
      const relation = state.relations.find((r) => r.id === relationId)
      if (!relation || relation.identifying === identifying) return state

      return {
        ...withHistory(state),
        tables: state.tables.map((t) =>
          t.id === relation.targetTableId
            ? { ...t, columns: t.columns.map((c) => c.id === relation.targetColumnId ? { ...c, isFK: identifying } : c) }
            : t
        ),
        relations: state.relations.map((r) =>
          r.id === relationId ? { ...r, identifying } : r
        ),
      }
    }),

  updateRelationType: (relationId, type) =>
    set((state) => ({
      ...withHistory(state),
      relations: state.relations.map((r) =>
        r.id === relationId ? { ...r, type } : r
      ),
    })),

  setDiagram: (tables, relations) =>
    set((state) => ({
      ...withHistory(state),
      tables,
      relations,
    })),

  addTableGroup: (name) =>
    set((state) => ({
      tableGroups: { ...state.tableGroups, [name]: [] },
    })),

  removeTableGroup: (name) =>
    set((state) => {
      const { [name]: _, ...rest } = state.tableGroups
      return { tableGroups: rest }
    }),

  renameTableGroup: (oldName, newName) =>
    set((state) => {
      const { [oldName]: ids, ...rest } = state.tableGroups
      return { tableGroups: { ...rest, [newName]: ids ?? [] } }
    }),

  /** 테이블을 지정 그룹으로 이동 (기존 그룹에서 먼저 제거) */
  moveTableToGroup: (tableId, groupName) =>
    set((state) => {
      // Remove from all groups first
      const cleaned: Record<string, string[]> = {}
      for (const [k, v] of Object.entries(state.tableGroups)) {
        cleaned[k] = v.filter((id) => id !== tableId)
      }
      // Add to target group
      if (groupName && cleaned[groupName]) {
        cleaned[groupName] = [...cleaned[groupName], tableId]
      }
      return { tableGroups: cleaned }
    }),

  setDisplaySettings: (settings) =>
    set((state) => ({
      displaySettings: { ...state.displaySettings, ...settings },
    })),

  undo: () =>
    set((state) => {
      if (state.past.length === 0) return state
      const prev = state.past[state.past.length - 1]
      return {
        ...prev,
        past: state.past.slice(0, -1),
        future: [snapshot(state), ...state.future],
        canUndo: state.past.length > 1,
        canRedo: true,
      }
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0) return state
      const next = state.future[0]
      return {
        ...next,
        past: [...state.past, snapshot(state)],
        future: state.future.slice(1),
        canUndo: true,
        canRedo: state.future.length > 1,
      }
    }),
}), {
  name: 'erdiagram-store',
  partialize: (state) => ({
    tables: state.tables,
    relations: state.relations,
    nodePositions: state.nodePositions,
    tableGroups: state.tableGroups,
    displaySettings: state.displaySettings,
  }),
}))
