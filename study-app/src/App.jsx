import { useState } from "react"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { ThemeProvider } from "./context/ThemeContext"
import Auth from "./pages/Auth"
import Layout from "./components/Layout"
import Todos from "./pages/Todos"
import StudyHours from "./pages/StudyHours"
import Projects from "./pages/Projects"
import Dashboard from "./pages/Dashboard"

function AppContent() {
  const { user } = useAuth()
  const [currentPage, setCurrentPage] = useState("dashboard")

  if (!user) return <Auth />

  return (
    <Layout currentPage={currentPage} setCurrentPage={setCurrentPage}>
      {currentPage === "dashboard" && <Dashboard />}
      {currentPage === "todos" && <Todos />}
      {currentPage === "study" && <StudyHours />}
      {currentPage === "projects" && <Projects />}
    </Layout>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  )
}