import React, { useEffect, useRef } from 'react'
import { usePlayground } from '../../context/PlaygroundContext'
import type { EventType } from '../../types'

const EVENT_ICONS: Record<EventType, string> = {
  LOADING: '⏳',
  SUCCESS: '✅',
  ERROR: '❌',
  REFETCH: '🔄',
  STALE: '🕰',
  CACHE_HIT: '💾',
  INVALIDATED: '🗑',
  RETRY: '🔁',
  OPTIMISTIC: '✨',
  ROLLBACK: '↩️',
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }) + '.' + String(d.getMilliseconds()).padStart(3, '0')
}

export default function Timeline() {
  const { state, clearEvents } = usePlayground()
  const { events } = state
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [events.length])

  return (
    <div className="timeline-panel">
      <div className="timeline-header">
        <span className="timeline-title">
          <span className="timeline-live-dot" />
          Timeline
        </span>
        <button className="timeline-clear-btn" onClick={clearEvents}>
          Clear
        </button>
      </div>

      <div className="timeline-events">
        {events.length === 0 ? (
          <div className="timeline-empty">
            <div className="timeline-empty-icon">📡</div>
            <div className="timeline-empty-text">Events will appear here</div>
          </div>
        ) : (
          events.map(evt => (
            <div key={evt.id} className="timeline-event">
              <span className="event-time">{formatTime(evt.timestamp)}</span>
              <span className={`event-badge ${evt.type}`}>
                {EVENT_ICONS[evt.type]} {evt.type}
              </span>
              <span className="event-message">{evt.message}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
