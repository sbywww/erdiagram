import { useState, useEffect, useCallback } from 'react'
import { useDiagramStore } from '../store/diagramStore.ts'
import type { Table, Relation } from '../models/types.ts'
import { ChevronLeft, Check, AlertCircle } from 'lucide-react'

interface DiagramJson {
  tables: Table[]
  relations: Relation[]
  positions?: Record<string, { x: number; y: number }>
}

interface JsonEditorProps {
  collapsed: boolean
  onCollapse: () => void
}

export function JsonEditor({ collapsed, onCollapse }: JsonEditorProps) {
  const { tables, relations, nodePositions, setDiagram, setNodePosition } = useDiagramStore()
  const [jsonText, setJsonText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)

  // Store → JSON text (when store changes and editor is not dirty)
  useEffect(() => {
    if (dirty) return
    const json: DiagramJson = { tables, relations, positions: nodePositions }
    setJsonText(JSON.stringify(json, null, 2))
  }, [tables, relations, nodePositions, dirty])

  const handleChange = useCallback((value: string) => {
    setJsonText(value)
    setDirty(true)
    setError(null)
  }, [])

  // JSON text → Store
  const handleApply = useCallback(() => {
    try {
      const parsed: DiagramJson = JSON.parse(jsonText)

      if (!Array.isArray(parsed.tables)) {
        setError('"tables" must be an array')
        return
      }
      if (!Array.isArray(parsed.relations)) {
        setError('"relations" must be an array')
        return
      }

      setDiagram(parsed.tables, parsed.relations)

      if (parsed.positions) {
        for (const [id, pos] of Object.entries(parsed.positions)) {
          setNodePosition(id, pos)
        }
      }

      setError(null)
      setDirty(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON')
    }
  }, [jsonText, setDiagram, setNodePosition])

  const handleReset = useCallback(() => {
    setDirty(false)
    setError(null)
  }, [])

  if (collapsed) return null

  return (
    <div className="w-[400px] h-full border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-9 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shrink-0">
        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">JSON Editor</span>
        <div className="flex items-center gap-1">
          {dirty && (
            <>
              <button
                onClick={handleApply}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Check size={12} /> Apply
              </button>
              <button
                onClick={handleReset}
                className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                Reset
              </button>
            </>
          )}
          <button
            onClick={onCollapse}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title="Collapse"
          >
            <ChevronLeft size={14} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-1 px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs border-b border-red-100 dark:border-red-800">
          <AlertCircle size={12} />
          {error}
        </div>
      )}

      {/* Editor */}
      <textarea
        value={jsonText}
        onChange={(e) => handleChange(e.target.value)}
        className="flex-1 p-3 text-xs font-mono text-gray-800 dark:text-gray-200 bg-transparent resize-none focus:outline-none"
        spellCheck={false}
      />
    </div>
  )
}
