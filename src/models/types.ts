export interface Column {
  id: string
  name: string
  type: string
  isPK: boolean
  isFK: boolean
  notNull: boolean
  default?: string
  comment?: string
}

export interface Table {
  id: string
  physicalName: string
  logicalName: string
  columns: Column[]
}

export type RelationType = '1:1' | '1:N' | 'N:M'

export interface Relation {
  id: string
  type: RelationType
  sourceTableId: string
  sourceColumnId: string
  targetTableId: string
  targetColumnId: string
  bendX?: number // X position of the vertical segment (default: midpoint)
}
