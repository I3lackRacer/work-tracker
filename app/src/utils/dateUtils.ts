export const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

export const formatDuration = (clockIn: string, clockOut: string) => {
  const start = new Date(clockIn).getTime()
  const end = new Date(clockOut).getTime()
  const diff = end - start
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}h ${minutes}m`
}

export const formatDateTimeForInput = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export const formatDate = (date: Date) => {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}.${month}.${year}`
}

export const getWeekStart = (date: Date) => {
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  return new Date(date.setDate(diff))
}

export const getWeekDays = () => {
  return ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
}

export const formatDateTime = (timestamp: string) => {
  const date = new Date(timestamp)
  const day = date.getDate()
  const month = date.toLocaleString('en-US', { month: 'short' })
  const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${day}. ${month}. ${time}`
}

export const formatTimeRange = (startTimestamp: string, endTimestamp?: string) => {
  const startDate = new Date(startTimestamp)
  if (!endTimestamp) { 
    return formatDateTime(startTimestamp)
  }
  
  const endDate = new Date(endTimestamp)
  const sameDay = startDate.getDate() === endDate.getDate() &&
                  startDate.getMonth() === endDate.getMonth() &&
                  startDate.getFullYear() === endDate.getFullYear()
  
  const startTime = startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  const endTime = endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  const day = startDate.getDate()
  const month = startDate.toLocaleString('en-US', { month: 'short' })
  
  if (sameDay) {
    return `${day}. ${month} ${startTime} - ${endTime}`
  }
  
  const endDay = endDate.getDate()
  const endMonth = endDate.toLocaleString('en-US', { month: 'short' })
  const sameMonth = month === endMonth
  
  if (sameMonth) {
    return `${day}.-${endDay}. ${month} ${startTime} - ${endTime}`
  }
  
  return `${day}. ${month} ${startTime} - ${endDay}. ${endMonth} ${endTime}`
} 