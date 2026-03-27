/**
 * 테이블 삭제 확인 다이얼로그
 * - 테이블 이름 표시 + 연관 관계 개수 경고
 */
import { useI18n } from '../i18n/index.ts'

export interface DeleteConfirmState {
  tableId: string
  name: string
  relationCount: number
}

interface DeleteConfirmDialogProps {
  state: DeleteConfirmState
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirmDialog({ state, onConfirm, onCancel }: DeleteConfirmDialogProps) {
  const { t } = useI18n()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-5 min-w-[280px]">
        <div className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
          {t('delete.title')}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
          {t('delete.confirm', { name: state.name })}
        </div>
        {state.relationCount > 0 && (
          <div className="text-xs text-red-500 mb-3">
            {t('delete.relationsWarning', { count: state.relationCount })}
          </div>
        )}
        <div className="flex gap-2 mt-3">
          <button
            onClick={onCancel}
            className="flex-1 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            {t('delete.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-md hover:bg-red-600"
          >
            {t('delete.delete')}
          </button>
        </div>
      </div>
    </div>
  )
}
