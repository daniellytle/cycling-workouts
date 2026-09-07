import React, { useState, Fragment, useEffect, useRef } from "react"
import { Link, useParams } from "react-router-dom"

import { ZwiftWorkout } from "./types"
import { workouts } from "./workouts"
import WorkoutChart from "./WorkoutChart"
import { Dialog, Transition } from "@headlessui/react"
import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa"
import { useNavigate } from "react-router-dom"
import WorkoutView from "./WorkoutView"
import { computeTss, computeKj } from "./tss"
import { useFtp } from "./ftp"

type SortKey = "name" | "duration" | "tss" | "kj"
type SortDirection = "asc" | "desc"

const WorkoutList: React.FC = () => {
  const { workoutId } = useParams()
  const selectedWorkout = workouts.find((workout): Boolean => {
    return workout.name.replace(/\s+/g, "-").toLowerCase() === workoutId
  })
  const [displayWorkout, setDisplayWorkout] = useState<ZwiftWorkout | null>(
    null
  )
  useEffect(() => {
    if (selectedWorkout) setDisplayWorkout(selectedWorkout)
  }, [selectedWorkout])
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [minDuration, setMinDuration] = useState(0)
  const [maxDuration, setMaxDuration] = useState(100)
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const ftp = useFtp()

  const filteredWorkouts: ZwiftWorkout[] = workouts.filter(
    (workout) =>
      workout.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedTags.length === 0 ||
        selectedTags.every((x) => workout.tags.includes(x))) &&
      (selectedCategories.length === 0 ||
        selectedCategories.includes(workout.category)) &&
      workout.duration > minDuration &&
      workout.duration < maxDuration
  )

  const sortedWorkouts: ZwiftWorkout[] = [...filteredWorkouts].sort((a, b) => {
    if (sortKey === null) return 0
    const dir = sortDirection === "asc" ? 1 : -1
    if (sortKey === "name") {
      return (
        a.name.localeCompare(b.name, undefined, {
          numeric: true,
          sensitivity: "base",
        }) * dir
      )
    }
    if (sortKey === "tss") {
      return (computeTss(a).tss - computeTss(b).tss) * dir
    }
    if (sortKey === "kj") {
      return (computeKj(a, ftp) - computeKj(b, ftp)) * dir
    }
    return (a.duration - b.duration) * dir
  })

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDirection("asc")
    }
  }

  const ROW_HEIGHT = 77
  const scrollRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLTableSectionElement>(null)
  const [range, setRange] = useState({ start: 0, end: 20 })

  const updateRange = () => {
    const scroller = scrollRef.current
    if (!scroller) return
    const headerHeight = headerRef.current?.offsetHeight ?? 0
    const top = scroller.scrollTop
    const viewport = scroller.clientHeight
    const overscan = 6
    const start = Math.max(
      0,
      Math.floor((top - headerHeight) / ROW_HEIGHT) - overscan
    )
    const end = Math.min(
      filteredWorkouts.length,
      Math.ceil((top - headerHeight + viewport) / ROW_HEIGHT) + overscan
    )
    setRange((current) =>
      current.start === start && current.end === end
        ? current
        : { start, end }
    )
  }

  useEffect(() => {
    updateRange()
    window.addEventListener("resize", updateRange)
    return () => window.removeEventListener("resize", updateRange)
  })

  const resetTable = () => {
    scrollRef.current?.scrollTo({ top: 0 })
    updateRange()
  }

  const largestWorkoutDuration = Math.ceil(
    Math.max(...workouts.map((w) => w.duration))
  )

  const categories: string[] = Array.from(
    new Set(workouts.map((item) => item.category).flat())
  )
  const tags: string[] = Array.from(
    new Set(workouts.map((item) => item.tags).flat())
  )

  const navigate = useNavigate()

  const toggleTag = (tag: string) => {
    resetTable()
    const updatedTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag]
    setSelectedTags(updatedTags)
  }

  const toggleCategory = (category: string) => {
    resetTable()
    const updatedCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category]
    setSelectedCategories(updatedCategories)
  }

  const updateMaxDuration = (value: number) => {
    if (value > minDuration) setMaxDuration(value)
  }

  const updateMinDuration = (value: number) => {
    if (value < maxDuration) setMinDuration(value)
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-screen-2xl p-4 gap-6">
      {/* Filter Panel */}
      <aside className="w-80 shrink-0 overflow-y-auto pr-2 hidden lg:block">
        <h2 className="text-lg font-semibold mb-2">Filters</h2>
        <input
          type="text"
          placeholder="Name..."
          className="p-2 border border-gray-300 rounded-md mb-4 w-full bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:placeholder-gray-500"
          value={searchTerm}
          onChange={(e) => {
            resetTable()
            setSearchTerm(e.target.value)
          }}
        />
        {/*<div className="mb-4">
          <h3 className="text-sm font-semibold mb-1">Category</h3>
          {categories.map(category => (
            <div key={category} className="flex items-center mb-2">
              <input
                type="checkbox"
                id={category}
                checked={selectedCategories.includes(category)}
                onChange={() => toggleCategory(category)}
                className="mr-2"
              />
              <label htmlFor={category}>{category}</label>
            </div>
          ))}
        </div>
        */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold mb-1">Tags</h3>
          {tags.map((tag, i) => (
            <span
              key={i}
              className={
                "select-none cursor-pointer mr-2 mb-2 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset " +
                (selectedTags.includes(tag)
                  ? "ring-blue-500/10 bg-blue-50 text-blue-600 dark:ring-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400"
                  : "ring-gray-500/10 bg-gray-50 text-gray-600 dark:ring-gray-500/20 dark:bg-gray-800 dark:text-gray-300")
              }
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </span>
          ))}
        </div>
        {/* <div className="mb-4 relative">
          <h3 className="text-sm font-semibold mb-1">Duration</h3>
          <div className="h-2 absolute bg-gray-200 w-full rounded mt-1"></div>
          <div
            className="h-2 absolute bg-blue-300 rounded mt-1"
            style={{
              left: `${minDuration}%`,
              right: `${100 - maxDuration}%`,
            }}
          ></div>
          <input
            type="range"
            step={1}
            onChange={(e) => updateMinDuration(parseInt(e.target.value))}
            min={0}
            max={100}
            value={minDuration}
            className="w-full absolute bg-none"
          />
          <input
            type="range"
            step={1}
            onChange={(e) => updateMaxDuration(parseInt(e.target.value))}
            min={0}
            max={100}
            value={maxDuration}
            className="w-full absolute bg-none"
          />
          <div
            className="absolute mt-2 text-sm text-gray-400"
            style={{ left: `${minDuration}%` }}
          >
            {minDuration}
          </div>
        </div> */}
      </aside>
      <>
        <Transition appear show={selectedWorkout != null} as={Fragment}>
          <Dialog
            as="div"
            className="relative z-10"
            onClose={() => navigate("/")}
          >
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/25" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                    {displayWorkout && (
                      <WorkoutView workout={displayWorkout} />
                    )}
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      </>
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden rounded-2xl ring-1 ring-gray-200 dark:ring-gray-800 shadow-sm bg-white dark:bg-gray-900">
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
          onScroll={updateRange}
        >
          <table className="min-w-full">
            <thead ref={headerRef}>
              <tr className="text-left">
                <th className="w-52 px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
                  Profile
                </th>
                <th
                  aria-sort={
                    sortKey === "name"
                      ? sortDirection === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                  className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10"
                >
                  <button
                    onClick={() => toggleSort("name")}
                    className="inline-flex items-center gap-1.5 select-none cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    Name
                    {sortKey === "name" ? (
                      sortDirection === "asc" ? (
                        <FaSortUp aria-hidden="true" />
                      ) : (
                        <FaSortDown aria-hidden="true" />
                      )
                    ) : (
                      <FaSort className="opacity-40" aria-hidden="true" />
                    )}
                  </button>
                </th>
                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Category</th> */}
                <th
                  aria-sort={
                    sortKey === "duration"
                      ? sortDirection === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                  className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 hidden md:table-cell bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10"
                >
                  <button
                    onClick={() => toggleSort("duration")}
                    className="inline-flex items-center justify-end gap-1.5 w-full select-none cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    Duration
                    {sortKey === "duration" ? (
                      sortDirection === "asc" ? (
                        <FaSortUp aria-hidden="true" />
                      ) : (
                        <FaSortDown aria-hidden="true" />
                      )
                    ) : (
                      <FaSort className="opacity-40" aria-hidden="true" />
                    )}
                  </button>
                </th>
                <th
                  aria-sort={
                    sortKey === "tss"
                      ? sortDirection === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                  className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 hidden lg:table-cell bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10"
                >
                  <button
                    onClick={() => toggleSort("tss")}
                    className="inline-flex items-center justify-end gap-1.5 w-full select-none cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    TSS
                    {sortKey === "tss" ? (
                      sortDirection === "asc" ? (
                        <FaSortUp aria-hidden="true" />
                      ) : (
                        <FaSortDown aria-hidden="true" />
                      )
                    ) : (
                      <FaSort className="opacity-40" aria-hidden="true" />
                    )}
                  </button>
                </th>
                <th
                  aria-sort={
                    sortKey === "kj"
                      ? sortDirection === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                  className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 hidden xl:table-cell bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10"
                >
                  <button
                    onClick={() => toggleSort("kj")}
                    className="inline-flex items-center justify-end gap-1.5 w-full select-none cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    kJ
                    {sortKey === "kj" ? (
                      sortDirection === "asc" ? (
                        <FaSortUp aria-hidden="true" />
                      ) : (
                        <FaSortDown aria-hidden="true" />
                      )
                    ) : (
                      <FaSort className="opacity-40" aria-hidden="true" />
                    )}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900">
              {range.start > 0 && (
                <tr aria-hidden="true" style={{ height: range.start * ROW_HEIGHT }}>
                  <td colSpan={5} />
                </tr>
              )}
              {sortedWorkouts.slice(range.start, range.end).map((workout) => (
                <tr
                  key={workout.name}
                  className="group cursor-pointer border-b border-gray-100 dark:border-gray-800 transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-gray-800/60"
                  onClick={() =>
                    navigate(
                      `/workouts/${workout.name.replace(/\s+/g, "-").toLowerCase()}`
                    )
                  }
                >
                  <td className="px-6 py-3.5 align-middle">
                    <div className="h-12 w-full">
                      <WorkoutChart workout={workout} />
                    </div>
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap align-middle">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {workout.name}
                    </span>
                  </td>
                  {/* <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">{workout.category}</td> */}
                  <td className="px-6 py-3.5 whitespace-nowrap text-right align-middle text-sm text-gray-500 dark:text-gray-400 tabular-nums hidden md:table-cell">
                    {Math.round(workout.duration)} min
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-right align-middle text-sm font-medium text-gray-700 dark:text-gray-200 tabular-nums hidden lg:table-cell">
                    {Math.round(computeTss(workout).tss)}
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-right align-middle text-sm text-gray-500 dark:text-gray-400 tabular-nums hidden xl:table-cell">
                    {Math.round(computeKj(workout, ftp))}
                  </td>
                </tr>
              ))}
              {range.end < sortedWorkouts.length && (
                <tr aria-hidden="true" style={{ height: (sortedWorkouts.length - range.end) * ROW_HEIGHT }}>
                  <td colSpan={5} />
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <footer className="shrink-0 px-6 py-2.5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-medium text-gray-500 dark:text-gray-400">
          {filteredWorkouts.length.toLocaleString()}{" "}
          {filteredWorkouts.length === 1 ? "workout" : "workouts"}
        </footer>
      </div>
    </div>
  )
}

export default WorkoutList
