import { useState, useEffect } from 'react'
import client from '@/api/client'
import { useAuthStore } from '@/store/authStore'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { EmptyState } from '@/shared/components/EmptyState'
import { Pagination } from '@/shared/components/Pagination'
import { MessageSquare, Reply, ChevronDown, ChevronUp, Send, Search } from 'lucide-react'

interface AdminSuggestion {
  id: number
  topic_id: number
  topic_name?: string
  user: { id: number; name: string }
  body: string
  status: string
  admin_reply: { id: number; body: string; is_public_reply: boolean; created_at: string } | null
  created_at: string
}

const ADMIN_ROLES = ['super_admin', 'secretary', 'chairperson']
const ITEMS_PER_PAGE = 15

export function AdminSuggestionsPage() {
  const user = useAuthStore((s) => s.user)
  const [suggestions, setSuggestions] = useState<AdminSuggestion[]>([])
  const [allTopics, setAllTopics] = useState<{id: number; title: string}[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [replyBodies, setReplyBodies] = useState<Record<number, string>>({})
  const [replyPublic, setReplyPublic] = useState<Record<number, boolean>>({})
  const [replying, setReplying] = useState<Set<number>>(new Set())
  const [topicFilter, setTopicFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const fetchSuggestions = async () => {
    setLoading(true)
    try {
      const [topicsRes, { data }] = await Promise.all([
        client.get('/suggestion-topics'),
        client.get('/admin/suggestions'),
      ])
      setAllTopics(topicsRes.data)
      setSuggestions(data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSuggestions()
  }, [])

  if (!user || !ADMIN_ROLES.includes(user.role)) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <p className="text-red-500 font-medium">You do not have permission to access this page.</p>
      </div>
    )
  }

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleReply = async (suggestionId: number) => {
    const body = replyBodies[suggestionId]
    if (!body?.trim()) return
    setReplying((prev) => new Set(prev).add(suggestionId))
    try {
      await client.put(`/admin/suggestions/${suggestionId}/reply`, {
        body,
        is_public_reply: replyPublic[suggestionId] ?? false,
      })
      setReplyBodies((prev) => ({ ...prev, [suggestionId]: '' }))
      fetchSuggestions()
    } catch {
      // silent
    } finally {
      setReplying((prev) => {
        const next = new Set(prev)
        next.delete(suggestionId)
        return next
      })
    }
  }

  if (loading) return <LoadingSpinner size="lg" />

  const filtered = suggestions.filter((s) => {
    if (topicFilter !== 'all' && s.topic_id !== Number(topicFilter)) return false
    if (statusFilter !== 'all' && s.status !== statusFilter) return false
    if (search && !s.user.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <MessageSquare className="h-7 w-7 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Manage Suggestions</h1>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          value={topicFilter}
          onChange={(e) => { setTopicFilter(e.target.value); setCurrentPage(1) }}
        >
          <option value="all">All Topics</option>
          {allTopics.map((t) => (
            <option key={t.id} value={t.id}>{t.title}</option>
          ))}
        </select>
        <select
          className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="replied">Replied</option>
        </select>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by member name..."
            className="pl-8 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
          />
        </div>
      </div>

      {!filtered.length ? (
        <EmptyState message="No suggestions submitted" />
      ) : (
        <div className="space-y-2">
          {paginated.map((s) => (
            <div key={s.id} className="bg-white border rounded-xl shadow-sm overflow-hidden">
              <button
                onClick={() => toggleExpand(s.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex-shrink-0">
                    {s.topic_name || `Topic #${s.topic_id}`}
                  </span>
                  <span className="text-sm font-medium text-gray-700 min-w-0 truncate">{s.user.name}</span>
                  <p className="text-sm text-gray-500 truncate max-w-xs">{s.body}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    s.status === 'replied' ? 'bg-green-50 text-green-700' :
                    s.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                    'bg-gray-50 text-gray-600'
                  }`}>
                    {s.status}
                  </span>
                  <span className="text-xs text-gray-400">{new Date(s.created_at).toLocaleDateString()}</span>
                  {expanded.has(s.id) ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </button>
              {expanded.has(s.id) && (
                <div className="px-5 pb-5 border-t border-gray-100">
                  <div className="py-4">
                    <p className="text-sm font-medium text-gray-500 mb-1">From: {s.user.name}</p>
                    <p className="text-gray-700 whitespace-pre-wrap">{s.body}</p>
                  </div>
                  {s.admin_reply && (
                    <div className="mb-4 pl-4 border-l-2 border-blue-200 bg-blue-50/50 rounded-r-lg p-3">
                      <div className="flex items-center gap-1 text-xs font-medium text-blue-700 mb-1">
                        <Reply className="h-3 w-3" />
                        Previous Reply
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{s.admin_reply.body}</p>
                    </div>
                  )}
                  <div className="space-y-3">
                    <textarea
                      rows={3}
                      placeholder="Write your reply..."
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y text-sm"
                      value={replyBodies[s.id] || ''}
                      onChange={(e) => setReplyBodies((prev) => ({ ...prev, [s.id]: e.target.value }))}
                    />
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={replyPublic[s.id] ?? false}
                          onChange={(e) => setReplyPublic((prev) => ({ ...prev, [s.id]: e.target.checked }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        Public reply
                      </label>
                      <button
                        onClick={() => handleReply(s.id)}
                        disabled={replying.has(s.id) || !replyBodies[s.id]?.trim()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
                      >
                        {replying.has(s.id) ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-white" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filtered.length} onPageChange={setCurrentPage} />
        </div>
      )}
    </div>
  )
}
