import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown, Search, SearchX, X } from 'lucide-react'
import { cn, num } from '@/utils/format'
import { FilterSelect } from './Form'
import { Button } from './Button'
import { Skeleton } from './Feedback'

export interface Column<T> {
  key: string
  header: ReactNode
  cell: (row: T) => ReactNode
  /** Provide to make the column sortable */
  sort?: (row: T) => number | string
  align?: 'left' | 'right' | 'center'
  className?: string
  /** Hide on narrow screens */
  hideBelow?: 'sm' | 'md' | 'lg' | 'xl'
}

export interface TableFilter<T> {
  label: string
  options: string[]
  value: (row: T) => string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  rowKey: (row: T) => string
  searchText?: (row: T) => string
  searchPlaceholder?: string
  filters?: TableFilter<T>[]
  initialQuery?: string
  pageSize?: number
  onRowClick?: (row: T) => void
  actions?: ReactNode
  title?: ReactNode
  subtitle?: ReactNode
  defaultSort?: { key: string; dir: 'asc' | 'desc' }
  rowClassName?: (row: T) => string | undefined
  emptyMessage?: string
  className?: string
  /** Rendered beneath the table body (e.g. totals) */
  summary?: (rows: T[]) => ReactNode
}

const HIDE: Record<string, string> = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
  xl: 'hidden xl:table-cell',
}

