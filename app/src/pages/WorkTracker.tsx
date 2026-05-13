import { WorkTrackerProvider } from '../context/WorkTrackerContext'
import WorkTrackerLayout from '../components/workTracker/WorkTrackerLayout'

const WorkTracker = () => (
  <WorkTrackerProvider>
    <WorkTrackerLayout />
  </WorkTrackerProvider>
)

export default WorkTracker
