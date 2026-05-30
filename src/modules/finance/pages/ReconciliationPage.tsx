import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { EmptyState } from '@/shared/components/EmptyState'
import { Pagination } from '@/shared/components/Pagination'
import { Upload, Download, Loader2, Check, AlertTriangle, X, Save, ArrowLeft } from 'lucide-react'

interface ReconciliationUpload {
  id: number
  uploaded_by: number
  file_path: string
  status: string
  matched_count: number
  unmatched_count: number
  created_at: string
}

interface Match {
  id: number
  upload_id: number
  invoice_id: number | null
  transaction_reference: string
  matched_amount: number
  match_status: string
  sender_phone: string
  sender_name: string
  category: string | null
  description: string | null
  created_at: string
}

interface Totals {
  total_amount: number
  total_count: number
  by_category: Record<string, { total: number; count: number }>
}

const CATEGORIES = ['welfare', 'contribution', 'monthly', 'fine', 'fundraise', 'emergency'] as const

const CATEGORY_LABELS: Record<string, string> = {
  welfare: 'Welfare',
  contribution: 'Contribution',
  monthly: 'Monthly',
  fine: 'Fine',
  fundraise: 'Fundraise',
  emergency: 'Emergency',
}

const ITEMS_PER_PAGE = 15

const statusColors: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-700',
  conflict: 'bg-red-100 text-red-700',
  unmatched: 'bg-yellow-100 text-yellow-700',
  pending: 'bg-gray-100 text-gray-600',
}

const uploadStatusColors: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  failed: 'bg-red-100 text-red-700',
}

