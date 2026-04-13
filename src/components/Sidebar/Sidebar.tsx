import type { FetchMode } from '../../types'
import { usePlayground } from '../../context/PlaygroundContext'

const MODES: { id: FetchMode; label: string; icon: string; desc: string }[] = [
  { id: 'fetch', label: 'fetch()', icon: '🌐', desc: 'Native browser API' },
  { id: 'axios', label: 'axios', icon: '⚡', desc: 'HTTP client' },
  { id: 'custom-hook', label: 'Custom Hook', icon: '🪝', desc: 'useState + useEffect' },
  { id: 'tanstack-query', label: 'TanStack', icon: '🔥', desc: 'query v5' },
]

const CODE_SNIPPETS: Record<FetchMode, React.ReactNode> = {
  'fetch': (
    <div className="code-preview">
      <span className="code-line"><span className="code-kw">const</span> <span className="code-var">controller</span> = <span className="code-kw">new</span> <span className="code-op">AbortController</span>()</span>
      <span className="code-line"><span className="code-kw">const</span> <span className="code-var">res</span> = <span className="code-kw">await</span> <span className="code-op">fetch</span>(<span className="code-str">'/api/user'</span>, {'{'}</span>
      <span className="code-line">  <span className="code-var">signal</span>: <span className="code-var">controller</span>.<span className="code-fn">signal</span></span>
      <span className="code-line">{'}'})</span>
      <span className="code-line"><span className="code-kw">const</span> <span className="code-var">data</span> = <span className="code-kw">await</span> <span className="code-var">res</span>.<span className="code-fn">json</span>()</span>
      <span className="code-line cm">{'// Retry manually with exponential backoff'}</span>
    </div>
  ),
  'axios': (
    <div className="code-preview">
      <span className="code-line"><span className="code-kw">const</span> <span className="code-var">src</span> = <span className="code-var">axios</span>.<span className="code-fn">CancelToken</span>.<span className="code-fn">source</span>()</span>
      <span className="code-line"><span className="code-kw">const</span> {'{'} <span className="code-var">data</span> {'}'} = <span className="code-kw">await</span> <span className="code-var">axios</span>.<span className="code-fn">get</span>(</span>
      <span className="code-line">  <span className="code-str">'/api/user'</span>,</span>
      <span className="code-line">  {'{ cancelToken: src.token }'}</span>
      <span className="code-line">)</span>
      <span className="code-line cm">{'// src.cancel() to abort'}</span>
    </div>
  ),
  'custom-hook': (
    <div className="code-preview">
      <span className="code-line"><span className="code-kw">function</span> <span className="code-fn">useFetch</span>{'<T>'}(<span className="code-var">url</span>) {'{'}</span>
      <span className="code-line">  <span className="code-kw">const</span> [<span className="code-var">data</span>, <span className="code-var">setData</span>] = <span className="code-fn">useState</span>(<span className="code-kw">null</span>)</span>
      <span className="code-line">  <span className="code-fn">useEffect</span>{'(() => {'}</span>
      <span className="code-line">    <span className="code-cm">{'// cache → stale check → fetch'}</span></span>
      <span className="code-line">  {'}, [url])'}</span>
      <span className="code-line">  <span className="code-kw">return</span> {'{ data }'}</span>
      <span className="code-line">{'}'}</span>
    </div>
  ),
  'tanstack-query': (
    <div className="code-preview">
      <span className="code-line"><span className="code-kw">const</span> {'{'} <span className="code-var">data</span>, <span className="code-var">isLoading</span> {'}'} =</span>
      <span className="code-line">  <span className="code-fn">useQuery</span>({'{'}</span>
      <span className="code-line">    <span className="code-var">queryKey</span>: [<span className="code-str">'user'</span>],</span>
      <span className="code-line">    <span className="code-var">queryFn</span>: <span className="code-fn">fetchUser</span>,</span>
      <span className="code-line">    <span className="code-var">staleTime</span>: <span className="code-num">10_000</span>,</span>
      <span className="code-line">    <span className="code-var">retry</span>: <span className="code-num">3</span>,</span>
      <span className="code-line">  {'})'}</span>
    </div>
  ),
}

import React from 'react'

export default function Sidebar() {
  const { state, setMode, setConfig } = usePlayground()
  const { mode, config } = state

  return (
    <aside className="sidebar">
      {/* Mode selector */}
      <div className="sidebar-section">
        <div className="section-label">Fetcher Mode</div>
        <div className="mode-grid">
          {MODES.map(m => (
            <button
              key={m.id}
              className={`mode-btn ${mode === m.id ? 'active' : ''}`}
              onClick={() => setMode(m.id)}
              title={m.desc}
            >
              <span className="mode-icon">{m.icon}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Code snippet */}
      <div className="sidebar-section">
        <div className="section-label">Code Preview</div>
        {CODE_SNIPPETS[mode]}
      </div>

      {/* Config sliders */}
      <div className="sidebar-section" style={{ overflowY: 'auto' }}>
        <div className="section-label">Configuration</div>

        <div className="control-group">
          <div className="control-label">
            <span className="control-name">Network Delay</span>
            <span className="control-value">{config.delay}ms</span>
          </div>
          <input
            className="slider"
            type="range"
            min={0}
            max={5000}
            step={100}
            value={config.delay}
            onChange={e => setConfig({ delay: Number(e.target.value) })}
          />
        </div>

        <div className="control-group">
          <div className="control-label">
            <span className="control-name">Error Rate</span>
            <span className="control-value" style={{ color: config.errorRate > 30 ? 'var(--red)' : 'var(--cyan)' }}>
              {config.errorRate}%
            </span>
          </div>
          <input
            className="slider"
            type="range"
            min={0}
            max={100}
            step={5}
            value={config.errorRate}
            onChange={e => setConfig({ errorRate: Number(e.target.value) })}
          />
        </div>

        <div className="control-group">
          <div className="control-label">
            <span className="control-name">Retry Count</span>
            <span className="control-value">{config.retryCount}x</span>
          </div>
          <input
            className="slider"
            type="range"
            min={0}
            max={5}
            step={1}
            value={config.retryCount}
            onChange={e => setConfig({ retryCount: Number(e.target.value) })}
          />
        </div>

        <div className="control-group">
          <div className="control-label">
            <span className="control-name">Stale Time</span>
            <span className="control-value">{(config.staleTime / 1000).toFixed(0)}s</span>
          </div>
          <input
            className="slider"
            type="range"
            min={0}
            max={60000}
            step={1000}
            value={config.staleTime}
            onChange={e => setConfig({ staleTime: Number(e.target.value) })}
          />
        </div>

        <div className="control-group">
          <div className="control-label">
            <span className="control-name">Refetch Interval</span>
            <span className="control-value">
              {config.refetchInterval === 0 ? 'off' : `${(config.refetchInterval / 1000).toFixed(0)}s`}
            </span>
          </div>
          <input
            className="slider"
            type="range"
            min={0}
            max={30000}
            step={1000}
            value={config.refetchInterval}
            onChange={e => setConfig({ refetchInterval: Number(e.target.value) })}
          />
        </div>

        <div className="control-group" style={{ marginTop: 16 }}>
          <div className="toggle-row">
            <span className="toggle-label">⟳ Background Refetch</span>
            <label className="toggle">
              <input
                type="checkbox"
                checked={config.backgroundRefetch}
                onChange={e => setConfig({ backgroundRefetch: e.target.checked })}
              />
              <span className="toggle-track" />
            </label>
          </div>
        </div>
      </div>
    </aside>
  )
}
