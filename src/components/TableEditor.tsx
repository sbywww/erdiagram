import { useState, useEffect, useCallback } from 'react'
import { useDiagramStore } from '../store/diagramStore.ts'
import type { Column } from '../models/types.ts'
import { Trash2 } from 'lucide-react'

function createEmptyColumn(): Column {
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

interface TableEditorProps {
  tableId: string | null
  onDeselect: () => void
}

export function TableEditor({ tableId, onDeselect }: TableEditorProps) {
  const { tables, updateTable, removeTable } = useDiagramStore()
  const table = tables.find((t) => t.id === tableId)

  const [physicalName, setPhysicalName] = useState('')
  const [logicalName, setLogicalName] = useState('')
  const [columns, setColumns] = useState<Column[]>([])

  // Sync table → local state
  useEffect(() => {
    if (!table) return
    setPhysicalName(table.physicalName)
    setLogicalName(table.logicalName)
    setColumns(table.columns)
  }, [table])

  const save = useCallback(() => {
    if (!tableId || !physicalName.trim()) return
    updateTable(tableId, { physicalName, logicalName, columns })
  }, [tableId, physicalName, logicalName, columns, updateTable])

  const updateColumn = (index: number, updates: Partial<Column>) => {
    setColumns((prev) => prev.map((col, i) => (i === index ? { ...col, ...updates } : col)))
  }

  const addColumn = () => {
    setColumns((prev) => [...prev, createEmptyColumn()])
  }

  const removeColumn = (index: number) => {
    setColumns((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDelete = () => {
    if (!tableId) return
    removeTable(tableId)
    onDeselect()
  }

  if (!table) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-gray-400 dark:text-gray-500">
        테이블을 선택하세요
      </div>
    )
  }

  const inputClass = 'w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500'
  const labelClass = 'block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-0.5'

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-3 py-3 space-y-3 overflow-y-auto flex-1">
        {/* Table name */}
        <div className="space-y-2">
          <div>
            <label className={labelClass}>Physical Name</label>
            <input
              type="text"
              value={physicalName}
              onChange={(e) => setPhysicalName(e.target.value)}
              onBlur={save}
              className={inputClass}
              placeholder="users"
            />
          </div>
          <div>
            <label className={labelClass}>Logical Name</label>
            <input
              type="text"
              value={logicalName}
              onChange={(e) => setLogicalName(e.target.value)}
              onBlur={save}
              className={inputClass}
              placeholder="사용자"
            />
          </div>
        </div>

        {/* Columns */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Columns</span>
            <button
              type="button"
              onClick={() => { addColumn(); setTimeout(save, 0) }}
              className="text-[10px] text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
            >
              + Add
            </button>
          </div>

          <div className="space-y-1.5">
            {columns.map((col, i) => (
              <div key={col.id} className="border border-gray-200 dark:border-gray-700 rounded p-2 space-y-1.5 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={col.name}
                    onChange={(e) => updateColumn(i, { name: e.target.value })}
                    onBlur={save}
                    className={inputClass}
                    placeholder="column_name"
                  />
                  <input
                    type="text"
                    value={col.type}
                    onChange={(e) => updateColumn(i, { type: e.target.value })}
                    onBlur={save}
                    className={`${inputClass} w-24 shrink-0`}
                    placeholder="type"
                  />
                  <button
                    type="button"
                    onClick={() => { removeColumn(i); setTimeout(save, 0) }}
                    className="text-gray-400 hover:text-red-500 shrink-0"
                    title="Remove"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-gray-500 dark:text-gray-400">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" checked={col.isPK} onChange={(e) => { updateColumn(i, { isPK: e.target.checked }); setTimeout(save, 0) }} className="w-3 h-3" />
                    PK
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" checked={col.isFK} onChange={(e) => { updateColumn(i, { isFK: e.target.checked }); setTimeout(save, 0) }} className="w-3 h-3" />
                    FK
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" checked={col.notNull} onChange={(e) => { updateColumn(i, { notNull: e.target.checked }); setTimeout(save, 0) }} className="w-3 h-3" />
                    NN
                  </label>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={col.default ?? ''}
                    onChange={(e) => updateColumn(i, { default: e.target.value })}
                    onBlur={save}
                    className={`${inputClass} flex-1`}
                    placeholder="default"
                  />
                  <input
                    type="text"
                    value={col.comment ?? ''}
                    onChange={(e) => updateColumn(i, { comment: e.target.value })}
                    onBlur={save}
                    className={`${inputClass} flex-1`}
                    placeholder="comment"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center shrink-0">
        <button
          type="button"
          onClick={handleDelete}
          className="flex items-center gap-1 text-[10px] text-red-500 hover:text-red-700 dark:hover:text-red-400"
        >
          <Trash2 size={11} />
          Delete Table
        </button>
        <button
          type="button"
          onClick={save}
          className="px-3 py-1 text-[10px] bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Apply
        </button>
      </div>
    </div>
  )
}
