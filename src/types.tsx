interface ZwiftInterval {
  duration: number // Duration of the interval in seconds
  startPower: number // Starting power (% of FTP)
  endPower: number // Ending power (% of FTP)
}

interface ZwiftWorkout {
  name: string // Name of the workout
  description: string // Description of the workout
  source: string // Link to where the workout was sourced from
  rider: string // Associated rider name
  tags: string[] // Relevant tags (e.g. climbing, VO2, time-trial, ...)
  intervals: ZwiftInterval[] // Array of intervals
  category: string
  rawXML: string
  duration: number
}

export { type ZwiftWorkout, type ZwiftInterval }
