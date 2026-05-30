import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import client from '@/api/client'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { EmptyState } from '@/shared/components/EmptyState'
import { Pagination } from '@/shared/components/Pagination'
import { Shield, Search } from 'lucide-react'

const ITEMS_PER_PAGE = 20

const logIcons: Record<string, string> = {
  user: '👤', invoice: '💰', payment: '💳',
  contribution: '📊', event: '📅', auth: '🔐',
  registration: '📝', default: '📋',
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export function AuditLogPage() {
  const [logFilter, setLogFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const { data: logs = [], isLoading } = useQuery<any[]>({
    queryKey: ['audit-log'],
    queryFn: async () => {
      const { data } = await client.get('/admin/reports/audit')
      return data
    },
  })

  const filtered = logs.filter((l) => {
    if (logFilter !== 'all' && l.log_name !== logFilter) return false
    if (search && !l.description?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-7 w-7 text-gray-600" />
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#218078] outline-none"
          value={logFilter}
          onChange={(e) => { setLogFilter(e.target.value); setCurrentPage(1) }}
        >
          <option value="all">All Events</option>
          <option value="user">User</option>
          <option value="invoice">Invoice</option>
          <option value="payment">Payment</option>
          <option value="contribution">Contribution</option>
          <option value="event">Event</option>
          <option value="auth">Auth</option>
          <option value="registration">Registration</option>
        </select>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search descriptions..."
            className="pl-8 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#218078] outline-none w-64"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
          />
        </div>
        <span className="text-sm text-gray-400">{filtered.length} entries</span>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : !paginated.length ? (
        <EmptyState message="No audit log entries" />
      ) : (
        <div className="bg-white rounded-xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Causer</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginated.map((log: any) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{timeAgo(log.created_at)}</td>
                  <td className="px-4 py-3">
                    <span className="text-lg leading-none">{logIcons[log.log_name] || logIcons.default}</span>
                    <span className="ml-1.5 text-xs font-medium text-gray-500 capitalize">{log.log_name || 'other'}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 max-w-md truncate">{log.description}</td>
                  <td className="px-4 py-3 text-gray-500">{log.causer_id ? `User #${log.causer_id}` : 'System'}</td>
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
