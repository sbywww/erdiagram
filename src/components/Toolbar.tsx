import { useReactFlow, useViewport } from '@xyflow/react'
import { Minus, Plus, Maximize, Hand, MousePointer } from 'lucide-react'

interface ToolbarProps {
  panMode: boolean
  onPanModeChange: (pan: boolean) => void
}

export function Toolbar({ panMode, onPanModeChange }: ToolbarProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  const { zoom } = useViewport()
  const zoomPercent = Math.round(zoom * 100)

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md px-2 py-1 text-sm text-gray-700 dark:text-gray-300">
      <button
        onClick={() => zoomOut()}
        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        title="Zoom out"
      >
        <Minus size={14} />
      </button>

      <span className="w-12 text-center text-xs font-medium tabular-nums">
        {zoomPercent}%
      </span>

      <button
        onClick={() => zoomIn()}
        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        title="Zoom in"
      >
        <Plus size={14} />
      </button>

      <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1" />

      <button
        onClick={() => fitView({ padding: 0.2 })}
        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        title="Zoom to fit all elements in view"
      >
        <Maximize size={14} />
      </button>

      <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1" />

      <button
        onClick={() => onPanModeChange(false)}
        className={`p-1.5 rounded ${!panMode ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400'}`}
        title="Select mode (V)"
      >
        <MousePointer size={14} />
      </button>

      <button
        onClick={() => onPanModeChange(true)}
        className={`p-1.5 rounded ${panMode ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400'}`}
        title="Hand tool — drag to pan (H)"
      >
        <Hand size={14} />
      </button>
    </div>
  )
}
