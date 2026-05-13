import type { WorkSession } from '../types/work'
import type { WorkSettings } from '../components/modals/SettingsModal'
import type { Holiday } from '../types/holiday'
import { formatDuration, formatTime } from './dateUtils'

export interface CalendarWorkStats {
  daily: number
  /** Unrounded; use for Today h/m and minutes so display matches live session time. */
  dailyPrecise: number
  weekly: number
  monthly: number
  total: number
}

/** Rounded display for fractional hours: `3h`, `3h 24m` (aligned with {@link formatDuration}). */
export function formatHoursAndMinutes(hours: number): { primary: string; minutesTotal: number } {
  const totalMinutes = Math.max(0, Math.round(hours * 60))
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (totalMinutes === 0) return { primary: '0h', minutesTotal: 0 }
  const primary = m === 0 ? `${h}h` : `${h}h ${m}m`
  return { primary, minutesTotal: totalMinutes }
}

function sessionHoursThrough(session: WorkSession, asOf: Date): number {
  const start = new Date(session.startTime).getTime()
  const endMs = session.endTime ? new Date(session.endTime).getTime() : asOf.getTime()
  return Math.max(0, endMs - start) / (1000 * 60 * 60)
}

export function computeCalendarStatsFromSessions(workSessions: WorkSession[], asOf: Date = new Date()): CalendarWorkStats {
  const today = new Date(asOf.getFullYear(), asOf.getMonth(), asOf.getDate())
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - (today.getDay() || 7) + 1)
  const monthStart = new Date(asOf.getFullYear(), asOf.getMonth(), 1)

  const calculateHours = (session: WorkSession): number => sessionHoursThrough(session, asOf)

  const daily = workSessions
    .filter(session => new Date(session.startTime) >= today)
    .reduce((acc, session) => acc + calculateHours(session), 0)

  const weekly = workSessions
    .filter(session => new Date(session.startTime) >= weekStart)
    .reduce((acc, session) => acc + calculateHours(session), 0)

  const monthly = workSessions
    .filter(session => new Date(session.startTime) >= monthStart)
    .reduce((acc, session) => acc + calculateHours(session), 0)

  const total = workSessions
    .filter(session => session.endTime)
    .reduce((acc, session) => acc + calculateHours(session), 0)

  return {
    daily: Math.round(daily * 10) / 10,
    dailyPrecise: daily,
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
  const diffHm = formatHoursAndMinutes(Math.abs(hoursDifference)).primary

  if (progress >= 1.1) {
    return { status: 'ahead', message: `${diffHm} ahead (${Math.round((progress - 1) * 100)}%)` }
  }
  if (progress <= 0.9) {
    return { status: 'behind', message: `${diffHm} behind (${Math.round((1 - progress) * 100)}%)` }
  }
  return { status: 'on-track', message: 'On track' }
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
      duration: session.endTime ? formatDuration(session.startTime, session.endTime) : null,
    },
  }))
}
