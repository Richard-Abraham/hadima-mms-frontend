import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import client from '@/api/client'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { Users, FileText, Wallet, UserCheck, ArrowRight } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'

interface DashboardStats {
  total_members: number
  active_members: number
  pending_invoices: number
  monthly_collection: number
}

interface MemberStats {
  my_pending_invoices: number
  monthly_collection: number
  my_reconciled_amount: number
  my_reconciled_count: number
  pinned_announcements: {id: number; title: string; body: string; is_urgent: boolean}[]
  upcoming_events: {id: number; title: string; event_date: string; location: string}[]
}

const quickLinks = [
  { to: '/invoices', label: 'My Invoices', icon: FileText, color: 'text-blue-600 bg-blue-50' },
  { to: '/statement', label: 'Statement', icon: Wallet, color: 'text-green-600 bg-green-50' },
  { to: '/contributions', label: 'Contributions', icon: Users, color: 'text-purple-600 bg-purple-50' },
  { to: '/events', label: 'Events', icon: UserCheck, color: 'text-orange-600 bg-orange-50' },
]

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const isMember = user?.role === 'member'

  if (user && isMember && ['pending_payment', 'payment_verified'].includes(user.status)) {
    return <Navigate to="/registration" replace />
  }

  const { data: adminStats, isLoading: adminLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await client.get('/dashboard')
      return data
    },
    enabled: !isMember,
  })

  const { data: memberStats, isLoading: memberLoading } = useQuery<MemberStats>({
    queryKey: ['member-dashboard'],
    queryFn: async () => {
      const { data } = await client.get('/dashboard/member')
      return data
    },
    enabled: isMember,
  })

  const isLoading = isMember ? memberLoading : adminLoading

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-[#14564f] to-[#218078] rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back, {user?.name || 'Member'}</h1>
        <p className="text-teal-100 mt-1">Here's what's happening with your account today.</p>
      </div>

      {user?.status === 'pending_approval' && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-sm">
          Your registration has been submitted for review. You will be notified once an admin approves your account.
        </div>
      )}

      {/* Stats cards */}
      {isLoading ? (
        <LoadingSpinner />
      ) : isMember ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <FileText className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">My Pending Invoices</p>
                <p className="text-xl font-bold text-gray-900">{memberStats?.my_pending_invoices ?? 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Wallet className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">My Reconciled Payments</p>
                <p className="text-xl font-bold text-gray-900">{memberStats?.my_reconciled_count ?? 0}</p>
                <p className="text-xs text-gray-400">KES {memberStats?.my_reconciled_amount?.toLocaleString() ?? 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Wallet className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Monthly Collection</p>
                <p className="text-xl font-bold text-gray-900">
                  KES {memberStats?.monthly_collection?.toLocaleString() ?? 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Members</p>
                <p className="text-xl font-bold text-gray-900">{adminStats?.total_members ?? 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Active Members</p>
                <p className="text-xl font-bold text-gray-900">{adminStats?.active_members ?? 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <FileText className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Pending Invoices</p>
                <p className="text-xl font-bold text-gray-900">{adminStats?.pending_invoices ?? 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Wallet className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Monthly Collection</p>
                <p className="text-xl font-bold text-gray-900">
                  KES {adminStats?.monthly_collection?.toLocaleString() ?? 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Member dashboard extras */}
      {isMember && memberStats && (memberStats.pinned_announcements?.length > 0 || memberStats.upcoming_events?.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {memberStats.pinned_announcements?.length > 0 && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">📌 Pinned Announcements</h3>
              <div className="space-y-3">
                {memberStats.pinned_announcements.map((a) => (
                  <div key={a.id} className={`p-3 rounded-lg ${a.is_urgent ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
                    <p className="text-sm font-medium text-gray-900">{a.title}</p>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{a.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {memberStats.upcoming_events?.length > 0 && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">📅 Upcoming Events</h3>
              <div className="space-y-2">
                {memberStats.upcoming_events.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 text-sm">
                    <span className="text-xs font-medium text-[#218078] bg-teal-50 px-2 py-1 rounded">
                      {new Date(e.event_date).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-gray-700 flex-1 truncate">{e.title}</span>
                    {e.location && <span className="text-xs text-gray-400 truncate max-w-[100px]">{e.location}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick links */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Links</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="bg-white rounded-xl border p-4 flex items-center justify-between hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${link.color}`}>
                  <link.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-gray-700">{link.label}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </Link>
          ))}
        </div>
      </div>


    </div>
  )
}
