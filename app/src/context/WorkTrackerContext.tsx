import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import { useAuth, useAuthenticatedFetch } from './AuthContext'
import { formatDuration, formatDateTimeForInput } from '../utils/dateUtils'
import type { WorkSession } from '../types/work'
import type { WorkSettings } from '../components/modals/SettingsModal'
import * as XLSX from 'xlsx'
import type { Holiday } from '../types/holiday'
import { computeCalendarStatsFromSessions } from '../utils/workCalendarUtils'

const API_URL = (import.meta.env.VITE_API_URL || '') + '/api/v1'

export interface WorkTrackerStats {
  daily: number
  weekly: number
  monthly: number
  total: number
}

export interface WorkTrackerContextValue {
  workSessions: WorkSession[]
  isWorking: boolean
  currentSession: WorkSession | null
  notes: string
  setNotes: (v: string) => void
  error: string | null
  isManualEntry: boolean
  setIsManualEntry: (v: boolean) => void
  manualDateTime: string
  setManualDateTime: (v: string) => void
  isManualEntryModalOpen: boolean
  setIsManualEntryModalOpen: (v: boolean) => void
  editingSession: WorkSession | null
  setEditingSession: (s: WorkSession | null) => void
  showDeleteConfirmation: boolean
  holidays: Holiday[]
  isMenuOpen: boolean
  setIsMenuOpen: (v: boolean) => void
  currentPage: number
  setCurrentPage: Dispatch<SetStateAction<number>>
  isSettingsModalOpen: boolean
  setIsSettingsModalOpen: (v: boolean) => void
  workSettings: WorkSettings | undefined
  isSummaryModalOpen: boolean
  setIsSummaryModalOpen: (v: boolean) => void
  isMonthlySummaryModalOpen: boolean
  setIsMonthlySummaryModalOpen: (v: boolean) => void
  elapsedTime: string
  username: string | null
  logout: () => void
  sessionsPerPage: number
  deletingSessions: Set<number>
  stats: WorkTrackerStats
  calculateProgressStatus: (
    currentHours: number,
    targetHours: number,
    workDays: string,
    period: 'week' | 'month'
  ) => { status: 'on-track' | 'ahead' | 'behind'; message: string }
  clockIn: () => Promise<void>
  clockOut: () => Promise<void>
  addManualEntry: (startTime: string, endTime: string, notes: string) => Promise<void>
  editWorkSession: (
    sessionId: number,
    startTime: string,
    endTime: string,
    notes: string
  ) => Promise<void>
  handleDeleteClick: (sessionId: number) => void
  exportToExcel: () => void
  handleDeleteConfirm: () => void
  handleNeverAskAgain: () => void
  handleSaveSettings: (settings: WorkSettings) => Promise<void>
  closeDeleteConfirmation: () => void
}

const WorkTrackerContext = createContext<WorkTrackerContextValue | undefined>(undefined)

function formatElapsedTime(startTime: string): string {
  return formatDuration(startTime, new Date().toISOString())
}

