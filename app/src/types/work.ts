export interface WorkEntry {
  id: number
  timestamp: string
  type: 'CLOCK_IN' | 'CLOCK_OUT'
  notes?: string
}

export interface WorkSession {
  clockIn: WorkEntry
  clockOut?: WorkEntry
} 