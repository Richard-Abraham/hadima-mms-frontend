import { useState, useEffect } from 'react'
import client from '@/api/client'
import { useAuthStore } from '@/store/authStore'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { EmptyState } from '@/shared/components/EmptyState'
import { Pagination } from '@/shared/components/Pagination'
import { Megaphone, Plus, Trash2, Edit3, AlertTriangle, Pin, CheckCircle, X, Search } from 'lucide-react'

interface Announcement {
  id: number
  title: string
  body: string
  is_urgent: boolean
  is_pinned: boolean
  published_at: string | null
  created_at: string
}

const ADMIN_ROLES = ['super_admin', 'secretary', 'chairperson']
const ITEMS_PER_PAGE = 15

export function AdminAnnouncementsPage() {
  const user = useAuthStore((s) => s.user)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', body: '', is_urgent: false, is_pinned: false, publish_now: true })
  const [submitting, setSubmitting] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const fetchAnnouncements = async () => {
    setLoading(true)
    try {
      const { data } = await client.get('/announcements')
      setAnnouncements(data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  if (!user || !ADMIN_ROLES.includes(user.role)) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <p className="text-red-500 font-medium">You do not have permission to access this page.</p>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editing) {
        await client.put(`/admin/announcements/${editing.id}`, form)
      } else {
        await client.post('/admin/announcements', form)
      }
      setShowForm(false)
      setEditing(null)
      setForm({ title: '', body: '', is_urgent: false, is_pinned: false, publish_now: true })
      fetchAnnouncements()
    } catch {
      // silent
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return
    try {
      await client.delete(`/admin/announcements/${id}`)
      setAnnouncements((prev) => prev.filter((a) => a.id !== id))
    } catch {
      // silent
    }
  }

  const startEdit = (a: Announcement) => {
    setEditing(a)
    setForm({ title: a.title, body: a.body, is_urgent: a.is_urgent, is_pinned: a.is_pinned, publish_now: !!a.published_at })
    setShowForm(true)
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} selected announcements?`)) return
    try {
      await Promise.all([...selected].map((id) => client.delete(`/admin/announcements/${id}`)))
      setAnnouncements((prev) => prev.filter((a) => !selected.has(a.id)))
      setSelected(new Set())
    } catch {
      // silent
    }
  }

  if (loading) return <LoadingSpinner size="lg" />

  const filtered = announcements.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const toggleAll = () => {
    if (selected.size === paginated.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(paginated.map((a) => a.id)))
    }
  }

  const toggleOne = (id: number) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Megaphone className="h-7 w-7 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Manage Announcements</h1>
        </div>
        <button
          onClick={() => {
            setEditing(null)
            setForm({ title: '', body: '', is_urgent: false, is_pinned: false, publish_now: true })
            setShowForm(true)
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          New Announcement
        </button>
      </div>

      {showForm && (
        <div className="bg-white border rounded-xl p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {editing ? 'Edit Announcement' : 'Create Announcement'}
            </h2>
            <button onClick={() => { setShowForm(false); setEditing(null) }} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text" required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
              <textarea
                required rows={5}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
                value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}
              />
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.is_urgent}
                  onChange={(e) => setForm({ ...form, is_urgent: e.target.checked })}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                Urgent
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.is_pinned}
                  onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })}
                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                Pinned
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.publish_now}
                  onChange={(e) => setForm({ ...form, publish_now: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Publish now
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditing(null) }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
              >
                {submitting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-white" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {editing ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title..."
            className="pl-8 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); setSelected(new Set()) }}
          />
        </div>
        {selected.size > 0 && (
          <button
            onClick={handleBulkDelete}
            className="inline-flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4" />
            Delete ({selected.size})
          </button>
        )}
      </div>

      {!filtered.length ? (
        <EmptyState message="No announcements" />
      ) : (
        <div className="overflow-x-auto bg-white border rounded-xl shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-gray-600">
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={paginated.length > 0 && selected.size === paginated.length}
                    onChange={toggleAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium text-center">Urgent</th>
                <th className="px-4 py-3 font-medium text-center">Pinned</th>
                <th className="px-4 py-3 font-medium text-center">Published</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((a) => (
                <tr key={a.id} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(a.id)}
                      onChange={() => toggleOne(a.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{a.title}</td>
                  <td className="px-4 py-3 text-center">
                    {a.is_urgent ? (
                      <AlertTriangle className="h-4 w-4 text-red-500 mx-auto" />
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {a.is_pinned ? (
                      <Pin className="h-4 w-4 text-amber-500 mx-auto" />
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {a.published_at ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                    ) : (
                      <X className="h-4 w-4 text-gray-300 mx-auto" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{new Date(a.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => startEdit(a)} className="text-blue-500 hover:text-blue-700 p-1" title="Edit">
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(a.id)} className="text-red-500 hover:text-red-700 p-1" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 pb-4">
            <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filtered.length} onPageChange={setCurrentPage} />
          </div>
        </div>
      )}
    </div>
  )
}
