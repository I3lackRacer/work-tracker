import type { WorkSession } from '../types/work'
import type { WorkSettings } from '../components/modals/SettingsModal'
import type { Holiday } from '../types/holiday'
import { formatTime } from './dateUtils'

export interface CalendarWorkStats {
  daily: number
  weekly: number
  monthly: number
  total: number
}

export function computeCalendarStatsFromSessions(workSessions: WorkSession[]): CalendarWorkStats {
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

  const total = completedSessions.reduce((acc, session) => acc + calculateHours(session), 0)

  return {
    daily: Math.round(daily * 10) / 10,
    weekly: Math.round(weekly * 10) / 10,
    monthly: Math.round(monthly * 10) / 10,
    total: Math.round(total * 10) / 10,
  }
}

export function calendarCalculateProgressStatus(
  workSettings: WorkSettings | undefined,
  currentHours: number,
  targetHours: number,
  workDays: string,
  period: 'week' | 'month'
): { status: 'on-track' | 'behind' | 'ahead'; message: string } {
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
    for (let d = new Date(weekStart); d <= today; d.setDate(d.getDate() + 1)) {
      if (workDaysArray.includes(d.getDay() || 7)) {
        elapsedWorkDays++
      }
    }
    for (let d = new Date(weekStart); d < new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000); d.setDate(d.getDate() + 1)) {
      if (workDaysArray.includes(d.getDay() || 7)) {
        totalWorkDays++
      }
    }
  } else {
    for (let d = new Date(monthStart); d <= today; d.setDate(d.getDate() + 1)) {
      if (workDaysArray.includes(d.getDay() || 7)) {
        elapsedWorkDays++
      }
    }
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
  }
  if (progress <= 0.9) {
    return { status: 'behind', message: `${Math.abs(hoursDifference)}h behind (${Math.round((1 - progress) * 100)}%)` }
  }
  return { status: 'on-track', message: 'On track' }
}

export function calculateDurationHours(start: string, end: string): number {
  const startTime = new Date(start).getTime()
  const endTime = new Date(end).getTime()
  return Math.round(((endTime - startTime) / (1000 * 60 * 60)) * 10) / 10
}

export function buildHolidayCalendarEvents(holidays: Holiday[]) {
  return holidays.map(holiday => ({
    id: `holiday-${holiday.date}`,
    title: holiday.name,
    start: new Date(holiday.date).toISOString().split('T')[0],
    allDay: true,
    display: 'background' as const,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    textColor: '#FCA5A5',
    extendedProps: {
      type: 'holiday',
      description: holiday.description,
      state: holiday.state,
    },
  }))
}

export function buildSessionCalendarEvents(workSessions: WorkSession[]) {
  return workSessions.map(session => ({
    id: session.id.toString(),
    title: session.notes || 'Work Session',
    start: session.startTime,
    end: session.endTime || new Date().toISOString(),
    backgroundColor: session.endTime ? '#3B82F6' : '#DC2626',
    borderColor: session.endTime ? '#2563EB' : '#DC2626',
    extendedProps: {
      timeRange: session.endTime
        ? `${formatTime(session.startTime)} - ${formatTime(session.endTime)}`
        : formatTime(session.startTime),
      duration: session.endTime ? calculateDurationHours(session.startTime, session.endTime) : null,
    },
  }))
}
