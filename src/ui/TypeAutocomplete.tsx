/**
 * 컬럼 타입 자동완성 입력 컴포넌트
 * - 입력값으로 DB 타입 목록을 그룹별(Numeric, String 등)로 필터링
 * - 키보드(화살표/Enter/ESC) 및 마우스로 선택 가능
 */
import { useState, useRef, useEffect, useMemo } from 'react'

/** DB 컬럼 타입 그룹 정의 (자동완성 후보 목록) */
export const COLUMN_TYPE_GROUPS: Record<string, string[]> = {
  Numeric: [
    'bigint', 'int', 'mediumint', 'smallint', 'tinyint',
    'bigint unsigned', 'int unsigned', 'tinyint unsigned',
    'decimal', 'decimal(10,2)', 'numeric', 'float', 'double',
  ],
  String: [
    'varchar(50)', 'varchar(100)', 'varchar(255)', 'varchar(500)',
    'char(1)', 'char(36)',
    'text', 'tinytext', 'mediumtext', 'longtext',
  ],
  'Date/Time': [
    'date', 'datetime', 'timestamp', 'time', 'year',
  ],
  Binary: [
    'blob', 'tinyblob', 'mediumblob', 'longblob',
    'binary(16)', 'varbinary(255)',
  ],
  Other: [
    'boolean', 'bit', 'json', 'enum', 'set', 'uuid',
  ],
}

interface TypeAutocompleteProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
  wrapperClassName?: string
}

export function TypeAutocomplete({ value, onChange, disabled, className, wrapperClassName }: TypeAutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  /** 입력값으로 타입 목록 필터링 (그룹 구조 + 평탄화된 리스트 모두 반환) */
  const { filtered, flatFiltered } = useMemo(() => {
    const query = value.toLowerCase()
    const groups: { group: string; types: string[] }[] = []
    for (const [group, types] of Object.entries(COLUMN_TYPE_GROUPS)) {
      const matched = types.filter((t) => t.toLowerCase().includes(query))
      if (matched.length > 0) groups.push({ group, types: matched })
    }
    return { filtered: groups, flatFiltered: groups.flatMap((g) => g.types) }
  }, [value])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as HTMLElement)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    setHighlighted(-1)
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown') { setOpen(true); e.preventDefault() }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((prev) => Math.min(prev + 1, flatFiltered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && highlighted >= 0) {
      e.preventDefault()
      onChange(flatFiltered[highlighted])
      setOpen(false)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlighted < 0 || !listRef.current) return
    const items = listRef.current.querySelectorAll('[data-type-item]')
    items[highlighted]?.scrollIntoView({ block: 'nearest' })
  }, [highlighted])

  return (
    <div ref={wrapperRef} className={wrapperClassName ?? 'relative'}>
      <input
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={className}
        placeholder="varchar(255)"
      />
      {open && !disabled && filtered.length > 0 && (
        <div
          ref={listRef}
          className="absolute top-full left-0 mt-1 w-48 max-h-52 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 py-1"
        >
          {(() => {
            let idx = 0
            return filtered.map(({ group, types }) => (
              <div key={group}>
                <div className="px-2 py-1 text-[9px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  {group}
                </div>
                {types.map((type) => {
                  const currentIdx = idx++
                  return (
                    <button
                      key={type}
                      data-type-item
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); onChange(type); setOpen(false) }}
                      onMouseEnter={() => setHighlighted(currentIdx)}
                      className={`w-full text-left px-3 py-1 text-xs ${
                        currentIdx === highlighted
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {type}
                    </button>
                  )
                })}
              </div>
            ))
          })()}
        </div>
      )}
    </div>
  )
}
