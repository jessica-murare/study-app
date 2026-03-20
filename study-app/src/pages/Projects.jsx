import { useState, useEffect } from "react"
import { collection, addDoc, onSnapshot, updateDoc, deleteDoc, doc } from "firebase/firestore"
import { db } from "../firebase"
import { useAuth } from "../context/AuthContext"

const CATEGORIES = [
  { label: "College", color: "bg-blue-100 text-blue-700 dark:text-blue-400" },
  { label: "Personal", color: "bg-purple-100 text-purple-700" },
  { label: "Exam Prep", color: "bg-amber-100 text-amber-700" },
  { label: "Book / Course", color: "bg-green-100 text-green-700" },
]

export default function Projects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [expanded, setExpanded] = useState({})
  const [newSubtask, setNewSubtask] = useState({})

  // New project form
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newCategory, setNewCategory] = useState("College")
  const [newDesc, setNewDesc] = useState("")

  useEffect(() => {
    const ref = collection(db, "users", user.uid, "projects")
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      data.sort((a, b) => b.createdAt - a.createdAt)
      setProjects(data)
    })
    return unsubscribe
  }, [user])

  async function addProject() {
    if (!newTitle.trim()) return
    await addDoc(collection(db, "users", user.uid, "projects"), {
      title: newTitle.trim(),
      description: newDesc.trim(),
      category: newCategory,
      subtasks: [],
      createdAt: Date.now(),
    })
    setNewTitle("")
    setNewDesc("")
    setNewCategory("College")
    setShowForm(false)
  }

  async function deleteProject(id) {
    await deleteDoc(doc(db, "users", user.uid, "projects", id))
  }

  async function addSubtask(project) {
    const text = newSubtask[project.id]?.trim()
    if (!text) return
    const ref = doc(db, "users", user.uid, "projects", project.id)
    const updated = [
      ...(project.subtasks || []),
      { id: Date.now(), title: text, completed: false },
    ]
    await updateDoc(ref, { subtasks: updated })
    setNewSubtask((prev) => ({ ...prev, [project.id]: "" }))
  }

  async function toggleSubtask(project, subtaskId) {
    const ref = doc(db, "users", user.uid, "projects", project.id)
    const updated = project.subtasks.map((s) =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    )
    await updateDoc(ref, { subtasks: updated })
  }

  async function deleteSubtask(project, subtaskId) {
    const ref = doc(db, "users", user.uid, "projects", project.id)
    const updated = project.subtasks.filter((s) => s.id !== subtaskId)
    await updateDoc(ref, { subtasks: updated })
  }

  function getCategoryStyle(label) {
    return CATEGORIES.find((c) => c.label === label)?.color || "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 dark:text-gray-600"
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Projects</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {showForm ? "Cancel" : "+ New Project"}
        </button>
      </div>
      <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">{projects.length} project{projects.length !== 1 ? "s" : ""}</p>

      {/* New project form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 mb-6">
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-4">New Project</h2>
          <div className="space-y-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Project title"
              className="w-full border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
              className="w-full border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 block mb-2">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.label}
                    onClick={() => setNewCategory(cat.label)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
                      ${newCategory === cat.label
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                        : "border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:bg-gray-950"
                      }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={addProject}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              Create Project
            </button>
          </div>
        </div>
      )}

      {/* Project list */}
      <div className="space-y-4">
        {projects.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No projects yet. Create one above!</p>
        )}
        {projects.map((project) => {
          const subDone = (project.subtasks || []).filter((s) => s.completed).length
          const subTotal = (project.subtasks || []).length
          const progress = subTotal > 0 ? Math.round((subDone / subTotal) * 100) : 0

          return (
            <div key={project.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              {/* Project header */}
              <div className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${getCategoryStyle(project.category)}`}>
                        {project.category}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{project.title}</h3>
                    {project.description && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{project.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpanded((prev) => ({ ...prev, [project.id]: !prev[project.id] }))}
                      className="text-xs text-gray-400 dark:text-gray-500 hover:text-blue-500 px-2"
                    >
                      {expanded[project.id] ? "▲" : "▼"}
                    </button>
                    <button
                      onClick={() => deleteProject(project.id)}
                      className="text-gray-300 dark:text-gray-600 hover:text-red-400 text-sm transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Progress */}
                {subTotal > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mb-1">
                      <span>{subDone} of {subTotal} done</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                      <div
                        className="bg-blue-50 dark:bg-blue-900/300 h-1.5 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Subtasks */}
              {expanded[project.id] && (
                <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-4 bg-gray-50 dark:bg-gray-950 space-y-2">
                  {(project.subtasks || []).length === 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">No subtasks yet. Add one below!</p>
                  )}
                  {(project.subtasks || []).map((sub) => (
                    <div key={sub.id} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={sub.completed}
                        onChange={() => toggleSubtask(project, sub.id)}
                        className="w-3.5 h-3.5 accent-blue-600 cursor-pointer"
                      />
                      <span className={`flex-1 text-sm ${sub.completed ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-700 dark:text-gray-200"}`}>
                        {sub.title}
                      </span>
                      <button
                        onClick={() => deleteSubtask(project, sub.id)}
                        className="text-gray-300 dark:text-gray-600 hover:text-red-400 text-xs transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {/* Add subtask */}
                  <div className="flex gap-2 mt-3">
                    <input
                      type="text"
                      value={newSubtask[project.id] || ""}
                      onChange={(e) => setNewSubtask((prev) => ({ ...prev, [project.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && addSubtask(project)}
                      placeholder="Add a subtask..."
                      className="flex-1 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900"
                    />
                    <button
                      onClick={() => addSubtask(project)}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}