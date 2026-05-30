import { useQuery } from '@tanstack/react-query'
import client from '@/api/client'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { EmptyState } from '@/shared/components/EmptyState'
import { AlertCircle, FileDown, Download } from 'lucide-react'

export function StatementPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['statements'],
    queryFn: () => client.get('/statements').then((r) => r.data),
  })

  const downloadPdf = async () => {
    const response = await client.get('/statements/export/pdf', { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'statement.pdf')
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  if (isLoading) return <LoadingSpinner size="lg" />
  if (error)
    return (
      <div className="flex items-center justify-center gap-2 p-8 text-red-600">
        <AlertCircle className="h-5 w-5" />
        Failed to load statement
      </div>
    )

  const entries = data?.entries ?? []
  const balance = data?.balance ?? (entries.length > 0 ? entries[entries.length - 1].balance : 0)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FileDown className="h-6 w-6 text-gray-700" />
          <h1 className="text-xl font-bold text-gray-900">Statement</h1>
        </div>
        <div className="flex gap-2">
          <a
            href="/api/statements/export/csv"
            className="inline-flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            CSV
          </a>
          <button
            onClick={downloadPdf}
            className="inline-flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <p className="text-xs text-gray-500 uppercase tracking-wide">Running Balance</p>
        <p className={`text-2xl font-bold mt-1 ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          KSh {Number(balance).toLocaleString()}
        </p>
      </div>

      {entries.length === 0 ? (
        <EmptyState message="No statement entries" />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Description</th>
                <th className="text-left px-4 py-3 font-medium">Reference</th>
                <th className="text-right px-4 py-3 font-medium">Debit</th>
                <th className="text-right px-4 py-3 font-medium">Credit</th>
                <th className="text-right px-4 py-3 font-medium">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {entries.map((entry: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{new Date(entry.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{entry.description}</td>
                  <td className="px-4 py-3 font-mono text-xs">{entry.reference}</td>
                  <td className="px-4 py-3 text-right text-red-600">
                    {entry.debit ? `KSh ${Number(entry.debit).toLocaleString()}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-green-600">
                    {entry.credit ? `KSh ${Number(entry.credit).toLocaleString()}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    KSh {Number(entry.balance).toLocaleString()}
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
