import { useState, useEffect, useRef } from 'react'
import { getSmoothStepPath, type EdgeProps } from '@xyflow/react'
import type { RelationType } from '../models/types.ts'
import { useThemeStore } from '../store/themeStore.ts'

const MARKER_W = 10
const MARKER_H = 10

function OneMarker({ id, color }: { id: string; color: string }) {
  return (
    <marker
      id={id}
      viewBox="0 0 20 20"
      refX="18"
      refY="10"
      markerWidth={MARKER_W}
      markerHeight={MARKER_H}
      orient="auto-start-reverse"
    >
      <line x1="14" y1="4" x2="14" y2="16" stroke={color} strokeWidth="1.5" />
      <line x1="18" y1="4" x2="18" y2="16" stroke={color} strokeWidth="1.5" />
    </marker>
  )
}

function ManyMarker({ id, color }: { id: string; color: string }) {
  return (
    <marker
      id={id}
      viewBox="0 0 20 20"
      refX="20"
      refY="10"
      markerWidth={MARKER_W}
      markerHeight={MARKER_H}
      orient="auto-start-reverse"
    >
      <line x1="6" y1="10" x2="20" y2="3" stroke={color} strokeWidth="1.5" />
      <line x1="6" y1="10" x2="20" y2="10" stroke={color} strokeWidth="1.5" />
      <line x1="6" y1="10" x2="20" y2="17" stroke={color} strokeWidth="1.5" />
    </marker>
  )
}

function getMarkers(relationType: RelationType) {
  switch (relationType) {
    case '1:1':
      return { SourceMarker: OneMarker, TargetMarker: OneMarker }
    case '1:N':
      return { SourceMarker: OneMarker, TargetMarker: ManyMarker }
    case 'N:M':
      return { SourceMarker: ManyMarker, TargetMarker: ManyMarker }
  }
}

export function RelationEdge(props: EdgeProps) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data } = props
  const relationType = (data?.relationType as RelationType) ?? '1:N'
  const theme = useThemeStore((s) => s.theme)
  const color = theme === 'dark' ? '#9ca3af' : '#6b7280'
  const activeColor = theme === 'dark' ? '#60a5fa' : '#3b82f6'

  const [hovered, setHovered] = useState(false)
  const animRef = useRef<SVGPathElement>(null)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number | null>(null)

  const sourceId = `${id}-source`
  const targetId = `${id}-target`
  const { SourceMarker, TargetMarker } = getMarkers(relationType)

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 8,
  })

  useEffect(() => {
    if (!hovered) {
      cancelAnimationFrame(rafRef.current)
      startRef.current = null
      if (animRef.current) {
        animRef.current.style.strokeDashoffset = '0'
      }
      return
    }

    function tick(ts: number) {
      if (!startRef.current) startRef.current = ts
      if (animRef.current) {
        const offset = -((ts - startRef.current) * 0.05) % 16
        animRef.current.style.strokeDashoffset = `${offset}px`
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [hovered])

  const currentColor = hovered ? activeColor : color

  return (
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ pointerEvents: 'all' }}
    >
      <defs>
        <SourceMarker id={sourceId} color={currentColor} />
        <TargetMarker id={targetId} color={currentColor} />
      </defs>
      {/* Invisible wider hit area */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
      />
      {/* Visible edge */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={currentColor}
        strokeWidth={hovered ? 2.5 : 1.5}
        markerStart={`url(#${sourceId})`}
        markerEnd={`url(#${targetId})`}
      />
      {/* Flow animation - always mounted, visibility toggled */}
      <path
        ref={animRef}
        d={edgePath}
        fill="none"
        stroke={activeColor}
        strokeWidth={2.5}
        strokeDasharray="6 10"
        strokeLinecap="butt"
        opacity={hovered ? 1 : 0}
      />
    </g>
  )
}
