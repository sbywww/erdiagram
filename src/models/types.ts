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

export interface DisplaySettings {
  showType: boolean
  showComment: boolean
  showNotNull: boolean
  showPKFK: boolean
}

export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  showType: true,
  showComment: true,
  showNotNull: true,
  showPKFK: true,
}

export interface Relation {
  id: string
  type: RelationType
  identifying: boolean
  sourceTableId: string
  sourceColumnId: string
  targetTableId: string
  targetColumnId: string
}
