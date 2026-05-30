import { useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { AlertCircle, CreditCard, Copy, Check, X, Download } from 'lucide-react'

const statusColors: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  overdue: 'bg-red-100 text-red-700',
}

export function InvoiceDetailPage() {
  const { reference } = useParams<{ reference: string }>()
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [channel, setChannel] = useState('mpesa')
  const [transactionCode, setTransactionCode] = useState('')
  const [payError, setPayError] = useState('')
  const [paySuccess, setPaySuccess] = useState('')
  const [copied, setCopied] = useState<'paybill' | 'account' | null>(null)
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: inv, isLoading, error } = useQuery({
    queryKey: ['invoice', reference],
    queryFn: () => client.get(`/invoices/${reference}`).then((r) => r.data),
    enabled: !!reference,
  })

  const payMutation = useMutation({
    mutationFn: () => {
      const formData = new FormData()
      formData.append('channel', channel)
      formData.append('transaction_code', transactionCode)
      if (screenshot) {
        formData.append('payment_proof', screenshot)
      }
      return client.post(`/invoices/${reference}/pay`, formData, {
        headers: { 'Content-Type': undefined },
      })
    },
    onSuccess: () => {
      setPaySuccess('Payment submitted for verification')
      setShowModal(false)
      setTransactionCode('')
      setScreenshot(null)
      setPreviewUrl(null)
      queryClient.invalidateQueries({ queryKey: ['invoice', reference] })
    },
    onError: (err: any) => {
      setPayError(err.response?.data?.detail || 'Payment submission failed')
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setScreenshot(file)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(file ? URL.createObjectURL(file) : null)
  }

  const downloadPdf = async () => {
    const response = await client.get(`/invoices/${reference}/pdf`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `invoice-${reference}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  const handleCopy = (field: 'paybill' | 'account') => {
    const val = field === 'paybill' ? '247247' : 'HADIMA/001'
    navigator.clipboard.writeText(val)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  if (isLoading) return <LoadingSpinner size="lg" />
  if (error)
    return (
      <div className="flex items-center justify-center gap-2 p-8 text-red-600">
        <AlertCircle className="h-5 w-5" />
        Failed to load invoice
      </div>
    )

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-gray-700" />
          <h1 className="text-xl font-bold text-gray-900">Invoice Details</h1>
        </div>
        <button
          onClick={downloadPdf}
          className="inline-flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </button>
      </div>

      {paySuccess && (
        <div className="mb-4 bg-green-50 text-green-700 text-sm p-3 rounded-lg flex items-center gap-2">
          <Check className="h-4 w-4" />
          {paySuccess}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Reference</p>
            <p className="font-mono text-sm mt-0.5">{inv.reference}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Type</p>
            <p className="capitalize text-sm mt-0.5">{inv.type}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Amount</p>
            <p className="text-lg font-semibold mt-0.5">KSh {Number(inv.amount).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[inv.status] || 'bg-gray-100 text-gray-600'}`}>
              {inv.status}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Due Date</p>
            <p className="text-sm mt-0.5">{new Date(inv.due_date).toLocaleDateString()}</p>
          </div>
        </div>

        {inv.notes && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Notes</p>
            <p className="text-sm mt-0.5">{inv.notes}</p>
          </div>
        )}
      </div>

      <div className="mt-6 bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">M-Pesa Payment Instructions</h2>
        <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside mb-4">
          <li>Go to M-Pesa menu</li>
          <li>Select Lipa na M-Pesa &rarr; Paybill</li>
          <li>Enter Paybill number: <strong>247247</strong>
            <button onClick={() => handleCopy('paybill')} className="ml-2 inline-flex items-center gap-1 text-blue-600 hover:underline">
              {copied === 'paybill' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied === 'paybill' ? 'Copied' : 'Copy'}
            </button>
          </li>
          <li>Enter Account number: <strong>HADIMA/001</strong>
            <button onClick={() => handleCopy('account')} className="ml-2 inline-flex items-center gap-1 text-blue-600 hover:underline">
              {copied === 'account' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied === 'account' ? 'Copied' : 'Copy'}
            </button>
          </li>
          <li>Enter Amount: <strong>KSh {Number(inv.amount).toLocaleString()}</strong></li>
          <li>Enter your M-Pesa PIN and send</li>
          <li>Enter the transaction code below</li>
        </ol>

        <button
          onClick={() => { setShowModal(true); setPayError(''); setPaySuccess('') }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
        >
          Pay Now
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
            <button onClick={() => { setShowModal(false); setPreviewUrl(null); setScreenshot(null) }} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold mb-4">Confirm Payment</h2>
            {payError && (
              <div className="mb-3 bg-red-50 text-red-600 text-sm p-3 rounded-lg">{payError}</div>
            )}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                >
                  <option value="mpesa">M-Pesa</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Code</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. QWE1234RTY"
                  value={transactionCode}
                  onChange={(e) => setTransactionCode(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Screenshot <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {previewUrl && (
                  <div className="mt-2">
                    <img src={previewUrl} alt="Payment screenshot preview" className="max-h-40 rounded border" />
                  </div>
                )}
              </div>
              <button
                onClick={() => payMutation.mutate()}
                disabled={!transactionCode || payMutation.isPending}
                className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {payMutation.isPending ? 'Submitting...' : 'Submit Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
