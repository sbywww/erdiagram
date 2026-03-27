/**
 * 캔버스 상단 액션 바 컴포넌트
 * - 테이블/관계 추가, Undo/Redo, 디스플레이 옵션 토글, 패널 열기/닫기
 */
import { useState, useRef, useEffect } from 'react'
import { useDiagramStore } from '../store/diagramStore.ts'
import { TableProperties, ArrowLeftRight, Undo2, Redo2, PanelLeftOpen, PanelLeftClose, PanelRightOpen, PanelRightClose, Eye } from 'lucide-react'
import type { DisplaySettings } from '../models/types.ts'
import { useI18n } from '../i18n/index.ts'

interface ActionBarProps {
  onAddTable: () => void
  onAddRelation: () => void
  editorCollapsed: boolean
  onToggleEditor: () => void
  viewsOpen: boolean
  onToggleViews: () => void
}

const TOGGLE_ITEMS: { key: keyof DisplaySettings; label: string }[] = [
  { key: 'showPKFK', label: 'PK/FK' },
  { key: 'showType', label: 'Type' },
  { key: 'showNotNull', label: 'NN' },
  { key: 'showComment', label: 'Comment' },
]

export function ActionBar({ onAddTable, onAddRelation, editorCollapsed, onToggleEditor, viewsOpen, onToggleViews }: ActionBarProps) {
  const { canUndo, canRedo, undo, redo, displaySettings, setDisplaySettings } = useDiagramStore()
  const { t } = useI18n()
  const [showDisplayMenu, setShowDisplayMenu] = useState(false)
  const displayMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showDisplayMenu) return
    const handleClick = (e: MouseEvent) => {
      if (displayMenuRef.current && !displayMenuRef.current.contains(e.target as HTMLElement)) {
        setShowDisplayMenu(false)
      }
    }
    window.addEventListener('mousedown', handleClick)
    return () => window.removeEventListener('mousedown', handleClick)
  }, [showDisplayMenu])

  const btnClass = 'flex items-center gap-1.5 px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white rounded'
  const disabledClass = 'flex items-center gap-1.5 px-3 py-1 text-xs text-gray-300 dark:text-gray-600 rounded cursor-not-allowed'

  return (
    <div className="h-9 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-3 gap-1 shrink-0">
      {/* Toggle editor panel */}
      <button
        onClick={onToggleEditor}
        className={btnClass}
        title={editorCollapsed ? t('action.openJsonEditor') : t('action.closeJsonEditor')}
      >
        {editorCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
      </button>

      <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />

      <button onClick={onAddTable} className={btnClass}>
        <TableProperties size={13} />
        {t('action.addTable')}
      </button>

      <button onClick={onAddRelation} className={btnClass}>
        <ArrowLeftRight size={13} />
        {t('action.addRelation')}
      </button>

      <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />

      <button
        onClick={undo}
        disabled={!canUndo}
        className={canUndo ? btnClass : disabledClass}
        title={t('action.undo')}
      >
        <Undo2 size={13} />
      </button>

      <button
        onClick={redo}
        disabled={!canRedo}
        className={canRedo ? btnClass : disabledClass}
        title={t('action.redo')}
      >
        <Redo2 size={13} />
      </button>

      <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />

      <div className="relative" ref={displayMenuRef}>
        <button
          onClick={() => setShowDisplayMenu((v) => !v)}
          className={btnClass}
          title={t('action.display')}
        >
          <Eye size={13} />
          {t('action.display')}
        </button>

        {showDisplayMenu && (
          <div className="absolute top-full mt-1 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-1 min-w-[120px] z-50">
            {TOGGLE_ITEMS.map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <input
                  type="checkbox"
                  checked={displaySettings[key]}
                  onChange={(e) => setDisplaySettings({ [key]: e.target.checked })}
                  className="rounded"
                />
                <span className="text-gray-700 dark:text-gray-300">{label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Toggle views panel */}
      <button
        onClick={onToggleViews}
        className={btnClass}
        title={viewsOpen ? t('action.closeViews') : t('action.openViews')}
      >
        {viewsOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
      </button>
    </div>
  )
}
