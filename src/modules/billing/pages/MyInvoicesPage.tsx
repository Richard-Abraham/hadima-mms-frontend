import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import client from '@/api/client'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { EmptyState } from '@/shared/components/EmptyState'
import { AlertCircle, FileText } from 'lucide-react'

const statusColors: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  overdue: 'bg-red-100 text-red-700',
}

export function MyInvoicesPage() {
  const [status, setStatus] = useState('all')
  const [type, setType] = useState('all')

  const { data, isLoading, error } = useQuery({
    queryKey: ['invoices', status, type],
    queryFn: () =>
      client
        .get('/invoices', { params: { status: status !== 'all' ? status : undefined, type: type !== 'all' ? type : undefined } })
        .then((r) => r.data),
  })

  if (isLoading) return <LoadingSpinner size="lg" />
  if (error)
    return (
      <div className="flex items-center justify-center gap-2 p-8 text-red-600">
        <AlertCircle className="h-5 w-5" />
        Failed to load invoices
      </div>
    )

  const invoices = data ?? []

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="h-6 w-6 text-gray-700" />
        <h1 className="text-xl font-bold text-gray-900">My Invoices</h1>
      </div>

      <div className="flex gap-4 mb-4">
        <select
          className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
        <select
          className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="joining">Joining</option>
          <option value="monthly">Monthly</option>
          <option value="contribution">Contribution</option>
        </select>
      </div>

      {invoices.length === 0 ? (
        <EmptyState message="No invoices found" />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Reference</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Amount</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Due Date</th>
                <th className="text-left px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoices.map((inv: any) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{inv.reference}</td>
                  <td className="px-4 py-3 capitalize">{inv.type}</td>
                  <td className="px-4 py-3">KSh {Number(inv.amount).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[inv.status] || 'bg-gray-100 text-gray-600'}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{new Date(inv.due_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <Link to={`/invoices/${inv.reference}`} className="text-blue-600 hover:underline text-xs">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
