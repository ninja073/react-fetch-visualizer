import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { usePlayground } from '../context/PlaygroundContext'
import { createMockFetch, createMockFetchPosts } from '../api/mockApi'
import type { MockUser, MockPost } from '../types'

interface UseTanstackResult {
  user: MockUser | null
  posts: MockPost[] | null
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  error: string | null
  retryAttempt: number
  refetch: () => void
  invalidate: () => void
}

export function useTanstackQuery(): UseTanstackResult {
  const { state, addEvent, setQueryState, resetForceError } = usePlayground()
  const { config, forceErrorNext } = state
  const queryClient = useQueryClient()
  const retryCountRef = useRef(0)
  const prevStatusRef = useRef('')

  const effectiveConfig = useMemo(
    () => ({ ...config, errorRate: forceErrorNext ? 100 : config.errorRate }),
    [config, forceErrorNext],
  )

  const userQuery = useQuery<MockUser>({
    queryKey: ['user', config.delay, config.errorRate],
    queryFn: ({ signal }) => createMockFetch(effectiveConfig)(signal),
    staleTime: config.staleTime,
    gcTime: config.cacheTime,
    retry: config.retryCount,
    retryDelay: attemptIndex => Math.min(1000 * Math.pow(2, attemptIndex), 5000),
    refetchInterval: config.refetchInterval > 0 ? config.refetchInterval : false,
  })

  const postsQuery = useQuery<MockPost[]>({
    queryKey: ['posts'],
    queryFn: ({ signal }) => createMockFetchPosts(config)(signal),
    staleTime: config.staleTime,
    gcTime: config.cacheTime,
    retry: config.retryCount,
  })

  // Emit timeline events based on query status changes
  useEffect(() => {
    const status = userQuery.status
    const isFetching = userQuery.isFetching
    const statusKey = `${status}-${isFetching}`

    if (statusKey === prevStatusRef.current) return
    prevStatusRef.current = statusKey

    if (status === 'pending' && isFetching) {
      addEvent('LOADING', '[tanstack-query] Query status: pending → fetching')
      setQueryState({ status: 'loading', isFetching: true })
    } else if (status === 'success' && isFetching) {
      addEvent('REFETCH', '[tanstack-query] Background refetch in progress (stale data served)')
      setQueryState({ isFetching: true, isStale: false })
    } else if (status === 'success' && !isFetching) {
      resetForceError()
      addEvent(
        'SUCCESS',
        `[tanstack-query] Query succeeded — "${userQuery.data?.name}" cached with staleTime: ${config.staleTime}ms`,
      )
      setQueryState({
        status: 'success',
        isFetching: false,
        isStale: false,
        dataUpdatedAt: new Date(userQuery.dataUpdatedAt),
        retryAttempt: 0,
      })
      retryCountRef.current = 0
    } else if (status === 'error') {
      resetForceError()
      addEvent('ERROR', `[tanstack-query] Query failed: ${(userQuery.error as Error)?.message}`)
      setQueryState({
        status: 'error',
        isFetching: false,
        errorCount: (state.queryState.errorCount || 0) + 1,
      })
    }
  }, [userQuery.status, userQuery.isFetching])

  // Track retries
  useEffect(() => {
    if (userQuery.failureCount > 0 && userQuery.failureCount !== retryCountRef.current) {
      retryCountRef.current = userQuery.failureCount
      addEvent(
        'RETRY',
        `[tanstack-query] Retry attempt ${userQuery.failureCount}/${config.retryCount}`,
      )
      setQueryState({ retryAttempt: userQuery.failureCount })
    }
  }, [userQuery.failureCount])

  // Track stale state
  useEffect(() => {
    if (userQuery.isStale && userQuery.status === 'success') {
      addEvent('STALE', `[tanstack-query] Data is stale (exceeded staleTime: ${config.staleTime}ms)`)
      setQueryState({ isStale: true })
    }
  }, [userQuery.isStale])

  const refetch = useCallback(() => {
    addEvent('REFETCH', '[tanstack-query] Manual refetch via refetch()')
    userQuery.refetch()
    postsQuery.refetch()
  }, [userQuery, postsQuery, addEvent])

  const invalidate = useCallback(() => {
    addEvent('INVALIDATED', '[tanstack-query] Cache invalidated via queryClient.invalidateQueries()')
    setQueryState({ isStale: true })
    queryClient.invalidateQueries({ queryKey: ['user'] })
    queryClient.invalidateQueries({ queryKey: ['posts'] })
  }, [queryClient, addEvent, setQueryState])

  return {
    user: userQuery.data ?? null,
    posts: postsQuery.data ?? null,
    isLoading: userQuery.isPending && userQuery.isFetching,
    isFetching: userQuery.isFetching,
    isError: userQuery.isError,
    error: userQuery.isError ? (userQuery.error as Error).message : null,
    retryAttempt: userQuery.failureCount,
    refetch,
    invalidate,
  }
}
