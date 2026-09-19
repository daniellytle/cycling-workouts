import React from "react"
import { ZwiftWorkout } from "./types"
import WorkoutChart from "./WorkoutChart"
import { useFtp } from "./ftp"
import { computeTss } from "./tss"

interface MyProps {
  workout: ZwiftWorkout
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
