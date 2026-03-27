/**
 * 다국어(i18n) 훅
 * - useI18n()으로 현재 로케일에 맞는 번역 함수 t() 제공
 * - {{key}} 형태의 파라미터 치환 지원
 */
import { useCallback } from 'react'
import { useLocaleStore } from '../store/localeStore.ts'
import { en } from './en.ts'
import { ko } from './ko.ts'

export type TranslationKey = keyof typeof en

const dictionaries = { en, ko } as const

/** 현재 로케일의 번역 함수 t()와 locale 값을 반환하는 훅 */
export function useI18n() {
  const locale = useLocaleStore((s) => s.locale)
  const dict = dictionaries[locale]

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      let text = dict[key] ?? en[key] ?? key
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.replaceAll(`{{${k}}}`, String(v))
        }
      }
      return text
    },
    [dict]
  )

  return { t, locale }
}
