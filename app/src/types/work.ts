export interface WorkEntry {
  id: number
  timestamp: string
  type: 'CLOCK_IN' | 'CLOCK_OUT'
  notes?: string
}

export interface WorkSession {
  id: number
  username: string
  startTime: string
  endTime?: string
  notes?: string
} 