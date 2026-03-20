import { useState, useEffect } from "react"
import { collection, onSnapshot } from "firebase/firestore"
import { db } from "../firebase"
import { useAuth } from "../context/AuthContext"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts"

export default function Dashboard() {
  const { user } = useAuth()
  const [todos, setTodos] = useState([])
  const [projects, setProjects] = useState([])
  const [sessions, setSessions] = useState([])
  const [chartView, setChartView] = useState("week")

  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, "users", user.uid, "todos"), (snap) => {
      setTodos(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    const unsub2 = onSnapshot(collection(db, "users", user.uid, "projects"), (snap) => {
      setProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    const unsub3 = onSnapshot(collection(db, "users", user.uid, "studySessions"), (snap) => {
      setSessions(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => { unsub1(); unsub2(); unsub3() }
  }, [user])

  // --- Todo stats ---
  const todoTotal = todos.length
  const todoDone = todos.filter((t) => t.completed).length
  const todoRemaining = todoTotal - todoDone

  // --- Project stats ---
  const projectTotal = projects.length
  const projectsDone = projects.filter((p) => {
    const subs = p.subtasks || []
    return subs.length > 0 && subs.every((s) => s.completed)
  }).length

  // overall subtask progress across all projects
  const allSubs = projects.flatMap((p) => p.subtasks || [])
  const allSubsDone = allSubs.filter((s) => s.completed).length

  // --- Study chart data ---
  function getWeekData() {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const now = new Date()
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now)
      d.setDate(now.getDate() - (6 - i))
      const dateStr = d.toISOString().split("T")[0]
      const hours = sessions
        .filter((s) => s.dateStr === dateStr)
        .reduce((sum, s) => sum + s.hours, 0)
      return { label: days[d.getDay()], hours: parseFloat(hours.toFixed(1)) }
    })
  }

  function getMonthData() {
    const now = new Date()
    const weeks = ["Week 1", "Week 2", "Week 3", "Week 4"]
    return Array.from({ length: 4 }, (_, i) => {
      const hours = sessions
        .filter((s) => {
          const d = new Date(s.date)
          return (
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear() &&
            Math.floor((d.getDate() - 1) / 7) === i
          )
        })
        .reduce((sum, s) => sum + s.hours, 0)
      return { label: weeks[i], hours: parseFloat(hours.toFixed(1)) }
    })
  }

  function getYearData() {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const now = new Date()
    return months.map((label, i) => {
      const hours = sessions
        .filter((s) => {
          const d = new Date(s.date)
          return d.getMonth() === i && d.getFullYear() === now.getFullYear()
        })
        .reduce((sum, s) => sum + s.hours, 0)
      return { label, hours: parseFloat(hours.toFixed(1)) }
    })
  }

  const chartData =
    chartView === "week" ? getWeekData() :
    chartView === "month" ? getMonthData() :
    getYearData()

  const totalStudyHours = sessions.reduce((sum, s) => sum + s.hours, 0)

  const totalStudyYear = sessions
    .filter((s) => new Date(s.date).getFullYear() === new Date().getFullYear())
    .reduce((sum, s) => sum + s.hours, 0)

  const totalStudyMonth = sessions
    .filter((s) => {
      const d = new Date(s.date)
      const now = new Date()
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    .reduce((sum, s) => sum + s.hours, 0)

  const totalStudyWeek = sessions
    .filter((s) => {
      const d = new Date(s.date)
      const now = new Date()
      const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)
      return d >= weekAgo
    })
    .reduce((sum, s) => sum + s.hours, 0)

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-1">Dashboard</h1>
      <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">Your progress at a glance</p>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Tasks Done", value: todoDone, color: "text-blue-600" },
          { label: "Tasks Remaining", value: todoRemaining, color: "text-amber-500" },
          { label: "Projects", value: projectTotal, color: "text-purple-600" },
          { label: "Study hrs (all time)", value: totalStudyHours.toFixed(1) + "h", color: "text-green-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tasks progress */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-200">Tasks Overview</h2>
          <span className="text-xs text-gray-400 dark:text-gray-500">{todoTotal > 0 ? Math.round((todoDone / todoTotal) * 100) : 0}% complete</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 mb-3">
          <div
            className="bg-blue-50 dark:bg-blue-900/300 h-2.5 rounded-full transition-all"
            style={{ width: `${todoTotal > 0 ? (todoDone / todoTotal) * 100 : 0}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>{todoDone} completed</span>
          <span>{todoRemaining} remaining</span>
        </div>
      </div>

      {/* Projects progress */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-200">Projects Overview</h2>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {allSubs.length > 0 ? Math.round((allSubsDone / allSubs.length) * 100) : 0}% subtasks done
          </span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 mb-3">
          <div
            className="bg-purple-500 h-2.5 rounded-full transition-all"
            style={{ width: `${allSubs.length > 0 ? (allSubsDone / allSubs.length) * 100 : 0}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>{allSubsDone} subtasks completed</span>
          <span>{projectsDone} of {projectTotal} projects fully done</span>
        </div>
      </div>

      {/* Study hours chart */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-200">Study Hours</h2>
          <div className="flex gap-1">
            {["week", "month", "year"].map((v) => (
              <button
                key={v}
                onClick={() => setChartView(v)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors capitalize
                  ${chartView === v
                    ? "bg-blue-600 text-white"
                    : "text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:bg-gray-800"
                  }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Mini stat row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "This Week", value: totalStudyWeek.toFixed(1) + "h" },
            { label: "This Month", value: totalStudyMonth.toFixed(1) + "h" },
            { label: "This Year", value: totalStudyYear.toFixed(1) + "h" },
          ].map((s) => (
            <div key={s.label} className="bg-gray-50 dark:bg-gray-950 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{s.label}</p>
              <p className="text-base font-semibold text-blue-600">{s.value}</p>
            </div>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                boxShadow: "none",
              }}
              formatter={(val) => [`${val}h`, "Hours"]}
            />
            <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}