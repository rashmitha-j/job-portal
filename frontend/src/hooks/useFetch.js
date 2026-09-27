import { useCallback, useEffect, useState } from 'react'

// Runs `fetcher` whenever it changes (wrap it in useCallback) and tracks loading/error state.
// Responses from outdated requests are ignored.
export default function useFetch(fetcher) {
  const [reloadKey, setReloadKey] = useState(0)
  // Remembers which request the stored result belongs to, so "loading" is derived, not set
  const [result, setResult] = useState({ fetcher: null, reloadKey: -1, data: null, error: null })

  useEffect(() => {
    let active = true
    fetcher().then(
      (data) => active && setResult({ fetcher, reloadKey, data, error: null }),
      (error) => active && setResult({ fetcher, reloadKey, data: null, error }),
    )
    return () => {
      active = false
    }
  }, [fetcher, reloadKey])

  const reload = useCallback(() => setReloadKey((key) => key + 1), [])
  const loading = result.fetcher !== fetcher || result.reloadKey !== reloadKey

  return { data: result.data, error: loading ? null : result.error, loading, reload }
}
