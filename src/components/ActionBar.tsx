import { useDiagramStore } from '../store/diagramStore.ts'
import { TableProperties, ArrowLeftRight, Undo2, Redo2, PanelLeftOpen, PanelLeftClose } from 'lucide-react'

interface ActionBarProps {
  onAddTable: () => void
  onAddRelation: () => void
  editorCollapsed: boolean
  onToggleEditor: () => void
}

export function ActionBar({ onAddTable, onAddRelation, editorCollapsed, onToggleEditor }: ActionBarProps) {
  const { canUndo, canRedo, undo, redo } = useDiagramStore()

  const btnClass = 'flex items-center gap-1.5 px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white rounded'
  const disabledClass = 'flex items-center gap-1.5 px-3 py-1 text-xs text-gray-300 dark:text-gray-600 rounded cursor-not-allowed'

  return (
    <div className="h-9 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-3 gap-1 shrink-0">
      {/* Toggle editor panel */}
      <button
        onClick={onToggleEditor}
        className={btnClass}
        title={editorCollapsed ? 'Open JSON Editor' : 'Close JSON Editor'}
      >
        {editorCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
      </button>

      <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />

      <button onClick={onAddTable} className={btnClass}>
        <TableProperties size={13} />
        Add Table
      </button>

      <button onClick={onAddRelation} className={btnClass}>
        <ArrowLeftRight size={13} />
        Add Relation
      </button>

      <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />

      <button
        onClick={undo}
        disabled={!canUndo}
        className={canUndo ? btnClass : disabledClass}
        title="Undo (Ctrl+Z)"
      >
        <Undo2 size={13} />
      </button>

      <button
        onClick={redo}
        disabled={!canRedo}
        className={canRedo ? btnClass : disabledClass}
        title="Redo (Ctrl+Shift+Z)"
      >
        <Redo2 size={13} />
      </button>
    </div>
  )
}
