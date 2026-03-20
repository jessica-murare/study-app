import { useState, useEffect } from "react"
import { collection, addDoc, onSnapshot, updateDoc, deleteDoc, doc } from "firebase/firestore"
import { db } from "../firebase"
import { useAuth } from "../context/AuthContext"

export default function Todos() {
  const { user } = useAuth()
  const [todos, setTodos] = useState([])
  const [newTask, setNewTask] = useState("")
  const [newSubtask, setNewSubtask] = useState({})
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    const ref = collection(db, "users", user.uid, "todos")
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setTodos(data)
    })
    return unsubscribe
  }, [user])

  async function addTodo() {
    if (!newTask.trim()) return
    await addDoc(collection(db, "users", user.uid, "todos"), {
      title: newTask.trim(),
      completed: false,
      subtasks: [],
      createdAt: Date.now(),
    })
    setNewTask("")
  }

  async function toggleTodo(todo) {
    const ref = doc(db, "users", user.uid, "todos", todo.id)
    await updateDoc(ref, { completed: !todo.completed })
  }

  async function deleteTodo(id) {
    await deleteDoc(doc(db, "users", user.uid, "todos", id))
  }

  async function addSubtask(todo) {
    const text = newSubtask[todo.id]?.trim()
    if (!text) return
    const ref = doc(db, "users", user.uid, "todos", todo.id)
    const updated = [...(todo.subtasks || []), { id: Date.now(), title: text, completed: false }]
    await updateDoc(ref, { subtasks: updated })
    setNewSubtask((prev) => ({ ...prev, [todo.id]: "" }))
  }

  async function toggleSubtask(todo, subtaskId) {
    const ref = doc(db, "users", user.uid, "todos", todo.id)
    const updated = todo.subtasks.map((s) =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    )
    await updateDoc(ref, { subtasks: updated })
  }

  async function deleteSubtask(todo, subtaskId) {
    const ref = doc(db, "users", user.uid, "todos", todo.id)
    const updated = todo.subtasks.filter((s) => s.id !== subtaskId)
    await updateDoc(ref, { subtasks: updated })
  }

  const completed = todos.filter((t) => t.completed).length
  const total = todos.length

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-1">To-Do List</h1>
      <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
        {completed} of {total} tasks completed
      </p>

      {/* Progress bar */}
      {total > 0 && (
        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 mb-6">
          <div
            className="bg-blue-50 dark:bg-blue-900/300 h-2 rounded-full transition-all"
            style={{ width: `${(completed / total) * 100}%` }}
          />
        </div>
      )}

      {/* Add task */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTodo()}
          placeholder="Add a new task..."
          className="flex-1 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={addTodo}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          Add
        </button>
      </div>

      {/* Task list */}
      <div className="space-y-3">
        {todos.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No tasks yet. Add one above!</p>
        )}
        {todos.map((todo) => {
          const subDone = (todo.subtasks || []).filter((s) => s.completed).length
          const subTotal = (todo.subtasks || []).length

          return (
            <div key={todo.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              {/* Task header */}
              <div className="flex items-center gap-3 px-4 py-3">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo)}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
                <span className={`flex-1 text-sm font-medium ${todo.completed ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-800 dark:text-gray-100"}`}>
                  {todo.title}
                </span>
                {subTotal > 0 && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">{subDone}/{subTotal}</span>
                )}
                <button
                  onClick={() => setExpanded((prev) => ({ ...prev, [todo.id]: !prev[todo.id] }))}
                  className="text-xs text-gray-400 dark:text-gray-500 hover:text-blue-500 px-2"
                >
                  {expanded[todo.id] ? "▲" : "▼"}
                </button>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="text-gray-300 dark:text-gray-600 hover:text-red-400 text-sm transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Subtasks */}
              {expanded[todo.id] && (
                <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-3 bg-gray-50 dark:bg-gray-950 space-y-2">
                  {(todo.subtasks || []).map((sub) => (
                    <div key={sub.id} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={sub.completed}
                        onChange={() => toggleSubtask(todo, sub.id)}
                        className="w-3.5 h-3.5 accent-blue-600 cursor-pointer"
                      />
                      <span className={`flex-1 text-sm ${sub.completed ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-600 dark:text-gray-300 dark:text-gray-600"}`}>
                        {sub.title}
                      </span>
                      <button
                        onClick={() => deleteSubtask(todo, sub.id)}
                        className="text-gray-300 dark:text-gray-600 hover:text-red-400 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {/* Add subtask */}
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={newSubtask[todo.id] || ""}
                      onChange={(e) => setNewSubtask((prev) => ({ ...prev, [todo.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && addSubtask(todo)}
                      placeholder="Add subtask..."
                      className="flex-1 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900"
                    />
                    <button
                      onClick={() => addSubtask(todo)}
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