import type { WorkSettings } from '../modals/SettingsModal'
import type { CalendarWorkStats } from '../../utils/workCalendarUtils'
import { calendarCalculateProgressStatus } from '../../utils/workCalendarUtils'

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

  return (
    <div className="grid grid-cols-4 gap-3 mb-4 shrink-0">
      <div className="bg-gray-800 p-3 rounded-lg">
        <h4 className="text-gray-400 text-sm">Today</h4>
        <p className="text-xl font-semibold">{stats.daily}h</p>
      </div>
      <div className="bg-gray-800 p-3 rounded-lg">
        <h4 className="text-gray-400 text-sm">This Week</h4>
        <p className="text-xl font-semibold">
          {stats.weekly}h / {workSettings && (workSettings?.expectedWeeklyHours || 0)}h
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
            {workSettings?.expectedWeeklyHours || 0}h
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
          {stats.monthly}h / {workSettings && (workSettings?.expectedMonthlyHours || 0)}h
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
            {workSettings?.expectedMonthlyHours || 0}h
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
        <p className="text-xl font-semibold">{stats.total}h</p>
      </div>
    </div>
  )
}

export default CalendarStatsBar
