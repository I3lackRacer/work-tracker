import { useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { WorkSession } from '../types/work'
import type { WorkSettings } from './modals/SettingsModal'
import { formatTime } from '../utils/dateUtils'

interface WorkCalendarProps {
  workSessions: WorkSession[]
  onAddManualEntry: (startTime: string, endTime: string, notes: string) => Promise<void>
  onEdit: (session: WorkSession) => void
  workSettings: WorkSettings | undefined  
}

interface WorkStats {
  daily: number
  weekly: number
  monthly: number
  total: number
}

const WorkCalendar = ({ workSessions, onAddManualEntry, onEdit, workSettings }: WorkCalendarProps) => {
  const [stats, setStats] = useState<WorkStats>({
    daily: 0,
    weekly: 0,
    monthly: 0,
    total: 0
  })

  useEffect(() => {
    calculateStats()
  }, [workSessions])

  const calculateStats = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - (today.getDay() || 7) + 1)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const completedSessions = workSessions.filter(session => session.clockOut)
    
    const calculateHours = (session: WorkSession): number => {
      if (!session.clockOut) return 0
      return (new Date(session.clockOut.timestamp).getTime() - new Date(session.clockIn.timestamp).getTime()) / (1000 * 60 * 60)
    }

    const daily = completedSessions
      .filter(session => new Date(session.clockIn.timestamp) >= today)
      .reduce((acc, session) => acc + calculateHours(session), 0)

    const weekly = completedSessions
      .filter(session => new Date(session.clockIn.timestamp) >= weekStart)
      .reduce((acc, session) => acc + calculateHours(session), 0)

    const monthly = completedSessions
      .filter(session => new Date(session.clockIn.timestamp) >= monthStart)
      .reduce((acc, session) => acc + calculateHours(session), 0)

    const total = completedSessions
      .reduce((acc, session) => acc + calculateHours(session), 0)

    setStats({
      daily: Math.round(daily * 10) / 10,
      weekly: Math.round(weekly * 10) / 10,
      monthly: Math.round(monthly * 10) / 10,
      total: Math.round(total * 10) / 10
    })
  }

  const calculateDurationHours = (start: string, end: string): number => {
    const startTime = new Date(start).getTime()
    const endTime = new Date(end).getTime()
    return Math.round((endTime - startTime) / (1000 * 60 * 60) * 10) / 10
  }

  const calendarEvents = workSessions.map(session => ({
    id: session.clockIn.id.toString(),
    title: session.clockIn.notes || 'Work Session',
    start: session.clockIn.timestamp,
    end: session.clockOut?.timestamp || new Date().toISOString(),
    backgroundColor: session.clockOut ? '#3B82F6' : '#DC2626',
    borderColor: session.clockOut ? '#2563EB' : '#DC2626',
    extendedProps: {
      timeRange: session.clockOut ? 
        `${formatTime(session.clockIn.timestamp)} - ${formatTime(session.clockOut.timestamp)}` : 
        formatTime(session.clockIn.timestamp),
      duration: session.clockOut ? 
        calculateDurationHours(session.clockIn.timestamp, session.clockOut.timestamp) : 
        null
    }
  }))

  const handleDateSelect = async (selectInfo: any) => {
    const startTime = selectInfo.start.toISOString()
    const endTime = selectInfo.end.toISOString()
    
    try {
      await onAddManualEntry(startTime, endTime, '')
      selectInfo.view.calendar.unselect()
    } catch (error) {
      console.error('Failed to add manual entry:', error)
    }
  }

  const handleEventClick = (clickInfo: any) => {
    const sessionId = parseInt(clickInfo.event.id)
    const session = workSessions.find(s => s.clockIn.id === sessionId)
    if (session) {
      onEdit(session)
    }
  }

  const renderEventContent = (eventInfo: any) => {
    const isMonthView = eventInfo.view.type === 'dayGridMonth'
    
    if (isMonthView) {
      const duration = eventInfo.event.extendedProps.duration
      if (duration === null) return { html: eventInfo.event.extendedProps.timeRange }
      return {
        html: `${eventInfo.event.extendedProps.timeRange} • ${duration}h`
      }
    }
    
    return {
      html: eventInfo.event.title
    }
  }

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      <div className="grid grid-cols-4 gap-3 mb-4 shrink-0">
        <div className="bg-gray-800 p-3 rounded-lg">
          <h4 className="text-gray-400 text-sm">Today</h4>
          <p className="text-xl font-semibold">{stats.daily}h</p>
        </div>
        <div className="bg-gray-800 p-3 rounded-lg">
          <h4 className="text-gray-400 text-sm">This Week</h4>
          <p className="text-xl font-semibold">{stats.weekly}h</p>
          <div className="mt-2">
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${Math.min((stats.weekly / (workSettings?.expectedWeeklyHours || 0)) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {Math.round((stats.weekly / (workSettings?.expectedWeeklyHours || 0)) * 100)}% of {workSettings?.expectedWeeklyHours || 0}h
            </p>
          </div>
        </div>
        <div className="bg-gray-800 p-3 rounded-lg">
          <h4 className="text-gray-400 text-sm">This Month</h4>
          <p className="text-xl font-semibold">{stats.monthly}h</p>
          <div className="mt-2">
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${Math.min((stats.monthly / (workSettings?.expectedMonthlyHours || 0)) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {Math.round((stats.monthly / (workSettings?.expectedMonthlyHours || 0)) * 100)}% of {workSettings?.expectedMonthlyHours || 0}h
            </p>
          </div>
        </div>
        <div className="bg-gray-800 p-3 rounded-lg">
          <h4 className="text-gray-400 text-sm">Total</h4>
          <p className="text-xl font-semibold">{stats.total}h</p>
        </div>
      </div>
      <div className="flex-1 bg-gray-800 rounded-lg p-3 min-h-0 overflow-hidden">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          events={calendarEvents}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
          height="100%"
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
    </div>
  )
}

export default WorkCalendar 