import { useEffect, useState } from 'react'
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
  const { workSessions, workSettings, holidays, addManualEntry, setEditingSession } = useWorkTracker()

  const [stats, setStats] = useState<CalendarWorkStats>({
    daily: 0,
    weekly: 0,
    monthly: 0,
    total: 0,
  })

  useEffect(() => {
    setStats(computeCalendarStatsFromSessions(workSessions))
  }, [workSessions])

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
