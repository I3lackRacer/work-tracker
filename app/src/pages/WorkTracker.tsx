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

const WorkTracker = () => {
  const [workSessions, setWorkSessions] = useState<WorkSession[]>([])
  const [isWorking, setIsWorking] = useState(false)
  const [currentSession, setCurrentSession] = useState<WorkSession | null>(null)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isManualEntry, setIsManualEntry] = useState(false)
  const [manualDateTime, setManualDateTime] = useState('')
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

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      <div className="px-4 py-2 border-b border-gray-800 shrink-0">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Work Time Tracker</h1>
          <button
            onClick={logout}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors duration-200"
          >
            Logout
          </button>
        </div>
      </div>

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
              <h3 className="text-lg font-semibold mb-3">Current Session</h3>
              <p className="text-gray-300">Started at: {formatTime(currentSession.clockIn.timestamp)}</p>
              {currentSession.clockIn.notes && (
                <p className="text-gray-300 mt-2">Notes: {currentSession.clockIn.notes}</p>
              )}
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
                        {session.clockOut && (
                          <span className="bg-blue-900 text-blue-200 px-3 py-1 rounded-full text-sm">
                            {formatDuration(session.clockIn.timestamp, session.clockOut.timestamp)}
                          </span>
                        )}
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