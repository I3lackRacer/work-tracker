import { formatTime } from '../../utils/dateUtils'
import { useWorkTracker } from '../../context/WorkTrackerContext'

const CurrentSessionCard = () => {
  const { currentSession, setEditingSession, elapsedTime } = useWorkTracker()

  if (!currentSession) return null

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 shrink-0">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold">Current Session</h3>
        <button
          onClick={() => setEditingSession(currentSession)}
          className="text-blue-400 hover:text-blue-300 p-1 rounded transition-colors duration-200"
          title="Edit session"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </button>
      </div>
      <div className="space-y-2">
        <p className="text-gray-300">Started at: {formatTime(currentSession.startTime)}</p>
        <p className="text-gray-300">
          Elapsed time: <span className="font-mono">{elapsedTime}</span>
        </p>
        {currentSession.notes && <p className="text-gray-300">Notes: {currentSession.notes}</p>}
      </div>
    </div>
  )
}

export default CurrentSessionCard
