/**
 * 관계 연결 확인 다이얼로그
 * - 관계 유형 선택 (1:1, 1:N, N:M)
 * - 식별/비식별 관계 선택
 */
import { useI18n } from '../i18n/index.ts'
import type { Table, RelationType } from '../models/types.ts'

export interface LinkingConfirmState {
  sourceId: string
  targetId: string
  relationType: RelationType
}

interface LinkingConfirmDialogProps {
  state: LinkingConfirmState
  tables: Table[]
  onChangeType: (relationType: RelationType) => void
  onConfirm: (identifying: boolean) => void
  onCancel: () => void
}

export function LinkingConfirmDialog({ state, tables, onChangeType, onConfirm, onCancel }: LinkingConfirmDialogProps) {
  const { t } = useI18n()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-5 min-w-[280px]">
        <div className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">
          {t('linking.selectType')}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          {tables.find((t) => t.id === state.sourceId)?.physicalName}
          {' → '}
          {tables.find((t) => t.id === state.targetId)?.physicalName}
        </div>
        {/* 관계 유형 버튼 (1:1, 1:N, N:M) */}
        <div className="flex gap-1 mb-3">
          {(['1:1', '1:N', 'N:M'] as RelationType[]).map((rt) => (
            <button
              key={rt}
              type="button"
              onClick={() => onChangeType(rt)}
              className={`flex-1 px-2 py-1 text-xs font-medium rounded ${
                state.relationType === rt
                  ? 'bg-blue-900 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {rt}
            </button>
          ))}
        </div>
        {/* 식별/비식별 선택 */}
        <div className="flex gap-2">
          <button
            onClick={() => onConfirm(true)}
            className="flex-1 px-3 py-2 text-xs font-medium bg-blue-900 text-white rounded-md hover:bg-blue-800"
          >
            {t('linking.identifying')}
            <div className="text-[10px] text-blue-300 mt-0.5">{t('linking.identifyingDesc')}</div>
          </button>
          <button
            onClick={() => onConfirm(false)}
            className="flex-1 px-3 py-2 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            {t('linking.nonIdentifying')}
            <div className="text-[10px] text-gray-400 mt-0.5">{t('linking.nonIdentifyingDesc')}</div>
          </button>
        </div>
        <button
          onClick={onCancel}
          className="w-full mt-2 px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          {t('dialog.cancel')}
        </button>
      </div>
    </div>
  )
}
