import { useState, useEffect } from 'react'
import { api } from '../api'
import '../styles/PODashboard.css'

export default function PODashboard({ user }) {
  const [bookings, setBookings] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filterStatus, setFilterStatus] = useState('pending')

  useEffect(() => {
    loadBookings()
  }, [filterStatus])

  const loadBookings = async () => {
    try {
      const bookingsData = await api.bookings.list(
        filterStatus ? { status: filterStatus } : {}
      )
      setBookings(bookingsData)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleApprove = async (bookingId) => {
    try {
      await api.bookings.approve(bookingId)
      setSuccess('Booking approved successfully!')
      await loadBookings()
      setTimeout(() => setSuccess(''), 2000)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleReject = async (bookingId) => {
    try {
      await api.bookings.reject(bookingId)
      setSuccess('Booking rejected successfully!')
      await loadBookings()
      setTimeout(() => setSuccess(''), 2000)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Cancel this booking?')) return
    try {
      await api.bookings.cancel(bookingId)
      setSuccess('Booking cancelled successfully!')
      await loadBookings()
      setTimeout(() => setSuccess(''), 2000)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="po-dashboard">
      <h2>Booking Requests Management</h2>
      
      <div className="filter-section">
        <button 
          className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
          onClick={() => setFilterStatus('pending')}
        >
          Pending Requests
        </button>
        <button 
          className={`filter-btn ${filterStatus === 'approved' ? 'active' : ''}`}
          onClick={() => setFilterStatus('approved')}
        >
          Approved
        </button>
        <button 
          className={`filter-btn ${filterStatus === 'rejected' ? 'active' : ''}`}
          onClick={() => setFilterStatus('rejected')}
        >
          Rejected
        </button>
        <button 
          className={`filter-btn ${filterStatus === '' ? 'active' : ''}`}
          onClick={() => setFilterStatus('')}
        >
          All
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {bookings.length === 0 ? (
        <p className="no-data">No bookings to display</p>
      ) : (
        <div className="bookings-table-container">
          <table className="bookings-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Building</th>
                <th>Room</th>
                <th>Date</th>
                <th>Time</th>
                <th>Purpose</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(booking => (
                <tr key={booking.id} className={`status-${booking.status}`}>
                  <td>
                    <strong>{booking.users?.name}</strong>
                    <br />
                    <small>{booking.users?.erp}</small>
                  </td>
                  <td>{booking.rooms?.buildings?.name}</td>
                  <td>{booking.rooms?.name}</td>
                  <td>{booking.date}</td>
                  <td>{booking.time_slots?.label}</td>
                  <td>{booking.purpose}</td>
                  <td>
                    <span className={`status-badge ${booking.status}`}>
                      {booking.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="actions">
                    {booking.status === 'pending' && (
                      <>
                        <button 
                          className="btn-approve"
                          onClick={() => handleApprove(booking.id)}
                        >
                          Approve
                        </button>
                        <button 
                          className="btn-reject"
                          onClick={() => handleReject(booking.id)}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {booking.status === 'approved' && (
                      <button 
                        className="btn-cancel"
                        onClick={() => handleCancel(booking.id)}
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
