/**
 * 토스트 알림 UI 컴포넌트
 * - 하단 중앙에 표시, 2초 후 자동 숨김
 */
import { useEffect } from 'react'
import { useToast } from '../store/toastStore.ts'

export function Toast() {
  const { message, hide } = useToast()

  useEffect(() => {
    if (!message) return
    const timer = setTimeout(hide, 2000)
    return () => clearTimeout(timer)
  }, [message, hide])

  if (!message) return null

  return (
    <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 text-xs px-4 py-2 rounded-lg shadow-lg animate-[fadeIn_0.2s]">
      {message}
    </div>
  )
}
