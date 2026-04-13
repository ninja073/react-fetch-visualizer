import React from 'react'
import type { MockUser, MockPost } from '../../types'
import { getUserAvatarColor } from '../../api/mockApi'
import OptimisticDemo from './OptimisticDemo'

function SkeletonLoader() {
  return (
    <div className="data-card fade-in">
      <div className="data-card-header">
        <span className="data-card-title">User Profile</span>
        <span className="data-card-meta skeleton skeleton-line" style={{ width: 100 }} />
      </div>
      <div className="data-card-body">
        <div className="user-profile">
          <div className="skeleton skeleton-avatar" />
          <div style={{ flex: 1 }}>
            <div className="skeleton skeleton-line title" />
            <div className="skeleton skeleton-line" style={{ width: '80%' }} />
            <div className="skeleton skeleton-line" style={{ width: '60%' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

function ErrorDisplay({ error, retryAttempt, maxRetries }: {
  error: string
  retryAttempt: number
  maxRetries: number
}) {
  return (
    <div className="data-card error fade-in">
      <div className="data-card-header">
        <span className="data-card-title">Request Failed</span>
      </div>
      <div className="data-card-body">
        <div className="error-display">
          <div className="error-icon">💥</div>
          <div className="error-title">Network Error</div>
          <div className="error-msg">{error}</div>
          {retryAttempt > 0 && (
            <div className="retry-count-chip">
              Retry {retryAttempt} / {maxRetries}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface DataCardProps {
  user: MockUser | null
  posts: MockPost[] | null
  isLoading: boolean
  isError: boolean
  error: string | null
  retryAttempt: number
  maxRetries: number
}

export default function DataCard({
  user,
  posts,
  isLoading,
  isError,
  error,
  retryAttempt,
  maxRetries,
}: DataCardProps) {
  if (isLoading && !user) return <SkeletonLoader />

  if (isError && !user) {
    return (
      <ErrorDisplay
        error={error ?? 'Unknown error'}
        retryAttempt={retryAttempt}
        maxRetries={maxRetries}
      />
    )
  }

  if (!user) {
    return (
      <div className="data-card">
        <div className="data-card-body">
          <div className="error-display">
            <div className="error-icon" style={{ fontSize: 36, opacity: 0.4 }}>📭</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No data loaded yet</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* User card */}
      <div className={`data-card ${isError ? 'error' : 'success'} slide-up`}>
        <div className="data-card-header">
          <span className="data-card-title">User Profile</span>
          <span className="data-card-meta">id: {user.id}</span>
        </div>
        <div className="data-card-body">
          <div className="user-profile">
            <div
              className="user-avatar"
              style={{ background: getUserAvatarColor(user.id) }}
            >
              {user.avatar}
            </div>
            <div className="user-info">
              <h3>{user.name}</h3>
              <p>{user.role}</p>
              <p style={{ color: 'var(--text-muted)' }}>{user.email}</p>
              <div className="user-tags">
                {user.skills.map(sk => (
                  <span key={sk} className="user-tag">{sk}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts grid */}
      {posts && (
        <div className="data-card slide-up" style={{ animationDelay: '0.05s' }}>
          <div className="data-card-header">
            <span className="data-card-title">Posts</span>
            <span className="data-card-meta">{posts.length} items</span>
          </div>
          <div className="data-card-body">
            <div className="posts-grid">
              {posts.map(post => (
                <div key={post.id} className="post-card">
                  <h4>{post.title}</h4>
                  <p>{post.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Optimistic updates demo */}
      {posts && <OptimisticDemo posts={posts} />}
    </>
  )
}
