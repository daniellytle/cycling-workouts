import { ZwiftWorkout } from "./types"

export const workoutName = (workout: ZwiftWorkout): string => {
  const riderWords = workout.rider
    .trim()
    .split(/\s+/)
    .map((w) => w.toLowerCase())
  const nameWords = workout.name.trim().split(/\s+/)
  let best = 0
  for (let i = 0; i < riderWords.length; i++) {
    const suffix = riderWords.slice(i)
    if (suffix.length <= best) continue
    const prefix = nameWords.slice(0, suffix.length).map((w) => w.toLowerCase())
    if (suffix.every((w, idx) => w === prefix[idx])) best = suffix.length
  }
  return nameWords.slice(best).join(" ")
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

export const stripRiderName = (text: string, rider: string): string => {
  if (!rider) return text
  const riderPattern = rider
    .trim()
    .split(/\s+/)
    .map(escapeRegex)
    .join("\\s+")
  const re = new RegExp(`^\\s*${riderPattern}('s)?\\s*`, "i")
  const stripped = text.replace(re, "")
  return stripped.charAt(0).toUpperCase() + stripped.slice(1)
}
