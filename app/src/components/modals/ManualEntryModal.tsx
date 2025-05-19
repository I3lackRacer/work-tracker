import { useState, useEffect } from 'react'

interface ManualEntryModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (startTime: string, endTime: string, notes: string) => Promise<void>
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

export default ManualEntryModal 