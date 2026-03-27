/**
 * 테이블 생성/수정 다이얼로그
 * - 테이블명, 컬럼(PK/FK/타입/NN/기본값/코멘트) 편집 폼
 * - FK 컬럼은 관계에 의해 관리되므로 편집 불가
 */
import { useState, useEffect } from 'react'
import type { Table, Column } from '../models/types.ts'
import { createEmptyColumn, createEmptyTable } from '../models/types.ts'
import { useI18n } from '../i18n/index.ts'
import { TypeAutocomplete } from '../ui/TypeAutocomplete.tsx'

interface TableDialogProps {
  table: Table | null
  existingNames: string[]
  onSave: (table: Table) => void
  onCancel: () => void
  onDelete?: (id: string) => void
}

const INPUT_CLASS = 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500'
const INPUT_DISABLED_CLASS = 'border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500 rounded px-2 py-1 text-xs cursor-not-allowed'

export function TableDialog({ table, existingNames, onSave, onCancel, onDelete }: TableDialogProps) {
  const { t } = useI18n()
  const [form, setForm] = useState<Table>(table ?? createEmptyTable)
  const [error, setError] = useState('')
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
    const name = form.physicalName.trim()
    if (!name) { setError(t('dialog.physicalNameRequired')); return }
    if (existingNames.includes(name)) { setError(t('dialog.duplicateTableName')); return }
    setError('')
    onSave(form)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-[720px] max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
            {isEdit ? t('dialog.editTable') : t('dialog.newTable')}
          </h2>
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto flex-1 space-y-4">
          {/* Table name fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {t('dialog.physicalName')}
              </label>
              <input
                type="text"
                value={form.physicalName}
                onChange={(e) => { setForm((prev) => ({ ...prev, physicalName: e.target.value })); setError('') }}
                className={`w-full border ${error ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="users"
                autoFocus
              />
              {error && <p className="text-red-500 text-[10px] mt-1">{error}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {t('dialog.logicalName')}
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
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">{t('dialog.columns')}</label>
              <button
                type="button"
                onClick={addColumn}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
              >
                {t('dialog.addColumn')}
              </button>
            </div>

            {/* Column header */}
            <div className="grid grid-cols-[32px_32px_1fr_120px_80px_32px_1fr_28px] gap-1 text-[10px] text-gray-400 font-medium px-1 mb-1">
              <span>PK</span>
              <span>FK</span>
              <span>Name</span>
              <span>Type</span>
              <span>Default</span>
              <span>NN</span>
              <span>Comment</span>
              <span></span>
            </div>

            {/* Column rows */}
            <div className="space-y-1">
              {form.columns.map((col, i) => (
                <div
                  key={col.id}
                  className="grid grid-cols-[32px_32px_1fr_120px_80px_32px_1fr_28px] gap-1 items-center"
                >
                  <input
                    type="checkbox"
                    checked={col.isPK}
                    onChange={(e) => updateColumn(i, { isPK: e.target.checked })}
                    disabled={col.isFK}
                    className="justify-self-center"
                  />
                  <input
                    type="checkbox"
                    checked={col.isFK}
                    disabled
                    className="justify-self-center cursor-not-allowed"
                    title={t('dialog.fkManagedByRelation')}
                  />
                  <input
                    type="text"
                    value={col.name}
                    onChange={(e) => updateColumn(i, { name: e.target.value })}
                    disabled={col.isFK}
                    className={col.isFK ? INPUT_DISABLED_CLASS : INPUT_CLASS}
                    placeholder="column_name"
                  />
                  <TypeAutocomplete
                    value={col.type}
                    onChange={(v) => updateColumn(i, { type: v })}
                    disabled={col.isFK}
                    className={`w-full ${col.isFK ? INPUT_DISABLED_CLASS : INPUT_CLASS}`}
                    wrapperClassName="relative min-w-0"
                  />
                  <input
                    type="text"
                    value={col.default ?? ''}
                    onChange={(e) => updateColumn(i, { default: e.target.value })}
                    className={INPUT_CLASS}
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
                    className={INPUT_CLASS}
                    placeholder=""
                  />
                  {col.isFK ? (
                    <span className="text-[10px] text-gray-400 justify-self-center" title={t('dialog.fkManagedByRelation')}>
                      🔒
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => removeColumn(i)}
                      className="text-red-400 hover:text-red-600 text-sm justify-self-center"
                      title={t('dialog.removeColumn')}
                    >
                      x
                    </button>
                  )}
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
                {t('dialog.deleteTable')}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              {t('dialog.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {isEdit ? t('dialog.save') : t('dialog.create')}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
