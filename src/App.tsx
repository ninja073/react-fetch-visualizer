import React from 'react'
import { PlaygroundProvider } from './context/PlaygroundContext'
import Sidebar from './components/Sidebar/Sidebar'
import Timeline from './components/Timeline/Timeline'
import Playground from './components/Playground/Playground'

export default function App() {
  return (
    <PlaygroundProvider>
      {/* Header */}
      <header className="app-header">
        <div className="app-logo">
          <div className="app-logo-icon">⚡</div>
          <span className="app-logo-text">React Fetch Playground</span>
          <span className="app-logo-badge">v1.0</span>
        </div>
        <div className="app-header-right">
          <span className="header-pill">fetch</span>
          <span className="header-pill">axios</span>
          <span className="header-pill">custom-hook</span>
          <span className="header-pill">tanstack-query</span>
        </div>
      </header>

      {/* Main layout: Sidebar | Timeline | Content | DevTools */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 240px 1fr 300px', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <Timeline />
        <Playground />
      </div>
    </PlaygroundProvider>
  )
}
