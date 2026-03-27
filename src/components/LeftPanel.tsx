/**
 * 좌측 패널 컴포넌트
 * - JSON 에디터를 감싸는 접이식 패널
 */
import { ChevronLeft } from 'lucide-react'
import { JsonEditor } from './JsonEditor.tsx'
import { useI18n } from '../i18n/index.ts'

interface LeftPanelProps {
  collapsed: boolean
  onCollapse: () => void
}

export function LeftPanel({ collapsed, onCollapse }: LeftPanelProps) {
  const { t } = useI18n()

  if (collapsed) return null

  return (
    <div className="w-[400px] h-full border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shrink-0 px-3 py-1.5">
        <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">{t('panel.json')}</span>
        <button
          onClick={onCollapse}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded shrink-0"
          title={t('panel.collapse')}
        >
          <ChevronLeft size={14} className="text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <JsonEditor />
    </div>
  )
}
