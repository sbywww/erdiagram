import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { Column, DisplaySettings } from '../models/types.ts'
import { DEFAULT_DISPLAY_SETTINGS } from '../models/types.ts'

interface TableNodeData {
  physicalName: string
  logicalName: string
  columns: Column[]
  displaySettings?: DisplaySettings
  [key: string]: unknown
}

const HANDLE_CLASS = '!w-1.5 !h-1.5 !bg-transparent !border-0 !min-w-0 !min-h-0'
const SEP = <span className="text-gray-300 dark:text-gray-600">|</span>

export function TableNode({ data, selected }: NodeProps) {
  const { physicalName, logicalName, columns, displaySettings } = data as unknown as TableNodeData
  const ds = displaySettings ?? DEFAULT_DISPLAY_SETTINGS

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg min-w-[220px] text-xs border ${
        selected
          ? 'border-blue-400 dark:border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5),0_0_20px_rgba(59,130,246,0.25)]'
          : 'border-gray-300 dark:border-gray-600'
      }`}
    >
      <div className="bg-blue-950 dark:bg-blue-900 text-white px-3 py-2 rounded-t-[7px]">
        <div className="font-bold text-sm">{physicalName}</div>
        <div className="text-white text-[10px]">{logicalName}</div>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {columns.map((col) => (
          <div key={col.id} className="relative flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700">
            <Handle type="target" position={Position.Left} id={`${col.id}-l`}
              style={{ top: '50%' }} className={HANDLE_CLASS} />
            <Handle type="source" position={Position.Left} id={`${col.id}-l`}
              style={{ top: '50%' }} className={HANDLE_CLASS} />
            {ds.showPKFK && (
              <>
                <span className="w-6 text-[10px] shrink-0 text-center">
                  {col.isPK ? <span className="text-yellow-500 font-bold">PK</span>
                    : col.isFK ? <span className="text-green-500 font-bold">FK</span>
                    : null}
                </span>
                {SEP}
              </>
            )}
            <span className="font-medium text-gray-800 dark:text-gray-200 flex-1 truncate">{col.name}</span>
            {ds.showType && (
              <>
                {SEP}
                <span className="text-gray-400 dark:text-gray-500 shrink-0">{col.type}</span>
              </>
            )}
            {ds.showNotNull && col.notNull && (
              <>
                {SEP}
                <span className="text-red-400 text-[10px] shrink-0">NN</span>
              </>
            )}
            {ds.showComment && col.comment && (
              <>
                {SEP}
                <span className="text-gray-400 dark:text-gray-500 text-[10px] max-w-[80px] truncate shrink-0" title={col.comment}>
                  {col.comment}
                </span>
              </>
            )}
            <Handle type="target" position={Position.Right} id={`${col.id}-r`}
              style={{ top: '50%' }} className={HANDLE_CLASS} />
            <Handle type="source" position={Position.Right} id={`${col.id}-r`}
              style={{ top: '50%' }} className={HANDLE_CLASS} />
          </div>
        ))}
      </div>
    </div>
  )
}
