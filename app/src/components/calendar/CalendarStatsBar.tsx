import type { WorkSettings } from '../modals/SettingsModal'
import type { CalendarWorkStats } from '../../utils/workCalendarUtils'
import { calendarCalculateProgressStatus, formatHoursAndMinutes } from '../../utils/workCalendarUtils'

interface CalendarStatsBarProps {
  stats: CalendarWorkStats
  workSettings: WorkSettings | undefined
}

const CalendarStatsBar = ({ stats, workSettings }: CalendarStatsBarProps) => {
  const weekProgress = workSettings
    ? calendarCalculateProgressStatus(
        workSettings,
        stats.weekly,
        workSettings.expectedWeeklyHours,
        workSettings.workDays,
        'week'
      )
    : null
  const monthProgress = workSettings
    ? calendarCalculateProgressStatus(
        workSettings,
        stats.monthly,
        workSettings.expectedMonthlyHours,
        workSettings.workDays,
        'month'
      )
    : null

  const todayHm = formatHoursAndMinutes(stats.dailyPrecise)
  const weekHm = formatHoursAndMinutes(stats.weekly)
  const monthHm = formatHoursAndMinutes(stats.monthly)
  const totalHm = formatHoursAndMinutes(stats.total)
  const expectedWeekHm = workSettings ? formatHoursAndMinutes(workSettings.expectedWeeklyHours) : null
  const expectedMonthHm = workSettings ? formatHoursAndMinutes(workSettings.expectedMonthlyHours) : null

  return (
    <div className="grid grid-cols-4 gap-3 mb-4 shrink-0">
      <div className="bg-gray-800 p-3 rounded-lg">
        <h4 className="text-gray-400 text-sm">Today</h4>
        <p className="text-xl font-semibold">{todayHm.primary}</p>
      </div>
      <div className="bg-gray-800 p-3 rounded-lg">
        <h4 className="text-gray-400 text-sm">This Week</h4>
        <p className="text-xl font-semibold">
          {weekHm.primary} / {expectedWeekHm?.primary ?? '—'}
        </p>
        <div className="mt-2">
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                workSettings
                  ? weekProgress?.status === 'ahead'
                    ? 'bg-green-600'
                    : weekProgress?.status === 'behind'
                      ? 'bg-red-600'
                      : 'bg-blue-600'
                  : 'bg-blue-600'
              }`}
              style={{
                width: `${Math.min((stats.weekly / (workSettings?.expectedWeeklyHours || 0)) * 100, 100)}%`,
              }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {Math.round((stats.weekly / (workSettings?.expectedWeeklyHours || 0)) * 100)}% of{' '}
            {expectedWeekHm?.primary ?? '—'}
            {workSettings && weekProgress && (
              <span
                className={`ml-2 ${
                  weekProgress.status === 'ahead'
                    ? 'text-green-400'
                    : weekProgress.status === 'behind'
                      ? 'text-red-400'
                      : 'text-blue-400'
                }`}
              >
                ({weekProgress.message})
              </span>
            )}
          </p>
        </div>
      </div>
      <div className="bg-gray-800 p-3 rounded-lg">
        <h4 className="text-gray-400 text-sm">This Month</h4>
        <p className="text-xl font-semibold">
          {monthHm.primary} / {expectedMonthHm?.primary ?? '—'}
        </p>
        <div className="mt-2">
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                workSettings
                  ? monthProgress?.status === 'ahead'
                    ? 'bg-green-600'
                    : monthProgress?.status === 'behind'
                      ? 'bg-red-600'
                      : 'bg-blue-600'
                  : 'bg-blue-600'
              }`}
              style={{
                width: `${Math.min((stats.monthly / (workSettings?.expectedMonthlyHours || 0)) * 100, 100)}%`,
              }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {Math.round((stats.monthly / (workSettings?.expectedMonthlyHours || 0)) * 100)}% of{' '}
            {expectedMonthHm?.primary ?? '—'}
            {workSettings && monthProgress && (
              <span
                className={`ml-2 ${
                  monthProgress.status === 'ahead'
                    ? 'text-green-400'
                    : monthProgress.status === 'behind'
                      ? 'text-red-400'
                      : 'text-blue-400'
                }`}
              >
                ({monthProgress.message})
              </span>
            )}
          </p>
        </div>
      </div>
      <div className="bg-gray-800 p-3 rounded-lg">
        <h4 className="text-gray-400 text-sm">Total</h4>
        <p className="text-xl font-semibold">{totalHm.primary}</p>
      </div>
    </div>
  )
}

export default CalendarStatsBar
