import { parseZwiftWorkoutString } from "./zwo"
import { ZwiftWorkout } from "./types"
import workoutFile from "./dist/workouts.json"

interface WorkoutEntry {
  xml: string
  rider: string
  tags?: string[]
}

const validWorkoutEntries = workoutFile.data.filter((entry: WorkoutEntry) => {
  try {
    parseZwiftWorkoutString(entry.xml)
    return true
  } catch (error) {
    console.log(`error parsing ${entry.rider}`, error)
  }
  return false
})

const workouts: ZwiftWorkout[] = validWorkoutEntries.map((entry: WorkoutEntry) => {
  const workout = parseZwiftWorkoutString(entry.xml)
  return {
    ...workout,
    rider: entry.rider,
    tags: Array.from(new Set([...workout.tags, ...(entry.tags || [])])),
  }
})

export { workouts }