export const WorkTrackerProvider = ({ children }: { children: ReactNode }) => {
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
  const [holidays, setHolidays] = useState<Holiday[]>([])
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
  const [elapsedTime, setElapsedTime] = useState('00:00')
  const [statsTick, setStatsTick] = useState(0)

  const calculateProgressStatus = useCallback(
    (
      currentHours: number,
      targetHours: number,
      _workDays: string,
      _period: 'week' | 'month'
    ): { status: 'on-track' | 'ahead' | 'behind'; message: string } => {
      if (!targetHours) return { status: 'on-track', message: '' }
      const percent = currentHours / targetHours
      if (percent > 1.05) return { status: 'ahead', message: 'ahead of target' }
      if (percent < 0.95) return { status: 'behind', message: 'behind target' }
      return { status: 'on-track', message: 'on track' }
    },
    []
  )

  useEffect(() => {
    if (username) {
      document.title = `${username}'s Work Tracker`
    }
  }, [username])

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null

    if (currentSession && !currentSession.endTime) {
      setElapsedTime(formatElapsedTime(currentSession.startTime))

      intervalId = setInterval(() => {
        setElapsedTime(formatElapsedTime(currentSession.startTime))
      }, 60000)
    } else {
      setElapsedTime('00:00')
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [currentSession])

  useEffect(() => {
    if (!isWorking) return
    const id = setInterval(() => setStatsTick(t => t + 1), 60_000)
    return () => clearInterval(id)
  }, [isWorking])

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

  const fetchHolidays = useCallback(async () => {
    const response = await authenticatedFetch(`${API_URL}/holiday/state/${workSettings?.state ?? 'NATIONAL'}`)
    if (!response.ok) {
      throw new Error('Failed to fetch holidays')
    }
    const data = (await response.json()) as Holiday[]
    setHolidays(data)
  }, [authenticatedFetch, workSettings])

  const fetchWorkSettings = useCallback(async () => {
    const response = await authenticatedFetch(`${API_URL}/work/config`)
    if (!response.ok) {
      setWorkSettings({
        expectedWeeklyHours: 40,
        expectedMonthlyHours: 160,
        trackLunchBreak: true,
        defaultLunchBreakMinutes: 30,
        workDays: '1,2,3,4,5',
        state: 'NATIONAL',
        showHolidays: true,
      })
    }
    const data = await response.json()
    setWorkSettings(data)
    fetchHolidays()
  }, [authenticatedFetch, fetchHolidays])

  const fetchWorkEntries = useCallback(async () => {
    try {
      const response = await authenticatedFetch(`${API_URL}/work/entries`)

      if (!response.ok) {
        throw new Error('Failed to fetch work entries')
      }

      const sessions = (await response.json()) as WorkSession[]

      setWorkSessions(sessions)
      const lastSession = sessions[sessions.length - 1]
      if (lastSession && !lastSession.endTime) {
        setIsWorking(true)
        setCurrentSession(lastSession)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }, [authenticatedFetch])

  useEffect(() => {
    void fetchWorkEntries()
    void fetchWorkSettings()
    // Intentionally once on mount; matches original WorkTracker behavior
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable initial load only
  }, [])

  const clockIn = useCallback(async () => {
    try {
      let timestamp: string | undefined
      if (isManualEntry) {
        const date = new Date(manualDateTime)
        timestamp = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString()
      }

      const response = await authenticatedFetch(`${API_URL}/work/clock-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          notes,
          timestamp,
        }),
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
  }, [authenticatedFetch, isManualEntry, manualDateTime, notes, workSessions])

  const clockOut = useCallback(async () => {
    try {
      if (!currentSession) {
        throw new Error('No active session to clock out')
      }

      let timestamp: string | undefined
      if (isManualEntry) {
        const date = new Date(manualDateTime)
        timestamp = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString()
      }

      const response = await authenticatedFetch(`${API_URL}/work/clock-out/${currentSession.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          notes,
          timestamp,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to clock out')
      }

      const updatedSession = await response.json()

      if (currentSession) {
        const updatedSessions = workSessions.map(session =>
          session.id === currentSession.id ? updatedSession : session
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
  }, [authenticatedFetch, currentSession, isManualEntry, manualDateTime, notes, workSessions])

  const deleteWorkSession = useCallback(
    async (sessionId: number) => {
      try {
        setDeletingSessions(prev => new Set([...prev, sessionId]))

        await new Promise(resolve => setTimeout(resolve, 300))

        const response = await authenticatedFetch(`${API_URL}/work/entries/${sessionId}`, {
          method: 'DELETE',
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
    },
    [authenticatedFetch, workSessions]
  )

  const editWorkSession = useCallback(
    async (sessionId: number, startTime: string, endTime: string, notesArg: string) => {
      try {
        const response = await authenticatedFetch(`${API_URL}/work/entries/${sessionId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            newStartTime: new Date(startTime).toISOString(),
            newEndTime: endTime ? new Date(endTime).toISOString() : null,
            notes: notesArg,
          }),
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
    },
    [authenticatedFetch, fetchWorkEntries]
  )

  const addManualEntry = useCallback(
    async (startTime: string, endTime: string, notesArg: string) => {
      try {
        const startDate = new Date(startTime)
        const endDate = new Date(endTime)

        const startTimeISO = new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000).toISOString()
        const endTimeISO = new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000).toISOString()

        const clockInResponse = await authenticatedFetch(`${API_URL}/work/clock-in`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            notes: notesArg,
            timestamp: startTimeISO,
          }),
        })

        if (!clockInResponse.ok) {
          const errorData = await clockInResponse.json()
          throw new Error(errorData.message || errorData.error || 'Failed to clock in for manual entry')
        }

        const session = await clockInResponse.json()

        const clockOutResponse = await authenticatedFetch(`${API_URL}/work/clock-out/${session.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            notes: notesArg,
            timestamp: endTimeISO,
          }),
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
    },
    [authenticatedFetch, fetchWorkEntries]
  )

  const exportToExcel = useCallback(() => {
    const exportData = workSessions
      .filter(session => session.endTime)
      .map(session => ({
        'Start Time': new Date(session.startTime).toLocaleString(),
        'End Time': new Date(session.endTime!).toLocaleString(),
        'Worked Time': formatDuration(session.startTime, session.endTime!),
        Notes: session.notes || '',
      }))

    const ws = XLSX.utils.json_to_sheet(exportData)

    const colWidths = [{ wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 30 }, { wch: 30 }]
    ws['!cols'] = colWidths

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Work Sessions')

    const date = new Date().toISOString().split('T')[0]
    const filename = `work_sessions_${date}.xlsx`

    XLSX.writeFile(wb, filename)
  }, [workSessions])

  const handleDeleteClick = useCallback(
    (sessionId: number) => {
      setDeletingSessionId(sessionId)
      const skipDeleteConfirmation = localStorage.getItem('skipDeleteConfirmation') === 'true'
      if (!skipDeleteConfirmation) {
        setShowDeleteConfirmation(true)
      } else {
        void deleteWorkSession(sessionId)
      }
    },
    [deleteWorkSession]
  )

  const handleDeleteConfirm = useCallback(() => {
    if (deletingSessionId !== null) {
      void deleteWorkSession(deletingSessionId)
      setDeletingSessionId(null)
    }
    setShowDeleteConfirmation(false)
  }, [deletingSessionId, deleteWorkSession])

  const handleNeverAskAgain = useCallback(() => {
    localStorage.setItem('skipDeleteConfirmation', 'true')
    setShowDeleteConfirmation(false)
  }, [])

  const closeDeleteConfirmation = useCallback(() => {
    setShowDeleteConfirmation(false)
    setDeletingSessionId(null)
  }, [])

  const handleSaveSettings = useCallback(
    async (settings: WorkSettings) => {
      try {
        const response = await authenticatedFetch(`${API_URL}/work/config`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(settings),
        })

        if (!response.ok) {
          throw new Error('Failed to save settings')
        }

        setWorkSettings(settings)
        localStorage.setItem('workSettings', JSON.stringify(settings))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save settings')
      }
    },
    [authenticatedFetch]
  )

  const value = useMemo<WorkTrackerContextValue>(() => {
    const raw = computeCalendarStatsFromSessions(workSessions)
    const stats: WorkTrackerStats = {
      daily: raw.dailyPrecise,
      weekly: raw.weekly,
      monthly: raw.monthly,
      total: raw.total,
    }

    return {
      workSessions,
      isWorking,
      currentSession,
      notes,
      setNotes,
      error,
      isManualEntry,
      setIsManualEntry,
      manualDateTime,
      setManualDateTime,
      isManualEntryModalOpen,
      setIsManualEntryModalOpen,
      editingSession,
      setEditingSession,
      showDeleteConfirmation,
      holidays,
      isMenuOpen,
      setIsMenuOpen,
      currentPage,
      setCurrentPage,
      isSettingsModalOpen,
      setIsSettingsModalOpen,
      workSettings,
      isSummaryModalOpen,
      setIsSummaryModalOpen,
      isMonthlySummaryModalOpen,
      setIsMonthlySummaryModalOpen,
      elapsedTime,
      username,
      logout,
      sessionsPerPage,
      deletingSessions,
      stats,
      calculateProgressStatus,
      clockIn,
      clockOut,
      addManualEntry,
      editWorkSession,
      handleDeleteClick,
      exportToExcel,
      handleDeleteConfirm,
      handleNeverAskAgain,
      handleSaveSettings,
      closeDeleteConfirmation,
    }
  }, [
    workSessions,
    statsTick,
    isWorking,
    currentSession,
    notes,
    error,
    isManualEntry,
    manualDateTime,
    isManualEntryModalOpen,
    editingSession,
    showDeleteConfirmation,
    holidays,
    isMenuOpen,
    currentPage,
    isSettingsModalOpen,
    workSettings,
    isSummaryModalOpen,
    isMonthlySummaryModalOpen,
    elapsedTime,
    username,
    logout,
    deletingSessions,
    calculateProgressStatus,
    clockIn,
    clockOut,
    addManualEntry,
    editWorkSession,
    handleDeleteClick,
    exportToExcel,
    handleDeleteConfirm,
    handleNeverAskAgain,
    handleSaveSettings,
    closeDeleteConfirmation,
  ])

  return <WorkTrackerContext.Provider value={value}>{children}</WorkTrackerContext.Provider>
}

export function useWorkTracker(): WorkTrackerContextValue {
  const ctx = useContext(WorkTrackerContext)
  if (ctx === undefined) {
    throw new Error('useWorkTracker must be used within WorkTrackerProvider')
  }
  return ctx
}
