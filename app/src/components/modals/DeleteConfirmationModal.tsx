import { useState, useEffect } from 'react'

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  onNeverAskAgain: () => void
}

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, onNeverAskAgain }: DeleteConfirmationModalProps) => {
  const [neverAskAgain, setNeverAskAgain] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Reset the checkbox when modal opens
      setNeverAskAgain(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
        <p className="text-gray-300 mb-4">Are you sure you want to delete this work session? This action cannot be undone.</p>
        
        <div className="flex items-center gap-2 mb-6">
          <input
            type="checkbox"
            id="neverAskAgain"
            checked={neverAskAgain}
            onChange={(e) => setNeverAskAgain(e.target.checked)}
            className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-600 bg-gray-700 focus:ring-blue-500"
          />
          <label htmlFor="neverAskAgain" className="text-gray-300">
            Don't ask again
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (neverAskAgain) {
                onNeverAskAgain()
              }
              onConfirm()
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteConfirmationModal 