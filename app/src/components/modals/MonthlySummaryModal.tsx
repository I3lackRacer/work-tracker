import { useState, useEffect, useMemo } from 'react'
import type { WorkSession } from '../../types/work'
import type { WorkSettings } from './SettingsModal'

interface MonthlyStats {
  totalHours: number
  totalSessions: number
  averageSessionLength: number
  averageDailyHours: number
  workDays: number
  longestSession: { hours: number; date: string; notes?: string }
  shortestSession: { hours: number; date: string; notes?: string }
  mostProductiveDay: { day: string; hours: number }
  leastProductiveDay: { day: string; hours: number }
  dailyBreakdown: Array<{ date: string; hours: number; sessions: number }>
  weeklyBreakdown: Array<{ week: string; hours: number; days: number }>
  targetHours: number
  targetAchievement: number
  overtimeHours: number
  undertimeHours: number
}

interface MonthlySummaryModalProps {
  isOpen: boolean
  onClose: () => void
  workSessions: WorkSession[]
  workSettings: WorkSettings | undefined
}

const MonthlySummaryModal = ({ isOpen, onClose, workSessions, workSettings }: MonthlySummaryModalProps) => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const calculateHours = (session: WorkSession): number => {
    if (!session.endTime) return 0
    return (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60 * 60)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const formatMonth = (monthString: string): string => {
    const [year, month] = monthString.split('-')
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    })
  }

  const getMonthSessions = (monthString: string): WorkSession[] => {
    const [year, month] = monthString.split('-')
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
    const endDate = new Date(parseInt(year), parseInt(month), 0)
    
    return workSessions.filter(session => {
      const sessionDate = new Date(session.startTime)
      return sessionDate >= startDate && sessionDate <= endDate && session.endTime
    })
  }

  const calculateMonthlyStats = (sessions: WorkSession[]): MonthlyStats => {
    if (sessions.length === 0) {
      return {
        totalHours: 0,
        totalSessions: 0,
        averageSessionLength: 0,
        averageDailyHours: 0,
        workDays: 0,
        longestSession: { hours: 0, date: '', notes: '' },
        shortestSession: { hours: 0, date: '', notes: '' },
        mostProductiveDay: { day: '', hours: 0 },
        leastProductiveDay: { day: '', hours: 0 },
        dailyBreakdown: [],
        weeklyBreakdown: [],
        targetHours: workSettings?.expectedMonthlyHours || 0,
        targetAchievement: 0,
        overtimeHours: 0,
        undertimeHours: 0
      }
    }

    const totalHours = sessions.reduce((acc, session) => acc + calculateHours(session), 0)
    const totalSessions = sessions.length
    const averageSessionLength = totalHours / totalSessions

    // Daily breakdown
    const dailyMap = new Map<string, { hours: number; sessions: number }>()
    sessions.forEach(session => {
      const date = new Date(session.startTime).toISOString().split('T')[0]
      const hours = calculateHours(session)
      const existing = dailyMap.get(date) || { hours: 0, sessions: 0 }
      dailyMap.set(date, { hours: existing.hours + hours, sessions: existing.sessions + 1 })
    })

    const dailyBreakdown = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      hours: data.hours,
      sessions: data.sessions
    })).sort((a, b) => a.date.localeCompare(b.date))

    const workDays = dailyBreakdown.length
    const averageDailyHours = totalHours / workDays

    // Find longest and shortest sessions
    const sessionDetails = sessions.map(session => ({
      hours: calculateHours(session),
      date: formatDate(session.startTime),
      notes: session.notes
    }))

    const longestSession = sessionDetails.reduce((max, session) => 
      session.hours > max.hours ? session : max, sessionDetails[0])
    const shortestSession = sessionDetails.reduce((min, session) => 
      session.hours < min.hours ? session : min, sessionDetails[0])

    // Most and least productive days
    const mostProductiveDay = dailyBreakdown.reduce((max, day) => 
      day.hours > max.hours ? { day: formatDate(day.date), hours: day.hours } : max, 
      { day: '', hours: 0 })
    const leastProductiveDay = dailyBreakdown.reduce((min, day) => 
      day.hours < min.hours ? { day: formatDate(day.date), hours: day.hours } : min, 
      { day: '', hours: 0 })

    // Weekly breakdown
    const weeklyMap = new Map<string, { hours: number; days: Set<string> }>()
    dailyBreakdown.forEach(day => {
      const date = new Date(day.date)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      const weekKey = weekStart.toISOString().split('T')[0]
      
      const existing = weeklyMap.get(weekKey) || { hours: 0, days: new Set() }
      existing.hours += day.hours
      existing.days.add(day.date)
      weeklyMap.set(weekKey, existing)
    })

    const weeklyBreakdown = Array.from(weeklyMap.entries()).map(([week, data]) => ({
      week: formatDate(week),
      hours: data.hours,
      days: data.days.size
    })).sort((a, b) => a.week.localeCompare(b.week))

    const targetHours = workSettings?.expectedMonthlyHours || 0
    const targetAchievement = targetHours > 0 ? (totalHours / targetHours) * 100 : 0
    const overtimeHours = Math.max(0, totalHours - targetHours)
    const undertimeHours = Math.max(0, targetHours - totalHours)

    return {
      totalHours,
      totalSessions,
      averageSessionLength,
      averageDailyHours,
      workDays,
      longestSession,
      shortestSession,
      mostProductiveDay,
      leastProductiveDay,
      dailyBreakdown,
      weeklyBreakdown,
      targetHours,
      targetAchievement,
      overtimeHours,
      undertimeHours
    }
  }

  const monthSessions = useMemo(() => getMonthSessions(selectedMonth), [selectedMonth, workSessions])
  const stats = useMemo(() => calculateMonthlyStats(monthSessions), [monthSessions])

  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, month] = selectedMonth.split('-').map(Number)
    let newYear = year
    let newMonth = month

    if (direction === 'prev') {
      if (month === 1) {
        newMonth = 12
        newYear = year - 1
      } else {
        newMonth = month - 1
      }
    } else {
      if (month === 12) {
        newMonth = 1
        newYear = year + 1
      } else {
        newMonth = month + 1
      }
    }

    setSelectedMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Monthly Summary</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigateMonth('prev')}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200"
          >
            ← Previous Month
          </button>
          <h3 className="text-xl font-semibold">{formatMonth(selectedMonth)}</h3>
          <button
            onClick={() => navigateMonth('next')}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200"
          >
            Next Month →
          </button>
        </div>

        {monthSessions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-lg">No work sessions found for {formatMonth(selectedMonth)}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Overview Stats */}
            <div className="space-y-4">
              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="text-lg font-semibold mb-3">Overview</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Total Hours</p>
                    <p className="text-2xl font-bold">{stats.totalHours.toFixed(1)}h</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Work Sessions</p>
                    <p className="text-2xl font-bold">{stats.totalSessions}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Work Days</p>
                    <p className="text-2xl font-bold">{stats.workDays}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Avg Session</p>
                    <p className="text-2xl font-bold">{stats.averageSessionLength.toFixed(1)}h</p>
                  </div>
                </div>
              </div>

              {/* Target Achievement */}
              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="text-lg font-semibold mb-3">Target Achievement</h4>
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{stats.totalHours.toFixed(1)}h / {stats.targetHours}h</span>
                    <span>{stats.targetAchievement.toFixed(1)}%</span>
                  </div>
                  <div className="h-3 bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        stats.targetAchievement >= 100 ? 'bg-green-600' : 
                        stats.targetAchievement >= 80 ? 'bg-yellow-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${Math.min(stats.targetAchievement, 100)}%` }}
                    />
                  </div>
                </div>
                {stats.overtimeHours > 0 && (
                  <p className="text-green-400 text-sm">+{stats.overtimeHours.toFixed(1)}h overtime</p>
                )}
                {stats.undertimeHours > 0 && (
                  <p className="text-red-400 text-sm">-{stats.undertimeHours.toFixed(1)}h under target</p>
                )}
              </div>

              {/* Session Records */}
              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="text-lg font-semibold mb-3">Session Records</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-400 text-sm">Longest Session</p>
                    <p className="font-semibold">{stats.longestSession.hours.toFixed(1)}h on {stats.longestSession.date}</p>
                    {stats.longestSession.notes && (
                      <p className="text-gray-400 text-xs">{stats.longestSession.notes}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Shortest Session</p>
                    <p className="font-semibold">{stats.shortestSession.hours.toFixed(1)}h on {stats.shortestSession.date}</p>
                    {stats.shortestSession.notes && (
                      <p className="text-gray-400 text-xs">{stats.shortestSession.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Daily and Weekly Breakdown */}
            <div className="space-y-4">
              {/* Most Productive Days */}
              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="text-lg font-semibold mb-3">Productivity Highlights</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-400 text-sm">Most Productive Day</p>
                    <p className="font-semibold text-green-400">{stats.mostProductiveDay.day} ({stats.mostProductiveDay.hours.toFixed(1)}h)</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Least Productive Day</p>
                    <p className="font-semibold text-red-400">{stats.leastProductiveDay.day} ({stats.leastProductiveDay.hours.toFixed(1)}h)</p>
                  </div>
                </div>
              </div>

              {/* Daily Breakdown */}
              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="text-lg font-semibold mb-3">Daily Breakdown</h4>
                <div className="max-h-48 overflow-y-auto">
                  {stats.dailyBreakdown.map(day => (
                    <div key={day.date} className="flex justify-between items-center py-1 border-b border-gray-600 last:border-b-0">
                      <span className="text-sm">{formatDate(day.date)}</span>
                      <div className="text-right">
                        <span className="font-semibold">{day.hours.toFixed(1)}h</span>
                        <span className="text-gray-400 text-xs ml-2">({day.sessions} sessions)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly Breakdown */}
              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="text-lg font-semibold mb-3">Weekly Breakdown</h4>
                <div className="space-y-2">
                  {stats.weeklyBreakdown.map(week => (
                    <div key={week.week} className="flex justify-between items-center py-1 border-b border-gray-600 last:border-b-0">
                      <span className="text-sm">{week.week}</span>
                      <div className="text-right">
                        <span className="font-semibold">{week.hours.toFixed(1)}h</span>
                        <span className="text-gray-400 text-xs ml-2">({week.days} days)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MonthlySummaryModal 