export function ReconciliationPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [matchesPage, setMatchesPage] = useState(1)
  const [categoryInputs, setCategoryInputs] = useState<Record<number, { category: string; description: string }>>({})
  const fileRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const { data: totals, isLoading: totalsLoading } = useQuery<Totals>({
    queryKey: ['reconciliation-totals'],
    queryFn: async () => {
      const { data } = await client.get('/reconciliation/totals')
      return data
    },
  })

  const { data: uploads, isLoading: uploadsLoading } = useQuery<ReconciliationUpload[]>({
    queryKey: ['reconciliations'],
    queryFn: async () => {
      const { data } = await client.get('/admin/reconciliations')
      return data
    },
  })

  const { data: matches, isLoading: matchesLoading } = useQuery<Match[]>({
    queryKey: ['reconciliation-matches', selectedId],
    queryFn: async () => {
      const { data } = await client.get(`/admin/reconciliations/${selectedId}/matches`)
      return data
    },
    enabled: !!selectedId,
  })

  const confirmMutation = useMutation({
    mutationFn: async (matchId: number) => {
      await client.post(`/admin/reconciliations/matches/${matchId}/confirm`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation-matches', selectedId] })
      queryClient.invalidateQueries({ queryKey: ['reconciliations'] })
      queryClient.invalidateQueries({ queryKey: ['reconciliation-totals'] })
    },
  })

  const conflictMutation = useMutation({
    mutationFn: async (matchId: number) => {
      await client.post(`/admin/reconciliations/matches/${matchId}/conflict`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation-matches', selectedId] })
      queryClient.invalidateQueries({ queryKey: ['reconciliations'] })
      queryClient.invalidateQueries({ queryKey: ['reconciliation-totals'] })
    },
  })

  const unmarkMutation = useMutation({
    mutationFn: async (matchId: number) => {
      await client.post(`/admin/reconciliations/matches/${matchId}/unmark`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation-matches', selectedId] })
      queryClient.invalidateQueries({ queryKey: ['reconciliations'] })
      queryClient.invalidateQueries({ queryKey: ['reconciliation-totals'] })
    },
  })

  const categorizeMutation = useMutation({
    mutationFn: async ({ matchId, payload }: { matchId: number; payload: { category: string; description: string } }) => {
      await client.put(`/admin/reconciliations/matches/${matchId}/categorize`, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation-matches', selectedId] })
      queryClient.invalidateQueries({ queryKey: ['reconciliation-totals'] })
    },
  })

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      await client.post('/admin/reconciliations', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      queryClient.invalidateQueries({ queryKey: ['reconciliations'] })
      queryClient.invalidateQueries({ queryKey: ['reconciliation-totals'] })
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''
    } finally {
      setUploading(false)
    }
  }

  const downloadTemplate = async () => {
    try {
      const response = await client.get('/admin/invoices/recon-template', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'reconciliation-template.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      // silent
    }
  }

  const handleCategoryChange = (matchId: number, field: 'category' | 'description', value: string) => {
    setCategoryInputs((prev) => ({
      ...prev,
      [matchId]: { ...(prev[matchId] ?? { category: '', description: '' }), [field]: value },
    }))
  }

  if (selectedId) {
    const totalMatchesPages = Math.ceil((matches?.length || 0) / ITEMS_PER_PAGE)
    const paginatedMatches = (matches || []).slice(
      (matchesPage - 1) * ITEMS_PER_PAGE,
      matchesPage * ITEMS_PER_PAGE
    )

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setSelectedId(null); setMatchesPage(1); setCategoryInputs({}) }}
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h2 className="text-lg font-semibold text-gray-900">Matches</h2>
        </div>

        {matchesLoading ? (
          <LoadingSpinner />
        ) : !matches?.length ? (
          <EmptyState message="No matches found" />
        ) : (
          <div className="bg-white rounded-xl border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Transaction Ref</th>
                  <th className="px-4 py-3 font-medium">Sender Name</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedMatches.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900 font-mono text-xs">
                      {m.transaction_reference}
                    </td>
                    <td className="px-4 py-3">{m.sender_name}</td>
                    <td className="px-4 py-3 text-gray-500">{m.sender_phone}</td>
                    <td className="px-4 py-3">
                      KES {m.matched_amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          statusColors[m.match_status] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {m.match_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {m.match_status === 'unmatched' ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={categoryInputs[m.id]?.category ?? ''}
                            onChange={(e) => handleCategoryChange(m.id, 'category', e.target.value)}
                            className="px-2 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                          >
                            <option value="">Select category</option>
                            {CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {CATEGORY_LABELS[cat]}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            placeholder="Description"
                            value={categoryInputs[m.id]?.description ?? ''}
                            onChange={(e) => handleCategoryChange(m.id, 'description', e.target.value)}
                            className="px-2 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none w-32"
                          />
                          <button
                            onClick={() => {
                              const input = categoryInputs[m.id]
                              if (input?.category) {
                                categorizeMutation.mutate({
                                  matchId: m.id,
                                  payload: { category: input.category, description: input.description || '' },
                                })
                              }
                            }}
                            disabled={!categoryInputs[m.id]?.category || categorizeMutation.isPending}
                            className="inline-flex items-center gap-1 px-2 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 disabled:opacity-50"
                          >
                            {categorizeMutation.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Save className="h-3 w-3" />
                            )}
                            Save
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          {m.match_status !== 'confirmed' && (
                            <button
                              onClick={() => confirmMutation.mutate(m.id)}
                              disabled={confirmMutation.isPending}
                              className="p-1.5 rounded-lg hover:bg-green-50 text-green-600"
                              title="Confirm"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          {m.match_status !== 'conflict' && (
                            <button
                              onClick={() => conflictMutation.mutate(m.id)}
                              disabled={conflictMutation.isPending}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"
                              title="Mark conflict"
                            >
                              <AlertTriangle className="h-4 w-4" />
                            </button>
                          )}
                          {m.match_status !== 'pending' && (
                            <button
                              onClick={() => unmarkMutation.mutate(m.id)}
                              disabled={unmarkMutation.isPending}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                              title="Unmark"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 pb-4">
              <Pagination
                currentPage={matchesPage}
                totalPages={totalMatchesPages}
                totalItems={matches.length}
                onPageChange={setMatchesPage}
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  const totalPages = Math.ceil((uploads?.length || 0) / ITEMS_PER_PAGE)
  const paginatedUploads = (uploads || []).slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Reconciliation</h1>

      {totalsLoading ? (
        <div className="bg-white rounded-xl border p-6">
          <LoadingSpinner />
        </div>
      ) : totals ? (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Totals</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-xs text-blue-600 font-medium uppercase">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                KES {totals.total_amount.toLocaleString()}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-xs text-green-600 font-medium uppercase">Total Count</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totals.total_count}</p>
            </div>
            {Object.entries(totals.by_category).map(([key, val]) => (
              <div key={key} className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 font-medium uppercase">
                  {CATEGORY_LABELS[key] || key}
                </p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  KES {val.total.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">{val.count} entries</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Upload CSV</h2>
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Upload
          </button>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 ml-auto"
          >
            <Download className="h-4 w-4" />
            Download CSV Template
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Expected columns:{' '}
          <code>Transaction Code</code>, <code>Amount</code>,{' '}
          <code>Sender Phone</code>, <code>Sender Name</code>, <code>Date</code>
        </p>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Previous Uploads</h2>
        {uploadsLoading ? (
          <LoadingSpinner />
        ) : !uploads?.length ? (
          <EmptyState message="No uploads yet" />
        ) : (
          <div className="bg-white rounded-xl border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">File</th>
                  <th className="px-4 py-3 font-medium">Uploaded By</th>
                  <th className="px-4 py-3 font-medium">Matched</th>
                  <th className="px-4 py-3 font-medium">Unmatched</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedUploads.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {r.file_path.split('/').pop()}
                    </td>
                    <td className="px-4 py-3">{r.uploaded_by}</td>
                    <td className="px-4 py-3 text-green-600">{r.matched_count}</td>
                    <td className="px-4 py-3 text-yellow-600">{r.unmatched_count}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          uploadStatusColors[r.status] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { setSelectedId(r.id); setMatchesPage(1) }}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 pb-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={uploads.length}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
