import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar'
import { Topbar } from '../components/Topbar'
import { CommandPalette } from '../components/CommandPalette'
import { NotificationsPopover } from '../components/NotificationsPopover'
import { HelpModal } from '../components/HelpModal'
import { TweaksPanel } from '../components/TweaksPanel'

export function AppShell() {
  const navigate = useNavigate()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  // Глобальні гарячі клавіші
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || '').toLowerCase()
      const inField = tag === 'input' || tag === 'textarea'
      const meta = e.metaKey || e.ctrlKey

      if (meta && e.key === 'k') {
        e.preventDefault()
        setPaletteOpen(o => !o)
      } else if (e.key === '/' && !inField) {
        e.preventDefault()
        setPaletteOpen(true)
      } else if (e.key === 'Escape') {
        setPaletteOpen(false)
        setNotifOpen(false)
        setHelpOpen(false)
      } else if (e.key === '?' && !inField) {
        e.preventDefault()
        setHelpOpen(o => !o)
      } else if (meta && /^[1-4]$/.test(e.key)) {
        e.preventDefault()
        const map: Record<string, string> = { '1': '/dashboard', '2': '/bugs', '3': '/tests', '4': '/runs' }
        navigate(map[e.key])
      } else if (!meta && !inField) {
        if (e.key.toLowerCase() === 'c' && !e.shiftKey) {
          e.preventDefault()
          navigate('/bugs/new')
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  return (
    <div className="app">
      <Sidebar onOpenPalette={() => setPaletteOpen(true)} />
      <main className="main">
        <Topbar
          onOpenNotif={() => setNotifOpen(true)}
          onOpenHelp={() => setHelpOpen(true)}
          onOpenPalette={() => setPaletteOpen(true)}
        />
        <div className="scroll" style={{ display: 'flex', flexDirection: 'column' }}>
          <Outlet />
        </div>
      </main>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <NotificationsPopover open={notifOpen} onClose={() => setNotifOpen(false)} />
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      <TweaksPanel />
    </div>
  )
}
