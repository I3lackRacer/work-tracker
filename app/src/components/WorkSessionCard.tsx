import type { WorkSession } from '../types/work'
import { formatTime, formatDuration, formatDateTime, formatTimeRange } from '../utils/dateUtils'

interface WorkSessionCardProps {
  session: WorkSession
  onEdit: (session: WorkSession) => void
  onDelete: (clockInId: number) => void
  isDeleting?: boolean
}

const WorkSessionCard = ({ session, onEdit, onDelete, isDeleting = false }: WorkSessionCardProps) => {

  return (
    <div className={`bg-gray-800 rounded-lg p-3 border border-gray-700 transition-all duration-300 ${
      isDeleting ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'
    }`}>
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium">
          {session.clockIn.notes || session.clockOut?.notes || 'No notes'}
        </span>
        <div className="flex items-center gap-2">
          {session.clockOut && (
            <span className="bg-blue-900 text-blue-200 px-3 py-1 rounded-full text-sm">
              {formatDuration(session.clockIn.timestamp, session.clockOut.timestamp)}
            </span>
          )}
          <button
            onClick={() => onEdit(session)}
            className="text-blue-400 hover:text-blue-300 p-1 rounded transition-colors duration-200"
            title="Edit session"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(session.clockIn.id)}
            className="text-red-400 hover:text-red-300 p-1 rounded transition-colors duration-200"
            title="Delete session"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      <div className="text-gray-300">
        {formatTimeRange(session.clockIn.timestamp, session.clockOut?.timestamp)}
      </div>
    </div>
  )
}

export default WorkSessionCard 