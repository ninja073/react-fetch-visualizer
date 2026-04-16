import React, { useState, useCallback, useEffect } from 'react'
import type { MockPost } from '../../types'
import { usePlayground } from '../../context/PlaygroundContext'
import { mockLikePost } from '../../api/mockApi'

interface LikeState {
  [postId: number]: {
    count: number
    status: 'idle' | 'pending' | 'ok' | 'fail'
    rollback: boolean
  }
}

export default function OptimisticDemo({ posts }: { posts: MockPost[] }) {
  const { addEvent, state } = usePlayground()
  const [likeState, setLikeState] = useState<LikeState>({})

  // Sync new/changed posts into likeState; preserve entries already being interacted with
  useEffect(() => {
    setLikeState(prev => {
      const next: LikeState = {}
      for (const p of posts) {
        next[p.id] = prev[p.id] ?? { count: p.likes, status: 'idle', rollback: false }
      }
      return next
    })
  }, [posts])

  const handleLike = useCallback(async (post: MockPost) => {
    const prevCount = likeState[post.id]?.count ?? post.likes

    // Optimistic update
    setLikeState(s => ({
      ...s,
      [post.id]: { count: prevCount + 1, status: 'pending', rollback: false },
    }))
    addEvent('OPTIMISTIC', `[optimistic] Instantly updated post "${post.title.slice(0, 30)}..." +1 like`)

    try {
      await mockLikePost(post.id, state.config)
      setLikeState(s => ({ ...s, [post.id]: { ...s[post.id], status: 'ok' } }))
      addEvent('SUCCESS', `[optimistic] Server confirmed like on post #${post.id}`)

      // Reset to idle after 2s
      setTimeout(() => {
        setLikeState(s => ({ ...s, [post.id]: { ...s[post.id], status: 'idle' } }))
      }, 2000)
    } catch {
      // ROLLBACK
      addEvent('ROLLBACK', `[optimistic] Server rejected! Rolling back like on post #${post.id}`)
      setLikeState(s => ({
        ...s,
        [post.id]: { count: prevCount, status: 'fail', rollback: true },
      }))

      setTimeout(() => {
        setLikeState(s => ({ ...s, [post.id]: { ...s[post.id], status: 'idle', rollback: false } }))
      }, 2500)
    }
  }, [likeState, addEvent, state.config])

  const displayPosts = posts.slice(0, 4)

  return (
    <div className="optimistic-section">
      <div className="optimistic-title">Optimistic Updates</div>
      <div className="like-posts-list">
        {displayPosts.map(post => {
          const ls = likeState[post.id] ?? { count: post.likes, status: 'idle', rollback: false }
          return (
            <div key={post.id} className="like-item">
              <span className="like-item-title">#{post.id} {post.title}</span>
              {ls.status !== 'idle' && (
                <span className={`like-status ${ls.status}`}>
                  {ls.status === 'pending' && '⏳ pending'}
                  {ls.status === 'ok' && '✅ confirmed'}
                  {ls.status === 'fail' && '↩️ rolled back'}
                </span>
              )}
              <button
                className={`like-btn ${ls.status !== 'idle' ? 'liked' : ''}`}
                data-rollback={ls.rollback ? 'true' : 'false'}
                onClick={() => handleLike(post)}
                disabled={ls.status === 'pending'}
              >
                ❤️ {ls.count}
              </button>
            </div>
          )
        })}
      </div>
      <p style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
        {'// ~40% chance server rejects → rollback demo'}
      </p>
    </div>
  )
}
