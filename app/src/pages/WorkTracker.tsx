import { useState, useEffect } from 'react'
import { useAuth, useAuthenticatedFetch } from '../context/AuthContext'
import WorkCalendar from '../components/WorkCalendar'
import ManualEntryModal from '../components/modals/ManualEntryModal'
import EditSessionModal from '../components/modals/EditSessionModal'
import DeleteConfirmationModal from '../components/modals/DeleteConfirmationModal'
import SettingsModal from '../components/modals/SettingsModal'
import WorkSessionCard from '../components/WorkSessionCard'
import { formatTime, formatDuration, formatDateTimeForInput } from '../utils/dateUtils'
import type { WorkSession } from '../types/work'
import type { WorkSettings } from '../components/modals/SettingsModal'
import * as XLSX from 'xlsx'
import '../styles/calendar.css'
import SummaryModal from '../components/modals/SummaryModal'
import MonthlySummaryModal from '../components/modals/MonthlySummaryModal'

const API_URL = (import.meta.env.VITE_API_URL || '') + "/api/v1"

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
  const [deletingSessionId, setDeletingSessionId] = useState<number | null>(null)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [deletingSessions, setDeletingSessions] = useState<Set<number>>(new Set())
  const { logout, username } = useAuth()
  const authenticatedFetch = useAuthenticatedFetch()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const sessionsPerPage = 5
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [workSettings, setWorkSettings] = useState<WorkSettings | undefined>(() => {
    const savedSettings = localStorage.getItem('workSettings')
    return savedSettings ? JSON.parse(savedSettings) : undefined
  })
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false)
  const [isMonthlySummaryModalOpen, setIsMonthlySummaryModalOpen] = useState(false)

  // Calculate stats
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - (today.getDay() || 7) + 1)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const completedSessions = workSessions.filter(session => session.endTime)
  const calculateHours = (session: WorkSession): number => {
    if (!session.endTime) return 0
    return (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60 * 60)
  }

  const stats = {
    daily: Math.round(completedSessions.filter(session => new Date(session.startTime) >= today).reduce((acc, session) => acc + calculateHours(session), 0) * 10) / 10,
    weekly: Math.round(completedSessions.filter(session => new Date(session.startTime) >= weekStart).reduce((acc, session) => acc + calculateHours(session), 0) * 10) / 10,
    monthly: Math.round(completedSessions.filter(session => new Date(session.startTime) >= monthStart).reduce((acc, session) => acc + calculateHours(session), 0) * 10) / 10,
    total: Math.round(completedSessions.reduce((acc, session) => acc + calculateHours(session), 0) * 10) / 10
  }

  // Calculate progress status
  const calculateProgressStatus = (
    currentHours: number,
    targetHours: number,
    workDays: string,
    period: 'week' | 'month'
  ): { status: 'on-track' | 'ahead' | 'behind'; message: string } => {
    if (!targetHours) return { status: 'on-track', message: '' }
    const percent = currentHours / targetHours
    if (percent > 1.05) return { status: 'ahead', message: 'ahead of target' }
    if (percent < 0.95) return { status: 'behind', message: 'behind target' }
    return { status: 'on-track', message: 'on track' }
  }

  useEffect(() => {
    if (username) {
      document.title = `${username}'s Work Tracker`
    }
  }, [username])

  useEffect(() => {
    if (isManualEntry) {
      setManualDateTime(formatDateTimeForInput(new Date()))
    }
  }, [isManualEntry])

  useEffect(() => {
    const skipDeleteConfirmation = localStorage.getItem('skipDeleteConfirmation') === 'true'
    if (skipDeleteConfirmation) {
      setShowDeleteConfirmation(false)
    }
  }, [])

  const fetchWorkSettings = async () => {
    const response = await authenticatedFetch(`${API_URL}/work/config`)
    if (!response.ok) {
      setWorkSettings({
        expectedWeeklyHours: 40,
        expectedMonthlyHours: 160,
        trackLunchBreak: true,
        defaultLunchBreakMinutes: 30,
        workDays: '1,2,3,4,5'
      })
    }
    const data = await response.json()
    setWorkSettings(data)
  }

  const fetchWorkEntries = async () => {
    try {
      const response = await authenticatedFetch(`${API_URL}/work/entries`)

      if (!response.ok) {
        throw new Error('Failed to fetch work entries')
      }

      const sessions = await response.json() as WorkSession[]

      setWorkSessions(sessions)
      const lastSession = sessions[sessions.length - 1]
      if (lastSession && !lastSession.endTime) {
        setIsWorking(true)
        setCurrentSession(lastSession)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  useEffect(() => {
    fetchWorkEntries()
    fetchWorkSettings()
  }, [])

  const clockIn = async () => {
    try {
      let timestamp
      if (isManualEntry) {
        const date = new Date(manualDateTime)
        timestamp = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString()
      }

      const response = await authenticatedFetch(`${API_URL}/work/clock-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          notes,
          timestamp
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || 'Failed to clock in')
      }

      const session = await response.json()
      setWorkSessions([...workSessions, session])
      setCurrentSession(session)
      setIsWorking(true)
      setNotes('')
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clock in')
    }
  }

  const clockOut = async () => {
    try {
      if (!currentSession) {
        throw new Error('No active session to clock out')
      }

      let timestamp
      if (isManualEntry) {
        const date = new Date(manualDateTime)
        timestamp = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString()
      }

      const response = await authenticatedFetch(`${API_URL}/work/clock-out/${currentSession.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          notes,
          timestamp
        })
      })

      if (!response.ok) {
        throw new Error('Failed to clock out')
      }

      const updatedSession = await response.json()

      if (currentSession) {
        const updatedSessions = workSessions.map(session =>
          session.id === currentSession.id
            ? updatedSession
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

  const deleteWorkSession = async (sessionId: number) => {
    try {
      setDeletingSessions(prev => new Set([...prev, sessionId]))

      await new Promise(resolve => setTimeout(resolve, 300))

      const response = await authenticatedFetch(`${API_URL}/work/entries/${sessionId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete work session')
      }

      setWorkSessions(workSessions.filter(session => session.id !== sessionId))
      setDeletingSessions(prev => {
        const newSet = new Set(prev)
        newSet.delete(sessionId)
        return newSet
      })
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete work session')
      setDeletingSessions(prev => {
        const newSet = new Set(prev)
        newSet.delete(sessionId)
        return newSet
      })
    }
  }

  const editWorkSession = async (
    sessionId: number,
    startTime: string,
    endTime: string,
    notes: string
  ) => {
    try {
      const response = await authenticatedFetch(`${API_URL}/work/entries/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          newStartTime: new Date(startTime).toISOString(),
          newEndTime: endTime ? new Date(endTime).toISOString() : null,
          notes
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to edit work session')
      }

      await fetchWorkEntries()
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to edit work session')
      throw err
    }
  }

  const addManualEntry = async (startTime: string, endTime: string, notes: string) => {
    try {
      const startDate = new Date(startTime)
      const endDate = new Date(endTime)

      const startTimeISO = new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000).toISOString()
      const endTimeISO = new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000).toISOString()

      // First, clock in with the start time
      const clockInResponse = await authenticatedFetch(`${API_URL}/work/clock-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          notes,
          timestamp: startTimeISO
        })
      })

      if (!clockInResponse.ok) {
        const errorData = await clockInResponse.json()
        throw new Error(errorData.message || errorData.error || 'Failed to clock in for manual entry')
      }

      const session = await clockInResponse.json()

      // Then immediately clock out with the end time
      const clockOutResponse = await authenticatedFetch(`${API_URL}/work/clock-out/${session.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          notes,
          timestamp: endTimeISO
        })
      })

      if (!clockOutResponse.ok) {
        const errorData = await clockOutResponse.json()
        throw new Error(errorData.message || errorData.error || 'Failed to clock out for manual entry')
      }

      await fetchWorkEntries()
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add manual entry')
      throw err
    }
  }

  const exportToExcel = () => {
    const exportData = workSessions
      .filter(session => session.endTime)
      .map(session => ({
        'Start Time': new Date(session.startTime).toLocaleString(),
        'End Time': new Date(session.endTime!).toLocaleString(),
        'Worked Time': formatDuration(session.startTime, session.endTime!),
        'Notes': session.notes || ''
      }))

    const ws = XLSX.utils.json_to_sheet(exportData)

    const colWidths = [
      { wch: 20 },
      { wch: 20 },
      { wch: 15 },
      { wch: 30 },
      { wch: 30 }
    ]
    ws['!cols'] = colWidths

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Work Sessions')

    const date = new Date().toISOString().split('T')[0]
    const filename = `work_sessions_${date}.xlsx`

    XLSX.writeFile(wb, filename)
  }

  const handleDeleteClick = (sessionId: number) => {
    setDeletingSessionId(sessionId)
    const skipDeleteConfirmation = localStorage.getItem('skipDeleteConfirmation') === 'true'
    if (!skipDeleteConfirmation) {
      setShowDeleteConfirmation(true)
    } else {
      deleteWorkSession(sessionId)
    }
  }

  const handleDeleteConfirm = () => {
    if (deletingSessionId !== null) {
      deleteWorkSession(deletingSessionId)
      setDeletingSessionId(null)
    }
    setShowDeleteConfirmation(false)
  }

  const handleNeverAskAgain = () => {
    localStorage.setItem('skipDeleteConfirmation', 'true')
    setShowDeleteConfirmation(false)
  }

  const handleSaveSettings = async (settings: WorkSettings) => {
    try {
      const response = await authenticatedFetch(`${API_URL}/work/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(settings)
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      setWorkSettings(settings)
      localStorage.setItem('workSettings', JSON.stringify(settings))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    }
  }

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      <div className="px-4 py-2 border-b border-gray-800 shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Work Time Tracker</h1>
            {username && (
              <p className="text-gray-400 text-sm">Welcome back, {username}!</p>
            )}
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          <div className="hidden md:flex gap-3">
            <button
              onClick={() => setIsMonthlySummaryModalOpen(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              Monthly Summary
            </button>
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Export Excel
            </button>
            <button
              onClick={() => setIsManualEntryModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
            >
              Add Manual Entry
            </button>
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              Settings
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden mt-4 space-y-2">
            <button
              onClick={() => {
                setIsMonthlySummaryModalOpen(true)
                setIsMenuOpen(false)
              }}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              Monthly Summary
            </button>
            <button
              onClick={exportToExcel}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Export Excel
            </button>
            <button
              onClick={() => {
                setIsManualEntryModalOpen(true)
                setIsMenuOpen(false)
              }}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
            >
              Add Manual Entry
            </button>
            <button
              onClick={() => {
                setIsSettingsModalOpen(true)
                setIsMenuOpen(false)
              }}
              className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              Settings
            </button>
            <button
              onClick={logout}
              className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        )}
      </div>

      <ManualEntryModal
        isOpen={isManualEntryModalOpen}
        onClose={() => setIsManualEntryModalOpen(false)}
        onSubmit={addManualEntry}
      />

      <EditSessionModal
        isOpen={!!editingSession}
        onClose={() => setEditingSession(null)}
        onSubmit={editWorkSession}
        onDelete={handleDeleteClick}
        session={editingSession!}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={() => {
          setShowDeleteConfirmation(false)
          setDeletingSessionId(null)
        }}
        onConfirm={handleDeleteConfirm}
        onNeverAskAgain={handleNeverAskAgain}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSave={handleSaveSettings}
        initialSettings={workSettings}
      />

      <SummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        stats={stats}
        workSettings={workSettings}
        calculateProgressStatus={calculateProgressStatus}
      />

      <MonthlySummaryModal
        isOpen={isMonthlySummaryModalOpen}
        onClose={() => setIsMonthlySummaryModalOpen(false)}
        workSessions={workSessions}
        workSettings={workSettings}
      />

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
                <p className="text-gray-300">Started at: {formatTime(currentSession.startTime)}</p>
                {currentSession.notes && (
                  <p className="text-gray-300">Notes: {currentSession.notes}</p>
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
                {workSessions.filter(session => session.endTime).length > sessionsPerPage && (
                  <div className="flex justify-between items-center mt-4">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-gray-400">
                      Page {currentPage} of {Math.ceil(workSessions.filter(session => session.endTime).length / sessionsPerPage)}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(Math.ceil(workSessions.filter(session => session.endTime).length / sessionsPerPage), prev + 1))}
                      disabled={currentPage >= Math.ceil(workSessions.filter(session => session.endTime).length / sessionsPerPage)}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          <WorkCalendar
            workSessions={workSessions}
            onAddManualEntry={addManualEntry}
            onEdit={setEditingSession}
            workSettings={workSettings}
          />
        </div>
      </div>
      <div> {!isSummaryModalOpen && (
      <button
        className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg md:hidden"
        onClick={() => setIsSummaryModalOpen(true)}
      >
        Show Summary
      </button>
      )}
      </div>
    </div>
  )
}

export default WorkTracker 