import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { Column } from '../models/types.ts'

interface TableNodeData {
  physicalName: string
  logicalName: string
  columns: Column[]
  [key: string]: unknown
}

export function TableNode({ data, selected }: NodeProps) {
  const { physicalName, logicalName, columns } = data as unknown as TableNodeData

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg min-w-[220px] text-xs border ${
        selected
          ? 'border-blue-400 dark:border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5),0_0_20px_rgba(59,130,246,0.25)]'
          : 'border-gray-300 dark:border-gray-600'
      }`}
    >
      <div className="bg-blue-600 dark:bg-blue-500 text-white px-3 py-2 rounded-t-[7px]">
        <div className="font-bold text-sm">{physicalName}</div>
        <div className="text-blue-200 dark:text-blue-100 text-[10px]">{logicalName}</div>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {columns.map((col) => (
          <div key={col.id} className="relative flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700">
            <Handle
              type="target"
              position={Position.Left}
              id={col.id}
              style={{ top: '50%' }}
              className="!w-1.5 !h-1.5 !bg-transparent !border-0 !min-w-0 !min-h-0"
            />
            <span className="w-8 text-[10px] text-gray-400 shrink-0">
              {col.isPK && <span className="text-yellow-500 font-bold">PK</span>}
              {col.isFK && <span className="text-green-500 font-bold">FK</span>}
            </span>
            <span className="font-medium text-gray-800 dark:text-gray-200 flex-1">{col.name}</span>
            <span className="text-gray-400 dark:text-gray-500">{col.type}</span>
            {col.notNull && <span className="text-red-400 text-[10px]">NN</span>}
            <Handle
              type="source"
              position={Position.Right}
              id={col.id}
              style={{ top: '50%' }}
              className="!w-1.5 !h-1.5 !bg-transparent !border-0 !min-w-0 !min-h-0"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
