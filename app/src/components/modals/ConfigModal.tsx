import { useState, useEffect } from 'react'
import { useAuthenticatedFetch } from '../../context/AuthContext'

interface ConfigModalProps {
  isOpen: boolean
  onClose: () => void
}

interface WorkConfig {
  id?: number
  username?: string
  expectedWeeklyHours: number
  expectedDailyHours: number
  trackLunchBreak: boolean
  defaultLunchBreakMinutes: number
  workDays: string
  showForecast: boolean
}

const WEEKDAYS = [
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
  { value: '7', label: 'Sunday' },
]

const ConfigModal = ({ isOpen, onClose }: ConfigModalProps) => {
  const [config, setConfig] = useState<WorkConfig>({
    id: undefined,
    username: undefined,
    expectedWeeklyHours: 40,
    expectedDailyHours: 8,
    trackLunchBreak: true,
    defaultLunchBreakMinutes: 30,
    workDays: '1,2,3,4,5',
    showForecast: true
  })
  const [error, setError] = useState<string | null>(null)
  const [isWorkDaysOpen, setIsWorkDaysOpen] = useState(false)
  const authenticatedFetch = useAuthenticatedFetch()
  const API_URL = (import.meta.env.VITE_API_URL || '') + "/api/v1"

  useEffect(() => {
    if (isOpen) {
      fetchConfig()
    }
  }, [isOpen])

  const fetchConfig = async () => {
    try {
      const response = await authenticatedFetch(`${API_URL}/work/config`)
      if (!response.ok) {
        throw new Error('Failed to fetch configuration')
      }
      const data = await response.json()
      setConfig(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch configuration')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await authenticatedFetch(`${API_URL}/work/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      })

      if (!response.ok) {
        throw new Error('Failed to update configuration')
      }

      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update configuration')
    }
  }

  const toggleWorkDay = (dayValue: string) => {
    if (!config) return

    const currentDays = config.workDays.split(',').filter(Boolean)
    const newDays = currentDays.includes(dayValue)
      ? currentDays.filter(d => d !== dayValue)
      : [...currentDays, dayValue].sort()

    setConfig({ ...config, workDays: newDays.join(',') })
  }

  const getSelectedDays = () => {
    if (!config) return []
    return config.workDays.split(',').filter(Boolean)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Work Configuration</h2>
        
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        {config && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Expected Weekly Hours
              </label>
              <input
                type="number"
                value={config.expectedWeeklyHours}
                onChange={(e) => setConfig({ ...config, expectedWeeklyHours: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                step="0.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Expected Daily Hours
              </label>
              <input
                type="number"
                value={config.expectedDailyHours}
                onChange={(e) => setConfig({ ...config, expectedDailyHours: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                step="0.5"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="trackLunchBreak"
                checked={config.trackLunchBreak}
                onChange={(e) => setConfig({ ...config, trackLunchBreak: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
              />
              <label htmlFor="trackLunchBreak" className="ml-2 block text-sm text-gray-300">
                Track Lunch Break
              </label>
            </div>

            {config.trackLunchBreak && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Default Lunch Break (minutes)
                </label>
                <input
                  type="number"
                  value={config.defaultLunchBreakMinutes}
                  onChange={(e) => setConfig({ ...config, defaultLunchBreakMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="5"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Work Days
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsWorkDaysOpen(!isWorkDaysOpen)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {getSelectedDays().length > 0
                    ? getSelectedDays()
                        .map(day => WEEKDAYS.find(w => w.value === day)?.label)
                        .join(', ')
                    : 'Select work days'}
                </button>
                
                {isWorkDaysOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg">
                    {WEEKDAYS.map(day => (
                      <label
                        key={day.value}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-600 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={getSelectedDays().includes(day.value)}
                          onChange={() => toggleWorkDay(day.value)}
                          className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-600 bg-gray-700 focus:ring-blue-500"
                        />
                        <span className="text-white">{day.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="showForecast"
                checked={config.showForecast}
                onChange={(e) => setConfig({ ...config, showForecast: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
              />
              <label htmlFor="showForecast" className="ml-2 block text-sm text-gray-300">
                Show Forecast
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
              >
                Save
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ConfigModal 