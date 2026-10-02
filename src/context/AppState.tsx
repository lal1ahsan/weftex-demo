import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { AppNotification, DowntimeRecord, Loom, LoomStatus, ProductionRecord } from '@/types'
import { DOWNTIME, LOOMS, PRODUCTION } from '@/data/production'
import { NOTIFICATIONS } from '@/data/commercial'

const AUTH_KEY = 'ghw-demo-auth'

function readAuth() {
  try {
    return localStorage.getItem(AUTH_KEY) === '1'
  } catch {
    return false
  }
}

interface AppState {
  isAuthed: boolean
  signIn: () => void
  signOut: () => void
  production: ProductionRecord[]
  addProduction: (r: Omit<ProductionRecord, 'id' | 'efficiency'>) => ProductionRecord
  downtime: DowntimeRecord[]
  addDowntime: (r: Omit<DowntimeRecord, 'id'>) => DowntimeRecord
  looms: Loom[]
  setLoomStatus: (id: string, status: LoomStatus) => void
  notifications: AppNotification[]
  markRead: (id: string) => void
  markAllRead: () => void
}

const Ctx = createContext<AppState | null>(null)

/**
 * Frontend-only state for the demo. Records added here live for the session,
 * so the client sees their entries appear across screens.
 */
export function AppStateProvider({ children }: { children: ReactNode }) {
  const [isAuthed, setAuthed] = useState(readAuth)
  const [production, setProduction] = useState(PRODUCTION)
  const [downtime, setDowntime] = useState(DOWNTIME)
  const [loomStatus, setLoomStatusMap] = useState<Record<string, LoomStatus>>({})
  const [notifications, setNotifications] = useState(NOTIFICATIONS)

  const signIn = useCallback(() => {
    try {
      localStorage.setItem(AUTH_KEY, '1')
    } catch {
      /* storage unavailable — session-only auth */
    }
    setAuthed(true)
  }, [])

  const signOut = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_KEY)
    } catch {
      /* ignore */
    }
    setAuthed(false)
  }, [])

  const addProduction = useCallback((r: Omit<ProductionRecord, 'id' | 'efficiency'>) => {
    const rec: ProductionRecord = {
      ...r,
      id: `PR-${49890 + Math.floor(Math.random() * 99)}`,
      efficiency: Math.round((r.actual / r.target) * 1000) / 10,
    }
    setProduction((p) => [rec, ...p])
    return rec
  }, [])

  const addDowntime = useCallback((r: Omit<DowntimeRecord, 'id'>) => {
    const rec: DowntimeRecord = { ...r, id: `DT-${3360 + Math.floor(Math.random() * 90)}` }
    setDowntime((d) => [rec, ...d])
    return rec
  }, [])

  const setLoomStatus = useCallback((id: string, status: LoomStatus) => setLoomStatusMap((m) => ({ ...m, [id]: status })), [])

  const looms = useMemo(
    () =>
      LOOMS.map((l) => {
        const s = loomStatus[l.id]
        if (!s || s === l.status) return l
        return { ...l, status: s, stoppedSince: s === 'Running' ? undefined : l.stoppedSince, stopReason: s === 'Running' ? undefined : l.stopReason }
      }),
    [loomStatus],
  )

  const markRead = useCallback((id: string) => setNotifications((n) => n.map((x) => (x.id === id ? { ...x, read: true } : x))), [])
  const markAllRead = useCallback(() => setNotifications((n) => n.map((x) => ({ ...x, read: true }))), [])

  const value = useMemo(
    () => ({ isAuthed, signIn, signOut, production, addProduction, downtime, addDowntime, looms, setLoomStatus, notifications, markRead, markAllRead }),
    [isAuthed, signIn, signOut, production, addProduction, downtime, addDowntime, looms, setLoomStatus, notifications, markRead, markAllRead],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp must be used inside AppStateProvider')
  return ctx
}
