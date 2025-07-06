import { useState, useEffect } from 'react'
import type { WorkSession } from '../../types/work'

interface EditSessionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (sessionId: number, startTime: string, endTime: string, notes: string) => Promise<void>
  onDelete: (sessionId: number) => void
  session: WorkSession
}

const EditSessionModal = ({ isOpen, onClose, onSubmit, onDelete, session }: EditSessionModalProps) => {
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      const formatDateTime = (timestamp: string) => {
        const date = new Date(timestamp)
        // Adjust for timezone to ensure we get the correct local time
        const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        return localDate.toISOString().slice(0, 16) // Format: YYYY-MM-DDTHH:mm
      }

      setStartTime(formatDateTime(session.startTime))
      setNotes(session.notes || '')
      
      if (session.endTime) {
        setEndTime(formatDateTime(session.endTime))
      } else {
        const now = new Date()
        // Adjust for timezone to ensure we get the correct local time
        const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        setEndTime(localNow.toISOString().slice(0, 16))
      }
    }
  }, [isOpen, session])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Create Date objects from the input values
      const startDate = new Date(startTime)
      const endDate = new Date(endTime)
      
      // Adjust for timezone offset to preserve local time
      const startTimeISO = new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000).toISOString()
      const endTimeISO = new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000).toISOString()

      await onSubmit(
        session.id,
        startTimeISO,
        endTimeISO,
        notes
      )
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to edit work session')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Edit Work Session</h2>
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
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => {
                onDelete(session.id)
                onClose()
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors duration-200"
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

export default EditSessionModal 