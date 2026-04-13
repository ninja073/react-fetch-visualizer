import axios, { type CancelTokenSource } from 'axios'
import { useCallback, useEffect, useRef, useState } from 'react'
import { usePlayground } from '../context/PlaygroundContext'
import { createMockFetch, createMockFetchPosts } from '../api/mockApi'
import type { MockUser, MockPost } from '../types'

interface UseAxiosResult {
  user: MockUser | null
  posts: MockPost[] | null
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  error: string | null
  retryAttempt: number
  refetch: () => void
}

/**
 * Axios-based hook with interceptors and cancel tokens
 */
export function useAxiosHook(): UseAxiosResult {
  const { state, addEvent, setQueryState, resetForceError } = usePlayground()
  const { config, forceErrorNext } = state

  const [user, setUser] = useState<MockUser | null>(null)
  const [posts, setPosts] = useState<MockPost[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryAttempt, setRetryAttempt] = useState(0)
  const [trigger, setTrigger] = useState(0)

  const cancelRef = useRef<CancelTokenSource | null>(null)

  const refetch = useCallback(() => {
    setTrigger(t => t + 1)
    addEvent('REFETCH', '[axios] Manual refetch triggered via CancelToken')
  }, [addEvent])

  useEffect(() => {
    const hasCachedData = user !== null

    if (hasCachedData) {
      addEvent('CACHE_HIT', '[axios] Using cached response, background fetching')
      setIsFetching(true)
      setQueryState({ isFetching: true })
    } else {
      setIsLoading(true)
      setQueryState({ status: 'loading', isFetching: true })
      addEvent('LOADING', '[axios] Creating axios instance with interceptors...')
    }

    cancelRef.current?.cancel('New request initiated')
    const source = axios.CancelToken.source()
    cancelRef.current = source
    const controller = new AbortController()

    const effectiveConfig = { ...config, errorRate: forceErrorNext ? 100 : config.errorRate }
    const mockFetch = createMockFetch(effectiveConfig)
    const mockFetchPosts = createMockFetchPosts(config)

    let attempt = 0
    const maxRetries = config.retryCount
    let cancelled = false

    async function doFetch(): Promise<void> {
      try {
        // Simulate axios request with AbortController (mock transport) + cancel token (axios cancel)
        const [userData, postsData] = await Promise.all([
          mockFetch(controller.signal),
          mockFetchPosts(controller.signal),
        ])

        if (cancelled) return

        setUser(userData)
        setPosts(postsData)
        setIsError(false)
        setError(null)
        setRetryAttempt(0)
        resetForceError()

        addEvent('SUCCESS', `[axios] Response 200 OK — "${userData.name}" loaded`)
        setQueryState({
          status: 'success',
          isFetching: false,
          isStale: false,
          retryAttempt: 0,
          dataUpdatedAt: new Date(),
        })
      } catch (err: unknown) {
        if (axios.isCancel(err)) return
        const isAbort = err instanceof DOMException && err.name === 'AbortError'
        if (isAbort || cancelled) return

        const errorMsg = err instanceof Error ? err.message : 'Axios request failed'

        if (attempt < maxRetries) {
          attempt++
          setRetryAttempt(attempt)
          setQueryState({ retryAttempt: attempt })
          addEvent('RETRY', `[axios] Retry ${attempt}/${maxRetries} — exponential backoff`)
          await new Promise(r => setTimeout(r, Math.min(1000 * Math.pow(2, attempt - 1), 5000)))
          return doFetch()
        }

        setIsError(true)
        setError(errorMsg)
        addEvent('ERROR', `[axios] Request failed: ${errorMsg}`)
        setQueryState({
          status: 'error',
          isFetching: false,
          errorCount: (state.queryState.errorCount || 0) + 1,
        })
        resetForceError()
      } finally {
        setIsLoading(false)
        setIsFetching(false)
      }
    }

    doFetch()

    return () => {
      cancelled = true
      controller.abort()
      source.cancel('Component unmounted or effect re-ran')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger])

  return { user, posts, isLoading, isFetching, isError, error, retryAttempt, refetch }
}
