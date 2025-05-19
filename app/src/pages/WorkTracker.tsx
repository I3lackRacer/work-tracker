import { useState, useEffect } from 'react'
import { useAuth, useAuthenticatedFetch } from '../context/AuthContext'
import WorkCalendar from '../components/WorkCalendar'
import '../styles/calendar.css'

const API_URL = (import.meta.env.VITE_API_URL || '') + "/api/v1"

interface WorkEntry {
  id: number
  timestamp: string
  type: 'CLOCK_IN' | 'CLOCK_OUT'
  notes?: string
}

interface WorkSession {
  clockIn: WorkEntry
  clockOut?: WorkEntry
}

interface ManualEntryModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (startTime: string, endTime: string, notes: string) => Promise<void>
}

interface EditSessionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (clockInId: number, clockOutId: number | undefined, clockInTime: string, clockOutTime: string, clockInNotes: string, clockOutNotes: string) => Promise<void>
  session: WorkSession
}

const ManualEntryModal = ({ isOpen, onClose, onSubmit }: ManualEntryModalProps) => {
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      const timeStr = `${year}-${month}-${day}T${hours}:${minutes}`
      setStartTime(timeStr)
      setEndTime(timeStr)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await onSubmit(startTime, endTime, notes)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add manual entry')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add Manual Work Entry</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Start Time</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">End Time</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>
          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}
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
              Add Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const EditSessionModal = ({ isOpen, onClose, onSubmit, session }: EditSessionModalProps) => {
  const [clockInTime, setClockInTime] = useState('')
  const [clockOutTime, setClockOutTime] = useState('')
  const [clockInNotes, setClockInNotes] = useState('')
  const [clockOutNotes, setClockOutNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      const formatDateTime = (timestamp: string) => {
        const date = new Date(timestamp)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        return `${year}-${month}-${day}T${hours}:${minutes}`
      }

      setClockInTime(formatDateTime(session.clockIn.timestamp))
      setClockInNotes(session.clockIn.notes || '')
      
      if (session.clockOut) {
        setClockOutTime(formatDateTime(session.clockOut.timestamp))
        setClockOutNotes(session.clockOut.notes || '')
      } else {
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        const hours = String(now.getHours()).padStart(2, '0')
        const minutes = String(now.getMinutes()).padStart(2, '0')
        setClockOutTime(`${year}-${month}-${day}T${hours}:${minutes}`)
      }
    }
  }, [isOpen, session])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await onSubmit(
        session.clockIn.id,
        session.clockOut?.id,
        clockInTime,
        clockOutTime,
        clockInNotes,
        clockOutNotes
      )
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to edit session')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Edit Work Session</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Clock In Time</label>
            <input
              type="datetime-local"
              value={clockInTime}
              onChange={(e) => setClockInTime(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Clock In Notes</label>
            <textarea
              value={clockInNotes}
              onChange={(e) => setClockInNotes(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Clock Out Time</label>
            <input
              type="datetime-local"
              value={clockOutTime}
              onChange={(e) => setClockOutTime(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Clock Out Notes</label>
            <textarea
              value={clockOutNotes}
              onChange={(e) => setClockOutNotes(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
            />
          </div>
          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const WorkTracker = () => {
  const [workSessions, setWorkSessions] = useState<WorkSession[]>([])
  const [isWorking, setIsWorking] = useState(false)
  const [currentSession, setCurrentSession] = useState<WorkSession | null>(null)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isManualEntry, setIsManualEntry] = useState(false)
  const [manualDateTime, setManualDateTime] = useState('')
  const [isManualEntryModalOpen, setIsManualEntryModalOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<WorkSession | null>(null)
  const { logout } = useAuth()
  const authenticatedFetch = useAuthenticatedFetch()

  // Initialize manualDateTime with current time when switching to manual mode
  useEffect(() => {
    if (isManualEntry) {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      setManualDateTime(`${year}-${month}-${day}T${hours}:${minutes}`)
    }
  }, [isManualEntry])

  const fetchWorkEntries = async () => {
    try {
      const response = await authenticatedFetch(`${API_URL}/work/entries`)

      if (!response.ok) {
        throw new Error('Failed to fetch work entries')
      }

      const entries: WorkEntry[] = await response.json()

      // Group entries into sessions (pairs of clock-in and clock-out)
      const sessions: WorkSession[] = []
      let currentSession: WorkSession | null = null

      entries.sort((a, b) => a.id - b.id)
        .forEach(entry => {
          if (entry.type === 'CLOCK_IN') {
            currentSession = { clockIn: entry }
            sessions.push(currentSession)
          } else if (entry.type === 'CLOCK_OUT' && currentSession) {
            currentSession.clockOut = entry
            currentSession = null
          }
        })

      setWorkSessions(sessions)

      // Check if user is currently working
      const lastSession = sessions[sessions.length - 1]
      if (lastSession && !lastSession.clockOut) {
        setIsWorking(true)
        setCurrentSession(lastSession)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  useEffect(() => {
    fetchWorkEntries()
  }, [])

  const clockIn = async () => {
    try {
      const response = await authenticatedFetch(`${API_URL}/work/clock-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          notes,
          timestamp: isManualEntry ? new Date(manualDateTime).toISOString() : undefined
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || 'Failed to clock in')
      }

      const entry: WorkEntry = await response.json()
      const newSession: WorkSession = { clockIn: entry }
      setWorkSessions([...workSessions, newSession])
      setCurrentSession(newSession)
      setIsWorking(true)
      setNotes('')
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clock in')
    }
  }

  const clockOut = async () => {
    try {
      const response = await authenticatedFetch(`${API_URL}/work/clock-out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          notes,
          timestamp: isManualEntry ? new Date(manualDateTime).toISOString() : undefined
        })
      })

      if (!response.ok) {
        throw new Error('Failed to clock out')
      }

      const entry: WorkEntry = await response.json()

      if (currentSession) {
        const updatedSessions = workSessions.map(session =>
          session === currentSession
            ? { ...session, clockOut: entry }
            : session
        )
        setWorkSessions(updatedSessions)
      }

      setCurrentSession(null)
      setIsWorking(false)
      setNotes('')
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clock out')
    }
  }

  const deleteWorkSession = async (clockInId: number) => {
    try {
      const response = await authenticatedFetch(`${API_URL}/work/entries/${clockInId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete work session')
      }

      // Remove the deleted session from state
      setWorkSessions(workSessions.filter(session => session.clockIn.id !== clockInId))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete work session')
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDuration = (clockIn: string, clockOut: string) => {
    const start = new Date(clockIn).getTime()
    const end = new Date(clockOut).getTime()
    const diff = end - start
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  const addManualEntry = async (startTime: string, endTime: string, notes: string) => {
    try {
      const response = await authenticatedFetch(`${API_URL}/work/manual-entry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          notes
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add manual entry')
      }

      await fetchWorkEntries()
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add manual entry')
      throw err
    }
  }

  const editWorkSession = async (
    clockInId: number,
    clockOutId: number | undefined,
    clockInTime: string,
    clockOutTime: string,
    clockInNotes: string,
    clockOutNotes: string
  ) => {
    try {
      // Edit clock in
      const clockInResponse = await authenticatedFetch(`${API_URL}/work/entries/${clockInId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          newTimestamp: new Date(clockInTime).toISOString(),
          notes: clockInNotes
        })
      })

      if (!clockInResponse.ok) {
        const errorData = await clockInResponse.json()
        throw new Error(errorData.error || 'Failed to edit clock in entry')
      }

      // Edit clock out if it exists
      if (clockOutId) {
        const clockOutResponse = await authenticatedFetch(`${API_URL}/work/entries/${clockOutId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            newTimestamp: new Date(clockOutTime).toISOString(),
            notes: clockOutNotes
          })
        })

        if (!clockOutResponse.ok) {
          const errorData = await clockOutResponse.json()
          throw new Error(errorData.error || 'Failed to edit clock out entry')
        }
      }

      await fetchWorkEntries()
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to edit work session')
      throw err
    }
  }

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      <div className="px-4 py-2 border-b border-gray-800 shrink-0">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Work Time Tracker</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setIsManualEntryModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
            >
              Add Manual Entry
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <ManualEntryModal
        isOpen={isManualEntryModalOpen}
        onClose={() => setIsManualEntryModalOpen(false)}
        onSubmit={addManualEntry}
      />

      {editingSession && (
        <EditSessionModal
          isOpen={!!editingSession}
          onClose={() => setEditingSession(null)}
          onSubmit={editWorkSession}
          session={editingSession}
        />
      )}

      {error && (
        <div className="mx-4 mt-2 bg-red-900/50 border border-red-500 text-red-200 px-4 py-2 rounded-lg shrink-0">
          {error}
        </div>
      )}

      <div className="flex-1 flex gap-4 p-4 min-h-0 overflow-hidden">
        <div className="w-[350px] flex flex-col gap-4 overflow-y-auto shrink-0">
          <div className="bg-gray-800 rounded-lg p-4 shrink-0">
            <div className="flex items-center gap-4 mb-4">
              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={isManualEntry}
                  onChange={(e) => setIsManualEntry(e.target.checked)}
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
                  onChange={(e) => setManualDateTime(e.target.value)}
                  className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={isWorking ? "Add notes for clock-out" : "Add notes for clock-in"}
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {!isWorking ? (
                <button
                  onClick={clockIn}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
                >
                  Clock In
                </button>
              ) : (
                <button
                  onClick={clockOut}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200"
                >
                  Clock Out
                </button>
              )}
            </div>
          </div>

          {currentSession && (
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
                <p className="text-gray-300">Started at: {formatTime(currentSession.clockIn.timestamp)}</p>
                {currentSession.clockIn.notes && (
                  <p className="text-gray-300">Notes: {currentSession.clockIn.notes}</p>
                )}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto min-h-0">
            <h3 className="text-lg font-semibold mb-3">Previous Sessions</h3>
            {workSessions.length === 0 ? (
              <p className="text-gray-400">No work sessions yet</p>
            ) : (
              <div className="space-y-3">
                {workSessions
                  .filter(session => session.clockOut)
                  .reverse()
                  .slice(0, 5)
                  .map(session => (
                    <div key={session.clockIn.id} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
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
                            onClick={() => setEditingSession(session)}
                            className="text-blue-400 hover:text-blue-300 p-1 rounded transition-colors duration-200"
                            title="Edit session"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteWorkSession(session.clockIn.id)}
                            className="text-red-400 hover:text-red-300 p-1 rounded transition-colors duration-200"
                            title="Delete session"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-400">
                        {formatTime(session.clockIn.timestamp)} - {
                          session.clockOut && formatTime(session.clockOut.timestamp)
                        }
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          <WorkCalendar workSessions={workSessions} />
        </div>
      </div>
    </div>
  )
}

export default WorkTracker 