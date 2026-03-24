import { useState, useMemo } from 'react'
import { useReactFlow } from '@xyflow/react'
import { ChevronRight, ChevronDown, FolderPlus, Trash2, GripVertical } from 'lucide-react'
import { useDiagramStore } from '../store/diagramStore.ts'

interface TableListProps {
  selectedTableId: string | null
  onSelectTable: (id: string) => void
}

export function TableList({ selectedTableId, onSelectTable }: TableListProps) {
  const { tables, tableGroups, addTableGroup, removeTableGroup, moveTableToGroup } = useDiagramStore()
  const reactFlow = useReactFlow()

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [newGroupName, setNewGroupName] = useState('')
  const [showNewGroupInput, setShowNewGroupInput] = useState(false)
  const [draggedTableId, setDraggedTableId] = useState<string | null>(null)
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null)

  // Tables that belong to a group
  const groupedTableIds = useMemo(() => {
    const ids = new Set<string>()
    for (const tableIds of Object.values(tableGroups)) {
      for (const id of tableIds) ids.add(id)
    }
    return ids
  }, [tableGroups])

  // Tables not in any group
  const ungroupedTables = useMemo(
    () => tables.filter((t) => !groupedTableIds.has(t.id)),
    [tables, groupedTableIds]
  )

  const toggleGroup = (name: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const handleClickTable = (tableId: string) => {
    onSelectTable(tableId)
    // Focus on the table in the canvas
    reactFlow.fitView({
      nodes: [{ id: tableId }],
      duration: 400,
      padding: 0.5,
    })
  }

  const handleCreateGroup = () => {
    const name = newGroupName.trim()
    if (!name) return
    addTableGroup(name)
    setNewGroupName('')
    setShowNewGroupInput(false)
  }

  const handleDragStart = (tableId: string) => {
    setDraggedTableId(tableId)
  }

  const handleDragOver = (e: React.DragEvent, groupName: string | null) => {
    e.preventDefault()
    setDragOverGroup(groupName)
  }

  const handleDrop = (groupName: string | null) => {
    if (draggedTableId) {
      moveTableToGroup(draggedTableId, groupName)
    }
    setDraggedTableId(null)
    setDragOverGroup(null)
  }

  const handleDragEnd = () => {
    setDraggedTableId(null)
    setDragOverGroup(null)
  }

  const tableItem = (tableId: string, physicalName: string, logicalName: string, columnCount: number) => (
    <div
      key={tableId}
      draggable
      onDragStart={() => handleDragStart(tableId)}
      onDragEnd={handleDragEnd}
      onClick={() => handleClickTable(tableId)}
      className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded text-xs transition-colors ${
        selectedTableId === tableId
          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
      }`}
    >
      <GripVertical size={10} className="text-gray-400 shrink-0 cursor-grab" />
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{physicalName}</div>
        {logicalName && (
          <div className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{logicalName}</div>
        )}
      </div>
      <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">
        {columnCount}cols
      </span>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 flex items-center justify-between shrink-0">
        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
          {tables.length} tables
        </span>
        <button
          onClick={() => setShowNewGroupInput(true)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          title="New Group"
        >
          <FolderPlus size={14} />
        </button>
      </div>

      {/* New group input */}
      {showNewGroupInput && (
        <div className="px-3 pb-2 flex gap-1 shrink-0">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateGroup()
              if (e.key === 'Escape') setShowNewGroupInput(false)
            }}
            autoFocus
            placeholder="Group name"
            className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={handleCreateGroup}
            className="px-2 py-1 text-[10px] bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add
          </button>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
        {/* Groups */}
        {Object.entries(tableGroups).map(([groupName, tableIds]) => {
          const groupTables = tableIds
            .map((id) => tables.find((t) => t.id === id))
            .filter(Boolean) as typeof tables
          const isCollapsed = collapsedGroups.has(groupName)

          return (
            <div
              key={groupName}
              onDragOver={(e) => handleDragOver(e, groupName)}
              onDrop={() => handleDrop(groupName)}
              className={`rounded ${dragOverGroup === groupName ? 'ring-1 ring-blue-400 bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
            >
              {/* Group header */}
              <div className="flex items-center gap-1 px-1 py-1 group">
                <button
                  onClick={() => toggleGroup(groupName)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0"
                >
                  {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                </button>
                <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400 flex-1 truncate">
                  {groupName}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 mr-1">
                  {groupTables.length}
                </span>
                <button
                  onClick={() => removeTableGroup(groupName)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 shrink-0 transition-opacity"
                  title="Delete Group"
                >
                  <Trash2 size={11} />
                </button>
              </div>

              {/* Group tables */}
              {!isCollapsed && (
                <div className="pl-3">
                  {groupTables.length === 0 ? (
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 px-2 py-1 italic">
                      Drag tables here
                    </div>
                  ) : (
                    groupTables.map((t) => tableItem(t.id, t.physicalName, t.logicalName, t.columns.length))
                  )}
                </div>
              )}
            </div>
          )
        })}

        {/* Ungrouped tables */}
        <div
          onDragOver={(e) => handleDragOver(e, null)}
          onDrop={() => handleDrop(null)}
          className={dragOverGroup === null && draggedTableId ? 'ring-1 ring-gray-300 dark:ring-gray-600 rounded' : ''}
        >
          {Object.keys(tableGroups).length > 0 && ungroupedTables.length > 0 && (
            <div className="text-[10px] text-gray-400 dark:text-gray-500 px-2 py-1 font-medium">
              Ungrouped
            </div>
          )}
          {ungroupedTables.map((t) => tableItem(t.id, t.physicalName, t.logicalName, t.columns.length))}
        </div>
      </div>
    </div>
  )
}
