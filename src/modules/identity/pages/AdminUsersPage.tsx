import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import { useAuthStore } from '@/store/authStore'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { EmptyState } from '@/shared/components/EmptyState'
import { AlertCircle, Shield, Plus, X, Search, LogIn, Pencil, ChevronLeft, ChevronRight } from 'lucide-react'
import type { User } from '@/types'

const roleColors: Record<string, string> = {
  super_admin: 'bg-red-100 text-red-700',
  treasurer: 'bg-blue-100 text-blue-700',
  secretary: 'bg-purple-100 text-purple-700',
  chairperson: 'bg-amber-100 text-amber-700',
  member: 'bg-gray-100 text-gray-600',
}

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  treasurer: 'Treasurer',
  secretary: 'Secretary',
  chairperson: 'Chairperson',
  member: 'Member',
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  suspended: 'bg-red-100 text-red-700',
  pending: 'bg-yellow-100 text-yellow-700',
  inactive: 'bg-gray-100 text-gray-600',
}

const roleOptions = [
  { value: 'member', label: 'Member' },
  { value: 'treasurer', label: 'Treasurer' },
  { value: 'secretary', label: 'Secretary' },
  { value: 'chairperson', label: 'Chairperson' },
  { value: 'super_admin', label: 'Super Admin' },
]

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'pending', label: 'Pending' },
  { value: 'inactive', label: 'Inactive' },
]

const PER_PAGE = 15

export function AdminUsersPage() {
  const currentUser = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()

  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [impersonateError, setImpersonateError] = useState('')

  const [createForm, setCreateForm] = useState({ name: '', email: '', phone: '', password: '', role: 'member', status: 'active' })
  const [createError, setCreateError] = useState('')

  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', role: '', status: '', member_number: '' })
  const [editError, setEditError] = useState('')

  const isAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'treasurer' || currentUser?.role === 'secretary' || currentUser?.role === 'chairperson'
  const isSuperAdmin = currentUser?.role === 'super_admin'

  useEffect(() => {
    setPage(1)
  }, [roleFilter, statusFilter, searchQuery])

  const { data, isLoading, error } = useQuery<User[]>({
    queryKey: ['admin-users'],
    queryFn: () => client.get('/admin/users').then((r) => r.data),
    enabled: isAdmin,
  })

  const createMutation = useMutation({
    mutationFn: () => client.post('/admin/users', createForm),
    onSuccess: () => {
      setShowCreate(false)
      setCreateForm({ name: '', email: '', phone: '', password: '', role: 'member', status: 'active' })
      setCreateError('')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (err: any) => {
      setCreateError(err.response?.data?.detail || 'Failed to create user')
    },
  })

  const updateMutation = useMutation({
    mutationFn: () => client.put(`/admin/users/${editUser!.id}`, editForm),
    onSuccess: () => {
      setEditUser(null)
      setEditError('')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (err: any) => {
      setEditError(err.response?.data?.detail || 'Failed to update user')
    },
  })

  const impersonateMutation = useMutation({
    mutationFn: (id: number) => client.post(`/admin/impersonate/${id}`).then((r) => r.data),
    onSuccess: (data) => {
      localStorage.setItem('token', data.access_token)
      window.location.href = '/dashboard'
    },
    onError: (err: any) => {
      setImpersonateError(err.response?.data?.detail || 'Failed to impersonate user')
    },
  })

  const filteredUsers = useMemo(() => {
    if (!data) return []
    let users = data
    if (roleFilter !== 'all') {
      users = users.filter((u) => u.role === roleFilter)
    }
    if (statusFilter !== 'all') {
      users = users.filter((u) => u.status === statusFilter)
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      users = users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    }
    return users
  }, [data, roleFilter, statusFilter, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)

  const openEditModal = (user: User) => {
    setEditUser(user)
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      member_number: user.member_number || '',
    })
    setEditError('')
  }

  const closeEditModal = () => {
    setEditUser(null)
    setEditError('')
  }

  const resetCreateForm = () => {
    setShowCreate(false)
    setCreateForm({ name: '', email: '', phone: '', password: '', role: 'member', status: 'active' })
    setCreateError('')
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
        Failed to load users
      </div>
    )

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-gray-700" />
          <h1 className="text-xl font-bold text-gray-900">Admin Users</h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Create User
        </button>
      </div>

      {impersonateError && (
        <div className="mb-4 bg-red-50 text-red-600 text-sm p-3 rounded-lg">{impersonateError}</div>
      )}

      <div className="flex flex-wrap gap-4 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">All Roles</option>
          {roleOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {filteredUsers.length === 0 ? (
        <EmptyState message="No users found" />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Email</th>
                  <th className="text-left px-4 py-3 font-medium">Phone</th>
                  <th className="text-left px-4 py-3 font-medium">Role</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Member No.</th>
                  <th className="text-left px-4 py-3 font-medium">Created</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">{user.phone}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role] || 'bg-gray-100 text-gray-600'}`}>
                        {roleLabels[user.role] || user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[user.status] || 'bg-gray-100 text-gray-600'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{user.member_number || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                          title="Edit user"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {isSuperAdmin && (
                          <button
                            onClick={() => impersonateMutation.mutate(user.id)}
                            disabled={impersonateMutation.isPending}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-50"
                            title="Login as this user"
                          >
                            <LogIn className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * PER_PAGE + 1}–{Math.min(currentPage * PER_PAGE, filteredUsers.length)} of {filteredUsers.length}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-2 rounded-lg border text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm border ${
                    p === currentPage
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="p-2 rounded-lg border text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
            <button onClick={resetCreateForm} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold mb-4">Create User</h2>
            {createError && (
              <div className="mb-3 bg-red-50 text-red-600 text-sm p-3 rounded-lg">{createError}</div>
            )}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                >
                  {roleOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={createForm.status}
                  onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                >
                  {statusOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => createMutation.mutate()}
                disabled={!createForm.name || !createForm.email || !createForm.password || createMutation.isPending}
                className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
            <button onClick={closeEditModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold mb-4">Edit User</h2>
            {editError && (
              <div className="mb-3 bg-red-50 text-red-600 text-sm p-3 rounded-lg">{editError}</div>
            )}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                >
                  {roleOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                >
                  {statusOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Member Number</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={editForm.member_number}
                  onChange={(e) => setEditForm({ ...editForm, member_number: e.target.value })}
                />
              </div>
              <button
                onClick={() => updateMutation.mutate()}
                disabled={!editForm.name || !editForm.email || updateMutation.isPending}
                className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
