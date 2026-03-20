import { signOut } from "firebase/auth"
import { auth } from "../firebase"
import { useAuth } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"

export default function Layout({ children, currentPage, setCurrentPage }) {
  const { user } = useAuth()
  const { dark, setDark } = useTheme()

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "todos", label: "To-Do List", icon: "✅" },
    { id: "projects", label: "Projects", icon: "📁" },
    { id: "study", label: "Study Hours", icon: "⏱️" },
  ]

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <div className="w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
        <div className="p-5 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-base font-semibold text-gray-800 dark:text-gray-100">Study App</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{user?.email}</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left
                ${currentPage === item.id
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-1">
          {/* Dark mode toggle */}
          <button
            onClick={() => setDark(!dark)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <span>{dark ? "☀️" : "🌙"}</span>
            {dark ? "Light mode" : "Dark mode"}
          </button>
          <button
            onClick={() => signOut(auth)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <span>🚪</span> Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6">
        {children}
      </div>
    </div>
  )
}