export function DataTable<T>({
  data,
  columns,
  rowKey,
  searchText,
  searchPlaceholder = 'Search…',
  filters = [],
  initialQuery = '',
  pageSize = 10,
  onRowClick,
  actions,
  title,
  subtitle,
  defaultSort,
  rowClassName,
  emptyMessage = 'No records match your search.',
  className,
  summary,
}: DataTableProps<T>) {
  const [query, setQuery] = useState(initialQuery)
  const [filterValues, setFilterValues] = useState<string[]>(() => filters.map(() => ''))
  const [sort, setSort] = useState(defaultSort ?? null)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 380)
    return () => clearTimeout(t)
  }, [])
  useEffect(() => setQuery(initialQuery), [initialQuery])
  useEffect(() => setPage(0), [query, filterValues, sort, data.length])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let rows = data.filter((row) => {
      if (q && searchText && !searchText(row).toLowerCase().includes(q)) return false
      return filters.every((f, i) => !filterValues[i] || f.value(row) === filterValues[i])
    })
    if (sort) {
      const col = columns.find((c) => c.key === sort.key)
      if (col?.sort) {
        const get = col.sort
        rows = [...rows].sort((a, b) => {
          const va = get(a)
          const vb = get(b)
          const r = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), undefined, { numeric: true })
          return sort.dir === 'asc' ? r : -r
        })
      }
    }
    return rows
  }, [data, query, filterValues, sort, columns, filters, searchText])

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const visible = filtered.slice(page * pageSize, page * pageSize + pageSize)
  const hasActiveFilters = query !== '' || filterValues.some(Boolean)

  const toggleSort = (key: string) =>
    setSort((s) => (!s || s.key !== key ? { key, dir: 'desc' } : s.dir === 'desc' ? { key, dir: 'asc' } : null))

  const clearAll = () => {
    setQuery('')
    setFilterValues(filters.map(() => ''))
  }

  return (
    <div className={cn('overflow-hidden rounded-2xl border border-line bg-white shadow-card', className)}>
      {(title || searchText || filters.length > 0 || actions) && (
        <div className="space-y-3 border-b border-line px-4 py-4 sm:px-5">
          {(title || actions) && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              {title && (
                <div>
                  <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
                  {subtitle && <p className="mt-0.5 text-[13px] text-slate-500">{subtitle}</p>}
                </div>
              )}
              {actions && <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>}
            </div>
          )}
          {(searchText || filters.length > 0) && (
            <div className="flex flex-wrap items-center gap-2">
              {searchText && (
                <div className="relative w-full sm:w-72">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="h-9 w-full rounded-lg border border-line-strong bg-white pr-8 pl-9 text-[13px] placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 focus:outline-none"
                  />
                  {query && (
                    <button onClick={() => setQuery('')} className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600" aria-label="Clear search">
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
              )}
              {filters.map((f, i) => (
                <FilterSelect
                  key={f.label}
                  label={f.label}
                  options={f.options}
                  value={filterValues[i]}
                  onChange={(v) => setFilterValues((vals) => vals.map((x, k) => (k === i ? v : x)))}
                />
              ))}
              {hasActiveFilters && (
                <button onClick={clearAll} className="text-[13px] font-medium text-brand-600 hover:text-brand-700">
                  Clear
                </button>
              )}
              <span className="ml-auto hidden text-[13px] text-slate-500 sm:inline num">
                {num(filtered.length)} {filtered.length === 1 ? 'record' : 'records'}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-slate-50/70">
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={cn(
                    'px-4 py-2.5 text-xs font-semibold tracking-wide whitespace-nowrap text-slate-500 uppercase first:pl-5 last:pr-5',
                    c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left',
                    c.hideBelow && HIDE[c.hideBelow],
                  )}
                >
                  {c.sort ? (
                    <button
                      onClick={() => toggleSort(c.key)}
                      className={cn('inline-flex items-center gap-1 uppercase hover:text-slate-800', sort?.key === c.key && 'text-slate-800', c.align === 'right' && 'flex-row-reverse')}
                    >
                      {c.header}
                      {sort?.key === c.key ? (
                        sort.dir === 'asc' ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />
                      ) : (
                        <ChevronsUpDown className="size-3.5 opacity-40" />
                      )}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading
              ? Array.from({ length: Math.min(pageSize, 6) }, (_, i) => (
                  <tr key={i}>
                    {columns.map((c) => (
                      <td key={c.key} className={cn('px-4 py-3.5 first:pl-5 last:pr-5', c.hideBelow && HIDE[c.hideBelow])}>
                        <Skeleton className={cn('h-4', c.align === 'right' ? 'ml-auto w-16' : 'w-24')} />
                      </td>
                    ))}
                  </tr>
                ))
              : visible.map((row) => (
                  <tr
                    key={rowKey(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn('transition-colors', onRowClick && 'cursor-pointer hover:bg-brand-50/40', rowClassName?.(row))}
                  >
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={cn(
                          'px-4 py-3 whitespace-nowrap text-slate-700 first:pl-5 last:pr-5',
                          c.align === 'right' ? 'text-right num' : c.align === 'center' ? 'text-center' : 'text-left',
                          c.hideBelow && HIDE[c.hideBelow],
                          c.className,
                        )}
                      >
                        {c.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
          {!loading && summary && filtered.length > 0 && <tfoot className="border-t border-line bg-slate-50/70 font-semibold">{summary(filtered)}</tfoot>}
        </table>
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
              <SearchX className="size-6" />
            </span>
            <p className="mt-3 text-sm font-semibold text-slate-800">Nothing found</p>
            <p className="mt-1 text-[13px] text-slate-500">{emptyMessage}</p>
            {hasActiveFilters && (
              <Button size="sm" className="mt-4" onClick={clearAll}>
                Clear search & filters
              </Button>
            )}
          </div>
        )}
      </div>

      {!loading && filtered.length > pageSize && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3 text-[13px] text-slate-500">
          <span className="num">
            Showing <b className="font-semibold text-slate-700">{page * pageSize + 1}</b>–<b className="font-semibold text-slate-700">{Math.min(filtered.length, (page + 1) * pageSize)}</b> of{' '}
            <b className="font-semibold text-slate-700">{num(filtered.length)}</b>
          </span>
          <div className="flex items-center gap-1">
            <Button size="icon-sm" variant="ghost" disabled={page === 0} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
              <ChevronLeft className="size-4" />
            </Button>
            {pageNumbers(page, pages).map((p, i) =>
              p === -1 ? (
                <span key={`gap${i}`} className="px-1 text-slate-400">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn('h-8 min-w-8 rounded-lg px-2 font-medium num', p === page ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100')}
                >
                  {p + 1}
                </button>
              ),
            )}
            <Button size="icon-sm" variant="ghost" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)} aria-label="Next page">
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function pageNumbers(current: number, total: number): number[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i)
  const set = new Set([0, total - 1, current - 1, current, current + 1].filter((p) => p >= 0 && p < total))
  const sorted = [...set].sort((a, b) => a - b)
  const out: number[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push(-1)
    out.push(p)
  })
  return out
}
