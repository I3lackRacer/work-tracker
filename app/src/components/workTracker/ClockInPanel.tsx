import { useWorkTracker } from '../../context/WorkTrackerContext'

const ClockInPanel = () => {
  const {
    isManualEntry,
    setIsManualEntry,
    manualDateTime,
    setManualDateTime,
    notes,
    setNotes,
    isWorking,
    clockIn,
    clockOut,
  } = useWorkTracker()

  return (
    <div className="bg-gray-800 rounded-lg p-4 shrink-0">
      <div className="flex items-center gap-4 mb-4">
        <label className="flex items-center gap-2 text-gray-300">
          <input
            type="checkbox"
            checked={isManualEntry}
            onChange={e => setIsManualEntry(e.target.checked)}
            className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-600 bg-gray-700 focus:ring-blue-500"
          />
          Manual Time Entry
        </label>
      </div>

      <div className="flex flex-col gap-4">
        {isManualEntry && (
          <input
            type="datetime-local"
            value={manualDateTime}
            onChange={e => setManualDateTime(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )}
        <input
          type="text"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder={isWorking ? 'Add notes for clock-out' : 'Add notes for clock-in'}
          className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {!isWorking ? (
          <button
            onClick={() => void clockIn()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
          >
            Clock In
          </button>
        ) : (
          <button
            onClick={() => void clockOut()}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200"
          >
            Clock Out
          </button>
        )}
      </div>
    </div>
  )
}

export default ClockInPanel
