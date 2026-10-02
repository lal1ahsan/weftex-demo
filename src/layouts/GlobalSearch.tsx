import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, CornerDownLeft, Factory, FileText, Layers, Package, Search, ShoppingBag, Spool, Truck, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { LOOMS } from '@/data/production'
import { FABRICS, SUPPLIERS, YARNS } from '@/data/inventory'
import { CUSTOMERS, ROLLS, SALES_ORDERS, customerById } from '@/data/commercial'
import { NAV } from '@/routes/nav'
import { cn, meters, num } from '@/utils/format'

interface SearchItem {
  group: string
  icon: LucideIcon
  title: string
  subtitle: string
  to: string
  haystack: string
}

function buildIndex(): SearchItem[] {
  const pages: SearchItem[] = NAV.flatMap((n) =>
    (n.children ?? [{ label: n.label, to: n.to! }]).map((c) => ({
      group: 'Pages',
      icon: FileText,
      title: c.label,
      subtitle: n.children ? n.label : 'Page',
      to: c.to,
      haystack: `${c.label} ${n.label}`,
    })),
  )
  return [
    ...LOOMS.map((l) => ({ group: 'Looms', icon: Factory, title: `Loom ${l.id}`, subtitle: `${l.status} · ${l.manufacturer} ${l.model} · ${l.hall}`, to: `/looms/${l.id}`, haystack: `loom ${l.id} ${l.status} ${l.hall} ${l.operator}` })),
    ...YARNS.map((y) => ({ group: 'Yarn', icon: Spool, title: `${y.code} · ${y.name} ${y.count}`, subtitle: `${y.type} · ${num(y.stockKg)} kg in stock`, to: `/yarn?q=${y.code}`, haystack: `yarn ${y.code} ${y.name} ${y.count} ${y.type} ${y.supplier}` })),
    ...FABRICS.map((f) => ({ group: 'Fabric', icon: Layers, title: `${f.code} · ${f.name}`, subtitle: `${f.construction} · ${f.density} · ${meters(f.meters)}`, to: `/fabric/${f.code}`, haystack: `fabric ${f.code} ${f.name} ${f.construction}` })),
    ...ROLLS.map((r) => ({ group: 'Rolls', icon: Package, title: `Roll ${r.id}`, subtitle: `${r.fabricCode} · ${r.loomId} · ${r.meters} m · ${r.quality}`, to: `/fabric/rolls/${r.id}`, haystack: `roll ${r.id} ${r.fabricCode} ${r.loomId}` })),
    ...CUSTOMERS.map((c) => ({ group: 'Customers', icon: Users, title: c.name, subtitle: `${c.city} · ${c.contact}`, to: `/sales/customers/${c.id}`, haystack: `customer ${c.name} ${c.city} ${c.contact} ${c.id}` })),
    ...SALES_ORDERS.map((o) => ({ group: 'Sales Orders', icon: ShoppingBag, title: o.id, subtitle: `${customerById(o.customerId)?.name} · ${num(o.quantity)} m · ${o.status}`, to: `/sales/orders/${o.id}`, haystack: `order ${o.id} ${customerById(o.customerId)?.name} ${o.status}` })),
    ...SUPPLIERS.map((s) => ({ group: 'Suppliers', icon: Truck, title: s.name, subtitle: `${s.category} · ${s.city}`, to: `/purchases/suppliers?q=${encodeURIComponent(s.name)}`, haystack: `supplier ${s.name} ${s.city} ${s.category}` })),
    ...pages,
  ]
}

const SUGGESTIONS = ['L-12', 'YRN-001', 'Roll R-10251', 'Ahmed Textile', 'SO-1024']

export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const index = useMemo(buildIndex, [])
  const [q, setQ] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setQ('')
      setCursor(0)
      setTimeout(() => inputRef.current?.focus(), 10)
    }
  }, [open])

  const results = useMemo(() => {
    const tokens = q.toLowerCase().split(/\s+/).filter(Boolean)
    if (!tokens.length) return []
    const matches = index.filter((i) => {
      const h = i.haystack.toLowerCase()
      return tokens.every((t) => h.includes(t))
    })
    // Exact id hits first
    const exact = (i: SearchItem) => (i.title.toLowerCase().includes(tokens[tokens.length - 1]) ? 0 : 1)
    return matches.sort((a, b) => exact(a) - exact(b)).slice(0, 24)
  }, [q, index])

  useEffect(() => setCursor(0), [q])

  const go = (item?: SearchItem) => {
    if (!item) return
    onClose()
    navigate(item.to)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCursor((c) => Math.min(c + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCursor((c) => Math.max(c - 1, 0))
    } else if (e.key === 'Enter') {
      go(results[cursor])
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${cursor}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [cursor])

  if (!open) return null

  const grouped: { group: string; items: { item: SearchItem; idx: number }[] }[] = []
  results.forEach((item, idx) => {
    let g = grouped.find((x) => x.group === item.group)
    if (!g) grouped.push((g = { group: item.group, items: [] }))
    g.items.push({ item, idx })
  })

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-center p-4 pt-[10vh]" role="dialog" aria-modal="true" aria-label="Search">
      <div className="absolute inset-0 animate-fade-in bg-ink-950/45 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative flex max-h-[70vh] w-full max-w-2xl animate-pop-in flex-col overflow-hidden rounded-2xl bg-white shadow-pop">
        <div className="flex items-center gap-3 border-b border-line px-5">
          <Search className="size-5 text-slate-400" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search looms, yarn, rolls, customers, orders…"
            className="h-14 flex-1 bg-transparent text-[15px] placeholder:text-slate-400 focus:outline-none"
          />
          <kbd className="rounded-md border border-line px-1.5 py-0.5 text-[11px] font-medium text-slate-400">ESC</kbd>
        </div>
        <div ref={listRef} className="scrollbar-thin flex-1 overflow-y-auto p-2">
          {!q && (
            <div className="p-3">
              <p className="mb-3 text-xs font-semibold tracking-wide text-slate-400 uppercase">Try searching for</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => setQ(s)} className="rounded-lg border border-line bg-slate-50 px-3 py-1.5 text-[13px] font-medium text-slate-700 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {q && results.length === 0 && (
            <div className="px-4 py-12 text-center">
              <p className="text-sm font-semibold text-slate-800">No results for “{q}”</p>
              <p className="mt-1 text-[13px] text-slate-500">Try a loom number (L-12), yarn code (YRN-001) or order (SO-1024).</p>
            </div>
          )}
          {grouped.map((g) => (
            <div key={g.group} className="mb-1">
              <p className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">{g.group}</p>
              {g.items.map(({ item, idx }) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.to + item.title}
                    data-idx={idx}
                    onMouseEnter={() => setCursor(idx)}
                    onClick={() => go(item)}
                    className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left', idx === cursor ? 'bg-brand-50' : 'hover:bg-slate-50')}
                  >
                    <span className={cn('grid size-9 shrink-0 place-items-center rounded-lg', idx === cursor ? 'bg-white text-brand-600 shadow-sm' : 'bg-slate-100 text-slate-500')}>
                      <Icon className="size-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-900">{item.title}</span>
                      <span className="block truncate text-[13px] text-slate-500">{item.subtitle}</span>
                    </span>
                    {idx === cursor ? <CornerDownLeft className="size-4 text-brand-500" /> : <ArrowRight className="size-4 text-slate-300" />}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 border-t border-line bg-slate-50/70 px-5 py-2.5 text-xs text-slate-500">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span className="ml-auto">Searches demo data only</span>
        </div>
      </div>
    </div>,
    document.body,
  )
}
