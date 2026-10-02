import { useSearchParams } from 'react-router-dom'

/** Read a single query-string value, e.g. `?q=YRN-001` from search results and notifications. */
export function useQueryParam(name: string) {
  const [params] = useSearchParams()
  return params.get(name) ?? ''
}
