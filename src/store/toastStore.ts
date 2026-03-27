/**
 * 토스트 알림 상태 관리 스토어
 * - show(): 메시지 표시
 * - hide(): 메시지 숨김 (Toast 컴포넌트에서 2초 후 자동 호출)
 */
import { create } from 'zustand'

interface ToastState {
  message: string | null
  show: (message: string) => void
  hide: () => void
}

export const useToast = create<ToastState>((set) => ({
  message: null,
  show: (message) => set({ message }),
  hide: () => set({ message: null }),
}))
