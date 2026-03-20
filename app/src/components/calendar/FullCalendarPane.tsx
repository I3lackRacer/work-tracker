import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { WorkSession } from '../../types/work'
import type { Holiday } from '../../types/holiday'

interface FullCalendarPaneProps {
  calendarEvents: unknown[]
  workSessions: WorkSession[]
  holidays: Holiday[]
  onAddManualEntry: (startTime: string, endTime: string, notes: string) => Promise<void>
  onEditSession: (session: WorkSession) => void
}

const FullCalendarPane = ({
  calendarEvents,
  workSessions,
  holidays,
  onAddManualEntry,
  onEditSession,
}: FullCalendarPaneProps) => {
  const handleDateSelect = async (selectInfo: { start: Date; end: Date; view: { calendar: { unselect: () => void } } }) => {
    const startTime = selectInfo.start.toISOString()
    const endTime = selectInfo.end.toISOString()

    try {
      await onAddManualEntry(startTime, endTime, '')
      selectInfo.view.calendar.unselect()
    } catch (error) {
      console.error('Failed to add manual entry:', error)
    }
  }

  const handleEventClick = (clickInfo: { event: { id: string } }) => {
    const eventId = clickInfo.event.id

    if (eventId.startsWith('holiday-')) {
      const holiday = holidays.find(h => `holiday-${h.date}` === eventId)
      if (holiday) {
        alert(`${holiday.name}\n${holiday.description}\nState: ${holiday.state}`)
      }
      return
    }

    const sessionId = parseInt(eventId, 10)
    const session = workSessions.find(s => s.id === sessionId)
    if (session) {
      onEditSession(session)
    }
  }

  const renderEventContent = (eventInfo: {
    event: { id: string; title: string; extendedProps: { timeRange: string; duration: number | null } }
    view: { type: string }
  }) => {
    if (eventInfo.event.id.startsWith('holiday-')) {
      return {
        html: `<div class="holiday-event">${eventInfo.event.title}</div>`,
      }
    }

    const isMonthView = eventInfo.view.type === 'dayGridMonth'

    if (isMonthView) {
      const duration = eventInfo.event.extendedProps.duration
      if (duration === null) return { html: eventInfo.event.extendedProps.timeRange }
      return {
        html: `${eventInfo.event.extendedProps.timeRange} • ${duration}h`,
      }
    }

    return {
      html: eventInfo.event.title,
    }
  }

  return (
    <div className="flex-1 bg-gray-800 rounded-lg p-3 min-h-0 overflow-hidden calendar-container">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        events={calendarEvents}
        eventClick={handleEventClick}
        eventContent={renderEventContent}
        height="auto"
        expandRows={true}
        stickyHeaderDates={true}
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        allDaySlot={false}
        nowIndicator={true}
        firstDay={1}
        locale="de"
        dayHeaderFormat={{ weekday: 'short', day: 'numeric' }}
        selectable={true}
        selectMirror={true}
        select={handleDateSelect}
        selectConstraint={{
          startTime: '06:00',
          endTime: '21:00',
        }}
      />
    </div>
  )
}

export default FullCalendarPane
