import WorkSessionCard from '../WorkSessionCard'
import { useWorkTracker } from '../../context/WorkTrackerContext'

const SessionHistoryList = () => {
  const {
    workSessions,
    currentPage,
    setCurrentPage,
    sessionsPerPage,
    setEditingSession,
    handleDeleteClick,
    deletingSessions,
  } = useWorkTracker()

  const completedCount = workSessions.filter(s => s.endTime).length
  const totalPages = Math.ceil(completedCount / sessionsPerPage)

  return (
    <div className="flex-1 overflow-y-auto min-h-0">
      <h3 className="text-lg font-semibold mb-3">Previous Sessions</h3>
      {workSessions.length === 0 ? (
        <p className="text-gray-400">No work sessions yet</p>
      ) : (
        <div className="space-y-3">
          {workSessions
            .filter(session => session.endTime)
            .reverse()
            .slice((currentPage - 1) * sessionsPerPage, currentPage * sessionsPerPage)
            .map(session => (
              <WorkSessionCard
                key={session.id}
                session={session}
                onEdit={setEditingSession}
                onDelete={() => handleDeleteClick(session.id)}
                isDeleting={deletingSessions.has(session.id)}
              />
            ))}
          {completedCount > sessionsPerPage && (
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SessionHistoryList
