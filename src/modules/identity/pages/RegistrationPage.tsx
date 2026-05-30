import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '@/api/client'
import { useAuthStore } from '@/store/authStore'
import { ArrowLeft, ArrowRight, Check, User, MapPin, Users } from 'lucide-react'

const STEPS = [
  { id: 1, label: 'Identity', icon: User },
  { id: 2, label: 'Contact', icon: MapPin },
  { id: 3, label: 'Next of Kin', icon: Users },
]

export function RegistrationPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    national_id: '', dob: '', gender: '',
    address: '', sub_location: '', ward: '', county: '', occupation: '', employer: '',
    kin_name: '', kin_relationship: '', kin_phone: '',
    declaration_accepted: false,
  })

  useEffect(() => {
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
      .finally(() => setProfileLoading(false))
  }, [])

  useEffect(() => {
    if (!profileLoading && user && user.status === 'active') {
      navigate('/dashboard', { replace: true })
    }
  }, [profileLoading, user, navigate])

  const update = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }))

  const validateStep = (): boolean => {
    setError('')
    if (step === 1) {
      if (!form.national_id) { setError('National ID is required'); return false }
      if (!form.dob) { setError('Date of birth is required'); return false }
      if (!form.gender) { setError('Gender is required'); return false }
      const age = new Date().getFullYear() - new Date(form.dob).getFullYear()
      if (age < 18) { setError('You must be at least 18 years old'); return false }
    }
    if (step === 2) {
      if (!form.address) { setError('Address is required'); return false }
      if (!form.county) { setError('County is required'); return false }
    }
    if (step === 3) {
      if (!form.kin_name) { setError('Next of kin name is required'); return false }
      if (!form.kin_relationship) { setError('Relationship is required'); return false }
      if (!form.kin_phone) { setError('Next of kin phone is required'); return false }
      if (!form.declaration_accepted) { setError('You must accept the declaration'); return false }
    }
    return true
  }

  const handleNext = async () => {
    if (!validateStep()) return
    setLoading(true)
    try {
      await client.put('/profile', {
        national_id: form.national_id, date_of_birth: form.dob, gender: form.gender,
        address: form.address, sub_location: form.sub_location, ward: form.ward,
        county: form.county, occupation: form.occupation, employer: form.employer,
        kin_name: form.kin_name, kin_relationship: form.kin_relationship, kin_phone: form.kin_phone,
      })
      if (step < 3) setStep(step + 1)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!validateStep()) return
    setLoading(true)
    setError('')
    try {
      await client.put('/profile', {
        national_id: form.national_id, date_of_birth: form.dob, gender: form.gender,
        address: form.address, sub_location: form.sub_location, ward: form.ward,
        county: form.county, occupation: form.occupation, employer: form.employer,
        kin_name: form.kin_name, kin_relationship: form.kin_relationship, kin_phone: form.kin_phone,
        declaration_accepted: true,
      })
      const { data } = await client.post('/profile/submit')
      setSuccess(data.message)
      setTimeout(() => navigate('/dashboard'), 2000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit')
    } finally {
      setLoading(false)
    }
  }

  if (profileLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#218078]" /></div>
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-sm border p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Registration Submitted!</h2>
          <p className="text-gray-500">{success}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Complete Your Registration</h1>
          <p className="text-gray-500 mt-1">Fill in your details to complete your HADIMA membership application.</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                step >= s.id ? 'bg-[#218078] text-white' : 'bg-gray-100 text-gray-400'
              }`}>
                <s.icon className="h-4 w-4" />
                {s.label}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 ${step > s.id ? 'bg-[#218078]' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-6">{error}</div>
        )}

        <div className="bg-white rounded-xl shadow-sm border p-6 sm:p-8">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Identity Details</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">National ID Number *</label>
                <input type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#218078] focus:border-[#218078] outline-none" value={form.national_id} onChange={(e) => update('national_id', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                <input type="date" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#218078] focus:border-[#218078] outline-none" value={form.dob} onChange={(e) => update('dob', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#218078] focus:border-[#218078] outline-none" value={form.gender} onChange={(e) => update('gender', e.target.value)}>
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact & Location</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                <input type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#218078] focus:border-[#218078] outline-none" value={form.address} onChange={(e) => update('address', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sub-location</label>
                  <input type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#218078] focus:border-[#218078] outline-none" value={form.sub_location} onChange={(e) => update('sub_location', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ward</label>
                  <input type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#218078] focus:border-[#218078] outline-none" value={form.ward} onChange={(e) => update('ward', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">County *</label>
                <input type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#218078] focus:border-[#218078] outline-none" value={form.county} onChange={(e) => update('county', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                  <input type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#218078] focus:border-[#218078] outline-none" value={form.occupation} onChange={(e) => update('occupation', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employer</label>
                  <input type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#218078] focus:border-[#218078] outline-none" value={form.employer} onChange={(e) => update('employer', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Next of Kin</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#218078] focus:border-[#218078] outline-none" value={form.kin_name} onChange={(e) => update('kin_name', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relationship *</label>
                <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#218078] focus:border-[#218078] outline-none" value={form.kin_relationship} onChange={(e) => update('kin_relationship', e.target.value)}>
                  <option value="">Select relationship</option>
                  <option value="spouse">Spouse</option>
                  <option value="parent">Parent</option>
                  <option value="sibling">Sibling</option>
                  <option value="child">Child</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input type="tel" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#218078] focus:border-[#218078] outline-none" placeholder="0712 345 678" value={form.kin_phone} onChange={(e) => update('kin_phone', e.target.value)} />
              </div>

              <hr className="my-6" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Declaration</h3>
              <p className="text-sm text-gray-600 mb-4">
                I confirm that the information provided is true and accurate. I agree to abide by the HADIMA Africa constitution and bylaws.
              </p>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="mt-1 h-4 w-4 rounded border-gray-300 text-[#218078] focus:ring-[#218078]" checked={form.declaration_accepted} onChange={(e) => update('declaration_accepted', e.target.checked)} />
                <span className="text-sm text-gray-700">I accept the declaration and terms of membership *</span>
              </label>
            </div>
          )}

          <div className="flex justify-between mt-8 pt-4 border-t">
            {step > 1 ? (
              <button onClick={() => setStep(step - 1)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border rounded-lg hover:bg-gray-50">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            ) : <div />}
            {step < 3 ? (
              <button onClick={handleNext} disabled={loading} className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-[#218078] rounded-lg hover:bg-[#1a6a62] disabled:opacity-50">
                {loading ? 'Saving...' : 'Next'} <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading} className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-[#218078] rounded-lg hover:bg-[#1a6a62] disabled:opacity-50">
                {loading ? 'Submitting...' : 'Submit for Approval'} <Check className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}