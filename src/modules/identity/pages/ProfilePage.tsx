import { useState, useEffect } from 'react'
import client from '@/api/client'
import { useAuthStore } from '@/store/authStore'
import { Save, Loader2 } from 'lucide-react'

export function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const setAuth = useAuthStore((s) => s.setAuth)
  const token = useAuthStore((s) => s.token)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    national_id: '', dob: '', gender: '',
    address: '', sub_location: '', ward: '', county: '', occupation: '', employer: '',
    kin_name: '', kin_relationship: '', kin_phone: '',
  })

  useEffect(() => {
    if (!user) return
    setForm((prev) => ({
      ...prev,
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
    }))
    client.get('/profile')
      .then(({ data }) => {
        setForm((prev) => ({
          ...prev,
          national_id: data.national_id || '',
          dob: data.dob || '',
          gender: data.gender || '',
          address: data.address || '',
          sub_location: data.sub_location || '',
          ward: data.ward || '',
          county: data.county || '',
          occupation: data.occupation || '',
          employer: data.employer || '',
          kin_name: data.kin_name || '',
          kin_relationship: data.kin_relationship || '',
          kin_phone: data.kin_phone || '',
        }))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  const update = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }))

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const { data } = await client.put('/profile', {
        name: form.name, email: form.email, phone: form.phone,
        id_number: form.national_id, date_of_birth: form.dob || null, gender: form.gender,
        address: form.address, sub_location: form.sub_location, ward: form.ward,
        county: form.county, occupation: form.occupation, employer: form.employer,
        kin_name: form.kin_name, kin_relationship: form.kin_relationship, kin_phone: form.kin_phone,
      })
      if (data.user) {
        setAuth(token!, data.user)
      }
      setSuccess('Profile updated successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#218078]" /></div>
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 mt-1">Manage your personal information and next of kin details.</p>
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}
      {success && <div className="bg-green-50 text-green-600 text-sm p-3 rounded-lg mb-4">{success}</div>}

      <div className="bg-white rounded-xl shadow-sm border p-6 sm:p-8 space-y-8">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#218078] focus:border-[#218078] outline-none" value={form.name} onChange={(e) => update('name', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#218078] focus:border-[#218078] outline-none" value={form.email} onChange={(e) => update('email', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#218078] focus:border-[#218078] outline-none" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">National ID</label>
              <input type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#218078] focus:border-[#218078] outline-none" value={form.national_id} onChange={(e) => update('national_id', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input type="date" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#218078] focus:border-[#218078] outline-none" value={form.dob} onChange={(e) => update('dob', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#218078] focus:border-[#218078] outline-none" value={form.gender} onChange={(e) => update('gender', e.target.value)}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </section>

        <hr />
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Address & Location</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#218078] focus:border-[#218078] outline-none" value={form.address} onChange={(e) => update('address', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sub-location</label>
              <input type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#218078] focus:border-[#218078] outline-none" value={form.sub_location} onChange={(e) => update('sub_location', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ward</label>
              <input type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#218078] focus:border-[#218078] outline-none" value={form.ward} onChange={(e) => update('ward', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">County</label>
              <input type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#218078] focus:border-[#218078] outline-none" value={form.county} onChange={(e) => update('county', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
              <input type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#218078] focus:border-[#218078] outline-none" value={form.occupation} onChange={(e) => update('occupation', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employer</label>
              <input type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#218078] focus:border-[#218078] outline-none" value={form.employer} onChange={(e) => update('employer', e.target.value)} />
            </div>
          </div>
        </section>

        <hr />
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Next of Kin</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#218078] focus:border-[#218078] outline-none" value={form.kin_name} onChange={(e) => update('kin_name', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
              <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#218078] focus:border-[#218078] outline-none" value={form.kin_relationship} onChange={(e) => update('kin_relationship', e.target.value)}>
                <option value="">Select</option>
                <option value="spouse">Spouse</option>
                <option value="parent">Parent</option>
                <option value="sibling">Sibling</option>
                <option value="child">Child</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#218078] focus:border-[#218078] outline-none" value={form.kin_phone} onChange={(e) => update('kin_phone', e.target.value)} />
            </div>
          </div>
        </section>

        <div className="flex justify-end pt-4">
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-[#218078] rounded-lg hover:bg-[#1a6a62] disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}