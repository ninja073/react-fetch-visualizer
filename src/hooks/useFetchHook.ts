import { useCallback, useEffect, useRef, useState } from 'react'
import { usePlayground } from '../context/PlaygroundContext'
import { createMockFetch, createMockFetchPosts } from '../api/mockApi'
import type { MockUser, MockPost } from '../types'

interface UseFetchResult {
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
 * Custom fetch hook - raw fetch() implementation with full lifecycle
 */
export function useFetchHook(): UseFetchResult {
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

  const abortRef = useRef<AbortController | null>(null)
  const isFirstFetch = useRef(true)

  const refetch = useCallback(() => {
    setTrigger(t => t + 1)
    addEvent('REFETCH', 'Manual refetch triggered')
  }, [addEvent])

  useEffect(() => {
    const hasCachedData = user !== null
    
    if (hasCachedData) {
      addEvent('CACHE_HIT', `Returning cached data while refetching in background`)
      setIsFetching(true)
      setQueryState({ isFetching: true, isStale: false })
    } else {
      setIsLoading(true)
      setQueryState({ status: 'loading', isFetching: true })
      addEvent('LOADING', 'Initiating fetch request...')
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    let attempt = 0
    const maxRetries = config.retryCount

    const mockFetch = createMockFetch({
      ...config,
      // If force error is set, use 100% error rate
      errorRate: forceErrorNext ? 100 : config.errorRate,
    })
    const mockFetchPosts = createMockFetchPosts(config)

    async function doFetch(): Promise<void> {
      try {
        const [userData, postsData] = await Promise.all([
          mockFetch(controller.signal),
          mockFetchPosts(controller.signal),
        ])

        if (controller.signal.aborted) return

        setUser(userData)
        setPosts(postsData)
        setIsError(false)
        setError(null)
        setRetryAttempt(0)
        isFirstFetch.current = false
        resetForceError()

        addEvent('SUCCESS', `User "${userData.name}" loaded successfully`)
        setQueryState({
          status: 'success',
          isFetching: false,
          isStale: false,
          retryAttempt: 0,
          dataUpdatedAt: new Date(),
        })
      } catch (err: unknown) {
        if (controller.signal.aborted) return

        const isAbort = err instanceof DOMException && err.name === 'AbortError'
        if (isAbort) return

        const errorMsg = err instanceof Error ? err.message : 'Unknown error'

        if (attempt < maxRetries) {
          attempt++
          setRetryAttempt(attempt)
          setQueryState({ retryAttempt: attempt })
          addEvent('RETRY', `Retry ${attempt}/${maxRetries}: ${errorMsg}`)

          const backoff = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
          await new Promise(r => setTimeout(r, backoff))
          return doFetch()
        }

        setIsError(true)
        setError(errorMsg)
        addEvent('ERROR', `Failed after ${maxRetries} retries: ${errorMsg}`)
        setQueryState({
          status: 'error',
          isFetching: false,
          errorCount: (state.queryState.errorCount || 0) + 1,
        })
        resetForceError()
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
          setIsFetching(false)
        }
      }
    }

    doFetch()

    return () => {
      controller.abort()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger])

  return { user, posts, isLoading, isFetching, isError, error, retryAttempt, refetch }
}
