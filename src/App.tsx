import { FaGithub, FaMoon, FaSun } from "react-icons/fa"
import { Outlet } from "react-router"
import { Link } from "react-router-dom"
import { useEffect, useState } from "react"
import { FtpContext, FTP_DEFAULT } from "./ftp"

const FTP_MIN = 50
const FTP_MAX = 1500

const readStoredFtp = (): number => {
  let stored: number | null = null
  try {
    const raw = localStorage.getItem("ftp")
    if (raw !== null) {
      const parsed = parseInt(raw, 10)
      if (!isNaN(parsed)) stored = parsed
    }
  } catch (e) {}
  if (stored === null) return FTP_DEFAULT
  return Math.min(FTP_MAX, Math.max(FTP_MIN, stored))
}

function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() =>
    document.documentElement.classList.contains("dark")
  )
  const [ftp, setFtp] = useState<number>(readStoredFtp)

  useEffect(() => {
    try {
      localStorage.setItem("ftp", String(ftp))
    } catch (e) {}
  }, [ftp])

  const toggleDarkMode = () => {
    const next = !darkMode
    setDarkMode(next)
    document.documentElement.classList.toggle("dark", next)
    try {
      localStorage.setItem("theme", next ? "dark" : "light")
    } catch (e) {}
  }

  return (
    <FtpContext.Provider value={ftp}>
      <div className="App h-screen flex flex-col bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <header className="shrink-0 bg-white border-b border-gray-200 w-full z-50 dark:bg-gray-900 dark:border-gray-700">
          <div className="mx-auto w-full max-w-screen-2xl flex justify-between items-center p-4 gap-4">
            <Link to={"/"}>
              <h1 className="text-3xl font-bold hover:text-gray-600 dark:hover:text-gray-400">
                Cycling Workouts
              </h1>
            </Link>
            <div className="flex items-center">
              <div
                className="flex items-center rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                title="Functional Threshold Power (watts)"
              >
                <span className="hidden md:inline pl-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  FTP
                </span>
                <input
                  type="number"
                  value={ftp}
                  min={FTP_MIN}
                  max={FTP_MAX}
                  step={1}
                  onChange={(e) => {
                    if (e.target.value === "") return
                    const parsed = parseInt(e.target.value, 10)
                    if (!isNaN(parsed) && parsed >= 1 && parsed <= FTP_MAX) {
                      setFtp(parsed)
                    }
                  }}
                  onBlur={() => {
                    setFtp((current) =>
                      Math.min(FTP_MAX, Math.max(FTP_MIN, current))
                    )
                  }}
                  aria-label="FTP in watts"
                  className="ml-1 w-16 px-1 py-1 bg-transparent text-center text-sm font-semibold text-gray-700 dark:text-gray-200 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="pr-2 text-sm text-gray-400 dark:text-gray-500">
                  W
                </span>
              </div>
              <Link
                className="ml-4 self-center"
                to={"about"}
              >
                About
              </Link>
              <Link
                className="ml-4 self-center"
                to={"https://github.com/daniellytle/cycling-workout-directory"}
                aria-label="GitHub repository"
                title="GitHub repository"
              >
                <FaGithub aria-hidden="true" />
              </Link>
              <button
                onClick={toggleDarkMode}
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                className="ml-4 p-1.5 rounded-md hover:bg-gray-100 text-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {darkMode ? <FaSun aria-hidden="true" /> : <FaMoon aria-hidden="true" />}
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </FtpContext.Provider>
  )
}

export default App
