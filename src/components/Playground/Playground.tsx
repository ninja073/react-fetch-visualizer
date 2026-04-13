import React from 'react'
import { usePlayground } from '../../context/PlaygroundContext'
import { useFetchHook } from '../../hooks/useFetchHook'
import { useAxiosHook } from '../../hooks/useAxiosHook'
import { useCustomHook } from '../../hooks/useCustomHook'
import { useTanstackQuery } from '../../hooks/useTanstackQuery'
import type { FetchMode, MockPost, MockUser } from '../../types'
import DataCard from '../DataCard/DataCard'
import DevToolsPane from '../DevPane/DevToolsPane'

// ===== Shared QueryState badges =====

interface StateBadgesProps {
  status: string
  isFetching: boolean
  isStale: boolean
  retryAttempt: number
  isFetchingBackground?: boolean
}

function StateBadges({ status, isFetching, isStale, retryAttempt }: StateBadgesProps) {
  return (
    <div className="state-badges">
      <div className={`state-badge ${status}`}>
        <span className={`dot ${isFetching ? 'pulse' : ''}`} />
        {status}
      </div>
      {isFetching && status !== 'loading' && (
        <div className="state-badge fetching">
          <span className="dot pulse" />
          background fetching
        </div>
      )}
      {isStale && (
        <div className="state-badge stale">
          <span className="dot" />
          stale
        </div>
      )}
      {retryAttempt > 0 && (
        <div className="state-badge" style={{ background: 'var(--amber-dim)', border: '1px solid rgba(245,158,11,0.3)', color: 'var(--amber)' }}>
          <span className="dot pulse" />
          retry {retryAttempt}
        </div>
      )}
    </div>
  )
}

// ===== Individual mode viewers =====

function FetchModeView() {
  const { state, toggleForceError, clearEvents } = usePlayground()
  const { user, posts, isLoading, isFetching, isError, error, retryAttempt, refetch } = useFetchHook()
  const { queryState, config } = state

  return (
    <>
      <ControlBarInner
        onRefetch={refetch}
        onForceError={toggleForceError}
        onClear={clearEvents}
        forceErrorActive={state.forceErrorNext}
        mode="fetch"
        isFetching={isFetching}
      />
      <div className="data-area">
        <StateBadges
          status={queryState.status}
          isFetching={isFetching}
          isStale={queryState.isStale}
          retryAttempt={retryAttempt}
        />
        <DataCard
          user={user}
          posts={posts}
          isLoading={isLoading}
          isError={isError}
          error={error}
          retryAttempt={retryAttempt}
          maxRetries={config.retryCount}
        />
      </div>
    </>
  )
}

function AxiosModeView() {
  const { state, toggleForceError, clearEvents } = usePlayground()
  const { user, posts, isLoading, isFetching, isError, error, retryAttempt, refetch } = useAxiosHook()
  const { queryState, config } = state

  return (
    <>
      <ControlBarInner
        onRefetch={refetch}
        onForceError={toggleForceError}
        onClear={clearEvents}
        forceErrorActive={state.forceErrorNext}
        mode="axios"
        isFetching={isFetching}
      />
      <div className="data-area">
        <StateBadges
          status={queryState.status}
          isFetching={isFetching}
          isStale={queryState.isStale}
          retryAttempt={retryAttempt}
        />
        <DataCard
          user={user}
          posts={posts}
          isLoading={isLoading}
          isError={isError}
          error={error}
          retryAttempt={retryAttempt}
          maxRetries={config.retryCount}
        />
      </div>
    </>
  )
}

function CustomHookView() {
  const { state, clearEvents } = usePlayground()
  const { user, posts, isLoading, isFetching, isError, error, retryAttempt, refetch } = useCustomHook()
  const { queryState, config } = state

  return (
    <>
      <ControlBarInner
        onRefetch={refetch}
        onForceError={() => {}}
        onClear={clearEvents}
        forceErrorActive={false}
        mode="custom-hook"
        isFetching={isFetching}
        hideForceError
      />
      <div className="data-area">
        <StateBadges
          status={queryState.status}
          isFetching={isFetching}
          isStale={queryState.isStale}
          retryAttempt={retryAttempt}
        />
        <DataCard
          user={user}
          posts={posts}
          isLoading={isLoading}
          isError={isError}
          error={error}
          retryAttempt={retryAttempt}
          maxRetries={config.retryCount}
        />
      </div>
    </>
  )
}

function TanstackModeView() {
  const { state, toggleForceError, clearEvents } = usePlayground()
  const {
    user, posts, isLoading, isFetching, isError, error, retryAttempt,
    refetch, invalidate,
  } = useTanstackQuery()
  const { queryState, config } = state

  return (
    <>
      <ControlBarInner
        onRefetch={refetch}
        onForceError={toggleForceError}
        onClear={clearEvents}
        forceErrorActive={state.forceErrorNext}
        mode="tanstack-query"
        isFetching={isFetching}
        onInvalidate={invalidate}
      />
      <div className="data-area">
        <StateBadges
          status={queryState.status}
          isFetching={isFetching}
          isStale={queryState.isStale}
          retryAttempt={retryAttempt}
        />
        <DataCard
          user={user}
          posts={posts}
          isLoading={isLoading}
          isError={isError}
          error={error}
          retryAttempt={retryAttempt}
          maxRetries={config.retryCount}
        />
      </div>
    </>
  )
}

// ===== Control bar inner =====

interface ControlBarInnerProps {
  onRefetch: () => void
  onForceError: () => void
  onClear: () => void
  onInvalidate?: () => void
  forceErrorActive: boolean
  mode: FetchMode
  isFetching: boolean
  hideForceError?: boolean
}

function ControlBarInner({
  onRefetch,
  onForceError,
  onClear,
  onInvalidate,
  forceErrorActive,
  mode,
  isFetching,
  hideForceError,
}: ControlBarInnerProps) {
  return (
    <div className="control-bar">
      <button className="ctrl-btn primary" onClick={onRefetch} disabled={isFetching}>
        {isFetching ? <span className="spin">↻</span> : '↺'} Refetch
      </button>

      {onInvalidate && (
        <button className="ctrl-btn warning" onClick={onInvalidate}>
          🗑 Invalidate Cache
        </button>
      )}

      {!hideForceError && (
        <button
          className={`ctrl-btn ${forceErrorActive ? 'danger' : ''}`}
          onClick={onForceError}
          style={{ borderColor: forceErrorActive ? 'var(--red)' : undefined }}
        >
          {forceErrorActive ? '🔴 Error Armed' : '💣 Force Error'}
        </button>
      )}

      <div className="ctrl-separator" />

      <button className="ctrl-btn" onClick={onClear}>
        🧹 Clear Timeline
      </button>

      <div className="ctrl-status-chip">
        <span>{mode}</span>
        {isFetching && <span className="spin" style={{ color: 'var(--cyan)' }}>↻</span>}
      </div>
    </div>
  )
}

// ===== Main Playground =====

const MODE_VIEWS: Record<FetchMode, React.ComponentType> = {
  'fetch': FetchModeView,
  'axios': AxiosModeView,
  'custom-hook': CustomHookView,
  'tanstack-query': TanstackModeView,
}

// DevTools wrapper that reads context
function DevToolsWrapper({ retryAttempt }: { retryAttempt?: number }) {
  return <DevToolsPane retryAttempt={retryAttempt} />
}

export default function Playground() {
  const { state } = usePlayground()
  const View = MODE_VIEWS[state.mode]

  return (
    <>
      <div className="main-content">
        <View />
      </div>
      <DevToolsWrapper />
    </>
  )
}
