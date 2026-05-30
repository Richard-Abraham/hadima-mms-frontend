import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { EmptyState } from '@/shared/components/EmptyState'
import { Pagination } from '@/shared/components/Pagination'
import { Plus, Loader2, Eye } from 'lucide-react'
import type { Contribution } from '@/types'

interface ContributionPayment {
  id: number
  user_id: number
  user_name: string
  amount: number
  channel: string
  transaction_code: string
  status: string
  paid_at: string
}

const ITEMS_PER_PAGE = 15

export function AdminContributionsPage() {
  const [showForm, setShowForm] = useState(false)
  const [viewDriveId, setViewDriveId] = useState<number | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('general')
  const [targetAmount, setTargetAmount] = useState('')
  const [memberAmount, setMemberAmount] = useState('')
  const [deadline, setDeadline] = useState('')
  const [visibility, setVisibility] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [paymentsPage, setPaymentsPage] = useState(1)
  const queryClient = useQueryClient()

  const { data: drives, isLoading } = useQuery<Contribution[]>({
    queryKey: ['admin-contributions'],
    queryFn: async () => {
      const { data } = await client.get('/admin/contributions')
      return data
    },
  })

  const { data: payments } = useQuery<ContributionPayment[]>({
    queryKey: ['admin-contribution-payments', viewDriveId],
    queryFn: async () => {
      const { data } = await client.get(`/admin/contributions/${viewDriveId}/payments`)
      return data
    },
    enabled: !!viewDriveId,
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      await client.post('/admin/contributions', {
        title,
        description,
        type,
        target_amount: parseFloat(targetAmount),
        member_amount: parseFloat(memberAmount),
        deadline,
        visibility,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contributions'] })
      resetForm()
    },
  })

  const resetForm = () => {
    setShowForm(false)
    setTitle('')
    setDescription('')
    setType('general')
    setTargetAmount('')
    setMemberAmount('')
    setDeadline('')
    setVisibility('all')
  }

  if (viewDriveId) {
    const totalPaymentsPages = Math.ceil((payments?.length || 0) / ITEMS_PER_PAGE)
    const paginatedPayments = (payments || []).slice((paymentsPage - 1) * ITEMS_PER_PAGE, paymentsPage * ITEMS_PER_PAGE)

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setViewDriveId(null)} className="text-sm text-blue-600 hover:underline">&larr; Back</button>
          <h2 className="text-lg font-semibold text-gray-900">Payments</h2>
        </div>
        {!payments?.length ? (
          <EmptyState message="No payments for this drive" />
        ) : (
          <div className="bg-white rounded-xl border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Channel</th>
                  <th className="px-4 py-3 font-medium">Transaction Code</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.user_name}</td>
                    <td className="px-4 py-3">KES {p.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 capitalize">{p.channel}</td>
                    <td className="px-4 py-3 text-gray-500">{p.transaction_code}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                        p.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(p.paid_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 pb-4">
              <Pagination currentPage={paymentsPage} totalPages={totalPaymentsPages} totalItems={payments.length} onPageChange={setPaymentsPage} />
            </div>
          </div>
        )}
      </div>
    )
  }

  const totalPages = Math.ceil((drives?.length || 0) / ITEMS_PER_PAGE)
  const paginatedDrives = (drives || []).slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Admin Contributions</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Create Drive
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : !drives?.length ? (
        <EmptyState message="No contribution drives" />
      ) : (
        <div className="bg-white rounded-xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Target</th>
                <th className="px-4 py-3 font-medium">Collected %</th>
                <th className="px-4 py-3 font-medium">Deadline</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedDrives.map((drive) => (
                <tr key={drive.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{drive.title}</td>
                  <td className="px-4 py-3 capitalize">{drive.type}</td>
                  <td className="px-4 py-3">KES {drive.target_amount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-100 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{
                          width: `${drive.target_amount > 0 ? Math.min(Math.round((drive.member_amount / drive.target_amount) * 100), 100) : 0}%`
                        }} />
                      </div>
                      <span className="text-xs text-gray-500">
                        {drive.target_amount > 0 ? Math.round((drive.member_amount / drive.target_amount) * 100) : 0}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(drive.deadline).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                      drive.status === 'active' ? 'bg-green-100 text-green-700' :
                      drive.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{drive.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setViewDriveId(drive.id)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                      title="View payments"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 pb-4">
            <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={drives.length} onPageChange={setCurrentPage} />
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={resetForm}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Contribution Drive</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text" required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={title} onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={type} onChange={(e) => setType(e.target.value)}
                  >
                    <option value="general">General</option>
                    <option value="project">Project</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={visibility} onChange={(e) => setVisibility(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="members">Members Only</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount (KES)</label>
                  <input
                    type="number" required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Per Member (KES)</label>
                  <input
                    type="number" required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={memberAmount} onChange={(e) => setMemberAmount(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                <input
                  type="date" required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={deadline} onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={resetForm} className="flex-1 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={() => createMutation.mutate()}
                  disabled={!title || !targetAmount || !deadline || createMutation.isPending}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
