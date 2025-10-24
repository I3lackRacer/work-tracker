import { useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { WorkSession } from '../types/work'
import type { WorkSettings } from './modals/SettingsModal'
import { formatTime } from '../utils/dateUtils'
import type { Holiday } from '../types/holiday'

interface WorkCalendarProps {
  workSessions: WorkSession[]
  onAddManualEntry: (startTime: string, endTime: string, notes: string) => Promise<void>
  onEdit: (session: WorkSession) => void
  workSettings: WorkSettings | undefined  
  holidays: Holiday[]
}

interface WorkStats {
  daily: number
  weekly: number
  monthly: number
  total: number
}

const WorkCalendar = ({ workSessions, onAddManualEntry, onEdit, workSettings, holidays }: WorkCalendarProps) => {
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

    const completedSessions = workSessions.filter(session => session.endTime)
    
    const calculateHours = (session: WorkSession): number => {
      if (!session.endTime) return 0
      return (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60 * 60)
    }

    const daily = completedSessions
      .filter(session => new Date(session.startTime) >= today)
      .reduce((acc, session) => acc + calculateHours(session), 0)

    const weekly = completedSessions
      .filter(session => new Date(session.startTime) >= weekStart)
      .reduce((acc, session) => acc + calculateHours(session), 0)

    const monthly = completedSessions
      .filter(session => new Date(session.startTime) >= monthStart)
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

  const calculateProgressStatus = (currentHours: number, targetHours: number, workDays: string, period: 'week' | 'month'): { status: 'on-track' | 'behind' | 'ahead', message: string } => {
    if (!workSettings) return { status: 'on-track', message: 'No settings available' }

    const workDaysArray = workDays.split(',').map(Number)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - (today.getDay() || 7) + 1)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    let elapsedWorkDays = 0
    let totalWorkDays = 0

    if (period === 'week') {
      // Count work days from week start to today
      for (let d = new Date(weekStart); d <= today; d.setDate(d.getDate() + 1)) {
        if (workDaysArray.includes(d.getDay() || 7)) {
          elapsedWorkDays++
        }
      }
      // Count total work days in the week
      for (let d = new Date(weekStart); d < new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000); d.setDate(d.getDate() + 1)) {
        if (workDaysArray.includes(d.getDay() || 7)) {
          totalWorkDays++
        }
      }
    } else {
      // Count work days from month start to today
      for (let d = new Date(monthStart); d <= today; d.setDate(d.getDate() + 1)) {
        if (workDaysArray.includes(d.getDay() || 7)) {
          elapsedWorkDays++
        }
      }
      // Count total work days in the month
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      for (let d = new Date(monthStart); d <= lastDayOfMonth; d.setDate(d.getDate() + 1)) {
        if (workDaysArray.includes(d.getDay() || 7)) {
          totalWorkDays++
        }
      }
    }

    const expectedHours = (targetHours / totalWorkDays) * elapsedWorkDays
    const progress = currentHours / expectedHours
    const hoursDifference = Math.round((currentHours - expectedHours) * 10) / 10

    if (progress >= 1.1) {
      return { status: 'ahead', message: `${Math.abs(hoursDifference)}h ahead (${Math.round((progress - 1) * 100)}%)` }
    } else if (progress <= 0.9) {
      return { status: 'behind', message: `${Math.abs(hoursDifference)}h behind (${Math.round((1 - progress) * 100)}%)` }
    } else {
      return { status: 'on-track', message: 'On track' }
    }
  }

  const calculateDurationHours = (start: string, end: string): number => {
    const startTime = new Date(start).getTime()
    const endTime = new Date(end).getTime()
    return Math.round((endTime - startTime) / (1000 * 60 * 60) * 10) / 10
  }

  const getHolidayDates = (): string[] => {
    return holidays.map(holiday => {
      const date = new Date(holiday.date)
      return date.toISOString().split('T')[0] // Format as YYYY-MM-DD
    })
  }

  const dayCellClassNames = (arg: any) => {
    const dateStr = arg.date.toISOString().split('T')[0]
    const holidayDates = getHolidayDates()
    /**
    if (holidayDates.includes(dateStr)) {
      return ['holiday-day']
    }
    return [] */
  }

  const getHolidayEvents = () => {
    return holidays.map(holiday => ({
      id: `holiday-${holiday.date}`,
      title: holiday.name,
      start: new Date(holiday.date).toISOString().split('T')[0], // All day event
      allDay: true,
      display: 'background',
      backgroundColor: 'rgba(239, 68, 68, 0.2)',
      textColor: '#FCA5A5',
      extendedProps: {
        type: 'holiday',
        description: holiday.description,
        state: holiday.state
      }
    }))
  }

  const calendarEvents = [
    ...workSessions.map(session => ({
      id: session.id.toString(),
      title: session.notes || 'Work Session',
      start: session.startTime,
      end: session.endTime || new Date().toISOString(),
      backgroundColor: session.endTime ? '#3B82F6' : '#DC2626',
      borderColor: session.endTime ? '#2563EB' : '#DC2626',
      extendedProps: {
        timeRange: session.endTime ? 
          `${formatTime(session.startTime)} - ${formatTime(session.endTime)}` : 
          formatTime(session.startTime),
        duration: session.endTime ? 
          calculateDurationHours(session.startTime, session.endTime) : 
          null
      }
    })),
    ...getHolidayEvents()
  ]

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
    const eventId = clickInfo.event.id
    
    // Check if it's a holiday event
    if (eventId.startsWith('holiday-')) {
      const holiday = holidays.find(h => `holiday-${h.date}` === eventId)
      if (holiday) {
        // Show holiday information (you could show a modal or alert)
        alert(`${holiday.name}\n${holiday.description}\nState: ${holiday.state}`)
      }
      return
    }
    
    // Handle work session events
    const sessionId = parseInt(eventId)
    const session = workSessions.find(s => s.id === sessionId)
    if (session) {
      onEdit(session)
    }
  }

  const renderEventContent = (eventInfo: any) => {
    // Handle holiday events
    if (eventInfo.event.id.startsWith('holiday-')) {
      return {
        html: `<div class="holiday-event">${eventInfo.event.title}</div>`
      }
    }
    
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
          <h4 className="text-gray-400 text-sm">Tody</h4>
          <p className="text-xl font-semibold">{stats.daily}h</p>
        </div>
        <div className="bg-gray-800 p-3 rounded-lg">
          <h4 className="text-gray-400 text-sm">This Week</h4>
          <p className="text-xl font-semibold">{stats.weekly}h / {workSettings && (workSettings?.expectedWeeklyHours || 0) }h</p>
          <div className="mt-2">
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  workSettings ? (calculateProgressStatus(stats.weekly, workSettings.expectedWeeklyHours, workSettings.workDays, 'week').status === 'ahead' ? 'bg-green-600' :
                  calculateProgressStatus(stats.weekly, workSettings.expectedWeeklyHours, workSettings.workDays, 'week').status === 'behind' ? 'bg-red-600' : 'bg-blue-600') : 'bg-blue-600'
                }`}
                style={{ width: `${Math.min((stats.weekly / (workSettings?.expectedWeeklyHours || 0)) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {Math.round((stats.weekly / (workSettings?.expectedWeeklyHours || 0)) * 100)}% of {workSettings?.expectedWeeklyHours || 0}h
              {workSettings && (
                <span className={`ml-2 ${
                  calculateProgressStatus(stats.weekly, workSettings.expectedWeeklyHours, workSettings.workDays, 'week').status === 'ahead' ? 'text-green-400' :
                  calculateProgressStatus(stats.weekly, workSettings.expectedWeeklyHours, workSettings.workDays, 'week').status === 'behind' ? 'text-red-400' : 'text-blue-400'
                }`}>
                  ({calculateProgressStatus(stats.weekly, workSettings.expectedWeeklyHours, workSettings.workDays, 'week').message})
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="bg-gray-800 p-3 rounded-lg">
          <h4 className="text-gray-400 text-sm">This Month</h4>
          <p className="text-xl font-semibold">{stats.monthly}h / {workSettings && (workSettings?.expectedMonthlyHours || 0) }h</p>
          <div className="mt-2">
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  workSettings ? (calculateProgressStatus(stats.monthly, workSettings.expectedMonthlyHours, workSettings.workDays, 'month').status === 'ahead' ? 'bg-green-600' :
                  calculateProgressStatus(stats.monthly, workSettings.expectedMonthlyHours, workSettings.workDays, 'month').status === 'behind' ? 'bg-red-600' : 'bg-blue-600') : 'bg-blue-600'
                }`}
                style={{ width: `${Math.min((stats.monthly / (workSettings?.expectedMonthlyHours || 0)) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {Math.round((stats.monthly / (workSettings?.expectedMonthlyHours || 0)) * 100)}% of {workSettings?.expectedMonthlyHours || 0}h
              {workSettings && (
                <span className={`ml-2 ${
                  calculateProgressStatus(stats.monthly, workSettings.expectedMonthlyHours, workSettings.workDays, 'month').status === 'ahead' ? 'text-green-400' :
                  calculateProgressStatus(stats.monthly, workSettings.expectedMonthlyHours, workSettings.workDays, 'month').status === 'behind' ? 'text-red-400' : 'text-blue-400'
                }`}>
                  ({calculateProgressStatus(stats.monthly, workSettings.expectedMonthlyHours, workSettings.workDays, 'month').message})
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="bg-gray-800 p-3 rounded-lg">
          <h4 className="text-gray-400 text-sm">Total</h4>
          <p className="text-xl font-semibold">{stats.total}h</p>
        </div>
      </div>
      <div className="flex-1 bg-gray-800 rounded-lg p-3 min-h-0 overflow-hidden calendar-container">
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
    </div>
  )
}

export default WorkCalendar 