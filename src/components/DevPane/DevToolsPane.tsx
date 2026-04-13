import React, { useEffect, useState } from 'react'
import { usePlayground } from '../../context/PlaygroundContext'

interface DevToolsPaneProps {
  retryAttempt?: number
}

function FreshnessBar() {
  const { state } = usePlayground()
  const { queryState, config } = state
  const [freshness, setFreshness] = useState(100)

  useEffect(() => {
    if (!queryState.dataUpdatedAt) {
      setFreshness(100)
      return
    }
    if (config.staleTime === 0) {
      setFreshness(0)
      return
    }

    const interval = setInterval(() => {
      const age = Date.now() - queryState.dataUpdatedAt!.getTime()
      const remaining = Math.max(0, 1 - age / config.staleTime)
      setFreshness(Math.round(remaining * 100))
    }, 500)

    return () => clearInterval(interval)
  }, [queryState.dataUpdatedAt, config.staleTime])

  const cls = freshness > 50 ? 'fresh' : freshness > 15 ? 'stale' : 'expired'
  const color = freshness > 50 ? 'var(--green)' : freshness > 15 ? 'var(--amber)' : 'var(--red)'

  return (
    <div className="freshness-container">
      <div className="freshness-label">
        <span>freshness</span>
        <span style={{ color }}>{freshness}%</span>
      </div>
      <div className="freshness-track">
        <div
          className={`freshness-fill ${cls}`}
          style={{ width: `${freshness}%` }}
        />
      </div>
    </div>
  )
}

export default function DevToolsPane({ retryAttempt = 0 }: DevToolsPaneProps) {
  const { state } = usePlayground()
  const { queryState, config, mode, events } = state

  const cacheHitCount = events.filter(e => e.type === 'CACHE_HIT').length
  const successCount = events.filter(e => e.type === 'SUCCESS').length
  const retryDots = Array.from({ length: config.retryCount }, (_, i) => i)

  function formatDate(d: Date | null) {
    if (!d) return '—'
    return d.toLocaleTimeString('en-US', { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0')
  }

  const statusColor: Record<string, string> = {
    idle: 'muted',
    loading: 'amber',
    success: 'green',
    error: 'red',
  }

  return (
    <div className="devtools-panel">
      <div className="devtools-header">
        <span className="devtools-title">
          <span>🛠</span>
          DevTools Inspector
        </span>
      </div>

      <div className="devtools-scroll">
        {/* Query State */}
        <div className="devtools-section">
          <div className="devtools-section-header">Query State</div>
          <div className="devtools-section-body">
            <div className="kv-row">
              <span className="kv-key">status</span>
              <span className={`kv-value ${statusColor[queryState.status] ?? 'muted'}`}>
                {queryState.status}
              </span>
            </div>
            <div className="kv-row">
              <span className="kv-key">isFetching</span>
              <span className={`kv-value ${queryState.isFetching ? 'cyan' : 'muted'}`}>
                {String(queryState.isFetching)}
              </span>
            </div>
            <div className="kv-row">
              <span className="kv-key">isStale</span>
              <span className={`kv-value ${queryState.isStale ? 'amber' : 'muted'}`}>
                {String(queryState.isStale)}
              </span>
            </div>
            <div className="kv-row">
              <span className="kv-key">dataUpdatedAt</span>
              <span className="kv-value muted" style={{ fontSize: 10 }}>
                {formatDate(queryState.dataUpdatedAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Cache Info */}
        <div className="devtools-section">
          <div className="devtools-section-header">Cache Inspector</div>
          <div className="devtools-section-body">
            <FreshnessBar />
            <div className="kv-row" style={{ marginTop: 8 }}>
              <span className="kv-key">staleTime</span>
              <span className="kv-value cyan">{(config.staleTime / 1000).toFixed(0)}s</span>
            </div>
            <div className="kv-row">
              <span className="kv-key">gcTime</span>
              <span className="kv-value purple">{(config.cacheTime / 1000).toFixed(0)}s</span>
            </div>
            <div className="kv-row">
              <span className="kv-key">cache hits</span>
              <span className="kv-value pink">{cacheHitCount}</span>
            </div>
          </div>
        </div>

        {/* Retry Tracker */}
        <div className="devtools-section">
          <div className="devtools-section-header">Retry Tracker</div>
          <div className="devtools-section-body">
            <div className="kv-row">
              <span className="kv-key">maxRetries</span>
              <span className="kv-value muted">{config.retryCount}</span>
            </div>
            <div className="kv-row">
              <span className="kv-key">attempt</span>
              <span className={`kv-value ${retryAttempt > 0 ? 'amber' : 'muted'}`}>
                {retryAttempt}
              </span>
            </div>
            <div className="retry-dots">
              {retryDots.map(i => (
                <div
                  key={i}
                  className={`retry-dot ${
                    i < retryAttempt
                      ? queryState.status === 'error'
                        ? 'failed'
                        : 'used'
                      : ''
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Network Stats */}
        <div className="devtools-section">
          <div className="devtools-section-header">Network Stats</div>
          <div className="devtools-section-body">
            <div className="kv-row">
              <span className="kv-key">mode</span>
              <span className="kv-value cyan">{mode}</span>
            </div>
            <div className="kv-row">
              <span className="kv-key">delay</span>
              <span className="kv-value muted">{config.delay}ms</span>
            </div>
            <div className="kv-row">
              <span className="kv-key">errorRate</span>
              <span className={`kv-value ${config.errorRate > 0 ? 'red' : 'green'}`}>
                {config.errorRate}%
              </span>
            </div>
            <div className="kv-row">
              <span className="kv-key">totalErrors</span>
              <span className={`kv-value ${queryState.errorCount > 0 ? 'red' : 'muted'}`}>
                {queryState.errorCount}
              </span>
            </div>
            <div className="kv-row">
              <span className="kv-key">successes</span>
              <span className="kv-value green">{successCount}</span>
            </div>
            <div className="kv-row">
              <span className="kv-key">refetchInterval</span>
              <span className="kv-value muted">
                {config.refetchInterval === 0 ? 'off' : `${config.refetchInterval / 1000}s`}
              </span>
            </div>
            <div className="kv-row">
              <span className="kv-key">bgRefetch</span>
              <span className={`kv-value ${config.backgroundRefetch ? 'cyan' : 'muted'}`}>
                {String(config.backgroundRefetch)}
              </span>
            </div>
          </div>
        </div>

        {/* Event Summary */}
        <div className="devtools-section">
          <div className="devtools-section-header">Event Counts</div>
          <div className="devtools-section-body">
            {(['LOADING', 'SUCCESS', 'ERROR', 'REFETCH', 'STALE', 'CACHE_HIT', 'RETRY'] as const).map(type => {
              const count = events.filter(e => e.type === type).length
              return (
                <div key={type} className="kv-row">
                  <span className="kv-key">{type}</span>
                  <span className={`kv-value ${count > 0 ? 'cyan' : 'muted'}`}>{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
