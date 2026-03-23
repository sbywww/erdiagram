import { useState, useRef, useEffect, useCallback } from 'react'
import { useDiagramStore } from '../store/diagramStore.ts'
import {
  Download, Upload, HelpCircle, Sun, Moon,
  ChevronDown, Plus, FolderOpen, Settings, Check,
} from 'lucide-react'
import { useThemeStore } from '../store/themeStore.ts'

export function Header() {
  const { tables, relations, nodePositions, setDiagram, setNodePosition } = useDiagramStore()
  const { theme, toggleTheme } = useThemeStore()
  const [workspaceName, setWorkspaceName] = useState('My Workspace')
  const [wsMenuOpen, setWsMenuOpen] = useState(false)
  const wsMenuRef = useRef<HTMLDivElement>(null)

  // Close workspace menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wsMenuRef.current && !wsMenuRef.current.contains(e.target as HTMLElement)) {
        setWsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleExport = useCallback(() => {
    const data = JSON.stringify({ tables, relations, positions: nodePositions }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${workspaceName}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [tables, relations, nodePositions, workspaceName])

  const handleImport = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target?.result as string)
          if (!Array.isArray(parsed.tables) || !Array.isArray(parsed.relations)) {
            alert('Invalid ERD file format')
            return
          }
          setDiagram(parsed.tables, parsed.relations)
          if (parsed.positions) {
            for (const [id, pos] of Object.entries(parsed.positions)) {
              setNodePosition(id, pos as { x: number; y: number })
            }
          }
          const name = file.name.replace(/\.json$/, '')
          setWorkspaceName(name)
        } catch {
          alert('Failed to parse JSON file')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }, [setDiagram, setNodePosition])

  const menuItemClass = 'w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'

  return (
    <header className="h-11 bg-white dark:bg-black border-b border-gray-200 dark:border-transparent flex items-center justify-between px-4 shrink-0">
      {/* Left: Logo + Workspace */}
      <div className="flex items-center gap-3">
        {/* Logo */}
        <span className="text-sm font-extrabold text-gray-900 dark:text-white tracking-tight">ERD</span>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />

        {/* Workspace selector */}
        <div ref={wsMenuRef} className="relative">
          <button
            onClick={() => setWsMenuOpen(!wsMenuOpen)}
            className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            {workspaceName}
            <ChevronDown size={12} className="text-gray-400" />
          </button>

          {wsMenuOpen && (
            <div className="absolute left-0 top-full mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg w-56 z-50 overflow-hidden">
              {/* Current workspace */}
              <div className="py-1 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-900 dark:text-white font-medium">
                  <Check size={14} className="text-blue-500" />
                  {workspaceName}
                </div>
              </div>

              {/* Title */}
              <div className="px-3 py-2">
                <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Workspaces</span>
              </div>

              {/* Actions */}
              <div className="pb-1">
                <button
                  onClick={() => {
                    setWsMenuOpen(false)
                    setDiagram([], [])
                    setWorkspaceName('Untitled')
                  }}
                  className={menuItemClass}
                >
                  <Plus size={14} className="text-gray-400" />
                  Create workspace
                </button>
                <button
                  onClick={() => {
                    setWsMenuOpen(false)
                    handleImport()
                  }}
                  className={menuItemClass}
                >
                  <FolderOpen size={14} className="text-gray-400" />
                  Open workspace
                </button>
                <button
                  onClick={() => {
                    setWsMenuOpen(false)
                    handleImport()
                  }}
                  className={menuItemClass}
                >
                  <Download size={14} className="text-gray-400" />
                  Import workspace
                </button>
                <button
                  onClick={() => {
                    setWsMenuOpen(false)
                    // TODO: manage workspace
                  }}
                  className={menuItemClass}
                >
                  <Settings size={14} className="text-gray-400" />
                  Manage workspace
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleImport}
          className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white rounded"
          title="Import"
        >
          <Upload size={15} />
        </button>

        <button
          onClick={handleExport}
          className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white rounded"
          title="Export"
        >
          <Download size={15} />
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white rounded"
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* Help */}
        <button
          className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white rounded"
          title="Help"
        >
          <HelpCircle size={15} />
        </button>
      </div>
    </header>
  )
}
