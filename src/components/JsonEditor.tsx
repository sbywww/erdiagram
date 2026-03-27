/**
 * JSON 에디터 컴포넌트
 * - 스토어 상태를 JSON 텍스트로 표시하고 직접 편집/적용 가능
 * - dirty 상태 관리: 편집 중에는 스토어 변경이 덮어쓰지 않음
 */
import { useState, useEffect, useCallback } from 'react'
import { useDiagramStore } from '../store/diagramStore.ts'
import type { Table, Relation } from '../models/types.ts'
import { Check, AlertCircle } from 'lucide-react'
import { useI18n } from '../i18n/index.ts'

interface DiagramJson {
  tables: Table[]
  relations: Relation[]
  positions?: Record<string, { x: number; y: number }>
}

export function JsonEditor() {
  const { tables, relations, nodePositions, setDiagram, setNodePosition } = useDiagramStore()
  const { t } = useI18n()
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

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      {dirty && (
        <div className="flex items-center gap-1 px-3 py-1.5 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <button
            onClick={handleApply}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Check size={12} /> {t('json.apply')}
          </button>
          <button
            onClick={handleReset}
            className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            {t('json.reset')}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-1 px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs border-b border-red-100 dark:border-red-800 shrink-0">
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
