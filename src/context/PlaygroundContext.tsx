import React, { createContext, useCallback, useContext, useReducer, useRef } from 'react'
import type { FetchMode, TimelineEvent, PlaygroundConfig, QueryState, EventType } from '../types'

// ===== DEFAULTS =====

const DEFAULT_CONFIG: PlaygroundConfig = {
  delay: 1200,
  errorRate: 0,
  retryCount: 3,
  staleTime: 10000,
  cacheTime: 60000,
  backgroundRefetch: false,
  refetchInterval: 0,
}

const DEFAULT_QUERY_STATE: QueryState = {
  status: 'idle',
  isFetching: false,
  isStale: false,
  retryAttempt: 0,
  dataUpdatedAt: null,
  errorCount: 0,
  cacheHits: 0,
}

// ===== STATE =====

interface PlaygroundState {
  mode: FetchMode
  config: PlaygroundConfig
  events: TimelineEvent[]
  queryState: QueryState
  forceErrorNext: boolean
}

type Action =
  | { type: 'SET_MODE'; mode: FetchMode }
  | { type: 'SET_CONFIG'; patch: Partial<PlaygroundConfig> }
  | { type: 'ADD_EVENT'; event: TimelineEvent }
  | { type: 'CLEAR_EVENTS' }
  | { type: 'SET_QUERY_STATE'; patch: Partial<QueryState> }
  | { type: 'TOGGLE_FORCE_ERROR' }
  | { type: 'RESET_FORCE_ERROR' }

function reducer(state: PlaygroundState, action: Action): PlaygroundState {
  switch (action.type) {
    case 'SET_MODE':
      return {
        ...state,
        mode: action.mode,
        events: [],
        queryState: DEFAULT_QUERY_STATE,
        forceErrorNext: false,
      }
    case 'SET_CONFIG':
      return { ...state, config: { ...state.config, ...action.patch } }
    case 'ADD_EVENT':
      return { ...state, events: [...state.events, action.event] }
    case 'CLEAR_EVENTS':
      return { ...state, events: [] }
    case 'SET_QUERY_STATE':
      return { ...state, queryState: { ...state.queryState, ...action.patch } }
    case 'TOGGLE_FORCE_ERROR':
      return { ...state, forceErrorNext: !state.forceErrorNext }
    case 'RESET_FORCE_ERROR':
      return { ...state, forceErrorNext: false }
    default:
      return state
  }
}

// ===== CONTEXT =====

interface PlaygroundContextValue {
  state: PlaygroundState
  addEvent: (type: EventType, message: string, meta?: Record<string, unknown>) => void
  setMode: (mode: FetchMode) => void
  setConfig: (patch: Partial<PlaygroundConfig>) => void
  clearEvents: () => void
  setQueryState: (patch: Partial<QueryState>) => void
  toggleForceError: () => void
  resetForceError: () => void
  refetchTrigger: React.MutableRefObject<number>
}

const PlaygroundContext = createContext<PlaygroundContextValue | null>(null)

export function PlaygroundProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    mode: 'tanstack-query',
    config: DEFAULT_CONFIG,
    events: [],
    queryState: DEFAULT_QUERY_STATE,
    forceErrorNext: false,
  })

  const refetchTrigger = useRef(0)
  const eventIdCounter = useRef(0)

  const addEvent = useCallback(
    (type: EventType, message: string, meta?: Record<string, unknown>) => {
      dispatch({
        type: 'ADD_EVENT',
        event: {
          id: `evt-${++eventIdCounter.current}`,
          type,
          message,
          timestamp: new Date(),
          meta,
        },
      })
    },
    [],
  )

  const setMode = useCallback((mode: FetchMode) => dispatch({ type: 'SET_MODE', mode }), [])
  const setConfig = useCallback(
    (patch: Partial<PlaygroundConfig>) => dispatch({ type: 'SET_CONFIG', patch }),
    [],
  )
  const clearEvents = useCallback(() => dispatch({ type: 'CLEAR_EVENTS' }), [])
  const setQueryState = useCallback(
    (patch: Partial<QueryState>) => dispatch({ type: 'SET_QUERY_STATE', patch }),
    [],
  )
  const toggleForceError = useCallback(() => dispatch({ type: 'TOGGLE_FORCE_ERROR' }), [])
  const resetForceError = useCallback(() => dispatch({ type: 'RESET_FORCE_ERROR' }), [])

  return (
    <PlaygroundContext.Provider
      value={{
        state,
        addEvent,
        setMode,
        setConfig,
        clearEvents,
        setQueryState,
        toggleForceError,
        resetForceError,
        refetchTrigger,
      }}
    >
      {children}
    </PlaygroundContext.Provider>
  )
}

export function usePlayground() {
  const ctx = useContext(PlaygroundContext)
  if (!ctx) throw new Error('usePlayground must be used inside PlaygroundProvider')
  return ctx
}
