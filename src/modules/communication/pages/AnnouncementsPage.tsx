import { useState, useEffect } from 'react'
import client from '@/api/client'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { EmptyState } from '@/shared/components/EmptyState'
import { Megaphone, Pin, AlertTriangle, ChevronDown, ChevronUp, Calendar } from 'lucide-react'

interface Announcement {
  id: number
  title: string
  body: string
  is_urgent: boolean
  is_pinned: boolean
  published_at: string | null
  created_at: string
}

export function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  useEffect(() => {
    client.get('/announcements')
      .then(({ data }) => setAnnouncements(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const pinned = announcements.find((a) => a.is_pinned || a.is_urgent)

  if (loading) return <LoadingSpinner size="lg" />
  if (!announcements.length) return <EmptyState message="No announcements yet" />

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Megaphone className="h-7 w-7 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
      </div>

      {pinned && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              {pinned.is_urgent ? (
                <AlertTriangle className="h-6 w-6 text-red-500" />
              ) : (
                <Pin className="h-6 w-6 text-amber-500" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-semibold text-gray-900">{pinned.title}</h2>
                {pinned.is_urgent && (
                  <span className="text-xs font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                    URGENT
                  </span>
                )}
                {pinned.is_pinned && !pinned.is_urgent && (
                  <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    Pinned
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 flex items-center gap-1 mb-3">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(pinned.created_at).toLocaleDateString()}
              </p>
              <p className="text-gray-700 whitespace-pre-wrap">{pinned.body}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {announcements
          .filter((a) => a.id !== pinned?.id)
          .map((a) => (
            <div key={a.id} className="border rounded-lg bg-white shadow-sm overflow-hidden">
              <button
                onClick={() => toggleExpand(a.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {a.is_urgent && <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />}
                  {a.is_pinned && !a.is_urgent && <Pin className="h-4 w-4 text-amber-500 flex-shrink-0" />}
                  <div className="min-w-0">
                    <span className="font-medium text-gray-900 block truncate">{a.title}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(a.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {expanded.has(a.id) ? (
                  <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                )}
              </button>
              {expanded.has(a.id) && (
                <div className="px-5 pb-4 pt-0 border-t border-gray-100">
                  <p className="text-gray-700 whitespace-pre-wrap text-sm">{a.body}</p>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  )
}
