import { ZwiftWorkout, ZwiftInterval } from "./types"
import { XMLParser } from "fast-xml-parser"

const getWorkoutDuration = (intervals: ZwiftInterval[]): number => {
  const duration =
    intervals.reduce((agg, interval) => (agg += interval.duration), 0) / 60
  if (isNaN(duration)) throw "Error calculating total workout duration"
  return duration
}

const getWorkoutFile = (content: any[]) =>
  content.find((item) => item.hasOwnProperty("workout_file")).workout_file

const getWorkoutTags = (content: any[]): string[] =>
  content
    .find((item) => item.hasOwnProperty("tags"))
    ?.tags.map((t: any) => getTagProperty("name", t)) || []

const getWorkout = (content: any[]) =>
  content.find((item) => item.hasOwnProperty("workout")).workout

const getTagProperty = (propertyName: string, content: any): string =>
  content[":@"][`@_${propertyName}`] || ""

const parsePowerPercentage = (powerString: string): number =>
  parseFloat(powerString) * 100 // convert to percentage

const getTagText = (tagName: string, content: any[]): string =>
  content.find((item) => item.hasOwnProperty(tagName))?.[tagName]?.[0]?.[
    "#text"
  ] || ""

const parseBlock = (content: object): ZwiftInterval => ({
  duration: parseInt(getTagProperty("Duration", content)),
  startPower: parsePowerPercentage(
    getTagProperty("PowerLow", content) ||
      getTagProperty("Power", content) ||
      "0.4"
  ),
  endPower: parsePowerPercentage(
    getTagProperty("PowerHigh", content) ||
      getTagProperty("Power", content) ||
      "0.4"
  ),
})

const parseIntervals = (content: object): ZwiftInterval[] => {
  const repeat = parseInt(getTagProperty("Repeat", content))
  const onDuration = parseInt(getTagProperty("OnDuration", content))
  const onPower = parsePowerPercentage(getTagProperty("OnPower", content))
  const offDuration = parseInt(getTagProperty("OffDuration", content))
  const offPower = parsePowerPercentage(getTagProperty("OffPower", content))
  return [...Array(repeat)]
    .map((i) => [
      { duration: onDuration, startPower: onPower, endPower: onPower },
      { duration: offDuration, startPower: offPower, endPower: offPower },
    ])
    .flat()
}

const getIntervals = (content: any[]): ZwiftInterval[] =>
  content
    .map((item) => {
      if (item.hasOwnProperty("IntervalsT")) {
        return parseIntervals(item)
      } else {
        return parseBlock(item)
      }
    })
    .flat()

function parseZwiftWorkoutString(workoutContent: string): ZwiftWorkout {
  const parser = new XMLParser({
    ignoreAttributes: false,
    preserveOrder: true,
  })
  const content = parser.parse(workoutContent)

  let workoutName = ""
  let workoutDescription = ""
  let workoutSource = ""
  let workoutCategory: string = ""
  let workoutTags: string[] = []
  let intervals: ZwiftInterval[] = []

  const workoutFile = getWorkoutFile(content)
  workoutName = getTagText("name", workoutFile).toString()
  workoutDescription = getTagText("description", workoutFile)
  workoutSource = getTagText("author", workoutFile)
  workoutCategory = getTagText("category", workoutFile)
  workoutTags = getWorkoutTags(workoutFile)

  const workout = getWorkout(workoutFile)
  intervals = getIntervals(workout)

  const duration = getWorkoutDuration(intervals)

  return {
    name: workoutName,
    description: workoutDescription,
    source: workoutSource,
    rider: "",
    intervals,
    tags: workoutTags,
    category: workoutCategory,
    rawXML: workoutContent,
    duration,
  }
}

export { parseZwiftWorkoutString }
