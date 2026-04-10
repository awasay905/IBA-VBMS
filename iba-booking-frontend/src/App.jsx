import { useState, useEffect } from 'react'
import { api, getStoredUser, setToken, setStoredUser, clearToken, clearStoredUser } from './api'
import './App.css'
import LoginPage from './pages/LoginPage'
import StudentDashboard from './pages/StudentDashboard'
import PODashboard from './pages/PODashboard'
import AdminDashboard from './pages/AdminDashboard'

function App() {
  const [user, setUser] = useState(getStoredUser())
  const [loading, setLoading] = useState(false)

  const handleLogout = () => {
    clearToken()
    clearStoredUser()
    setUser(null)
  }

  if (!user) {
    return <LoginPage onLogin={(userData) => setUser(userData)} />
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>IBA Facility Booking System</h1>
        <div className="header-right">
          <span className="user-info">{user.name} ({user.role})</span>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="app-main">
        {user.role === 'admin' && <AdminDashboard user={user} />}
        {user.role === 'student' && <StudentDashboard user={user} />}
        {user.role === 'po' && <PODashboard user={user} />}
        {user.role === 'programoffice' && <PODashboard user={user} />}
      </main>
    </div>
  )
}

export default App
