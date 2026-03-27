import { useState } from 'react'
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, Position, type EdgeProps } from '@xyflow/react'
import type { RelationType } from '../models/types.ts'

const BORDER_RADIUS = 8
const OFFSET = 20

const COLOR_DEFAULT = '#555555'
const COLOR_ACTIVE = '#3b82f6'
const COLOR_NON_IDENTIFYING = '#f59e0b'

function getLabel(marker: 'one' | 'many'): string {
  return marker === 'one' ? '1' : '*'
}

function getMarkerTypes(type: RelationType): { source: 'one' | 'many'; target: 'one' | 'many' } {
  switch (type) {
    case '1:1': return { source: 'one', target: 'one' }
    case '1:N': return { source: 'one', target: 'many' }
    case 'N:M': return { source: 'many', target: 'many' }
  }
}

function getLabelOffset(position: Position): { dx: number; dy: number } {
  switch (position) {
    case Position.Left:  return { dx: -5, dy: -10 }
    case Position.Right: return { dx: 5, dy: -10 }
    case Position.Top:   return { dx: 0, dy: -18 }
    case Position.Bottom: return { dx: 0, dy: 18 }
  }
}

export function RelationEdge({
  id, sourceX, sourceY, sourcePosition,
  targetX, targetY, targetPosition,
  selected, animated, data,
}: EdgeProps) {
  const [hovered, setHovered] = useState(false)
  const relationType = (data?.relationType as RelationType) ?? '1:N'
  const identifying = (data?.identifying as boolean) ?? true

  const [edgePath] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
    borderRadius: BORDER_RADIUS,
    offset: OFFSET,
  })

  const isActive = hovered || selected || animated
  const stroke = identifying
    ? (isActive ? COLOR_ACTIVE : COLOR_DEFAULT)
    : COLOR_NON_IDENTIFYING

  const markers = getMarkerTypes(relationType)
  const oneId = `${id}-one`
  const manyId = `${id}-many`

  const srcOffset = getLabelOffset(sourcePosition)
  const tgtOffset = getLabelOffset(targetPosition)

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
      {isActive && (
        <EdgeLabelRenderer>
          <div
            className="absolute text-[10px] font-bold pointer-events-none"
            style={{
              transform: `translate(-50%, -50%) translate(${sourceX + srcOffset.dx}px, ${sourceY + srcOffset.dy}px)`,
              color: stroke,
            }}
          >
            {getLabel(markers.source)}
          </div>
          <div
            className="absolute text-[10px] font-bold pointer-events-none"
            style={{
              transform: `translate(-50%, -50%) translate(${targetX + tgtOffset.dx}px, ${targetY + tgtOffset.dy}px)`,
              color: stroke,
            }}
          >
            {getLabel(markers.target)}
          </div>
        </EdgeLabelRenderer>
      )}
    </g>
  )
}
