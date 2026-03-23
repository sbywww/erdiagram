import { useState, useEffect } from 'react'
import type { Table, Column } from '../models/types.ts'

interface TableDialogProps {
  table: Table | null
  onSave: (table: Table) => void
  onCancel: () => void
  onDelete?: (id: string) => void
}

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

function createEmptyTable(): Table {
  return {
    id: crypto.randomUUID(),
    physicalName: '',
    logicalName: '',
    columns: [createEmptyColumn()],
  }
}

export function TableDialog({ table, onSave, onCancel, onDelete }: TableDialogProps) {
  const [form, setForm] = useState<Table>(table ?? createEmptyTable)
  const isEdit = table !== null

  useEffect(() => {
    setForm(table ?? createEmptyTable())
  }, [table])

  const updateColumn = (index: number, updates: Partial<Column>) => {
    setForm((prev) => ({
      ...prev,
      columns: prev.columns.map((col, i) => (i === index ? { ...col, ...updates } : col)),
    }))
  }

  const addColumn = () => {
    setForm((prev) => ({ ...prev, columns: [...prev.columns, createEmptyColumn()] }))
  }

  const removeColumn = (index: number) => {
    setForm((prev) => ({ ...prev, columns: prev.columns.filter((_, i) => i !== index) }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.physicalName.trim()) return
    onSave(form)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-[700px] max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
            {isEdit ? 'Edit Table' : 'New Table'}
          </h2>
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto flex-1 space-y-4">
          {/* Table name fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Physical Name *
              </label>
              <input
                type="text"
                value={form.physicalName}
                onChange={(e) => setForm((prev) => ({ ...prev, physicalName: e.target.value }))}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="users"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Logical Name
              </label>
              <input
                type="text"
                value={form.logicalName}
                onChange={(e) => setForm((prev) => ({ ...prev, logicalName: e.target.value }))}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="사용자"
              />
            </div>
          </div>

          {/* Columns */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Columns</label>
              <button
                type="button"
                onClick={addColumn}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
              >
                + Add Column
              </button>
            </div>

            {/* Column header */}
            <div className="grid grid-cols-[40px_40px_1fr_120px_80px_40px_80px_1fr_32px] gap-1 text-[10px] text-gray-400 font-medium px-1 mb-1">
              <span>PK</span>
              <span>FK</span>
              <span>Name</span>
              <span>Type</span>
              <span>Default</span>
              <span>NN</span>
              <span>Comment</span>
              <span></span>
              <span></span>
            </div>

            {/* Column rows */}
            <div className="space-y-1">
              {form.columns.map((col, i) => (
                <div
                  key={col.id}
                  className="grid grid-cols-[40px_40px_1fr_120px_80px_40px_80px_1fr_32px] gap-1 items-center"
                >
                  <input
                    type="checkbox"
                    checked={col.isPK}
                    onChange={(e) => updateColumn(i, { isPK: e.target.checked })}
                    className="justify-self-center"
                  />
                  <input
                    type="checkbox"
                    checked={col.isFK}
                    onChange={(e) => updateColumn(i, { isFK: e.target.checked })}
                    className="justify-self-center"
                  />
                  <input
                    type="text"
                    value={col.name}
                    onChange={(e) => updateColumn(i, { name: e.target.value })}
                    className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="column_name"
                  />
                  <input
                    type="text"
                    value={col.type}
                    onChange={(e) => updateColumn(i, { type: e.target.value })}
                    className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="varchar(255)"
                  />
                  <input
                    type="text"
                    value={col.default ?? ''}
                    onChange={(e) => updateColumn(i, { default: e.target.value })}
                    className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder=""
                  />
                  <input
                    type="checkbox"
                    checked={col.notNull}
                    onChange={(e) => updateColumn(i, { notNull: e.target.checked })}
                    className="justify-self-center"
                  />
                  <input
                    type="text"
                    value={col.comment ?? ''}
                    onChange={(e) => updateColumn(i, { comment: e.target.value })}
                    className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder=""
                  />
                  <span></span>
                  <button
                    type="button"
                    onClick={() => removeColumn(i)}
                    className="text-red-400 hover:text-red-600 text-sm justify-self-center"
                    title="Remove column"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <div>
            {isEdit && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(form.id)}
                className="px-4 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
              >
                Delete Table
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {isEdit ? 'Save' : 'Create'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
