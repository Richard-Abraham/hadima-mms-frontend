import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { EmptyState } from '@/shared/components/EmptyState'
import { Edit3, Loader2, Save, X } from 'lucide-react'

interface Setting {
  id: number
  key: string
  value: string
  description: string | null
  updated_at: string
}

export function SettingsPage() {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const queryClient = useQueryClient()

  const { data: settings, isLoading } = useQuery<Setting[]>({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await client.get('/settings')
      return data
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      await client.put('/settings', { key, value })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      setEditingId(null)
      setEditValue('')
    },
  })

  const startEditing = (setting: Setting) => {
    setEditingId(setting.id)
    setEditValue(setting.value)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Settings</h1>

      {isLoading ? (
        <LoadingSpinner />
      ) : !settings?.length ? (
        <EmptyState message="No settings found" />
      ) : (
        <div className="bg-white rounded-xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Key</th>
                <th className="px-4 py-3 font-medium">Value</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {settings.map((setting) => (
                <tr key={setting.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 font-mono text-xs">{setting.key}</td>
                  <td className="px-4 py-3">
                    {editingId === setting.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          className="w-full px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          autoFocus
                        />
                        <button
                          onClick={() => updateMutation.mutate({ key: setting.key, value: editValue })}
                          disabled={updateMutation.isPending}
                          className="p-1 rounded text-green-600 hover:bg-green-50"
                        >
                          {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => { setEditingId(null); setEditValue('') }}
                          className="p-1 rounded text-gray-400 hover:bg-gray-100"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-700">{setting.value}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{setting.description ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(setting.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {editingId !== setting.id && (
                      <button
                        onClick={() => startEditing(setting)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                        title="Edit"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    )}
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
