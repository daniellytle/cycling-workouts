import React from "react"
import { ZwiftWorkout } from "./types"
import WorkoutChart from "./WorkoutChart"
import { useFtp } from "./ftp"
import { computeTss } from "./tss"
import { FaRegClock, FaExternalLinkAlt, FaDownload } from "react-icons/fa"
import { workoutName, stripRiderName } from "./workoutName"

interface MyProps {
  workout: ZwiftWorkout
}

const WorkoutView: React.FC<MyProps> = (props: MyProps) => {
  const ftp = useFtp()
  const zwoFile = new Blob([props.workout.rawXML], { type: "text/plain" })
  const tss = Math.round(computeTss(props.workout).tss)
  const tssPerMinute = tss / Math.max(props.workout.duration, 1)

  const tssColor =
    tssPerMinute < 0.75
      ? "border-green-300 dark:border-green-700 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200"
      : tssPerMinute < 1.0
        ? "border-yellow-300 dark:border-yellow-700 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200"
        : tssPerMinute < 1.25
          ? "border-orange-300 dark:border-orange-700 bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200"
          : "border-red-300 dark:border-red-700 bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200"

  return (
    <div className="w-full prose max-w-none dark:prose-invert">
      <h2 className="mb-1">{workoutName(props.workout)}</h2>
      <p className="mb-4 text-sm font-medium text-gray-500 dark:text-gray-400">
        {props.workout.rider}
      </p>
      <div
        className="mb-4 p-4 w-full border border-color-gray-600 rounded dark:border-gray-600"
        style={{ height: 150 }}
      >
        <WorkoutChart workout={props.workout} interactive ftp={ftp} />
      </div>
      <div className="mb-4">
        {stripRiderName(props.workout.description, props.workout.rider)}
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 px-3 py-1 font-medium">
          <FaRegClock className="text-gray-500 dark:text-gray-400" />
          {Math.round(props.workout.duration)} min
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium ${tssColor}`}
        >
          TSS {tss}
        </span>
        <span className="ml-auto inline-flex items-center gap-2">
          {/^https?:\/\//i.test(props.workout.source) ? (
            <a
              href={props.workout.source}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/40 px-3 py-1 font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60"
            >
              <FaExternalLinkAlt className="text-xs" />
              Source
            </a>
          ) : (
            <span className="inline-flex items-center rounded-full border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 px-3 py-1 font-medium">
              {props.workout.source}
            </span>
          )}
          <a
            download={
              props.workout.name.replace(/\s+/g, "-").toLowerCase() + ".zwo"
            }
            target="_blank"
            rel="noreferrer"
            href={URL.createObjectURL(zwoFile)}
            className="inline-flex items-center gap-1.5 rounded-full border border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/40 px-3 py-1 font-medium text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/60"
          >
            <FaDownload className="text-xs" />
            .zwo
          </a>
        </span>
      </div>
    </div>
  )
}

export default WorkoutView
