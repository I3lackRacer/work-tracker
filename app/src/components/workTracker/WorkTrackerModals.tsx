import ManualEntryModal from '../modals/ManualEntryModal'
import EditSessionModal from '../modals/EditSessionModal'
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal'
import SettingsModal from '../modals/SettingsModal'
import SummaryModal from '../modals/SummaryModal'
import MonthlySummaryModal from '../modals/MonthlySummaryModal'
import { useWorkTracker } from '../../context/WorkTrackerContext'

const WorkTrackerModals = () => {
  const {
    isManualEntryModalOpen,
    setIsManualEntryModalOpen,
    addManualEntry,
    editingSession,
    setEditingSession,
    editWorkSession,
    handleDeleteClick,
    showDeleteConfirmation,
    closeDeleteConfirmation,
    handleDeleteConfirm,
    handleNeverAskAgain,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    handleSaveSettings,
    workSettings,
    isSummaryModalOpen,
    setIsSummaryModalOpen,
    stats,
    calculateProgressStatus,
    isMonthlySummaryModalOpen,
    setIsMonthlySummaryModalOpen,
    workSessions,
  } = useWorkTracker()

  return (
    <>
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
        onClose={closeDeleteConfirmation}
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
    </>
  )
}

export default WorkTrackerModals
