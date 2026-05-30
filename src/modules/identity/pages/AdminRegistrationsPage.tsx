import { useState, useEffect } from 'react'
import client from '@/api/client'
import { useAuthStore } from '@/store/authStore'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { EmptyState } from '@/shared/components/EmptyState'
import { CheckCircle, XCircle, Eye, UserCheck } from 'lucide-react'

interface PendingUser {
  id: number
  name: string
  email: string
  phone: string
  status: string
  created_at: string
  profile?: {
    national_id?: string
    county?: string
    occupation?: string
    employer?: string
  }
  next_of_kin?: {
    full_name?: string
    relationship?: string
    phone?: string
  }
}

export function AdminRegistrationsPage() {
  const user = useAuthStore((s) => s.user)
  const canApprove = user && ['super_admin', 'chairperson'].includes(user.role)
  const [pending, setPending] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [rejectModal, setRejectModal] = useState<{ id: number; name: string } | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [viewUser, setViewUser] = useState<PendingUser | null>(null)
  const [notif, setNotif] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showNotif = (type: 'success' | 'error', message: string) => {
    setNotif({ type, message })
    setTimeout(() => setNotif(null), 4000)
  }

  const fetchPending = async () => {
    setLoading(true)
    try {
      const { data } = await client.get('/admin/registrations')
      setPending(data)
    } catch {
      showNotif('error', 'Failed to load pending registrations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPending() }, [])

  const handleApprove = async (userId: number) => {
    setActionLoading(userId)
    try {
      await client.post(`/admin/registrations/${userId}/approve`)
      showNotif('success', 'Registration approved successfully')
      fetchPending()
    } catch (err: any) {
      showNotif('error', err.response?.data?.detail || 'Failed to approve')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async () => {
    if (!rejectModal) return
    setActionLoading(rejectModal.id)
    try {
      await client.post(`/admin/registrations/${rejectModal.id}/reject`, {
        action: 'reject',
        reason: rejectReason,
      })
      showNotif('success', 'Registration rejected')
      setRejectModal(null)
      setRejectReason('')
      fetchPending()
    } catch (err: any) {
      showNotif('error', err.response?.data?.detail || 'Failed to reject')
    } finally {
      setActionLoading(null)
    }
  }

  if (!canApprove) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-gray-400">Access Denied</h2>
        <p className="text-gray-400 mt-1">Only Super Admin and Chairperson can approve registrations.</p>
      </div>
    )
  }

  if (loading) return <LoadingSpinner size="lg" />

  return (
    <div>
      {notif && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
          notif.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {notif.message}
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <UserCheck className="h-7 w-7 text-[#218078]" />
        <h1 className="text-2xl font-bold text-gray-900">Registration Approvals</h1>
        <span className="text-sm text-gray-400 ml-2">({pending.length} pending)</span>
      </div>

      {!pending.length ? (
        <EmptyState message="No pending registrations" />
      ) : (
        <div className="space-y-4">
          {pending.map((p) => (
            <div key={p.id} className="bg-white border rounded-xl p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{p.name}</h3>
                  <p className="text-sm text-gray-500">{p.email} · {p.phone}</p>
                  <p className="text-xs text-gray-400 mt-1">Registered {new Date(p.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewUser(p)}
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-1.5"
                  >
                    <Eye className="h-3.5 w-3.5" /> View
                  </button>
                  <button
                    onClick={() => handleApprove(p.id)}
                    disabled={actionLoading === p.id}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {actionLoading === p.id ? '...' : <CheckCircle className="h-3.5 w-3.5" />} Approve
                  </button>
                  <button
                    onClick={() => setRejectModal({ id: p.id, name: p.name })}
                    disabled={actionLoading === p.id}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Profile Modal */}
      {viewUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" onClick={() => setViewUser(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500" onClick={() => setViewUser(null)}>✕</button>
            <h3 className="text-lg font-bold text-gray-900 mb-4">{viewUser.name}</h3>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-gray-500">Email:</span><br/>{viewUser.email}</div>
                <div><span className="text-gray-500">Phone:</span><br/>{viewUser.phone}</div>
                <div><span className="text-gray-500">National ID:</span><br/>{viewUser.profile?.national_id || '-'}</div>
                <div><span className="text-gray-500">County:</span><br/>{viewUser.profile?.county || '-'}</div>
                <div><span className="text-gray-500">Occupation:</span><br/>{viewUser.profile?.occupation || '-'}</div>
                <div><span className="text-gray-500">Employer:</span><br/>{viewUser.profile?.employer || '-'}</div>
              </div>
              {viewUser.next_of_kin && (
                <div className="pt-3 border-t">
                  <p className="font-medium text-gray-700 mb-1">Next of Kin</p>
                  <p className="text-gray-600">{viewUser.next_of_kin.full_name} ({viewUser.next_of_kin.relationship}) · {viewUser.next_of_kin.phone}</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-end mt-6 pt-4 border-t">
              <button onClick={() => setViewUser(null)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" onClick={() => setRejectModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Reject Registration</h3>
            <p className="text-sm text-gray-500 mb-4">Provide a reason for rejecting <strong>{rejectModal.name}</strong>:</p>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-y"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
            />
            <div className="flex gap-3 justify-end mt-4">
              <button onClick={() => setRejectModal(null)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleReject} disabled={!rejectReason.trim() || actionLoading === rejectModal.id} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
                {actionLoading === rejectModal.id ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
