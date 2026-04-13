// ===== TYPES =====

export type FetchMode = 'fetch' | 'axios' | 'custom-hook' | 'tanstack-query'

export type EventType =
  | 'LOADING'
  | 'SUCCESS'
  | 'ERROR'
  | 'REFETCH'
  | 'STALE'
  | 'CACHE_HIT'
  | 'INVALIDATED'
  | 'RETRY'
  | 'OPTIMISTIC'
  | 'ROLLBACK'

export interface TimelineEvent {
  id: string
  type: EventType
  message: string
  timestamp: Date
  meta?: Record<string, unknown>
}

export interface PlaygroundConfig {
  delay: number        // ms
  errorRate: number    // 0-100
  retryCount: number
  staleTime: number    // ms
  cacheTime: number    // ms
  backgroundRefetch: boolean
  refetchInterval: number // ms, 0 = off
}

export interface QueryState {
  status: 'idle' | 'loading' | 'success' | 'error'
  isFetching: boolean
  isStale: boolean
  retryAttempt: number
  dataUpdatedAt: Date | null
  errorCount: number
  cacheHits: number
}

export interface MockUser {
  id: number
  name: string
  email: string
  role: string
  avatar: string
  skills: string[]
}

export interface MockPost {
  id: number
  title: string
  body: string
  likes: number
}
