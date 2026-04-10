import { useState, useEffect } from 'react'
import { api } from '../api'
import '../styles/AdminDashboard.css'

export default function AdminDashboard({ user }) {
  const [tab, setTab] = useState('students')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Students
  const [students, setStudents] = useState([])
  const [studentForm, setStudentForm] = useState({ erp: '', name: '', email: '', password: '' })

  // PO Members
  const [poMembers, setPOMembers] = useState([])
  const [poForm, setPoForm] = useState({ erp: '', name: '', email: '', password: '' })

  // Buildings
  const [buildings, setBuildings] = useState([])
  const [buildingForm, setBuildingForm] = useState({ name: '', location: '' })

  // Rooms
  const [rooms, setRooms] = useState([])
  const [roomForm, setRoomForm] = useState({ name: '', building_id: '', capacity: '', type: '' })

  // Bookings
  const [bookings, setBookings] = useState([])
  const [filterStatus, setFilterStatus] = useState('pending')

  useEffect(() => {
    loadAllData()
  }, [])

  useEffect(() => {
    loadBookings()
  }, [filterStatus])

  const loadAllData = async () => {
    try {
      const buildingsData = await api.buildings.list()
      setBuildings(buildingsData)
      const usersData = await api.users.list()
      setStudents(usersData.filter(u => u.role === 'student'))
      setPOMembers(usersData.filter(u => u.role === 'programoffice'))
      const roomsData = await api.rooms.list()
      setRooms(roomsData)
      await loadBookings()
    } catch (err) {
      setError(err.message)
    }
  }

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

  // ========== STUDENTS ==========
  const handleAddStudent = async (e) => {
    e.preventDefault()
    try {
      await api.users.create({
        erp: studentForm.erp,
        name: studentForm.name,
        email: studentForm.email,
        password: studentForm.password,
        role: 'student'
      })
      setSuccess('Student added successfully')
      setStudentForm({ erp: '', name: '', email: '', password: '' })
      await loadAllData()
      setTimeout(() => setSuccess(''), 2000)
    } catch (err) {
      setError(err.message)
    }
  }

  // ========== PO MEMBERS ==========
  const handleAddPO = async (e) => {
    e.preventDefault()
    try {
      await api.users.create({
        erp: poForm.erp,
        name: poForm.name,
        email: poForm.email,
        password: poForm.password,
        role: 'programoffice'
      })
      setSuccess('PO member added successfully')
      setPoForm({ erp: '', name: '', email: '', password: '' })
      await loadAllData()
      setTimeout(() => setSuccess(''), 2000)
    } catch (err) {
      setError(err.message)
    }
  }

  // ========== BUILDINGS ==========
  const handleAddBuilding = async (e) => {
    e.preventDefault()
    try {
      await api.buildings.create(buildingForm)
      setSuccess('Building added successfully')
      setBuildingForm({ name: '', location: '' })
      await loadAllData()
      setTimeout(() => setSuccess(''), 2000)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteBuilding = async (buildingId) => {
    if (!window.confirm('Delete this building?')) return
    try {
      await api.buildings.remove(buildingId)
      setSuccess('Building deleted successfully')
      await loadAllData()
      setTimeout(() => setSuccess(''), 2000)
    } catch (err) {
      setError(err.message)
    }
  }

  // ========== ROOMS ==========
  const handleAddRoom = async (e) => {
    e.preventDefault()
    try {
      await api.rooms.create({
        ...roomForm,
        capacity: parseInt(roomForm.capacity)
      })
      setSuccess('Room added successfully')
      setRoomForm({ name: '', building_id: '', capacity: '', type: '' })
      await loadAllData()
      setTimeout(() => setSuccess(''), 2000)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Delete this room?')) return
    try {
      await api.rooms.remove(roomId)
      setSuccess('Room deleted successfully')
      await loadAllData()
      setTimeout(() => setSuccess(''), 2000)
    } catch (err) {
      setError(err.message)
    }
  }

  // ========== BOOKINGS ==========
  const handleApproveBooking = async (bookingId) => {
    try {
      await api.bookings.approve(bookingId)
      setSuccess('Booking approved successfully!')
      await loadBookings()
      setTimeout(() => setSuccess(''), 2000)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleRejectBooking = async (bookingId) => {
    try {
      await api.bookings.reject(bookingId)
      setSuccess('Booking rejected successfully!')
      await loadBookings()
      setTimeout(() => setSuccess(''), 2000)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleCancelBooking = async (bookingId) => {
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
    <div className="admin-dashboard">
      <div className="admin-tabs">
        <button
          className={`tab ${tab === 'students' ? 'active' : ''}`}
          onClick={() => setTab('students')}
        >
          Students
        </button>
        <button
          className={`tab ${tab === 'po' ? 'active' : ''}`}
          onClick={() => setTab('po')}
        >
          PO Members
        </button>
        <button
          className={`tab ${tab === 'buildings' ? 'active' : ''}`}
          onClick={() => setTab('buildings')}
        >
          Buildings
        </button>
        <button
          className={`tab ${tab === 'rooms' ? 'active' : ''}`}
          onClick={() => setTab('rooms')}
        >
          Rooms
        </button>
        <button
          className={`tab ${tab === 'bookings' ? 'active' : ''}`}
          onClick={() => setTab('bookings')}
        >
          Bookings
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* STUDENTS TAB */}
      {tab === 'students' && (
        <div className="admin-section">
          <h2>Manage Students</h2>

          <div className="form-card">
            <h3>Add New Student</h3>
            <form onSubmit={handleAddStudent}>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="ERP"
                  value={studentForm.erp}
                  onChange={(e) => setStudentForm({ ...studentForm, erp: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                  required
                />
              </div>
              <div className='form-row'>
                <input
                  type="email"
                  placeholder="Email"
                  value={studentForm.email}
                  onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={studentForm.password}
                  onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                  required
                />
              </div>

              <button type="submit">Add Student</button>
            </form>
          </div>

          <div className="data-table">
            <h3>Students List</h3>
            {students.length === 0 ? (
              <p>No students</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ERP</th>
                    <th>Name</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id}>
                      <td>{s.erp}</td>
                      <td>{s.name}</td>
                      <td>{s.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* PO MEMBERS TAB */}
      {tab === 'po' && (
        <div className="admin-section">
          <h2>Manage Program Office Members</h2>

          <div className="form-card">
            <h3>Add New PO Member</h3>
            <form onSubmit={handleAddPO}>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="ERP"
                  value={poForm.erp}
                  onChange={(e) => setPoForm({ ...poForm, erp: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={poForm.name}
                  onChange={(e) => setPoForm({ ...poForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <input
                  type="email"
                  placeholder="Email"
                  value={poForm.email}
                  onChange={(e) => setPoForm({ ...poForm, email: e.target.value })}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={poForm.password}
                  onChange={(e) => setPoForm({ ...poForm, password: e.target.value })}
                  required
                />
              </div>
              <button type="submit">Add PO Member</button>
            </form>
          </div>

          <div className="data-table">
            <h3>PO Members List</h3>
            {poMembers.length === 0 ? (
              <p>No PO members</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ERP</th>
                    <th>Name</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {poMembers.map(p => (
                    <tr key={p.id}>
                      <td>{p.erp}</td>
                      <td>{p.name}</td>
                      <td>{p.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* BUILDINGS TAB */}
      {tab === 'buildings' && (
        <div className="admin-section">
          <h2>Manage Buildings</h2>

          <div className="form-card">
            <h3>Add New Building</h3>
            <form onSubmit={handleAddBuilding}>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Building Name"
                  value={buildingForm.name}
                  onChange={(e) => setBuildingForm({ ...buildingForm, name: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={buildingForm.location}
                  onChange={(e) => setBuildingForm({ ...buildingForm, location: e.target.value })}
                  required
                />
              </div>
              <button type="submit">Add Building</button>
            </form>
          </div>

          <div className="data-table">
            <h3>Buildings List</h3>
            {buildings.length === 0 ? (
              <p>No buildings</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Location</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {buildings.map(b => (
                    <tr key={b.id}>
                      <td>{b.name}</td>
                      <td>{b.location}</td>
                      <td>
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteBuilding(b.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ROOMS TAB */}
      {tab === 'rooms' && (
        <div className="admin-section">
          <h2>Manage Rooms</h2>

          <div className="form-card">
            <h3>Add New Room</h3>
            <form onSubmit={handleAddRoom}>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Room Name"
                  value={roomForm.name}
                  onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                  required
                />
                <select
                  value={roomForm.building_id}
                  onChange={(e) => setRoomForm({ ...roomForm, building_id: e.target.value })}
                  required
                >
                  <option value="">Select Building</option>
                  {buildings.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <input
                  type="number"
                  placeholder="Capacity"
                  value={roomForm.capacity}
                  onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })}
                  required
                />
                <select
                  value={roomForm.type}
                  onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value })}
                  required
                >
                  <option value="">Select Room Type</option>
                  <option value="Classroom">Classroom</option>
                  <option value="Seminar Hall">Seminar Hall</option>
                  <option value="Computer Lab">Computer Lab</option>
                  <option value="Meeting Room">Meeting Room</option>
                </select>
              </div>
              <button type="submit">Add Room</button>
            </form>
          </div>

          <div className="data-table">
            <h3>Rooms List</h3>
            {rooms.length === 0 ? (
              <p>No rooms</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Building</th>
                    <th>Capacity</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map(r => (
                    <tr key={r.id}>
                      <td>{r.name}</td>
                      <td>{r.buildings?.name}</td>
                      <td>{r.capacity}</td>
                      <td>
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteRoom(r.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* BOOKINGS TAB */}
      {tab === 'bookings' && (
        <div className="admin-section">
          <h2>Manage Booking Requests</h2>

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
                              onClick={() => handleApproveBooking(booking.id)}
                            >
                              Approve
                            </button>
                            <button
                              className="btn-reject"
                              onClick={() => handleRejectBooking(booking.id)}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {booking.status === 'approved' && (
                          <button
                            className="btn-cancel"
                            onClick={() => handleCancelBooking(booking.id)}
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
      )}
    </div>
  )
}
