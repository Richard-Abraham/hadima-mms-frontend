import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { EmptyState } from '@/shared/components/EmptyState'
import { Wallet, Loader2 } from 'lucide-react'
import type { Contribution } from '@/types'

interface ContributionPayment {
  id: number
  contribution_id: number
  contribution_title: string
  amount: number
  channel: string
  transaction_code: string
  status: string
  paid_at: string
}

export function ContributionsPage() {
  const [selectedDrive, setSelectedDrive] = useState<Contribution | null>(null)
  const [amount, setAmount] = useState('')
  const [channel, setChannel] = useState('mpesa')
  const [transactionCode, setTransactionCode] = useState('')
  const queryClient = useQueryClient()

  const { data: drives, isLoading } = useQuery<Contribution[]>({
    queryKey: ['contributions'],
    queryFn: async () => {
      const { data } = await client.get('/contributions')
      return data
    },
  })

  const { data: myPayments } = useQuery<ContributionPayment[]>({
    queryKey: ['my-contribution-payments'],
    queryFn: async () => {
      const { data } = await client.get('/contributions/my-payments')
      return data
    },
  })

  const payMutation = useMutation({
    mutationFn: async (driveId: number) => {
      await client.post(`/contributions/${driveId}/pay`, {
        amount: parseFloat(amount),
        channel,
        transaction_code: transactionCode,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributions'] })
      queryClient.invalidateQueries({ queryKey: ['my-contribution-payments'] })
      setSelectedDrive(null)
      setAmount('')
      setChannel('mpesa')
      setTransactionCode('')
    },
  })

  const progressPercent = (collected: number, target: number) =>
    target > 0 ? Math.min(Math.round((collected / target) * 100), 100) : 0

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Contributions</h1>

      {isLoading ? (
        <LoadingSpinner />
      ) : !drives?.length ? (
        <EmptyState message="No contribution drives available" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {drives.map((drive) => (
            <div key={drive.id} className="bg-white rounded-xl border p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{drive.title}</h3>
                  <p className="text-xs text-gray-500 capitalize">{drive.type}</p>
                </div>
                <Wallet className="h-5 w-5 text-blue-600" />
              </div>
              {drive.description && (
                <p className="text-sm text-gray-600">{drive.description}</p>
              )}
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>KES {drive.member_amount?.toLocaleString() ?? 0} / member</span>
                  <span>Target: KES {drive.target_amount?.toLocaleString() ?? 0}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${progressPercent(drive.member_amount, drive.target_amount)}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Deadline: {new Date(drive.deadline).toLocaleDateString()}
                </span>
                <button
                  onClick={() => setSelectedDrive(drive)}
                  className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
                >
                  Contribute
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contribute Modal */}
      {selectedDrive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setSelectedDrive(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contribute to {selectedDrive.title}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KES)</label>
                <input
                  type="number" required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={amount} onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={channel} onChange={(e) => setChannel(e.target.value)}
                >
                  <option value="mpesa">M-Pesa</option>
                  <option value="kcb">KCB</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Code</label>
                <input
                  type="text" required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={transactionCode} onChange={(e) => setTransactionCode(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setSelectedDrive(null)}
                  className="flex-1 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => payMutation.mutate(selectedDrive.id)}
                  disabled={!amount || !transactionCode || payMutation.isPending}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {payMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Pay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* My payments */}
      <div className="bg-white rounded-xl border">
        <div className="px-4 py-3 border-b">
          <h2 className="font-semibold text-gray-900">My Contributions</h2>
        </div>
        {!myPayments?.length ? (
          <div className="p-4">
            <EmptyState message="No contributions yet" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Drive</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Channel</th>
                  <th className="px-4 py-3 font-medium">Transaction Code</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {myPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.contribution_title}</td>
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
          </div>
        )}
      </div>
    </div>
  )
}
