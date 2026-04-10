import { useState } from 'react'
import { api, setToken, setStoredUser } from '../api'
import '../styles/LoginPage.css'

export default function LoginPage({ onLogin }) {
  const [erp, setErp] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { access_token, user } = await api.auth.login(erp, password)
      setToken(access_token)
      setStoredUser(user)
      onLogin(user)
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>IBA Campus Facility Booking</h1>
          <p>Streamlining Facility Reservations</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="erp">ERP / Username</label>
            <input
              id="erp"
              type="text"
              value={erp}
              onChange={(e) => setErp(e.target.value)}
              placeholder="Enter your ERP or username"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="demo-section">
          <h3>Demo Credentials</h3>
          <table className="credentials-table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Username</th>
                <th>Password</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Admin</strong></td>
                <td>admin</td>
                <td>admin123</td>
              </tr>
              <tr>
                <td><strong>Student</strong></td>
                <td>12345</td>
                <td>password</td>
              </tr>
              <tr>
                <td><strong>Program Office</strong></td>
                <td>po001</td>
                <td>password</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
