import type { WorkSettings } from './SettingsModal'

interface WorkStats {
  daily: number
  weekly: number
  monthly: number
  total: number
}

interface SummaryModalProps {
  isOpen: boolean
  onClose: () => void
  stats: WorkStats
  workSettings: WorkSettings | undefined
  calculateProgressStatus: (currentHours: number, targetHours: number, workDays: string, period: 'week' | 'month') => { status: 'on-track' | 'behind' | 'ahead', message: string }
}

const SummaryModal = ({ isOpen, onClose, stats, workSettings, calculateProgressStatus }: SummaryModalProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Work Summary</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="bg-gray-700 p-4 rounded-lg">
            <h4 className="text-gray-300 text-sm mb-2">Today</h4>
            <p className="text-2xl font-semibold">{stats.daily}h</p>
          </div>
          
          <div className="bg-gray-700 p-4 rounded-lg">
            <h4 className="text-gray-300 text-sm mb-2">This Week</h4>
            <p className="text-2xl font-semibold">{stats.weekly}h / {workSettings?.expectedWeeklyHours || 0}h</p>
            <div className="mt-3">
              <div className="h-3 bg-gray-600 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    workSettings ? (calculateProgressStatus(stats.weekly, workSettings.expectedWeeklyHours, workSettings.workDays, 'week').status === 'ahead' ? 'bg-green-600' :
                    calculateProgressStatus(stats.weekly, workSettings.expectedWeeklyHours, workSettings.workDays, 'week').status === 'behind' ? 'bg-red-600' : 'bg-blue-600') : 'bg-blue-600'
                  }`}
                  style={{ width: `${Math.min((stats.weekly / (workSettings?.expectedWeeklyHours || 1)) * 100, 100)}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 mt-2">
                {Math.round((stats.weekly / (workSettings?.expectedWeeklyHours || 1)) * 100)}% of {workSettings?.expectedWeeklyHours || 0}h
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
          
          <div className="bg-gray-700 p-4 rounded-lg">
            <h4 className="text-gray-300 text-sm mb-2">This Month</h4>
            <p className="text-2xl font-semibold">{stats.monthly}h / {workSettings?.expectedMonthlyHours || 0}h</p>
            <div className="mt-3">
              <div className="h-3 bg-gray-600 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    workSettings ? (calculateProgressStatus(stats.monthly, workSettings.expectedMonthlyHours, workSettings.workDays, 'month').status === 'ahead' ? 'bg-green-600' :
                    calculateProgressStatus(stats.monthly, workSettings.expectedMonthlyHours, workSettings.workDays, 'month').status === 'behind' ? 'bg-red-600' : 'bg-blue-600') : 'bg-blue-600'
                  }`}
                  style={{ width: `${Math.min((stats.monthly / (workSettings?.expectedMonthlyHours || 1)) * 100, 100)}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 mt-2">
                {Math.round((stats.monthly / (workSettings?.expectedMonthlyHours || 1)) * 100)}% of {workSettings?.expectedMonthlyHours || 0}h
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
          
          <div className="bg-gray-700 p-4 rounded-lg">
            <h4 className="text-gray-300 text-sm mb-2">Total</h4>
            <p className="text-2xl font-semibold">{stats.total}h</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SummaryModal 