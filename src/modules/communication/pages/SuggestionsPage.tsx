import { useState, useEffect } from 'react'
import client from '@/api/client'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { EmptyState } from '@/shared/components/EmptyState'
import { Lightbulb, Send, Reply, MessageSquare } from 'lucide-react'

interface SuggestionTopic {
  id: number
  title: string
}

interface SuggestionReply {
  id: number
  body: string
  is_public_reply: boolean
  created_at: string
}

interface Suggestion {
  id: number
  topic_id: number
  topic_name?: string
  body: string
  status: string
  admin_reply: SuggestionReply | null
  created_at: string
}

export function SuggestionsPage() {
  const [topics, setTopics] = useState<SuggestionTopic[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [topicId, setTopicId] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [topicsRes, suggestionsRes] = await Promise.all([
        client.get('/suggestion-topics'),
        client.get('/suggestions'),
      ])
      setTopics(topicsRes.data)
      setSuggestions(suggestionsRes.data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topicId || !body.trim()) return
    setSubmitting(true)
    setError('')
    try {
      await client.post('/suggestions', { topic_id: Number(topicId), body })
      setBody('')
      setTopicId('')
      fetchData()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit suggestion')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingSpinner size="lg" />

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Lightbulb className="h-7 w-7 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Suggestions</h1>
      </div>

      <section className="bg-white border rounded-xl p-6 shadow-sm mb-10">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Send className="h-5 w-5 text-blue-500" />
          Submit a Suggestion
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
            <select
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
            >
              <option value="">Select a topic...</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Suggestion</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={4}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
              placeholder="Share your thoughts..."
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
          >
            {submitting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-white" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Submit
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-gray-500" />
          My Suggestions
        </h2>
        {!suggestions.length ? (
          <EmptyState message="No suggestions submitted yet" />
        ) : (
          <div className="space-y-3">
            {suggestions.map((s) => (
              <div key={s.id} className="bg-white border rounded-lg p-5 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      {s.topic_name || `Topic #${s.topic_id}`}
                    </span>
                    <span className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${
                      s.status === 'replied' ? 'bg-green-50 text-green-700' :
                      s.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                      'bg-gray-50 text-gray-600'
                    }`}>
                      {s.status}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(s.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{s.body}</p>
                {s.admin_reply && (
                  <div className="mt-3 pl-4 border-l-2 border-blue-200 bg-blue-50/50 rounded-r-lg p-3">
                    <div className="flex items-center gap-1 text-xs font-medium text-blue-700 mb-1">
                      <Reply className="h-3 w-3" />
                      Admin Reply
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{s.admin_reply.body}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
