import { useEffect, useRef, useState } from 'react'
import { useWorkTracker } from '../context/WorkTrackerContext'
import CalendarStatsBar from './calendar/CalendarStatsBar'
import FullCalendarPane from './calendar/FullCalendarPane'
import {
  buildHolidayCalendarEvents,
  buildSessionCalendarEvents,
  computeCalendarStatsFromSessions,
  type CalendarWorkStats,
} from '../utils/workCalendarUtils'

const WorkCalendar = () => {
  const { workSessions, workSettings, holidays, addManualEntry, setEditingSession, isWorking } = useWorkTracker()
  const sessionsRef = useRef(workSessions)
  sessionsRef.current = workSessions

  const [stats, setStats] = useState<CalendarWorkStats>({
    daily: 0,
    dailyPrecise: 0,
    weekly: 0,
    monthly: 0,
    total: 0,
  })

  useEffect(() => {
    setStats(computeCalendarStatsFromSessions(workSessions))
  }, [workSessions])

  useEffect(() => {
    if (!isWorking) return
    const id = setInterval(() => {
      setStats(computeCalendarStatsFromSessions(sessionsRef.current))
    }, 60_000)
    return () => clearInterval(id)
  }, [isWorking])

  const calendarEvents = [...buildSessionCalendarEvents(workSessions), ...buildHolidayCalendarEvents(holidays)]

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      <CalendarStatsBar stats={stats} workSettings={workSettings} />
      <FullCalendarPane
        calendarEvents={calendarEvents}
        workSessions={workSessions}
        holidays={holidays}
        onAddManualEntry={addManualEntry}
        onEditSession={setEditingSession}
      />
    </div>
  )
}

export default WorkCalendar
