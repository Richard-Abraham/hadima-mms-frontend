import { useState, useEffect } from 'react'
import client from '@/api/client'
import { useAuthStore } from '@/store/authStore'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { EmptyState } from '@/shared/components/EmptyState'
import { Pagination } from '@/shared/components/Pagination'
import { MessageSquare, Send, Phone, CheckCircle, XCircle, Clock } from 'lucide-react'

interface SmsLog {
  id: number
  phone: string
  message: string
  status: string
  created_at: string
}

const ADMIN_ROLES = ['super_admin', 'secretary', 'chairperson']
const MAX_SMS_LENGTH = 480
const ITEMS_PER_PAGE = 15

export function AdminSmsPage() {
  const user = useAuthStore((s) => s.user)
  const [audience, setAudience] = useState('all')
  const [message, setMessage] = useState('')
  const [logs, setLogs] = useState<SmsLog[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [sendSuccess, setSendSuccess] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const { data } = await client.get('/admin/sms/logs')
      setLogs(data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  if (!user || !ADMIN_ROLES.includes(user.role)) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <p className="text-red-500 font-medium">You do not have permission to access this page.</p>
      </div>
    )
  }

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || message.length > MAX_SMS_LENGTH) return
    setSending(true)
    setSendError('')
    setSendSuccess('')
    try {
      await client.post('/admin/sms/broadcast', { audience, message })
      setSendSuccess(`SMS broadcast sent to "${audience}" audience`)
      setMessage('')
      fetchLogs()
    } catch (err: any) {
      setSendError(err.response?.data?.detail || 'Failed to send broadcast')
    } finally {
      setSending(false)
    }
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  if (loading) return <LoadingSpinner size="lg" />

  const filtered = logs.filter((log) => {
    if (statusFilter !== 'all' && log.status !== statusFilter) return false
    if (dateFrom && new Date(log.created_at) < new Date(dateFrom)) return false
    if (dateTo) {
      const end = new Date(dateTo)
      end.setHours(23, 59, 59, 999)
      if (new Date(log.created_at) > end) return false
    }
    return true
  })

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <MessageSquare className="h-7 w-7 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">SMS Broadcast</h1>
      </div>

      <section className="bg-white border rounded-xl p-6 shadow-sm mb-10">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Send className="h-5 w-5 text-blue-500" />
          Send Broadcast
        </h2>
        <form onSubmit={handleBroadcast} className="space-y-4">
          {sendError && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{sendError}</div>
          )}
          {sendSuccess && (
            <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg">{sendSuccess}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
            >
              <option value="all">All Members</option>
              <option value="active">Active Members</option>
              <option value="pending_invoice">Pending Invoice</option>
              <option value="inactive">Inactive Members</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
              placeholder="Type your SMS message..."
            />
            <p className={`text-xs mt-1 text-right ${
              message.length > MAX_SMS_LENGTH ? 'text-red-500 font-medium' : 'text-gray-400'
            }`}>
              {message.length}/{MAX_SMS_LENGTH}
            </p>
          </div>
          <button
            type="submit"
            disabled={sending || !message.trim() || message.length > MAX_SMS_LENGTH}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
          >
            {sending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-white" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send Broadcast
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Phone className="h-5 w-5 text-gray-500" />
          SMS Logs
        </h2>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <select
            className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }}
          >
            <option value="all">All Status</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">From:</label>
            <input
              type="date"
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1) }}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">To:</label>
            <input
              type="date"
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1) }}
            />
          </div>
        </div>
        {!filtered.length ? (
          <EmptyState message="No SMS logs yet" />
        ) : (
          <div className="overflow-x-auto bg-white border rounded-xl shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-gray-600">
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Message</th>
                  <th className="px-4 py-3 font-medium text-center">Status</th>
                  <th className="px-4 py-3 font-medium">Sent Date</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((log) => (
                  <tr key={log.id} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{log.phone}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{log.message}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1">
                        {statusIcon(log.status)}
                        <span className="text-xs capitalize">{log.status}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
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
      </section>
    </div>
  )
}
