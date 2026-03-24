import { create } from 'zustand'
import type { Table, Relation } from '../models/types.ts'

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
  setDiagram: (tables: Table[], relations: Relation[]) => void
  addTableGroup: (name: string) => void
  removeTableGroup: (name: string) => void
  renameTableGroup: (oldName: string, newName: string) => void
  moveTableToGroup: (tableId: string, groupName: string | null) => void
  setRelationBendX: (relationId: string, bendX: number | undefined) => void
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
  { id: 'r1', type: '1:N', sourceTableId: 'demo-teams', sourceColumnId: 't1', targetTableId: 'demo-users', targetColumnId: 'u4' },
  { id: 'r2', type: '1:N', sourceTableId: 'demo-users', sourceColumnId: 'u1', targetTableId: 'demo-posts', targetColumnId: 'p4' },
]

const demoPositions: Record<string, NodePosition> = {
  'demo-teams': { x: 50, y: 50 },
  'demo-users': { x: 350, y: 50 },
  'demo-posts': { x: 650, y: 50 },
}

const MAX_HISTORY = 50

function snapshot(state: DiagramState): Snapshot {
  return { tables: state.tables, relations: state.relations, nodePositions: state.nodePositions, tableGroups: state.tableGroups }
}

function withHistory(state: DiagramState): Partial<DiagramState> {
  const past = [...state.past, snapshot(state)].slice(-MAX_HISTORY)
  return { past, future: [], canUndo: true, canRedo: false }
}

export const useDiagramStore = create<DiagramState>((set) => ({
  tables: demoTables,
  relations: demoRelations,
  nodePositions: demoPositions,
  tableGroups: {},
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
    set((state) => ({
      ...withHistory(state),
      tables: state.tables.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

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

  removeRelation: (id) =>
    set((state) => ({
      ...withHistory(state),
      relations: state.relations.filter((r) => r.id !== id),
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

  setRelationBendX: (relationId, bendX) =>
    set((state) => ({
      relations: state.relations.map((r) =>
        r.id === relationId ? { ...r, bendX } : r
      ),
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
}))
