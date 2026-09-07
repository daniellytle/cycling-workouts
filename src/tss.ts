import { ZwiftWorkout } from "./types"

const ROLLING_WINDOW_SECONDS = 30

interface TssResult {
  np: number
  tss: number
}

const cache = new WeakMap<ZwiftWorkout, TssResult>()

const samplePowers = (workout: ZwiftWorkout): number[] => {
  const samples: number[] = []
  for (const interval of workout.intervals) {
    const duration = Math.round(interval.duration)
    if (duration <= 0) continue
    const start = interval.startPower / 100
    const end = interval.endPower / 100
    if (interval.startPower === interval.endPower) {
      for (let i = 0; i < duration; i++) samples.push(start)
    } else {
      for (let i = 0; i < duration; i++) {
        samples.push(start + (end - start) * (i / duration))
      }
    }
  }
  return samples
}

export const computeTss = (workout: ZwiftWorkout): TssResult => {
  const cached = cache.get(workout)
  if (cached) return cached

  const samples = samplePowers(workout)
  const totalSeconds = samples.length
  if (totalSeconds === 0) {
    const empty = { np: 0, tss: 0 }
    cache.set(workout, empty)
    return empty
  }

  const window: number[] = []
  let windowSum = 0
  let smoothedSquares = 0
  for (const power of samples) {
    window.push(power)
    windowSum += power
    if (window.length > ROLLING_WINDOW_SECONDS) {
      windowSum -= window.shift() as number
    }
    const avg = windowSum / window.length
    smoothedSquares += avg * avg
  }

  const np = Math.sqrt(smoothedSquares / totalSeconds)
  const tss = (totalSeconds * np * np * 100) / 3600

  const result = { np, tss }
  cache.set(workout, result)
  return result
}

interface WorkLoadResult {
  seconds: number
  avgFraction: number
}

const workCache = new WeakMap<ZwiftWorkout, WorkLoadResult>()

const averagePowerFraction = (workout: ZwiftWorkout): WorkLoadResult => {
  const cached = workCache.get(workout)
  if (cached) return cached

  let seconds = 0
  let weighted = 0
  for (const interval of workout.intervals) {
    const duration = Math.round(interval.duration)
    if (duration <= 0) continue
    const fraction =
      interval.startPower === interval.endPower
        ? interval.startPower / 100
        : ((interval.startPower + interval.endPower) / 2) / 100
    seconds += duration
    weighted += fraction * duration
  }
  const result = {
    seconds,
    avgFraction: seconds > 0 ? weighted / seconds : 0,
  }
  workCache.set(workout, result)
  return result
}

export const computeKj = (workout: ZwiftWorkout, ftp: number): number => {
  const { seconds, avgFraction } = averagePowerFraction(workout)
  return (avgFraction * ftp * seconds) / 1000
}
