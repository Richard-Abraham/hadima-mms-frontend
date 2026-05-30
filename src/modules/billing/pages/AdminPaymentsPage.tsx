import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import { useAuthStore } from '@/store/authStore'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { EmptyState } from '@/shared/components/EmptyState'
import { Pagination } from '@/shared/components/Pagination'
import { AlertCircle, Shield, Check, X, Search } from 'lucide-react'

const statusColors: Record<string, string> = {
  approved: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
}

const ITEMS_PER_PAGE = 15

export function AdminPaymentsPage() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const isAdmin = user?.role === 'super_admin' || user?.role === 'treasurer'
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: () => client.get('/admin/payments').then((r) => r.data),
    enabled: isAdmin,
  })

  const actionMutation = useMutation({
    mutationFn: ({ id, action }: { id: number; action: string }) =>
      client.put(`/admin/payments/${id}`, { action }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-payments'] }),
  })

  const bulkActionMutation = useMutation({
    mutationFn: async ({ ids, action }: { ids: number[]; action: string }) => {
      await Promise.all(ids.map((id) => client.put(`/admin/payments/${id}`, { action })))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] })
      setSelected(new Set())
    },
  })

  if (!isAdmin)
    return (
      <div className="flex items-center justify-center gap-2 p-8 text-red-600">
        <Shield className="h-5 w-5" />
        Access denied
      </div>
    )

  if (isLoading) return <LoadingSpinner size="lg" />
  if (error)
    return (
      <div className="flex items-center justify-center gap-2 p-8 text-red-600">
        <AlertCircle className="h-5 w-5" />
        Failed to load payments
      </div>
    )

  const payments = data ?? []

  const filtered = payments.filter((pmt: any) => {
    if (statusFilter !== 'all' && pmt.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!pmt.transaction_code?.toLowerCase().includes(q) && !pmt.invoice_reference?.toLowerCase().includes(q)) return false
    }
    return true
  })

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginatedPayments = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const toggleAll = () => {
    if (selected.size === paginatedPayments.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(paginatedPayments.map((p: any) => p.id)))
    }
  }

  const toggleOne = (id: number) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  const handleBulkAction = (action: string) => {
    if (confirm(`${action === 'approve' ? 'Approve' : 'Reject'} ${selected.size} selected payments?`))
      bulkActionMutation.mutate({ ids: [...selected], action })
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-6 w-6 text-gray-700" />
        <h1 className="text-xl font-bold text-gray-900">Admin Payments</h1>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); setSelected(new Set()) }}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by transaction code..."
            className="pl-8 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); setSelected(new Set()) }}
          />
        </div>
        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkAction('approve')}
              disabled={bulkActionMutation.isPending}
              className="inline-flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              Approve ({selected.size})
            </button>
            <button
              onClick={() => handleBulkAction('reject')}
              disabled={bulkActionMutation.isPending}
              className="inline-flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
              Reject ({selected.size})
            </button>
          </div>
        )}
      </div>

      {payments.length === 0 ? (
        <EmptyState message="No payments found" />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={paginatedPayments.length > 0 && selected.size === paginatedPayments.length}
                    onChange={toggleAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="text-left px-4 py-3 font-medium">Transaction Code</th>
                <th className="text-left px-4 py-3 font-medium">Channel</th>
                <th className="text-left px-4 py-3 font-medium">Amount</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Submitted</th>
                <th className="text-left px-4 py-3 font-medium">Invoice Ref</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedPayments.map((pmt: any) => (
                <tr key={pmt.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(pmt.id)}
                      onChange={() => toggleOne(pmt.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{pmt.transaction_code}</td>
                  <td className="px-4 py-3 uppercase text-xs">{pmt.channel}</td>
                  <td className="px-4 py-3">KSh {Number(pmt.amount || 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[pmt.status] || 'bg-gray-100 text-gray-600'}`}>
                      {pmt.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {new Date(pmt.submitted_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{pmt.invoice_reference || '-'}</td>
                  <td className="px-4 py-3">
                    {pmt.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => actionMutation.mutate({ id: pmt.id, action: 'approve' })}
                          disabled={actionMutation.isPending}
                          className="inline-flex items-center gap-1 text-green-600 hover:underline text-xs disabled:opacity-50"
                        >
                          <Check className="h-3 w-3" />
                          Approve
                        </button>
                        <button
                          onClick={() => actionMutation.mutate({ id: pmt.id, action: 'reject' })}
                          disabled={actionMutation.isPending}
                          className="inline-flex items-center gap-1 text-red-600 hover:underline text-xs disabled:opacity-50"
                        >
                          <X className="h-3 w-3" />
                          Reject
                        </button>
                      </div>
                    )}
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
