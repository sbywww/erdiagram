/**
 * 미니맵에 표시되는 테이블 노드 SVG 컴포넌트
 * - 헤더(파란색) + 컬럼 행(하늘색)으로 구성
 */
import { useDiagramStore } from '../store/diagramStore.ts'

const MINI_HEADER = 8
const MINI_ROW = 6

export function MiniMapNode({ id, x, y, width }: { id: string; x: number; y: number; width: number; [key: string]: unknown }) {
  const table = useDiagramStore((s) => s.tables.find((t) => t.id === id))
  const colCount = table?.columns.length ?? 1
  const h = MINI_HEADER + colCount * MINI_ROW

  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect width={width} height={MINI_HEADER} rx={2} fill="#1a1a1a" />
      <rect y={MINI_HEADER} width={width} height={colCount * MINI_ROW} fill="#dbeafe" stroke="#93c5fd" strokeWidth={0.5} />
      {Array.from({ length: colCount }, (_, i) => (
        <line key={i} x1={0} y1={MINI_HEADER + i * MINI_ROW} x2={width} y2={MINI_HEADER + i * MINI_ROW} stroke="#bfdbfe" strokeWidth={0.3} />
      ))}
      <rect width={width} height={h} rx={2} fill="none" stroke="#1d4ed8" strokeWidth={1} />
    </g>
  )
}
