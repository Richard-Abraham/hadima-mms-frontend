import { useState } from 'react'
import { Link, useNavigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import {
  Menu, X, FileText, Wallet, Calendar, Megaphone, Lightbulb,
  Users, Settings, LogOut, LayoutDashboard, CreditCard, MessageSquare,
  BarChart3, ShieldCheck, UserCheck,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/profile', label: 'My Profile', icon: Users },
  { to: '/invoices', label: 'My Invoices', icon: FileText },
  { to: '/statement', label: 'Statement', icon: CreditCard },
  { to: '/contributions', label: 'Contributions', icon: Wallet },
  { to: '/events', label: 'Events', icon: Calendar },
  { to: '/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/suggestions', label: 'Suggestions', icon: Lightbulb },
]

interface AdminNavItem {
  to: string; label: string; icon: any; roles: string[]
}

const adminNavItems: AdminNavItem[] = [
  { to: '/admin/users', label: 'Admin Users', icon: Users, roles: ['super_admin'] },
  { to: '/admin/registrations', label: 'Pending Approvals', icon: UserCheck, roles: ['super_admin', 'chairperson'] },
  { to: '/admin/invoices', label: 'Admin Invoices', icon: FileText, roles: ['super_admin', 'treasurer', 'secretary', 'chairperson'] },
  { to: '/admin/payments', label: 'Admin Payments', icon: Wallet, roles: ['super_admin', 'treasurer'] },
  { to: '/admin/contributions', label: 'Admin Contributions', icon: CreditCard, roles: ['super_admin', 'treasurer', 'secretary', 'chairperson'] },
  { to: '/admin/events', label: 'Events Calendar', icon: Calendar, roles: ['super_admin', 'secretary'] },
  { to: '/admin/announcements', label: 'Admin Announcements', icon: Megaphone, roles: ['super_admin', 'secretary'] },
  { to: '/admin/suggestions', label: 'Admin Suggestions', icon: Lightbulb, roles: ['super_admin', 'secretary'] },
  { to: '/admin/sms', label: 'SMS Broadcast', icon: MessageSquare, roles: ['super_admin', 'secretary'] },
  { to: '/admin/reconciliation', label: 'Reconciliation', icon: ShieldCheck, roles: ['super_admin', 'treasurer'] },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3, roles: ['super_admin', 'treasurer', 'secretary', 'chairperson'] },
  { to: '/admin/settings', label: 'Settings', icon: Settings, roles: ['super_admin'] },
  { to: '/admin/audit-log', label: 'Audit Log', icon: BarChart3, roles: ['super_admin'] },
]

const adminRoles: string[] = ['super_admin', 'treasurer', 'secretary', 'chairperson']

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const navigate = useNavigate()

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  const isAdmin = user && adminRoles.includes(user.role)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <h1 className="text-lg font-bold text-gray-900">HADIMA Africa</h1>
          <button className="lg:hidden p-1 rounded-md hover:bg-gray-100" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
          {(user?.role === 'super_admin' ? [] : navItems).map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
          {isAdmin && (
            <>
              <div className="pt-4 pb-2">
                <p className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Admin</p>
              </div>
              {adminNavItems.filter((item) => user && item.roles.includes(user.role)).map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-1 rounded-md hover:bg-gray-100" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">HADIMA Africa MMS</h2>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <>
                <span className="text-sm text-gray-600 hidden sm:inline">{user.name}</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full capitalize">
                  {user.role.replace('_', ' ')}
                </span>
              </>
            )}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
