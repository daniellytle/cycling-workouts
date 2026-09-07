import React, { useState } from "react"
import { ZwiftWorkout, ZwiftInterval } from "./types"

interface WorkoutChartProps {
  workout: ZwiftWorkout
  interactive?: boolean
  ftp?: number
}

const Chart = ({
  children,
  height,
  width,
}: {
  children: React.ReactNode
  height: number
  width: number
}) => (
  <svg
    viewBox={`0 0 ${width} ${height}`}
    style={{ width: "100%", height: "100%" }}
    preserveAspectRatio={"none"}
  >
    {children}
  </svg>
)

const powerRange = (intervals: ZwiftInterval[]): number =>
  Math.max(
    100,
    ...intervals.map((i) => Math.max(i.startPower, i.endPower))
  )

const workoutTotalSeconds = (intervals: ZwiftInterval[]): number =>
  intervals.reduce((sum, i) => sum + i.duration, 0)

const formatAxisTime = (seconds: number): string => {
  const mins = Math.round(seconds / 60)
  if (mins < 60) return `${mins}`
  const hours = Math.floor(mins / 60)
  const rem = mins % 60
  return `${hours}:${rem.toString().padStart(2, "0")}`
}

const xTicksFor = (intervals: ZwiftInterval[]): number[] => {
  const totalMinutes = workoutTotalSeconds(intervals) / 60
  const candidates = [1, 2, 5, 10, 15, 20, 30]
  const stepMinutes =
    candidates.find((s) => s >= totalMinutes / 6) || 60
  const ticks: number[] = []
  for (let minutes = 0; minutes <= totalMinutes + 0.001; minutes += stepMinutes) {
    ticks.push(minutes * 60)
  }
  return ticks
}

const yTickStepFor = (range: number): number => {
  const candidates = [10, 20, 25, 30, 50, 100]
  return candidates.find((s) => range / s <= 6) || 100
}

const powerColor = (interval: ZwiftInterval): string => {
  const power =
    interval.startPower > interval.endPower
      ? interval.startPower
      : interval.endPower
  if (power < 55) return "#38bdf8"
  else if (power < 75) return "#22c55e"
  else if (power < 90) return "#eab308"
  else if (power < 105) return "#f97316"
  else if (power < 120) return "#ef4444"
  else return "#a855f7"
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  return secs > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : `${mins}:00`
}

const intervalPct = (interval: ZwiftInterval): string => {
  if (interval.startPower === interval.endPower) {
    return `${Math.round(interval.startPower)}%`
  }
  return `${Math.round(interval.startPower)}–${Math.round(interval.endPower)}%`
}

const intervalWatts = (interval: ZwiftInterval, ftp: number): string => {
  const startW = Math.round((interval.startPower / 100) * ftp)
  const endW = Math.round((interval.endPower / 100) * ftp)
  if (interval.startPower === interval.endPower) {
    return `${startW} W`
  }
  return `${startW}–${endW} W`
}

const zoneLabel = (interval: ZwiftInterval): string => {
  const power =
    interval.startPower > interval.endPower
      ? interval.startPower
      : interval.endPower
  if (power < 55) return "Recovery"
  if (power < 75) return "Endurance"
  if (power < 90) return "Tempo"
  if (power < 105) return "Threshold"
  if (power < 120) return "VO2 Max"
  return "Anaerobic"
}

interface BlockProps {
  interval: ZwiftInterval
  index: number
  x: number
  y: number
  width: number
  height: number
  active: boolean
  interactive: boolean
  onHover: (index: number | null) => void
}

const Block: React.FC<BlockProps> = ({
  interval,
  index,
  x,
  y,
  width,
  active,
  interactive,
  onHover,
}) => (
  <rect
    onMouseEnter={() => interactive && onHover(index)}
    onMouseLeave={() => interactive && onHover(null)}
    fill={powerColor(interval)}
    x={x}
    y={y}
    width={width}
    height={interval.startPower}
    stroke={active ? "#111827" : "none"}
    strokeWidth={active ? 2 : 0}
  />
)

const Ramp: React.FC<BlockProps> = ({
  interval,
  index,
  x,
  y,
  width,
  height,
  active,
  interactive,
  onHover,
}) => (
  <path
    onMouseEnter={() => interactive && onHover(index)}
    onMouseLeave={() => interactive && onHover(null)}
    d={`M${x},${y} L${x + width},${y + interval.startPower - interval.endPower} L${x + width},${height} L${x},${height}`}
    fill={powerColor(interval)}
    stroke={active ? "#111827" : "none"}
    strokeWidth={active ? 2 : 0}
  />
)

interface BarChartProps {
  intervals: ZwiftInterval[]
  activeIndex: number | null
  interactive: boolean
  onHover: (index: number | null) => void
}

