import { useEffect } from 'react'
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
