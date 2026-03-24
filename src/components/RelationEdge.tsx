import { useState, useEffect, useRef, useCallback } from 'react'
import { useReactFlow, type EdgeProps } from '@xyflow/react'
import type { RelationType } from '../models/types.ts'
import { useThemeStore } from '../store/themeStore.ts'
import { useDiagramStore } from '../store/diagramStore.ts'

const MARKER_W = 10
const MARKER_H = 10
const CORNER_R = 8
const ROUTE_OFFSET = 50

function OneMarker({ id, color }: { id: string; color: string }) {
  return (
    <marker id={id} viewBox="0 0 20 20" refX="18" refY="10"
      markerWidth={MARKER_W} markerHeight={MARKER_H} orient="auto-start-reverse">
      <line x1="14" y1="4" x2="14" y2="16" stroke={color} strokeWidth="1.5" />
      <line x1="18" y1="4" x2="18" y2="16" stroke={color} strokeWidth="1.5" />
    </marker>
  )
}

function ManyMarker({ id, color }: { id: string; color: string }) {
  return (
    <marker id={id} viewBox="0 0 20 20" refX="20" refY="10"
      markerWidth={MARKER_W} markerHeight={MARKER_H} orient="auto-start-reverse">
      <line x1="6" y1="10" x2="20" y2="3" stroke={color} strokeWidth="1.5" />
      <line x1="6" y1="10" x2="20" y2="10" stroke={color} strokeWidth="1.5" />
      <line x1="6" y1="10" x2="20" y2="17" stroke={color} strokeWidth="1.5" />
    </marker>
  )
}

function getMarkers(relationType: RelationType) {
  switch (relationType) {
    case '1:1': return { SourceMarker: OneMarker, TargetMarker: OneMarker }
    case '1:N': return { SourceMarker: OneMarker, TargetMarker: ManyMarker }
    case 'N:M': return { SourceMarker: ManyMarker, TargetMarker: ManyMarker }
  }
}

/**
 * Orthogonal H-V-H path. First/last segments always horizontal → markers stay upright.
 */
function buildPath(sx: number, sy: number, tx: number, ty: number, mx: number): string {
  if (Math.abs(sy - ty) < 1) {
    return `M ${sx} ${sy} L ${tx} ${ty}`
  }

  const dy = ty - sy
  const r = Math.min(CORNER_R, Math.abs(dy) / 2, Math.abs(mx - sx), Math.abs(tx - mx))

  if (r < 1) {
    return `M ${sx} ${sy} L ${mx} ${sy} L ${mx} ${ty} L ${tx} ${ty}`
  }

  const dirY = dy > 0 ? 1 : -1
  const dirXs = mx > sx ? 1 : -1
  const dirXt = tx > mx ? 1 : -1

  return [
    `M ${sx} ${sy}`,
    `L ${mx - r * dirXs} ${sy}`,
    `Q ${mx} ${sy} ${mx} ${sy + r * dirY}`,
    `L ${mx} ${ty - r * dirY}`,
    `Q ${mx} ${ty} ${mx + r * dirXt} ${ty}`,
    `L ${tx} ${ty}`,
  ].join(' ')
}

/** Compute the default bendX based on source/target positions */
function getDefaultBendX(sx: number, tx: number): number {
  // Normal case: source left of target → bend in the middle
  if (sx + ROUTE_OFFSET < tx) {
    return (sx + tx) / 2
  }
  // Source is close to or right of target → route around to the right
  return Math.max(sx, tx) + ROUTE_OFFSET
}

