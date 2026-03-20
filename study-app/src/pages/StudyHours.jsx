import { useState, useEffect, useRef } from "react"
import { collection, addDoc, onSnapshot, deleteDoc, doc } from "firebase/firestore"
import { db } from "../firebase"
import { useAuth } from "../context/AuthContext"

export default function StudyHours() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])

  // Timer state
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerSubject, setTimerSubject] = useState("")
  const intervalRef = useRef(null)

  // Manual entry state
  const [manualSubject, setManualSubject] = useState("")
  const [manualHours, setManualHours] = useState("")
  const [manualDate, setManualDate] = useState(new Date().toISOString().split("T")[0])

  useEffect(() => {
    const ref = collection(db, "users", user.uid, "studySessions")
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      data.sort((a, b) => b.date - a.date)
      setSessions(data)
    })
    return unsubscribe
  }, [user])

  // Timer logic
  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => {
        setTimerSeconds((s) => s + 1)
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [timerRunning])

  function formatTime(seconds) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }

  async function stopAndSave() {
    if (timerSeconds < 60) {
      alert("Study for at least 1 minute before saving!")
      return
    }
    const hours = parseFloat((timerSeconds / 3600).toFixed(2))
    await addDoc(collection(db, "users", user.uid, "studySessions"), {
      subject: timerSubject.trim() || "General",
      hours,
      date: Date.now(),
      dateStr: new Date().toISOString().split("T")[0],
      type: "timer",
    })
    setTimerRunning(false)
    setTimerSeconds(0)
    setTimerSubject("")
  }

  async function addManualSession() {
    if (!manualHours || isNaN(manualHours) || parseFloat(manualHours) <= 0) {
      alert("Please enter valid hours!")
      return
    }
    await addDoc(collection(db, "users", user.uid, "studySessions"), {
      subject: manualSubject.trim() || "General",
      hours: parseFloat(parseFloat(manualHours).toFixed(2)),
      date: new Date(manualDate).getTime(),
      dateStr: manualDate,
      type: "manual",
    })
    setManualSubject("")
    setManualHours("")
    setManualDate(new Date().toISOString().split("T")[0])
  }

  async function deleteSession(id) {
    await deleteDoc(doc(db, "users", user.uid, "studySessions", id))
  }

  const totalToday = sessions
    .filter((s) => s.dateStr === new Date().toISOString().split("T")[0])
    .reduce((sum, s) => sum + s.hours, 0)

  const totalWeek = sessions
    .filter((s) => {
      const d = new Date(s.date)
      const now = new Date()
      const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)
      return d >= weekAgo
    })
    .reduce((sum, s) => sum + s.hours, 0)

  const totalMonth = sessions
    .filter((s) => {
      const d = new Date(s.date)
      const now = new Date()
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    .reduce((sum, s) => sum + s.hours, 0)

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-1">Study Hours</h1>
      <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">Track your study sessions</p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Today", value: totalToday.toFixed(1) + "h" },
          { label: "This Week", value: totalWeek.toFixed(1) + "h" },
          { label: "This Month", value: totalMonth.toFixed(1) + "h" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{stat.label}</p>
            <p className="text-2xl font-semibold text-blue-600">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2">
        {/* Timer */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-4">Start Timer</h2>
          <div className="text-4xl font-mono font-semibold text-gray-800 dark:text-gray-100 text-center mb-4">
            {formatTime(timerSeconds)}
          </div>
          <input
            type="text"
            value={timerSubject}
            onChange={(e) => setTimerSubject(e.target.value)}
            placeholder="Subject (optional)"
            disabled={timerRunning}
            className="w-full border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 dark:bg-gray-950"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setTimerRunning(!timerRunning)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors text-white
                ${timerRunning ? "bg-amber-500 hover:bg-amber-600" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {timerRunning ? "Pause" : "Start"}
            </button>
            {timerSeconds > 0 && (
              <button
                onClick={stopAndSave}
                className="flex-1 py-2 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition-colors"
              >
                Save
              </button>
            )}
          </div>
          {timerSeconds > 0 && !timerRunning && (
            <button
              onClick={() => { setTimerSeconds(0); setTimerSubject("") }}
              className="w-full mt-2 py-2 rounded-lg text-sm text-gray-400 dark:text-gray-500 hover:text-red-400 transition-colors"
            >
              Reset
            </button>
          )}
        </div>

        {/* Manual Entry */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-4">Manual Entry</h2>
          <div className="space-y-3">
            <input
              type="text"
              value={manualSubject}
              onChange={(e) => setManualSubject(e.target.value)}
              placeholder="Subject"
              className="w-full border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              value={manualHours}
              onChange={(e) => setManualHours(e.target.value)}
              placeholder="Hours (e.g. 1.5)"
              min="0"
              step="0.5"
              className="w-full border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              value={manualDate}
              onChange={(e) => setManualDate(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addManualSession}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Add Session
            </button>
          </div>
        </div>
      </div>

      {/* Sessions list */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-200">Recent Sessions</h2>
        </div>
        {sessions.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No sessions yet</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {sessions.slice(0, 10).map((s) => (
              <div key={s.id} className="flex items-center px-5 py-3 gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{s.subject}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{s.dateStr} · {s.type === "timer" ? "Timer" : "Manual"}</p>
                </div>
                <span className="text-sm font-semibold text-blue-600">{s.hours}h</span>
                <button
                  onClick={() => deleteSession(s.id)}
                  className="text-gray-300 dark:text-gray-600 hover:text-red-400 text-sm transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}