import { useCallback, useEffect, useRef, useState } from 'react'
import { usePlayground } from '../context/PlaygroundContext'
import { createMockFetch, createMockFetchPosts } from '../api/mockApi'
import type { MockUser, MockPost } from '../types'

interface FetchState<T> {
  data: T | null
  loading: boolean
  error: string | null
  fetchCount: number
}

/**
 * Internal generic fetch state machine hook
 * Demonstrates the building blocks that libraries like SWR and TanStack Query build on
 */
function useFetchState<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  staleTime: number,
  retryCount: number,
  deps: unknown[],
  onEvent: (type: string, msg: string) => void,
): FetchState<T> & { refetch: () => void } {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: false,
    error: null,
    fetchCount: 0,
  })

  const cacheRef = useRef<{ data: T; timestamp: number } | null>(null)
  const [trigger, setTrigger] = useState(0)

  const refetch = useCallback(() => {
    cacheRef.current = null // Invalidate cache
    setTrigger(t => t + 1)
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    // Check cache
    if (cacheRef.current) {
      const age = Date.now() - cacheRef.current.timestamp
      if (age < staleTime) {
        onEvent('CACHE_HIT', `[custom-hook] Cache hit! Data age: ${age}ms < staleTime: ${staleTime}ms`)
        setState(s => ({ ...s, data: cacheRef.current!.data, loading: false }))
        return
      } else {
        onEvent('STALE', `[custom-hook] Cache stale (age: ${age}ms), refetching...`)
        setState(s => ({ ...s, data: cacheRef.current!.data })) // serve stale while revalidating
      }
    }

    setState(s => ({ ...s, loading: true, error: null }))
    onEvent('LOADING', '[custom-hook] State machine: IDLE → LOADING')

    let attempt = 0

    async function run(): Promise<void> {
      try {
        const data = await fetcher(controller.signal)
        if (controller.signal.aborted) return
        cacheRef.current = { data, timestamp: Date.now() }
        setState({ data, loading: false, error: null, fetchCount: Date.now() })
        onEvent('SUCCESS', `[custom-hook] State machine: LOADING → SUCCESS`)
      } catch (err) {
        if (controller.signal.aborted) return
        const msg = err instanceof Error ? err.message : 'Unknown'
        if (attempt < retryCount) {
          attempt++
          onEvent('RETRY', `[custom-hook] State machine: LOADING → RETRY (${attempt}/${retryCount})`)
          await new Promise(r => setTimeout(r, 800 * attempt))
          return run()
        }
        setState(s => ({ ...s, loading: false, error: msg }))
        onEvent('ERROR', `[custom-hook] State machine: LOADING → ERROR — ${msg}`)
      }
    }

    run()
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, ...deps])

  return { ...state, refetch }
}

interface UseCustomHookResult {
  user: MockUser | null
  posts: MockPost[] | null
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  error: string | null
  retryAttempt: number
  refetch: () => void
}

export function useCustomHook(): UseCustomHookResult {
  const { state, addEvent, setQueryState, resetForceError } = usePlayground()
  const { config, forceErrorNext } = state
  const [globalTrigger, setGlobalTrigger] = useState(0)

  const effectiveConfig = { ...config, errorRate: forceErrorNext ? 100 : config.errorRate }

  const userFetch = useFetchState<MockUser>(
    createMockFetch(effectiveConfig),
    config.staleTime,
    config.retryCount,
    [globalTrigger],
    (type, msg) => addEvent(type as Parameters<typeof addEvent>[0], msg),
  )

  const postsFetch = useFetchState<MockPost[]>(
    createMockFetchPosts(config),
    config.staleTime,
    config.retryCount,
    [globalTrigger],
    () => {},
  )

  const refetch = useCallback(() => {
    setGlobalTrigger(t => t + 1)
    addEvent('REFETCH', '[custom-hook] Manual refetch — cache invalidated')
    resetForceError()
  }, [addEvent, resetForceError])

  useEffect(() => {
    const isLoading = userFetch.loading || postsFetch.loading
    const isError = !!userFetch.error || !!postsFetch.error
    const isSuccess = !isLoading && !isError && !!userFetch.data

    setQueryState({
      status: isLoading ? 'loading' : isError ? 'error' : isSuccess ? 'success' : 'idle',
      isFetching: isLoading,
      dataUpdatedAt: isSuccess ? new Date() : state.queryState.dataUpdatedAt,
    })
  }, [userFetch.loading, postsFetch.loading, userFetch.error, postsFetch.error, userFetch.data])

  return {
    user: userFetch.data,
    posts: postsFetch.data,
    isLoading: userFetch.loading,
    isFetching: userFetch.loading || postsFetch.loading,
    isError: !!userFetch.error,
    error: userFetch.error,
    retryAttempt: 0,
    refetch,
  }
}
