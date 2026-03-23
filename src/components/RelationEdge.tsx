import { BaseEdge, getSmoothStepPath, type EdgeProps } from '@xyflow/react'
import type { RelationType } from '../models/types.ts'
import { useThemeStore } from '../store/themeStore.ts'

const MARKER_SIZE = 12

function CrowFootMarker({ id, color }: { id: string; color: string }) {
  return (
    <marker
      id={id}
      viewBox="0 0 12 12"
      refX="12"
      refY="6"
      markerWidth={MARKER_SIZE}
      markerHeight={MARKER_SIZE}
      orient="auto-start-reverse"
    >
      <path d="M0,0 L12,6 L0,12" fill="none" stroke={color} strokeWidth="1.5" />
    </marker>
  )
}

function OneMarker({ id, color }: { id: string; color: string }) {
  return (
    <marker
      id={id}
      viewBox="0 0 12 12"
      refX="12"
      refY="6"
      markerWidth={MARKER_SIZE}
      markerHeight={MARKER_SIZE}
      orient="auto-start-reverse"
    >
      <path d="M10,0 L10,12" fill="none" stroke={color} strokeWidth="1.5" />
    </marker>
  )
}

function getMarkers(relationType: RelationType) {
  switch (relationType) {
    case '1:1':
      return { SourceMarker: OneMarker, TargetMarker: OneMarker }
    case '1:N':
      return { SourceMarker: OneMarker, TargetMarker: CrowFootMarker }
    case 'N:M':
      return { SourceMarker: CrowFootMarker, TargetMarker: CrowFootMarker }
  }
}

export function RelationEdge(props: EdgeProps) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data } = props
  const relationType = (data?.relationType as RelationType) ?? '1:N'
  const theme = useThemeStore((s) => s.theme)
  const color = theme === 'dark' ? '#9ca3af' : '#6b7280'

  const sourceId = `${id}-source`
  const targetId = `${id}-target`
  const { SourceMarker, TargetMarker } = getMarkers(relationType)

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 8,
  })

  return (
    <>
      <defs>
        <SourceMarker id={sourceId} color={color} />
        <TargetMarker id={targetId} color={color} />
      </defs>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{ stroke: color, strokeWidth: 1.5 }}
        markerStart={`url(#${sourceId})`}
        markerEnd={`url(#${targetId})`}
      />
      <text
        x={labelX}
        y={labelY - 10}
        textAnchor="middle"
        className="fill-gray-500 dark:fill-gray-400 text-[10px] font-medium"
      >
        {relationType}
      </text>
    </>
  )
}
