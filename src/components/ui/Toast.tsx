import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info, Sparkles, X } from 'lucide-react'
import { cn } from '@/utils/format'

type ToastKind = 'success' | 'error' | 'info' | 'demo'
interface ToastItem {
  id: number
  kind: ToastKind
  title: string
  body?: string
}

interface ToastApi {
  success: (title: string, body?: string) => void
  error: (title: string, body?: string) => void
  info: (title: string, body?: string) => void
  /** Professional placeholder for actions that need the production backend. */
  demo: (body?: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

const ICONS = {
  success: <CheckCircle2 className="size-5 text-emerald-500" />,
  error: <AlertTriangle className="size-5 text-rose-500" />,
  info: <Info className="size-5 text-sky-500" />,
  demo: <Sparkles className="size-5 text-brand-500" />,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const seq = useRef(0)

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const push = useCallback(
    (kind: ToastKind, title: string, body?: string) => {
      const id = ++seq.current
      setToasts((t) => [...t.slice(-3), { id, kind, title, body }])
      setTimeout(() => dismiss(id), kind === 'demo' ? 4200 : 3600)
    },
    [dismiss],
  )

  const api = useMemo<ToastApi>(
    () => ({
      success: (t, b) => push('success', t, b),
      error: (t, b) => push('error', t, b),
      info: (t, b) => push('info', t, b),
      demo: (b) => push('demo', 'Demo Mode', b ?? 'This action is available in the production version.'),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              'pointer-events-auto flex w-full animate-toast-in items-start gap-3 rounded-xl border bg-white p-4 shadow-pop sm:w-[380px]',
              t.kind === 'demo' ? 'border-brand-200' : 'border-line',
            )}
          >
            <span className="mt-px">{ICONS[t.kind]}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">{t.title}</p>
              {t.body && <p className="mt-0.5 text-[13px] leading-5 text-slate-600">{t.body}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} className="rounded p-0.5 text-slate-400 hover:text-slate-600" aria-label="Dismiss">
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
