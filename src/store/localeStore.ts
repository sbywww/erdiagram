/**
 * 언어(로케일) 상태 관리 스토어
 * - localStorage를 통해 사용자 언어 설정 유지 (en / ko)
 */
import { create } from 'zustand'

export type Locale = 'en' | 'ko'

interface LocaleState {
  locale: Locale
  setLocale: (locale: Locale) => void
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: (localStorage.getItem('locale') as Locale) ?? 'en',
  setLocale: (locale) => {
    localStorage.setItem('locale', locale)
    set({ locale })
  },
}))
