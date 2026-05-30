import { useState, useRef, useEffect } from 'react'
import client from '@/api/client'
import { useAuthStore } from '@/store/authStore'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventClickArg } from '@fullcalendar/core'

interface CalendarEventData {
  id: number
  title: string
  start: string
  end?: string
  color?: string
  description?: string
  location?: string
  is_pinned?: boolean
  rsvp_enabled?: boolean
  rsvp_count?: number
}

interface EventForm {
  id?: number
  title: string
  date: string
  time: string
  location: string
  description: string
  is_pinned: boolean
  rsvp_enabled: boolean
}

const EMPTY_FORM: EventForm = {
  title: '', date: '', time: '10:00', location: '',
  description: '', is_pinned: false, rsvp_enabled: true,
}

export function AdminCalendarPage() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user && ['super_admin', 'secretary'].includes(user.role)
  const calendarRef = useRef<FullCalendar>(null)

  const [events, setEvents] = useState<CalendarEventData[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'view' | 'create' | 'edit'>('view')
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventData & { extendedProps?: Record<string, any> } | null>(null)
  const [form, setForm] = useState<EventForm>(EMPTY_FORM)
  const [attendees, setAttendees] = useState<{id: number; name: string; responded_at: string | null}[]>([])
  const [attendeesOpen, setAttendeesOpen] = useState(false)
  const [attendeesLoading, setAttendeesLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notif, setNotif] = useState<{type: 'success' | 'error'; message: string} | null>(null)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)

  const showNotif = (type: 'success' | 'error', message: string, highlightEvId?: string) => {
    setNotif({ type, message })
    if (highlightEvId) {
      setHighlightedId(highlightEvId)
      setTimeout(() => setHighlightedId(null), 3000)
    }
    setTimeout(() => setNotif(null), 4000)
  }

  const loadEvents = async () => {
    try {
      const { data } = await client.get('/events/calendar')
      setEvents(data)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  useEffect(() => { loadEvents() }, [])

  const fcEvents = events.map((ev) => ({
    id: String(ev.id),
    title: ev.title,
    start: ev.start,
    end: ev.end,
    backgroundColor: ev.is_pinned ? '#F59E0B' : '#218078',
    borderColor: ev.is_pinned ? '#D97706' : '#1A6A62',
    textColor: '#FFFFFF',
    display: 'block',
    className: ev.is_pinned ? 'fc-event-pinned fc-event-visible' : 'fc-event-normal fc-event-visible',
    extendedProps: { is_pinned: ev.is_pinned, location: ev.location, description: ev.description, rsvp_enabled: ev.rsvp_enabled, rsvp_count: ev.rsvp_count },
  }))

  const openCreate = (dateStr: string) => {
    setForm({ ...EMPTY_FORM, date: dateStr })
    setModalMode('create')
    setSelectedEvent(null)
    setError('')
    setModalOpen(true)
  }

  const openView = (ev: CalendarEventData) => {
    setSelectedEvent({
      ...ev,
      extendedProps: { location: ev.location, description: ev.description, is_pinned: ev.is_pinned, rsvp_enabled: ev.rsvp_enabled, rsvp_count: ev.rsvp_count },
    })
    setModalMode(isAdmin ? 'view' : 'view')
    setError('')
    setModalOpen(true)
  }

  const openEdit = () => {
    if (!selectedEvent) return
    const d = new Date(selectedEvent.start)
    setForm({
      id: selectedEvent.id,
      title: selectedEvent.title,
      date: d.toISOString().split('T')[0],
      time: d.toTimeString().slice(0, 5),
      location: selectedEvent.location || '',
      description: selectedEvent.description || '',
      is_pinned: selectedEvent.is_pinned || false,
      rsvp_enabled: selectedEvent.rsvp_enabled !== false,
    })
    setModalMode('edit')
    setError('')
  }

  const handleSave = async () => {
    if (!form.title) { setError('Title is required'); return }
    if (!form.date) { setError('Date is required'); return }
    setSaving(true)
    setError('')
    try {
      const eventDate = form.time
        ? `${form.date} ${form.time}:00`
        : `${form.date}T10:00:00`
      const payload = {
        title: form.title,
        event_date: eventDate,
        location: form.location || null,
        description: form.description || null,
        is_pinned: form.is_pinned,
        rsvp_enabled: form.rsvp_enabled,
      }
      if (modalMode === 'edit' && form.id) {
        await client.put(`/admin/events/${form.id}`, payload)
        showNotif('success', 'Event updated successfully', String(form.id))
      } else {
        await client.post('/admin/events', payload)
        showNotif('success', 'Event created successfully', 'new')
      }
      setModalOpen(false)
      setLoading(true)
      await loadEvents()
      calendarRef.current?.getApi().refetchEvents()
    } catch (err: any) {
      const detail = err.response?.data?.detail
      if (Array.isArray(detail)) {
        setError(detail.map((d: any) => d.msg).join(', '))
      } else {
        setError(detail || 'Failed to save event')
      }
    } finally {
      setSaving(false)
    }
  }

  const loadAttendees = async () => {
    if (!selectedEvent) return
    setAttendeesLoading(true)
    try {
      const { data } = await client.get(`/admin/events/${selectedEvent.id}/attendees`)
      setAttendees(data)
      setAttendeesOpen(true)
    } catch {
      // silent
    } finally {
      setAttendeesLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedEvent) return
    if (!window.confirm('Delete this event?')) return
    setSaving(true)
    try {
      await client.delete(`/admin/events/${selectedEvent.id}`)
      showNotif('success', 'Event deleted successfully', 'del')
      setModalOpen(false)
      setLoading(true)
      await loadEvents()
      calendarRef.current?.getApi().refetchEvents()
    } catch {
      showNotif('error', 'Failed to delete event')
    } finally {
      setSaving(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-gray-400">Access Denied</h2>
        <p className="text-gray-400 mt-1">Only admins can access this page.</p>
      </div>
    )
  }

  if (loading) return <LoadingSpinner size="lg" />

  return (
    <div>
      <style>{`
        @keyframes calPulse { 0%,100% { box-shadow:0 0 0 0 rgba(33,128,120,0); } 50% { box-shadow:0 0 0 4px rgba(33,128,120,0.25); } }
        .cal-highlight { animation: calPulse 1s ease-in-out 2; }
        .fc-event-visible { padding: 4px 6px !important; margin-bottom: 2px !important; font-size: 13px !important; font-weight: 600 !important; border-left: 4px solid rgba(255,255,255,0.4) !important; box-shadow: 0 1px 3px rgba(0,0,0,0.12) !important; }
        .fc-event-visible:hover { filter: brightness(1.1) !important; box-shadow: 0 2px 6px rgba(0,0,0,0.2) !important; transform: translateY(-1px); }
        .fc-daygrid-day-events { min-height: 28px !important; }
        .fc-daygrid-event-harness { margin-bottom: 2px !important; }
      `}</style>
      {notif && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
          notif.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          <span>{notif.type === 'success' ? '✓' : '✕'}</span>
          <span>{notif.message}</span>
        </div>
      )}
      <h2 className="text-xl font-bold text-gray-900 mb-1">Events Calendar</h2>
      <p className="text-sm text-gray-500 mb-6">Click a date to create an event. Click an event to view/edit/delete.</p>

      <div className={`bg-white border rounded-xl shadow-sm overflow-hidden p-4 transition-all duration-500 [&_.fc-toolbar-title]:text-lg [&_.fc-toolbar-title]:font-semibold [&_.fc-button-primary]:bg-[#218078] [&_.fc-button-primary]:border-[#218078] [&_.fc-button-primary:hover]:bg-[#1A6A62] [&_.fc-button-active]:!bg-[#1A6A62] [&_.fc-daygrid-day]:!cursor-pointer [&_.fc-daygrid-day:hover]:bg-[#f0f8f6] [&_.fc-day-today]:!bg-teal-50 [&_.fc-event]:!rounded-md [&_.fc-event]:!px-1.5 [&_.fc-event]:!py-0.5 [&_.fc-event]:!text-xs [&_.fc-event]:!font-medium [&_.fc-event]:!cursor-pointer [&_.fc-scrollgrid]:rounded-b-xl ${highlightedId ? 'cal-highlight' : ''}`}>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
          events={fcEvents}
          height="auto"
          firstDay={1}
          dateClick={(info) => openCreate(info.dateStr)}
          eventClick={(info: EventClickArg) => {
            const ep = info.event.extendedProps || {}
            openView({
              id: Number(info.event.id),
              title: info.event.title,
              start: info.event.startStr,
              end: info.event.endStr || undefined,
              location: (ep.location as string) || '',
              description: (ep.description as string) || '',
              is_pinned: (ep.is_pinned as boolean) || false,
              rsvp_enabled: (ep.rsvp_enabled as boolean) !== false,
              rsvp_count: (ep.rsvp_count as number) || 0,
            })
          }}
        />
      </div>

      <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 ${modalOpen ? '' : 'hidden'}`} onClick={() => setModalOpen(false)}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <button className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500" onClick={() => setModalOpen(false)}>✕</button>

          {modalMode === 'view' && selectedEvent && (
            <>
              <h3 className="text-lg font-bold text-gray-900 mb-4">{selectedEvent.title}</h3>
              <div className="text-sm text-gray-600 space-y-2 mb-4">
                <p>📅 {new Date(selectedEvent.start).toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p>🕐 {new Date(selectedEvent.start).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}</p>
                {selectedEvent.location && <p>📍 {selectedEvent.location}</p>}
                {selectedEvent.description && <p className="text-gray-700 whitespace-pre-wrap mt-2">{selectedEvent.description}</p>}
                <p className="text-gray-400 mt-2">{selectedEvent.rsvp_count || 0} attending</p>
                {selectedEvent.is_pinned && <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full mt-1">📌 Pinned</span>}
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t">
                <button className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200" onClick={loadAttendees} disabled={attendeesLoading}>
                  {attendeesLoading ? 'Loading...' : `👥 Attendees (${selectedEvent?.rsvp_count || 0})`}
                </button>
                <button className="px-5 py-2 text-sm font-medium text-white bg-red-600 rounded-full hover:bg-red-700" onClick={handleDelete} disabled={saving}>
                  {saving ? 'Deleting...' : 'Delete'}
                </button>
                <button className="px-5 py-2 text-sm font-medium text-white bg-[#218078] rounded-full hover:bg-[#1a6a62]" onClick={openEdit}>
                  Edit
                </button>
              </div>
            </>
          )}

          {(modalMode === 'create' || modalMode === 'edit') && (
            <>
              <h3 className="text-lg font-bold text-gray-900 mb-4">{modalMode === 'create' ? 'New Event' : 'Edit Event'}</h3>
              {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Event Title *</label>
                  <input className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#218078] focus:ring-2 focus:ring-[#218078]/20 outline-none" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Event name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Date *</label>
                    <input type="date" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#218078] focus:ring-2 focus:ring-[#218078]/20 outline-none" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Time</label>
                    <input type="time" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#218078] focus:ring-2 focus:ring-[#218078]/20 outline-none" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Location</label>
                  <input className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#218078] focus:ring-2 focus:ring-[#218078]/20 outline-none" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Venue or online link" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                  <textarea className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#218078] focus:ring-2 focus:ring-[#218078]/20 outline-none resize-y min-h-[80px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Event details..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Pin to dashboard?</label>
                    <select className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#218078] focus:ring-2 focus:ring-[#218078]/20 outline-none" value={form.is_pinned ? '1' : '0'} onChange={(e) => setForm({ ...form, is_pinned: e.target.value === '1' })}>
                      <option value="0">No</option>
                      <option value="1">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Enable RSVP?</label>
                    <select className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#218078] focus:ring-2 focus:ring-[#218078]/20 outline-none" value={form.rsvp_enabled ? '1' : '0'} onChange={(e) => setForm({ ...form, rsvp_enabled: e.target.value === '1' })}>
                      <option value="1">Yes</option>
                      <option value="0">No</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-6 mt-6 border-t">
                <button className="px-5 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200" onClick={() => setModalOpen(false)}>Cancel</button>
                <button className="px-5 py-2 text-sm font-medium text-white bg-[#218078] rounded-full hover:bg-[#1a6a62] disabled:opacity-50" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : (modalMode === 'create' ? 'Create Event' : 'Save Changes')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Attendees Modal */}
      <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 ${attendeesOpen ? '' : 'hidden'}`} onClick={() => setAttendeesOpen(false)}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative" onClick={(e) => e.stopPropagation()}>
          <button className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500" onClick={() => setAttendeesOpen(false)}>✕</button>
          <h3 className="text-lg font-bold text-gray-900 mb-4">👥 Attendees</h3>
          {attendees.length === 0 ? (
            <p className="text-sm text-gray-400">No attendees yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {attendees.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-3">
                  <span className="text-sm font-medium text-gray-700">{a.name}</span>
                  {a.responded_at && <span className="text-xs text-gray-400">{new Date(a.responded_at).toLocaleDateString()}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}