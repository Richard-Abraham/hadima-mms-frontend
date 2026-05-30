import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import client from '@/api/client'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { EmptyState } from '@/shared/components/EmptyState'
import { Pagination } from '@/shared/components/Pagination'
import { FileText, FileSpreadsheet } from 'lucide-react'

const reportTypes = [
  { value: 'members', label: 'Members' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'payments', label: 'Payments' },
  { value: 'reconciliation', label: 'Reconciliation' },
  { value: 'sms', label: 'SMS' },
  { value: 'audit', label: 'Audit' },
]

const ITEMS_PER_PAGE = 15

export function ReportPage() {
  const [type, setType] = useState('members')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const { data, isLoading } = useQuery<any[]>({
    queryKey: ['reports', type],
    queryFn: async () => {
      const { data } = await client.get(`/admin/reports/${type}`)
      return data
    },
  })

  const filtered = data?.filter((row: any) =>
    Object.values(row).some((val: any) =>
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  ) ?? []

  const columns = data && data.length > 0 ? Object.keys(data[0]) : []

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const downloadExport = async (format: 'csv' | 'pdf') => {
    try {
      const res = await client.get(`/admin/reports/export/${type}/${format}`, {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `report-${type}-${new Date().toISOString().slice(0, 10)}.${format}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      // silent
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Reports</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadExport('csv')}
            className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700"
          >
            <FileSpreadsheet className="h-4 w-4" />
            CSV
          </button>
          <button
            onClick={() => downloadExport('pdf')}
            className="flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700"
          >
            <FileText className="h-4 w-4" />
            PDF
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {reportTypes.map((rt) => (
          <button
            key={rt.value}
            onClick={() => { setType(rt.value); setCurrentPage(1) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              type === rt.value
                ? 'bg-blue-600 text-white'
                : 'bg-white border text-gray-600 hover:bg-gray-50'
            }`}
          >
            {rt.label}
          </button>
        ))}
      </div>

      <div>
        <input
          type="text"
          placeholder="Search..."
          className="w-full max-w-sm px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
        />
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : !paginated.length ? (
        <EmptyState message="No data for this report" />
      ) : (
        <div className="bg-white rounded-xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
              <tr>
                {columns.map((col) => (
                  <th key={col} className="px-4 py-3 font-medium">{col.replace(/_/g, ' ')}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginated.map((row: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  {columns.map((col) => (
                    <td key={col} className="px-4 py-3 text-gray-700">
                      {String(row[col] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 pb-4">
            <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filtered.length} onPageChange={setCurrentPage} />
          </div>
        </div>
      )}
    </div>
  )
}
