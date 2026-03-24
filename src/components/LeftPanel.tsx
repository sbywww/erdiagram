import { useState, useEffect } from 'react'
import { ChevronLeft } from 'lucide-react'
import { JsonEditor } from './JsonEditor.tsx'
import { TableEditor } from './TableEditor.tsx'

type Tab = 'json' | 'table'

interface LeftPanelProps {
  collapsed: boolean
  onCollapse: () => void
  selectedTableId: string | null
  onDeselectTable: () => void
}

export function LeftPanel({ collapsed, onCollapse, selectedTableId, onDeselectTable }: LeftPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('json')

  // Auto-switch to table tab when a table is selected
  useEffect(() => {
    if (selectedTableId) {
      setActiveTab('table')
    }
  }, [selectedTableId])

  if (collapsed) return null

  const tabClass = (tab: Tab) =>
    `flex-1 text-center py-1.5 text-[11px] font-medium cursor-pointer transition-colors ${
      activeTab === tab
        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border-b-2 border-transparent'
    }`

  return (
    <div className="w-[400px] h-full border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col shrink-0">
      {/* Header with tabs */}
      <div className="flex items-center border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shrink-0">
        <div className="flex flex-1 min-w-0">
          <button className={tabClass('json')} onClick={() => setActiveTab('json')}>
            JSON
          </button>
          <button className={tabClass('table')} onClick={() => setActiveTab('table')}>
            Table
          </button>
        </div>
        <button
          onClick={onCollapse}
          className="p-1.5 mx-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded shrink-0"
          title="Collapse"
        >
          <ChevronLeft size={14} className="text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Content */}
      {activeTab === 'json' && <JsonEditor />}
      {activeTab === 'table' && <TableEditor tableId={selectedTableId} onDeselect={onDeselectTable} />}
    </div>
  )
}
