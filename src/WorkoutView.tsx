import React from "react"
import { ZwiftWorkout, ZwiftInterval } from "./types"
import WorkoutChart from "./WorkoutChart"
import { useFtp } from "./ftp"
import { computeTss } from "./tss"

interface MyProps {
  workout: ZwiftWorkout
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  return secs > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : `${mins} min`
}

const intervalWatts = (interval: ZwiftInterval, ftp: number): string => {
  const startW = Math.round((interval.startPower / 100) * ftp)
  const endW = Math.round((interval.endPower / 100) * ftp)
  if (interval.startPower === interval.endPower) {
    return `${startW} W`
  }
  return `${startW}–${endW} W`
}

const intervalLabel = (interval: ZwiftInterval): string => {
  if (interval.startPower === interval.endPower) {
    return `${Math.round(interval.startPower)}%`
  }
  return `${Math.round(interval.startPower)}→${Math.round(interval.endPower)}%`
}

const WorkoutView: React.FC<MyProps> = (props: MyProps) => {
  const ftp = useFtp()
  const zwoFile = new Blob([props.workout.rawXML], { type: "text/plain" })

  return (
    <div className="w-full prose max-w-none dark:prose-invert">
      <h2 className="mb-4">{props.workout.name}</h2>
      <div
        className="mb-4 p-4 w-full border border-color-gray-600 rounded dark:border-gray-600"
        style={{ height: 150 }}
      >
        <WorkoutChart workout={props.workout} interactive ftp={ftp} />
      </div>
      <div className="mb-4">{props.workout.description}</div>
      <div className="mb-4">
        Author: <span className="font-bold">{props.workout.author}</span>
      </div>
      <div className="mb-4 flex gap-6 text-sm">
        <div>
          Duration:{" "}
          <span className="font-medium">
            {Math.round(props.workout.duration)} min
          </span>
        </div>
        <div>
          TSS:{" "}
          <span className="font-medium">
            {Math.round(computeTss(props.workout).tss)}
          </span>
        </div>
      </div>
      <div className="mb-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {props.workout.intervals.length} segments · power shown at FTP{" "}
          {ftp} W
        </div>
        <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
          {props.workout.intervals.map((interval, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 px-3 py-1.5 text-sm last:border-b-0"
            >
              <span className="text-gray-500 dark:text-gray-400">
                {formatDuration(interval.duration)}
              </span>
              <span className="text-gray-400 dark:text-gray-500">
                {intervalLabel(interval)}
              </span>
              <span className="font-medium text-gray-700 dark:text-gray-200">
                {intervalWatts(interval, ftp)}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end">
        <a
          download={
            props.workout.name.replace(/\s+/g, "-").toLowerCase() + ".zwo"
          }
          target="_blank"
          rel="noreferrer"
          href={URL.createObjectURL(zwoFile)}
          className="no-underline bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded"
        >
          Download .zwo File
        </a>
      </div>
    </div>
  )
}

export default WorkoutView
