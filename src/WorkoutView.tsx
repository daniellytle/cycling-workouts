import React from "react"
import { ZwiftWorkout } from "./types"
import WorkoutChart from "./WorkoutChart"
import { useFtp } from "./ftp"
import { computeTss } from "./tss"
import { FaRegClock } from "react-icons/fa"

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
      <h2 className="mb-4">{props.workout.name}</h2>
      <div
        className="mb-4 p-4 w-full border border-color-gray-600 rounded dark:border-gray-600"
        style={{ height: 150 }}
      >
        <WorkoutChart workout={props.workout} interactive ftp={ftp} />
      </div>
      <div className="mb-4">{props.workout.description}</div>
      <div className="mb-4 flex gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 px-3 py-1 font-medium">
          <FaRegClock className="text-gray-500 dark:text-gray-400" />
          {Math.round(props.workout.duration)} min
        </span>
        <div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium ${tssColor}`}
          >
            TSS {tss}
          </span>
        </div>
      </div>
      <div className="mb-4">
        Source:{" "}
        {/^https?:\/\//i.test(props.workout.source) ? (
          <a
            href={props.workout.source}
            target="_blank"
            rel="noreferrer"
            className="font-bold text-blue-600 hover:underline dark:text-blue-400"
          >
            {props.workout.source}
          </a>
        ) : (
          <span className="font-bold">{props.workout.source}</span>
        )}
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
