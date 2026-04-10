import { useState, useEffect } from 'react'
import { api } from '../api'
import '../styles/StudentDashboard.css'

export default function StudentDashboard({ user }) {
  const [buildings, setBuildings] = useState([])
  const [rooms, setRooms] = useState([])
  const [slots, setSlots] = useState([])
  const [bookings, setBookings] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [selectedBuilding, setSelectedBuilding] = useState('')
  const [selectedRoom, setSelectedRoom] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [purpose, setPurpose] = useState('')

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      const buildingsData = await api.buildings.list()
      setBuildings(buildingsData)
      const slotsData = await api.timeSlots.list()
      setSlots(slotsData)
      await loadBookings()
    } catch (err) {
      setError(err.message)
    }
  }

  const loadRooms = async (buildingId) => {
    try {
      setSelectedRoom('')
      if (buildingId) {
        const roomsData = await api.rooms.list(buildingId)
        setRooms(roomsData)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const loadBookings = async () => {
    try {
      const bookingsData = await api.bookings.list({ mine: true })
      setBookings(bookingsData)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleBooking = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!selectedRoom || !selectedDate || !selectedSlot || !purpose) {
      setError('Please fill in all fields')
      return
    }

    try {
      await api.bookings.create({
        room_id: selectedRoom,
        date: selectedDate,
        slot_id: parseInt(selectedSlot),
        purpose
      })
      setSuccess('Booking request submitted successfully!')
      setSelectedBuilding('')
      setSelectedRoom('')
      setSelectedDate('')
      setSelectedSlot('')
      setPurpose('')
      setTimeout(async () => {
        await loadBookings()
        setSuccess('')
      }, 2000)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return
    try {
      await api.bookings.cancel(bookingId)
      setSuccess('Booking cancelled successfully')
      await loadBookings()
      setTimeout(() => setSuccess(''), 2000)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="student-dashboard">
      <div className="booking-section">
        <h2>Request Room Booking</h2>
        
        <form onSubmit={handleBooking} className="booking-form">
          <div className="form-row">
            <div className="form-group">
              <label>Building *</label>
              <select 
                value={selectedBuilding}
                onChange={(e) => {
                  setSelectedBuilding(e.target.value)
                  loadRooms(e.target.value)
                }}
                required
              >
                <option value="">Select a building</option>
                {buildings.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Room *</label>
              <select 
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                disabled={!selectedBuilding}
                required
              >
                <option value="">Select a room</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>{r.name} (Capacity: {r.capacity})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date *</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="form-group">
              <label>Time Slot *</label>
              <select 
                value={selectedSlot}
                onChange={(e) => setSelectedSlot(e.target.value)}
                required
              >
                <option value="">Select a time slot</option>
                {slots.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.label} ({s.start_time} - {s.end_time})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group full-width">
            <label>Purpose of Booking *</label>
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Describe the purpose of this room booking"
              rows="3"
              required
            />
          </div>

          <button type="submit" className="submit-btn">Submit Booking Request</button>
        </form>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
      </div>

      <div className="bookings-section">
        <h2>My Bookings</h2>
        
        {bookings.length === 0 ? (
          <p className="no-data">No bookings yet</p>
        ) : (
          <div className="bookings-grid">
            {bookings.map(booking => (
              <div key={booking.id} className={`booking-card status-${booking.status}`}>
                <h3>{booking.rooms?.name}</h3>
                <p><strong>Building:</strong> {booking.rooms?.buildings?.name}</p>
                <p><strong>Date:</strong> {booking.date}</p>
                <p><strong>Time:</strong> {booking.time_slots?.label}</p>
                <p><strong>Purpose:</strong> {booking.purpose}</p>
                <p><strong>Status:</strong> <span className={`status ${booking.status}`}>{booking.status.toUpperCase()}</span></p>
                
                {booking.status === 'pending' && (
                  <button 
                    className="cancel-btn"
                    onClick={() => handleCancel(booking.id)}
                  >
                    Cancel Request
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
