import { useState, useEffect, useRef } from 'react'

const FC_CSS = [
  'https://cdn.jsdelivr.net/npm/@fullcalendar/core@6.1.20/index.global.min.css',
  'https://cdn.jsdelivr.net/npm/@fullcalendar/daygrid@6.1.20/index.global.min.css',
  'https://cdn.jsdelivr.net/npm/@fullcalendar/list@6.1.20/index.global.min.css',
]
import client from '@/api/client'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { Calendar, MapPin, Clock, CheckCircle, XCircle, Users, X } from 'lucide-react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import type { EventClickArg } from '@fullcalendar/core'

interface EventDetail {
  id: number
  title: string
  description: string
  location: string
  event_date: string
  rsvp_enabled: boolean
  rsvp_count?: number
}

interface CalendarEventData {
  id: number
  title: string
  start: string
  end?: string
  extendedProps: {
    location: string
    description: string
    is_pinned: boolean
    rsvp_enabled: boolean
    rsvp_count: number
  }
}

interface SelectedEvent {
  id: number
  title: string
  location: string
  description: string
  start: string
  end?: string
  rsvp_enabled: boolean
  rsvp_count: number
}

export function EventsPage() {
  const [events, setEvents] = useState<EventDetail[]>([])
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventData[]>([])
  const [loading, setLoading] = useState(true)
  const [rsvps, setRsvps] = useState<Record<number, boolean>>({})
  const [rsvpLoading, setRsvpLoading] = useState<Set<number>>(new Set())
  const [selectedEvent, setSelectedEvent] = useState<SelectedEvent | null>(null)
  const calendarRef = useRef<FullCalendar>(null)

  useEffect(() => {
    FC_CSS.forEach((href) => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = href
        document.head.appendChild(link)
      }
    })
  }, [])

  useEffect(() => {
    Promise.all([
      client.get('/events'),
      client.get('/events/calendar'),
    ])
      .then(([eventsRes, calendarRes]) => {
        setEvents(eventsRes.data)
        setCalendarEvents(calendarRes.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const toggleRsvp = async (id: number, current: boolean) => {
    setRsvpLoading((prev) => new Set(prev).add(id))
    try {
      await client.post(`/events/${id}/rsvp`, { attending: !current })
      setRsvps((prev) => ({ ...prev, [id]: !current }))
    } catch {
      // silent
    } finally {
      setRsvpLoading((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const handleEventClick = (arg: EventClickArg) => {
    const ep = arg.event.extendedProps || {}
    setSelectedEvent({
      id: Number(arg.event.id),
      title: arg.event.title,
      location: (ep.location as string) || '',
      description: (ep.description as string) || '',
      start: arg.event.startStr,
      end: arg.event.endStr || undefined,
      rsvp_enabled: (ep.rsvp_enabled as boolean) || false,
      rsvp_count: (ep.rsvp_count as number) || 0,
    })
  }

  const fcEvents = calendarEvents.map((ev) => ({
    id: String(ev.id),
    title: ev.title,
    start: ev.start,
    end: ev.end,
    backgroundColor: ev.extendedProps?.is_pinned ? '#F59E0B' : '#218078',
    borderColor: ev.extendedProps?.is_pinned ? '#D97706' : '#1A6A62',
    textColor: '#FFFFFF',
    display: 'block',
    className: ev.extendedProps?.is_pinned ? 'fc-event-pinned fc-event-visible' : 'fc-event-normal fc-event-visible',
    extendedProps: ev.extendedProps || {},
  }))

  if (loading) return <LoadingSpinner size="lg" />

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Calendar className="h-7 w-7 text-[#218078]" />
        <h1 className="text-2xl font-bold text-gray-900">Events</h1>
      </div>

      <>
        <section className="mb-10">
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden [&_.fc-toolbar-title]:text-lg [&_.fc-toolbar-title]:font-semibold [&_.fc-button-primary]:bg-[#218078] [&_.fc-button-primary]:border-[#218078] [&_.fc-button-primary:hover]:bg-[#1A6A62] [&_.fc-button-primary:hover]:border-[#1A6A62] [&_.fc-button-active]:!bg-[#1A6A62] [&_.fc-daygrid-event]:!rounded-md [&_.fc-daygrid-event]:!px-1.5 [&_.fc-daygrid-event]:!py-0.5 [&_.fc-day-today]:!bg-teal-50 [&_.fc-scrollgrid]:rounded-b-xl [&_.fc-event-visible]:!p-[4px_6px] [&_.fc-event-visible]:!mb-[2px] [&_.fc-event-visible]:!text-[13px] [&_.fc-event-visible]:!font-semibold [&_.fc-event-visible]:!border-l-[4px_solid_rgba(255,255,255,0.4)] [&_.fc-event-visible]:!shadow-sm [&_.fc-event-visible:hover]:!brightness-110 [&_.fc-daygrid-day-events]:!min-h-[28px]">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, interactionPlugin, listPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,listMonth',
              }}
              events={fcEvents}
              eventClick={handleEventClick}
              height="auto"
              contentHeight="auto"
              aspectRatio={1.8}
              buttonText={{
                today: 'Today',
                month: 'Month',
                listMonth: 'List',
              }}
              views={{
                dayGridMonth: {
                  titleFormat: { year: 'numeric', month: 'long' },
                },
              }}
            />
          </div>
        </section>

          {selectedEvent && (
            <div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
              onClick={() => setSelectedEvent(null)}
            >
              <div
                className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">{selectedEvent.title}</h2>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4 text-[#218078]" />
                    {new Date(selectedEvent.start).toLocaleString()}
                    {selectedEvent.end && ` — ${new Date(selectedEvent.end).toLocaleString()}`}
                  </div>
                  {selectedEvent.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 text-[#218078]" />
                      {selectedEvent.location}
                    </div>
                  )}
                  {selectedEvent.description && (
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">
                      {selectedEvent.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users className="h-4 w-4" />
                    <span>{selectedEvent.rsvp_count} attending</span>
                  </div>
                </div>
                <div className="mt-6">
                  {selectedEvent.rsvp_enabled && (
                    <button
                      onClick={() => toggleRsvp(selectedEvent.id, !!rsvps[selectedEvent.id])}
                      disabled={rsvpLoading.has(selectedEvent.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                        rsvps[selectedEvent.id]
                          ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                          : 'bg-[#218078] text-white hover:bg-[#1A6A62]'
                      }`}
                    >
                      {rsvpLoading.has(selectedEvent.id) ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-current" />
                      ) : rsvps[selectedEvent.id] ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      {rsvps[selectedEvent.id] ? 'Attending' : 'RSVP'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Events</h2>
            <div className="grid gap-4">
              {events.map((event) => {
                const attending = rsvps[event.id]
                return (
                  <div key={event.id} className="bg-white border rounded-xl p-5 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{event.title}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(event.event_date).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {event.location}
                      </span>
                    </div>
                    {event.description && (
                      <p className="text-gray-700 text-sm mb-4 whitespace-pre-wrap">
                        {event.description}
                      </p>
                    )}
                    {event.rsvp_enabled && (
                      <button
                        onClick={() => toggleRsvp(event.id, !!attending)}
                        disabled={rsvpLoading.has(event.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                          attending
                            ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                            : 'bg-[#218078] text-white hover:bg-[#1A6A62]'
                        }`}
                      >
                        {rsvpLoading.has(event.id) ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-current" />
                        ) : attending ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        {attending ? 'Attending' : 'RSVP'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        </>
    </div>
  )
}
