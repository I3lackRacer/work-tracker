import { useState, useEffect } from 'react'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (settings: WorkSettings) => void
  initialSettings?: WorkSettings
}

export interface WorkSettings {
  expectedWeeklyHours: number
  expectedMonthlyHours: number
  trackLunchBreak: boolean
  defaultLunchBreakMinutes: number
  workDays: string // Comma-separated list of day numbers (1-7, where 1 is Monday)
  state: string
  showHolidays: boolean
}

const FEDERAL_STATES = [
  { value: 'BW', label: 'Baden-Württemberg' },
  { value: 'BY', label: 'Bayern' },
  { value: 'BE', label: 'Berlin' },
  { value: 'BB', label: 'Brandenburg' },
  { value: 'HB', label: 'Bremen' },
  { value: 'HH', label: 'Hamburg' },
  { value: 'HE', label: 'Hessen' },
  { value: 'MV', label: 'Mecklenburg-Vorpommern' },
  { value: 'NI', label: 'Niedersachsen' },
  { value: 'NW', label: 'Nordrhein-Westfalen' },
  { value: 'RP', label: 'Rheinland-Pfalz' },
  { value: 'SL', label: 'Saarland' },
  { value: 'SN', label: 'Sachsen' },
  { value: 'ST', label: 'Sachsen-Anhalt' },
  { value: 'SH', label: 'Schleswig-Holstein' },
  { value: 'TH', label: 'Thüringen' },
  { value: 'NATIONAL', label: 'Deutschlandweit' }
]

const defaultSettings: WorkSettings = {
  expectedWeeklyHours: 40,
  expectedMonthlyHours: 160, // 40 hours * 4 weeks
  trackLunchBreak: true,
  defaultLunchBreakMinutes: 30,
  workDays: '1,2,3,4,5', // Monday to Friday
  state: 'NATIONAL',
  showHolidays: true
}

const DAYS_OF_WEEK = [
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
  { value: '7', label: 'Sunday' }
]

const SettingsModal = ({ isOpen, onClose, onSave, initialSettings }: SettingsModalProps) => {
  const [settings, setSettings] = useState<WorkSettings>(() => {
    // Ensure all required fields are present in the initial settings
    return {
      ...defaultSettings,
      ...initialSettings,
      workDays: initialSettings?.workDays || defaultSettings.workDays
    }
  })

  // Update settings when initialSettings changes
  useEffect(() => {
    if (initialSettings) {
      setSettings({
        ...defaultSettings,
        ...initialSettings,
        workDays: initialSettings.workDays || defaultSettings.workDays
      })
    }
  }, [initialSettings])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(settings)
    onClose()
  }

  const handleWorkDayToggle = (day: string) => {
    const currentDays = settings.workDays.split(',')
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort()
    setSettings(prev => ({
      ...prev,
      workDays: newDays.join(',')
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Work Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Expected Hours Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Expected Hours</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Weekly Hours</label>
                <input
                  type="number"
                  min="0"
                  max="168"
                  value={settings.expectedWeeklyHours}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    expectedWeeklyHours: parseInt(e.target.value)
                  }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Monthly Hours</label>
                <input
                  type="number"
                  min="0"
                  max="720"
                  value={settings.expectedMonthlyHours}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    expectedMonthlyHours: parseInt(e.target.value)
                  }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

                    {/* Lunch Break and Federal State Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Lunch Break</h3>
              
              {/* Track Lunch Break Checkbox */}
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.trackLunchBreak}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    trackLunchBreak: e.target.checked
                  }))}
                  className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-600 bg-gray-700 focus:ring-blue-500"
                />
                <span className="text-gray-300">Track Lunch Break</span>
              </label>

              {/* Break Duration Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Default Break Duration (minutes)</label>
                <input
                  type="number"
                  min="0"
                  max="180"
                  value={settings.defaultLunchBreakMinutes}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    defaultLunchBreakMinutes: parseInt(e.target.value)
                  }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>


            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Federal State</h3>
              
              {/* Show Holidays Checkbox */}
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.showHolidays}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    showHolidays: e.target.checked
                  }))}
                  className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-600 bg-gray-700 focus:ring-blue-500"
                />
                <span className="text-gray-300">Show Holidays</span>
              </label>
              
              {/* State Select */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Select your federal state</label>
                <select
                  value={settings.state}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    state: e.target.value
                  }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {FEDERAL_STATES.map(state => (
                    <option key={state.value} value={state.value}>
                      {state.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Work Days Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Work Days</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {DAYS_OF_WEEK.map(day => (
                <label
                  key={day.value}
                  className="flex items-center space-x-2 p-2 rounded-lg border border-gray-600 hover:bg-gray-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={settings.workDays?.split(',').includes(day.value) || false}
                    onChange={() => handleWorkDayToggle(day.value)}
                    className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-600 bg-gray-700 focus:ring-blue-500"
                  />
                  <span className="text-gray-300">{day.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
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
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SettingsModal 