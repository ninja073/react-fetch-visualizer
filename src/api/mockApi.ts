import type { MockUser, MockPost, PlaygroundConfig } from '../types'

// ===== MOCK DATA =====

export const MOCK_USERS: MockUser[] = [
  {
    id: 1,
    name: 'Nitish Jaiswal',
    email: 'nitish@fetchlab.dev',
    role: 'Senior Frontend Engineer',
    avatar: '🧑‍💻',
    skills: ['React', 'TanStack Query', 'TypeScript', 'GraphQL'],
  },
  {
    id: 2,
    name: 'Priya Sharma',
    email: 'priya@fetchlab.dev',
    role: 'Full Stack Developer',
    avatar: '👩‍💻',
    skills: ['Next.js', 'Node.js', 'PostgreSQL', 'Redis'],
  },
  {
    id: 3,
    name: 'Alex Chen',
    email: 'alex@fetchlab.dev',
    role: 'Systems Architect',
    avatar: '🧑‍🔬',
    skills: ['Rust', 'Go', 'Kubernetes', 'gRPC'],
  },
]

export const MOCK_POSTS: MockPost[] = [
  { id: 1, title: 'Understanding Stale-While-Revalidate', body: 'SWR is a strategy where cached data is returned immediately while a background refetch is in progress...', likes: 42 },
  { id: 2, title: 'Optimistic Updates Deep Dive', body: 'An optimistic update immediately reflects the new state before the server confirms, creating a snappy UX...', likes: 31 },
  { id: 3, title: 'React Query Internals', body: 'TanStack Query maintains a cache that maps query keys to query states including data, errors, and staleness...', likes: 78 },
  { id: 4, title: 'Custom Fetch Hooks', body: 'Building your own fetch hook teaches you what libraries like SWR and TanStack Query abstract for you...', likes: 19 },
]

// ===== MOCK API FUNCTIONS =====

let callCount = 0

export function createMockFetch(config: PlaygroundConfig) {
  return async function mockFetchUser(signal?: AbortSignal): Promise<MockUser> {
    // Simulate network delay
    await sleep(config.delay, signal)

    // Simulate configured error rate
    if (Math.random() * 100 < config.errorRate) {
      throw new Error(`Network Error: Request failed (${config.errorRate}% error rate configured)`)
    }

    callCount++
    const user = MOCK_USERS[callCount % MOCK_USERS.length]
    return { ...user }
  }
}

export function createMockFetchPosts(config: PlaygroundConfig) {
  return async function mockFetchPosts(signal?: AbortSignal): Promise<MockPost[]> {
    await sleep(Math.max(300, config.delay * 0.6), signal)

    if (Math.random() * 100 < config.errorRate) {
      throw new Error(`Network Error: Posts fetch failed`)
    }

    return MOCK_POSTS.map(p => ({ ...p }))
  }
}

export async function mockLikePost(
  postId: number,
  _config: PlaygroundConfig,
): Promise<{ success: boolean }> {
  // 60% success rate for optimistic updates demo
  await sleep(800)
  if (Math.random() < 0.4) {
    throw new Error('Server rejected like: rate limit exceeded')
  }
  return { success: true, postId } as { success: boolean }
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timeout)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })
}

export function getUserAvatarColor(userId: number): string {
  const colors = [
    'linear-gradient(135deg, #667eea, #764ba2)',
    'linear-gradient(135deg, #f093fb, #f5576c)',
    'linear-gradient(135deg, #4facfe, #00f2fe)',
    'linear-gradient(135deg, #43e97b, #38f9d7)',
  ]
  return colors[userId % colors.length]
}