export function RelationEdge(props: EdgeProps) {
  const { id, sourceX, sourceY, targetX, targetY, data } = props
  const relationType = (data?.relationType as RelationType) ?? '1:N'
  const bendX = data?.bendX as number | undefined
  const relationId = (data?.relationId as string) ?? id

  const theme = useThemeStore((s) => s.theme)
  const color = theme === 'dark' ? '#9ca3af' : '#6b7280'
  const activeColor = theme === 'dark' ? '#60a5fa' : '#3b82f6'

  const { setRelationBendX } = useDiagramStore()
  const reactFlow = useReactFlow()

  const [active, setActive] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [wpHover, setWpHover] = useState(false)
  const flowRef = useRef<SVGPathElement>(null)
  const measureRef = useRef<SVGPathElement>(null)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number | null>(null)
  const lengthRef = useRef<number>(0)

  const sourceId = `${id}-source`
  const targetId = `${id}-target`
  const glowFilterId = `${id}-glow`
  const { SourceMarker, TargetMarker } = getMarkers(relationType)

  const defaultMx = getDefaultBendX(sourceX, targetX)
  const mx = bendX ?? defaultMx
  const isHorizontal = Math.abs(sourceY - targetY) < 1
  const hasBend = bendX !== undefined

  const edgePath = buildPath(sourceX, sourceY, targetX, targetY, mx)

  // Waypoint position: center of vertical segment
  const wpX = mx
  const wpY = (sourceY + targetY) / 2

  useEffect(() => {
    if (measureRef.current) {
      lengthRef.current = measureRef.current.getTotalLength()
    }
  }, [edgePath])

  // Flow animation
  const startAnimation = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    startRef.current = null
    function tick(ts: number) {
      if (!startRef.current) startRef.current = ts
      const totalLen = lengthRef.current
      if (!totalLen || !flowRef.current) { rafRef.current = requestAnimationFrame(tick); return }
      const segLen = totalLen * 0.25
      const progress = ((ts - startRef.current) / 3000) % 1
      flowRef.current.style.strokeDasharray = `${segLen} ${totalLen}`
      flowRef.current.style.strokeDashoffset = `${-progress * (totalLen - segLen)}`
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const stopAnimation = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    startRef.current = null
  }, [])

  useEffect(() => {
    if (active) startAnimation(); else stopAnimation()
    return () => stopAnimation()
  }, [active, startAnimation, stopAnimation])

  // Click hint → create real waypoint at current position
  const handleHintClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setRelationBendX(relationId, mx)
  }, [relationId, mx, setRelationBendX])

  // Drag real waypoint
  const handleWpMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setDragging(true)

    const onMouseMove = (me: MouseEvent) => {
      const pos = reactFlow.screenToFlowPosition({ x: me.clientX, y: me.clientY })
      setRelationBendX(relationId, pos.x)
    }
    const onMouseUp = () => {
      setDragging(false)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [reactFlow, relationId, setRelationBendX])

  // Double-click real waypoint → reset to auto
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setRelationBendX(relationId, undefined)
  }, [relationId, setRelationBendX])

  const wpFill = theme === 'dark' ? '#1f2937' : '#ffffff'
  const wpStroke = theme === 'dark' ? '#60a5fa' : '#3b82f6'
  const fixedDotColor = theme === 'dark' ? '#6b7280' : '#9ca3af'

  return (
    <g
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => { if (!dragging) { setActive(false); setWpHover(false) } }}
      style={{ pointerEvents: 'all', cursor: 'pointer' }}
    >
      <defs>
        <SourceMarker id={sourceId} color={color} />
        <TargetMarker id={targetId} color={color} />
        <filter id={glowFilterId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <path ref={measureRef} d={edgePath} fill="none" stroke="none" />

      {/* Hit area */}
      <path d={edgePath} fill="none" stroke="transparent" strokeWidth={16} />

      {/* Base line */}
      <path id={id} d={edgePath} fill="none" stroke={color} strokeWidth={1.5}
        markerStart={`url(#${sourceId})`} markerEnd={`url(#${targetId})`} />

      {/* Flow animation */}
      <path ref={flowRef} d={edgePath} fill="none" stroke={activeColor}
        strokeWidth={3} strokeLinecap="round"
        opacity={active ? 1 : 0}
        filter={active ? `url(#${glowFilterId})` : undefined}
        style={{ transition: 'opacity 0.2s' }} />

      {/* Fixed start/end waypoints (non-interactive) */}
      {active && (
        <>
          <circle cx={sourceX} cy={sourceY} r={3} fill={fixedDotColor} />
          <circle cx={targetX} cy={targetY} r={3} fill={fixedDotColor} />
        </>
      )}

      {/* Waypoint on vertical segment */}
      {active && !isHorizontal && (
        hasBend ? (
          /* Real waypoint — draggable */
          <circle
            cx={wpX} cy={wpY}
            r={wpHover ? 6 : 5}
            fill={wpFill} stroke={wpStroke} strokeWidth={2}
            style={{ cursor: 'col-resize', transition: 'r 0.1s' }}
            onMouseEnter={() => setWpHover(true)}
            onMouseLeave={() => setWpHover(false)}
            onMouseDown={handleWpMouseDown}
            onDoubleClick={handleDoubleClick}
          />
        ) : (
          /* Hint waypoint — click to activate */
          <circle
            cx={wpX} cy={wpY}
            r={wpHover ? 5 : 3.5}
            fill={wpFill} stroke={wpStroke}
            strokeWidth={1.5}
            strokeDasharray={wpHover ? 'none' : '2 2'}
            opacity={wpHover ? 0.9 : 0.4}
            style={{ cursor: 'pointer', transition: 'r 0.1s, opacity 0.1s' }}
            onMouseEnter={() => setWpHover(true)}
            onMouseLeave={() => setWpHover(false)}
            onMouseDown={handleHintClick}
          />
        )
      )}
    </g>
  )
}
