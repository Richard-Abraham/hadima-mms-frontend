import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import { useAuthStore } from '@/store/authStore'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { EmptyState } from '@/shared/components/EmptyState'
import { Pagination } from '@/shared/components/Pagination'
import { AlertCircle, Shield, Plus, X, Check, Download, Calendar } from 'lucide-react'

const statusColors: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  overdue: 'bg-red-100 text-red-700',
}

const ITEMS_PER_PAGE = 15

export function AdminInvoicesPage() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('all')
  const [type, setType] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ user_id: '', type: 'joining', amount: '', due_date: '', notes: '' })
  const [createError, setCreateError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [showBulkReconcile, setShowBulkReconcile] = useState(false)
  const [reconcileFromDate, setReconcileFromDate] = useState('')
  const [reconcileToDate, setReconcileToDate] = useState('')
  const [reconcileStatus, setReconcileStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [reconcileMessage, setReconcileMessage] = useState('')

  const isAdmin = user?.role === 'super_admin' || user?.role === 'treasurer'

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-invoices', status, type],
    queryFn: () =>
      client
        .get('/admin/invoices', { params: { status: status !== 'all' ? status : undefined, type: type !== 'all' ? type : undefined } })
        .then((r) => r.data),
    enabled: isAdmin,
  })

  const reconcileMutation = useMutation({
    mutationFn: (id: number) => client.post(`/invoices/${id}/reconcile`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-invoices'] }),
  })

  const createMutation = useMutation({
    mutationFn: () =>
      client.post('/admin/invoices', {
        user_id: Number(createForm.user_id),
        type: createForm.type,
        amount: Number(createForm.amount),
        due_date: createForm.due_date,
        notes: createForm.notes || undefined,
      }),
    onSuccess: () => {
      setShowCreate(false)
      setCreateForm({ user_id: '', type: 'joining', amount: '', due_date: '', notes: '' })
      setCreateError('')
      queryClient.invalidateQueries({ queryKey: ['admin-invoices'] })
    },
    onError: (err: any) => {
      setCreateError(err.response?.data?.detail || 'Failed to create invoice')
    },
  })

  const bulkReconcileMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map((id) => client.post(`/invoices/${id}/reconcile`)))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-invoices'] })
      setSelected(new Set())
    },
  })

  const dateBulkReconcileMutation = useMutation({
    mutationFn: (data: { from_date: string; to_date: string }) =>
      client.post('/invoices/bulk-reconcile', data),
    onSuccess: () => {
      setReconcileStatus('success')
      setReconcileMessage('Bulk reconciliation initiated successfully')
      queryClient.invalidateQueries({ queryKey: ['admin-invoices'] })
    },
    onError: (err: any) => {
      setReconcileStatus('error')
      setReconcileMessage(err.response?.data?.detail || 'Bulk reconciliation failed')
    },
  })

  const downloadCsvTemplate = async () => {
    const response = await client.get('/admin/invoices/recon-template', { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'reconciliation-template.csv')
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

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
        Failed to load invoices
      </div>
    )

  const invoices = data ?? []
  const totalPages = Math.ceil(invoices.length / ITEMS_PER_PAGE)
  const paginatedInvoices = invoices.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const toggleAll = () => {
    if (selected.size === paginatedInvoices.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(paginatedInvoices.map((i: any) => i.id)))
    }
  }

  const toggleOne = (id: number) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-gray-700" />
          <h1 className="text-xl font-bold text-gray-900">Admin Invoices</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={downloadCsvTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Download Reconciliation CSV
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Create Invoice
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <select
          className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setCurrentPage(1); setSelected(new Set()) }}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
        <select
          className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          value={type}
          onChange={(e) => { setType(e.target.value); setCurrentPage(1); setSelected(new Set()) }}
        >
          <option value="all">All Types</option>
          <option value="joining">Joining</option>
          <option value="monthly">Monthly</option>
          <option value="contribution">Contribution</option>
          <option value="levy">Levy</option>
          <option value="fine">Fine</option>
        </select>
        {selected.size > 0 && (
          <button
            onClick={() => {
              if (confirm(`Reconcile ${selected.size} selected invoices?`))
                bulkReconcileMutation.mutate([...selected])
            }}
            disabled={bulkReconcileMutation.isPending}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            Reconcile Selected ({selected.size})
          </button>
        )}
        <button
          onClick={() => { setShowBulkReconcile(true); setReconcileStatus('idle'); setReconcileMessage('') }}
          className="inline-flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
        >
          <Calendar className="h-4 w-4" />
          Bulk Reconcile
        </button>
      </div>

      {invoices.length === 0 ? (
        <EmptyState message="No invoices found" />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={paginatedInvoices.length > 0 && selected.size === paginatedInvoices.length}
                    onChange={toggleAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="text-left px-4 py-3 font-medium">Reference</th>
                <th className="text-left px-4 py-3 font-medium">User ID</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Amount</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Due Date</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedInvoices.map((inv: any) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(inv.id)}
                      onChange={() => toggleOne(inv.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{inv.reference}</td>
                  <td className="px-4 py-3">{inv.user_id}</td>
                  <td className="px-4 py-3 capitalize">{inv.type}</td>
                  <td className="px-4 py-3">KSh {Number(inv.amount).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[inv.status] || 'bg-gray-100 text-gray-600'}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{new Date(inv.due_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => reconcileMutation.mutate(inv.id)}
                      disabled={reconcileMutation.isPending}
                      className="text-blue-600 hover:underline text-xs disabled:opacity-50"
                    >
                      Reconcile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 pb-4">
            <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={invoices.length} onPageChange={setCurrentPage} />
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
            <button onClick={() => setShowCreate(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold mb-4">Create Invoice</h2>
            {createError && (
              <div className="mb-3 bg-red-50 text-red-600 text-sm p-3 rounded-lg">{createError}</div>
            )}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={createForm.user_id}
                  onChange={(e) => setCreateForm({ ...createForm, user_id: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={createForm.type}
                  onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
                >
                  <option value="joining">Joining</option>
                  <option value="monthly">Monthly</option>
                  <option value="contribution">Contribution</option>
                  <option value="levy">Levy</option>
                  <option value="fine">Fine</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KES)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={createForm.amount}
                  onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={createForm.due_date}
                  onChange={(e) => setCreateForm({ ...createForm, due_date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={2}
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                />
              </div>
              <button
                onClick={() => createMutation.mutate()}
                disabled={!createForm.user_id || !createForm.amount || !createForm.due_date || createMutation.isPending}
                className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showBulkReconcile && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
            <button onClick={() => setShowBulkReconcile(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold mb-4">Bulk Reconcile by Date Range</h2>
            {reconcileStatus === 'success' && (
              <div className="mb-3 bg-green-50 text-green-600 text-sm p-3 rounded-lg flex items-center gap-2">
                <Check className="h-4 w-4" />
                {reconcileMessage}
              </div>
            )}
            {reconcileStatus === 'error' && (
              <div className="mb-3 bg-red-50 text-red-600 text-sm p-3 rounded-lg">{reconcileMessage}</div>
            )}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={reconcileFromDate}
                  onChange={(e) => setReconcileFromDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={reconcileToDate}
                  onChange={(e) => setReconcileToDate(e.target.value)}
                />
              </div>
              <button
                onClick={() => {
                  if (!reconcileFromDate || !reconcileToDate) return
                  setReconcileStatus('loading')
                  dateBulkReconcileMutation.mutate({ from_date: reconcileFromDate, to_date: reconcileToDate })
                }}
                disabled={!reconcileFromDate || !reconcileToDate || reconcileStatus === 'loading'}
                className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {reconcileStatus === 'loading' ? 'Reconciling...' : 'Reconcile'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
