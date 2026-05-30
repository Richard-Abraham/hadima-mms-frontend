import { useState } from 'react'
import { Link } from 'react-router-dom'
import client from '@/api/client'
import { UserPlus, Loader2, CheckCircle } from 'lucide-react'

export function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', password_confirmation: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    if (form.password !== form.password_confirmation) {
      setErrors({ password_confirmation: 'Passwords do not match' })
      return
    }
    setLoading(true)
    try {
      await client.post('/auth/register', {
        name: form.name, email: form.email, phone: form.phone, password: form.password,
      })
      setSuccess(true)
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setErrors({ _general: err.response.data.detail })
      } else if (err.response?.data) {
        const fieldErrors: Record<string, string> = {}
        Object.entries(err.response.data).forEach(([key, val]) => {
          fieldErrors[key] = Array.isArray(val) ? val[0] : String(val)
        })
        setErrors(fieldErrors)
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border p-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
          <p className="text-sm text-gray-500 mb-6">Your joining invoice has been created. You can log in after paying.</p>
          <Link to="/login" className="inline-block bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Member Registration</h1>
          <p className="text-sm text-gray-500 mt-1">Join HADIMA Africa</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors._general && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{errors._general}</div>
          )}
          {['name', 'email', 'phone', 'password', 'password_confirmation'].map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                {field.replace(/_/g, ' ')}
              </label>
              <input
                type={field.includes('password') ? 'password' : field === 'email' ? 'email' : 'text'}
                name={field} required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={form[field as keyof typeof form]} onChange={handleChange}
              />
              {errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field]}</p>}
            </div>
          ))}
          <button
            type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Register
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  )
}