const BarChart: React.FC<BarChartProps> = ({
  intervals,
  activeIndex,
  interactive,
  onHover,
}) => {
  const barMargin = 3
  const width =
    intervals.reduce((agg, i) => agg + i.duration, 0) +
    intervals.length * barMargin
  const height = powerRange(intervals)

  return (
    <Chart height={height} width={width}>
      {intervals.map((interval, index) => {
        const x = intervals
          .slice(0, index)
          .reduce((agg, i) => agg + i.duration + barMargin, 0)
        const y = height - interval.startPower
        const common = {
          interval,
          index,
          x,
          y,
          width: interval.duration,
          height,
          active: index === activeIndex,
          interactive,
          onHover,
        }
        if (interval.startPower === interval.endPower) {
          return <Block key={index} {...common} />
        } else {
          return <Ramp key={index} {...common} />
        }
      })}
      {/* FTP Line */}
      {/* <line x1={0} y1={height - 100} x2={width} y2={height - 100} stroke={"red"}/> */}
    </Chart>
  )
}

const WorkoutChart: React.FC<WorkoutChartProps> = ({
  workout,
  interactive = false,
  ftp,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [containerSize, setContainerSize] = useState<{
    width: number
    height: number
  } | null>(null)
  const active =
    activeIndex !== null ? workout.intervals[activeIndex] : undefined

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return
    const rect = e.currentTarget.getBoundingClientRect()
    setContainerSize({ width: rect.width, height: rect.height })
  }

  const handleLeave = () => {
    setActiveIndex(null)
    setContainerSize(null)
  }

  const intervals = workout.intervals
  const totalSeconds = workoutTotalSeconds(intervals)
  const range = powerRange(intervals)

  let tooltipStyle: React.CSSProperties | undefined
  if (interactive && active && activeIndex !== null && containerSize) {
    const barMargin = 3
    const totalWidth =
      intervals.reduce((agg, i) => agg + i.duration, 0) +
      intervals.length * barMargin
    let x = 0
    for (let i = 0; i < activeIndex; i++) {
      x += intervals[i].duration + barMargin
    }
    const blockWidth = intervals[activeIndex].duration
    const blockTop = 1 - intervals[activeIndex].startPower / range
    const centerX = ((x + blockWidth / 2) / totalWidth) * 100

    const tooltipWidth = 230
    const tooltipHeight = 56
    const pxWidth = containerSize.width
    const pxHeight = containerSize.height
    const left = Math.min(
      Math.max((centerX / 100) * pxWidth - tooltipWidth / 2, 6),
      pxWidth - tooltipWidth - 6
    )
    const top = Math.min(
      Math.max(blockTop * pxHeight - tooltipHeight - 6, 6),
      pxHeight - tooltipHeight - 6
    )
    tooltipStyle = { left, top }
  }

  if (!interactive) {
    return (
      <div className="h-full w-full">
        <BarChart
          intervals={intervals}
          activeIndex={activeIndex}
          interactive={interactive}
          onHover={setActiveIndex}
        />
      </div>
    )
  }

  const yTickStep = yTickStepFor(range)
  const yTicks: number[] = []
  for (let p = 0; p <= range + 0.001; p += yTickStep) yTicks.push(p)
  const xTicks = xTicksFor(intervals)
  const labelFtp = ftp !== undefined ? ftp : 0

  return (
    <div className="flex h-full w-full">
      <div className="flex w-11 shrink-0 select-none flex-col">
        <div className="relative flex-1">
          {yTicks.map((p) => (
            <span
              key={p}
              className="absolute right-1 text-[10px] leading-none text-gray-400 dark:text-gray-500"
              style={{
                top: `${(1 - p / range) * 100}%`,
                transform: "translateY(-50%)",
              }}
            >
              {Math.round((p / 100) * labelFtp)}W
            </span>
          ))}
        </div>
        <div className="h-4 shrink-0" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div
          className="relative min-h-0 flex-1"
          onMouseMove={handleMove}
          onMouseLeave={handleLeave}
        >
          {yTicks.map((p) => (
            <div
              key={p}
              className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-gray-200 dark:border-gray-700/60"
              style={{ top: `${(1 - p / range) * 100}%` }}
            />
          ))}
          <div className="absolute inset-0">
            <BarChart
              intervals={intervals}
              activeIndex={activeIndex}
              interactive
              onHover={setActiveIndex}
            />
          </div>
          {active && tooltipStyle && (
            <div
              className="pointer-events-none absolute z-10 whitespace-nowrap rounded-md bg-gray-900/90 px-3 py-2 text-center text-xs text-white shadow-lg"
              style={tooltipStyle}
            >
              <div className="font-semibold">
                Block {(activeIndex as number) + 1} · {zoneLabel(active)} ·{" "}
                {formatDuration(active.duration)}
              </div>
              <div className="opacity-90">
                {intervalPct(active)} FTP
                {ftp !== undefined && <> · {intervalWatts(active, ftp)}</>}
              </div>
            </div>
          )}
        </div>
        <div className="relative h-4 shrink-0 select-none">
          {xTicks.map((t) => (
            <span
              key={t}
              className="absolute text-[10px] leading-none text-gray-400 dark:text-gray-500"
              style={{
                left: `${
                  totalSeconds > 0
                    ? Math.min(Math.max((t / totalSeconds) * 100, 5), 95)
                    : 0
                }%`,
                transform: "translateX(-50%)",
              }}
            >
              {formatAxisTime(t)}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default WorkoutChart
