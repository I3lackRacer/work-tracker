import WorkCalendar from '../WorkCalendar'
import WorkTrackerHeader from './WorkTrackerHeader'
import WorkTrackerModals from './WorkTrackerModals'
import ClockInPanel from './ClockInPanel'
import CurrentSessionCard from './CurrentSessionCard'
import SessionHistoryList from './SessionHistoryList'
import { useWorkTracker } from '../../context/WorkTrackerContext'
import '../../styles/calendar.css'

const WorkTrackerLayout = () => {
  const { error, isSummaryModalOpen, setIsSummaryModalOpen } = useWorkTracker()

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      <WorkTrackerHeader />
      <WorkTrackerModals />

      {error && (
        <div className="mx-4 mt-2 bg-red-900/50 border border-red-500 text-red-200 px-4 py-2 rounded-lg shrink-0">
          {error}
        </div>
      )}

      <div className="flex-1 flex gap-4 p-4 min-h-0 overflow-hidden">
        <div className="w-[350px] flex flex-col gap-4 overflow-y-auto shrink-0">
          <ClockInPanel />
          <CurrentSessionCard />
          <SessionHistoryList />
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          <WorkCalendar />
        </div>
      </div>

      <div>
        {!isSummaryModalOpen && (
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

export default WorkTrackerLayout
