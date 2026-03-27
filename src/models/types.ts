/**
 * ERD 데이터 모델 타입 정의
 * - 테이블, 컬럼, 관계 등 핵심 도메인 인터페이스와 팩토리 함수
 */

/** 테이블 내 개별 컬럼 정의 */
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

/** 테이블 정의 (물리명, 논리명, 컬럼 목록) */
export interface Table {
  id: string
  physicalName: string
  logicalName: string
  columns: Column[]
}

/** 관계 카디널리티 타입 (1:1, 1:N, N:M) */
export type RelationType = '1:1' | '1:N' | 'N:M'

/** 캔버스에서 테이블 노드에 표시할 항목 설정 */
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

/** 빈 컬럼 생성 (기본 타입: varchar(255)) */
export function createEmptyColumn(): Column {
  return {
    id: crypto.randomUUID(),
    name: '',
    type: 'varchar(255)',
    isPK: false,
    isFK: false,
    notNull: false,
    default: '',
    comment: '',
  }
}

/** 빈 테이블 생성 (컬럼 1개 포함) */
export function createEmptyTable(): Table {
  return {
    id: crypto.randomUUID(),
    physicalName: '',
    logicalName: '',
    columns: [createEmptyColumn()],
  }
}

/** 테이블 간 관계 정의 (식별/비식별, source → target) */
export interface Relation {
  id: string
  type: RelationType
  identifying: boolean
  sourceTableId: string
  sourceColumnId: string
  targetTableId: string
  targetColumnId: string
}
