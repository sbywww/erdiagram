import { useState } from 'react'
import { BaseEdge, getSmoothStepPath, type EdgeProps } from '@xyflow/react'
import type { RelationType } from '../models/types.ts'

const BORDER_RADIUS = 8
const OFFSET = 20

const COLOR_DEFAULT = '#555555'
const COLOR_ACTIVE = '#3b82f6'

/** IE 표기법: relationType → source/target 마커 종류 */
function getMarkerTypes(type: RelationType): { source: 'one' | 'many'; target: 'one' | 'many' } {
  switch (type) {
    case '1:1': return { source: 'one', target: 'one' }
    case '1:N': return { source: 'one', target: 'many' }
    case 'N:M': return { source: 'many', target: 'many' }
  }
}

export function RelationEdge({
  id, sourceX, sourceY, sourcePosition,
  targetX, targetY, targetPosition,
  selected, animated, data,
}: EdgeProps) {
  const [hovered, setHovered] = useState(false)
  const relationType = (data?.relationType as RelationType) ?? '1:N'

  const [edgePath] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
    borderRadius: BORDER_RADIUS,
    offset: OFFSET,
  })

  const isActive = hovered || selected || animated
  const stroke = isActive ? COLOR_ACTIVE : COLOR_DEFAULT

  const markers = getMarkerTypes(relationType)
  const oneId = `${id}-one`
  const manyId = `${id}-many`

  return (
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <defs>
        {/* IE "1" — 수직 선 */}
        <marker id={oneId} viewBox="0 0 6 20" refX="6" refY="10"
          markerWidth={4} markerHeight={10} orient="auto-start-reverse">
          <line x1="6" y1="3" x2="6" y2="17" stroke={stroke} strokeWidth="2" />
        </marker>
        {/* IE "N/M" — 까마귀 발 (crow's foot) + 수직 선 */}
        <marker id={manyId} viewBox="0 0 16 20" refX="16" refY="10"
          markerWidth={8} markerHeight={10} orient="auto-start-reverse">
          <line x1="0" y1="10" x2="16" y2="3" stroke={stroke} strokeWidth="2" />
          <line x1="0" y1="10" x2="16" y2="10" stroke={stroke} strokeWidth="2.5" />
          <line x1="0" y1="10" x2="16" y2="17" stroke={stroke} strokeWidth="2" />
        </marker>
      </defs>
      <BaseEdge
        id={id}
        path={edgePath}
        markerStart={`url(#${markers.source === 'one' ? oneId : manyId})`}
        markerEnd={`url(#${markers.target === 'one' ? oneId : manyId})`}
        style={{
          stroke,
          strokeWidth: 1.5,
          ...(isActive
            ? { strokeDasharray: '5 5', animation: 'dashdraw 0.5s linear infinite' }
            : {}),
        }}
      />
    </g>
  )
}
