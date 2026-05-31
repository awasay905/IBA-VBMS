import { useState, useEffect, useMemo } from "react";
import { api } from "../api";
import { Toaster, toast } from "sonner";
import {
    ShieldCheck,
    Users,
    GraduationCap,
    Building2,
    DoorOpen,
    CalendarDays,
    Trash2,
    Plus,
    Loader2,
    Search,
    CheckCircle2,
    XCircle,
    Clock3,
    Ban,
    Mail,
    Lock,
    UserCircle,
    Hash,
    MapPin,
    Layers,
    Users2,
    LayoutGrid,
    Eye,
    X,
    Inbox,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
} from "lucide-react";

// ── Time Slot Formatter Utility ──────────────────────────────
function formatTimeSlot(slotLabel) {
    if (!slotLabel) return "";
    switch (slotLabel) {
        case "8:30 - 9:45":
            return "08:30 AM - 9:45 AM";
        case "10:00 - 11:15":
            return "10:00 AM - 11:15 AM";
        case "11:30 - 12:45":
            return "11:30 AM - 12:45 PM";
        case "1:00 - 2:15":
            return "01:00 PM - 02:15 PM";
        case "2:30 - 3:45":
            return "02:30 PM - 03:45 PM";
        case "4:00 - 5:15":
            return "04:00 PM - 05:15 PM";
        case "5:30 - 6:45":
            return "05:30 PM - 06:45 PM";
        default:
            return slotLabel;
    }
}

// ── Status Badge Component ───────────────────────────────────
const statusConfig = {
    pending: { cls: "badge-pending", icon: <Clock3 size={11} />, label: "Pending" },
    approved: { cls: "badge-approved", icon: <CheckCircle2 size={11} />, label: "Approved" },
    rejected: { cls: "badge-rejected", icon: <XCircle size={11} />, label: "Rejected" },
    cancelled: { cls: "badge-cancelled", icon: <Ban size={11} />, label: "Cancelled" },
};

function StatusBadge({ status }) {
    const cfg = statusConfig[status] || statusConfig.pending;
    return (
        <span className={`badge ${cfg.cls}`}>
            {cfg.icon}
            {cfg.label}
        </span>
    );
}

export default function AdminDashboard() {
    // --- State Management ---
    const [tab, setTab] = useState("bookings");

    // Data State
    const [students, setStudents] = useState([]);
    const [poMembers, setPOMembers] = useState([]);
    const [buildings, setBuildings] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [bookings, setBookings] = useState([]);

    // Filters & Pagination
    const [filterStatus, setFilterStatus] = useState(""); // "" means all
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    // Form States
    const [studentForm, setStudentForm] = useState({ erp: "", name: "", email: "", password: "" });
    const [poForm, setPoForm] = useState({ erp: "", name: "", email: "", password: "" });
    const [buildingForm, setBuildingForm] = useState({ name: "", location: "" });
    const [roomForm, setRoomForm] = useState({ name: "", building_id: "", capacity: "", type: "" });

    // UX States
    const [isFetching, setIsFetching] = useState(true);
    const [processing, setProcessing] = useState({ id: null, action: null });
    const [confirmAction, setConfirmAction] = useState({ id: null, type: null });

    // Reset pagination on tab or filter change
    useEffect(() => {
        setCurrentPage(1);
        setConfirmAction({ id: null, type: null });
    }, [tab, filterStatus, searchQuery]);

    // --- Data Loaders ---
    const loadAllData = async () => {
        setIsFetching(true);
        try {
            const [buildingsData, usersData, roomsData, bookingsData] = await Promise.all([
                api.buildings.list(),
                api.users.list(),
                api.rooms.list(),
                api.bookings.list({}),
            ]);
            setBuildings(buildingsData);
            setStudents(usersData.filter((u) => u.role === "student"));
            setPOMembers(usersData.filter((u) => u.role === "programoffice"));
            setRooms(roomsData);
            setBookings(bookingsData);
        } catch (err) {
            toast.error(err.message || "Failed to load administration data.");
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => {
        loadAllData();
    }, []);

    // --- Entity Action Handlers ---
    const executeAction = async (actionFn, successMsg, resetFormFn, actionType, id = "new") => {
        setProcessing({ id, action: actionType });
        try {
            await actionFn();
            toast.success(successMsg);
            if (resetFormFn) resetFormFn();
            await loadAllData();
        } catch (err) {
            toast.error(err.message || `Failed to execute action.`);
        } finally {
            setProcessing({ id: null, action: null });
            setConfirmAction({ id: null, type: null });
        }
    };

    // Submits
    const handleAddStudent = (e) => {
        e.preventDefault();
        executeAction(
            () => api.users.create({ ...studentForm, role: "student" }),
            "Student enrolled successfully.",
            () => setStudentForm({ erp: "", name: "", email: "", password: "" }),
            "add-student",
        );
    };

    const handleAddPO = (e) => {
        e.preventDefault();
        executeAction(
            () => api.users.create({ ...poForm, role: "programoffice" }),
            "PO Member appointed successfully.",
            () => setPoForm({ erp: "", name: "", email: "", password: "" }),
            "add-po",
        );
    };

    const handleAddBuilding = (e) => {
        e.preventDefault();
        executeAction(
            () => api.buildings.create(buildingForm),
            "Building registered successfully.",
            () => setBuildingForm({ name: "", location: "" }),
            "add-building",
        );
    };

    const handleAddRoom = (e) => {
        e.preventDefault();
        executeAction(
            () => api.rooms.create({ ...roomForm, capacity: parseInt(roomForm.capacity) }),
            "Room allocated successfully.",
            () => setRoomForm({ name: "", building_id: "", capacity: "", type: "" }),
            "add-room",
        );
    };

    // Deletes
    const handleDeleteBuilding = (id) =>
        executeAction(() => api.buildings.remove(id), "Building deleted.", null, "delete-building", id);
    const handleDeleteRoom = (id) =>
        executeAction(() => api.rooms.remove(id), "Room deleted.", null, "delete-room", id);

    // Booking Actions
    const handleApproveBooking = (id) =>
        executeAction(() => api.bookings.approve(id), "Booking approved.", null, "approve-booking", id);
    const handleRejectBooking = (id) =>
        executeAction(() => api.bookings.reject(id), "Booking rejected.", null, "reject-booking", id);
    const handleCancelBooking = (id) =>
        executeAction(() => api.bookings.cancel(id), "Booking revoked.", null, "cancel-booking", id);

    // --- Active Data & Filtering ---
    const getActiveData = () => {
        let data = [];
        if (tab === "bookings") data = bookings;
        if (tab === "students") data = students;
        if (tab === "po") data = poMembers;
        if (tab === "buildings") data = buildings;
        if (tab === "rooms") data = rooms;

        // Apply filters
        return data.filter((item) => {
            // Status Filter for Bookings
            if (tab === "bookings" && filterStatus && item.status !== filterStatus) return false;

            // Search Query
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const textToSearch = Object.values(item)
                    .map((val) => (typeof val === "object" ? JSON.stringify(val) : String(val)))
                    .join(" ")
                    .toLowerCase();
                return textToSearch.includes(query);
            }
            return true;
        });
    };

    const filteredData = getActiveData();
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Dynamic Stats Summary
    const stats = useMemo(() => {
        const result = { pending: 0, users: students.length + poMembers.length, facilities: rooms.length };
        bookings.forEach((b) => {
            if (b.status === "pending") result.pending++;
        });
        return result;
    }, [bookings, students, poMembers, rooms]);

    // Format Date Helper
    const formatDate = (dateString) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    if (isFetching && !buildings.length) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
                <Loader2 size={36} className="animate-spin" style={{ color: "var(--iba-red)" }} />
                <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                    Loading Administrative Systems...
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 page-enter pb-12">
            <Toaster position="top-center" richColors />

            {/* ── 1. Compact Header & KPIs ── */}
            <div
                className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4"
                style={{ borderBottom: "1px solid var(--border-base)" }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: "var(--iba-red-muted)" }}
                    >
                        <ShieldCheck size={20} style={{ color: "var(--iba-red)" }} />
                    </div>
                    <div>
                        <h1 className="font-display text-2xl" style={{ color: "var(--text-primary)" }}>
                            System Admin
                        </h1>
                        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                            Global oversight of facilities and users.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning)] text-xs font-bold">
                        <Clock3 size={12} /> {stats.pending} Pending Requests
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border-base)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] text-xs font-bold">
                        <Users size={12} /> {stats.users} Users
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border-base)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] text-xs font-bold">
                        <Building2 size={12} /> {stats.facilities} Rooms
                    </div>
                </div>
            </div>

            {/* ── 2. Top Navigation & Filters ── */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div className="nav-tabs w-full xl:w-auto overflow-x-auto hide-scrollbar shrink-0">
                    {[
                        { id: "bookings", label: "Reservations", icon: <CalendarDays size={14} /> },
                        { id: "buildings", label: "Buildings", icon: <Building2 size={14} /> },
                        { id: "rooms", label: "Rooms", icon: <DoorOpen size={14} /> },
                        { id: "students", label: "Students", icon: <GraduationCap size={14} /> },
                        { id: "po", label: "Staff", icon: <Users size={14} /> },
                    ].map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`nav-tab text-[13px] ${tab === t.id ? "active" : ""}`}
                        >
                            {t.icon} {t.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 w-full xl:w-auto">
                    {tab === "bookings" && (
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="input-field h-9 py-0 text-xs w-32 cursor-pointer"
                        >
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    )}
                    <div className="input-icon-wrapper flex-1 xl:w-64">
                        <Search size={14} className="input-icon" />
                        <input
                            type="text"
                            placeholder="Search records..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-field h-9 py-0 text-xs"
                        />
                    </div>
                    <button
                        onClick={loadAllData}
                        className="btn btn-outline h-9 px-3 gap-1 shrink-0"
                        title="Reload Data"
                    >
                        <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                </div>
            </div>

            {/* Quick Clear Filter Indicator */}
            {(searchQuery || filterStatus) && (
                <div className="flex justify-end -mt-2">
                    <button
                        onClick={() => {
                            setSearchQuery("");
                            setFilterStatus("");
                        }}
                        className="text-[10px] font-bold uppercase tracking-wider text-[var(--iba-red)] hover:underline flex items-center gap-1"
                    >
                        <X size={11} /> Clear Filters
                    </button>
                </div>
            )}

            {/* ── 3. Main Workspace Area ── */}

            {/* TAB: BOOKINGS */}
            {tab === "bookings" && (
                <div className="fade-in space-y-4">
                    <div className="table-container">
                        <table className="table-base">
                            <thead>
                                <tr>
                                    <th className="table-th">Requester</th>
                                    <th className="table-th">Facility</th>
                                    <th className="table-th">Schedule</th>
                                    <th className="table-th">Purpose</th>
                                    <th className="table-th">Status</th>
                                    <th className="table-th text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedData.length === 0 ? (
                                    <tr>
                                        <td colSpan={6}>
                                            <div className="empty-state py-12">
                                                <div className="empty-state-icon">
                                                    <Inbox size={22} />
                                                </div>
                                                <div>
                                                    <h3
                                                        className="font-display text-lg mb-1"
                                                        style={{ color: "var(--text-primary)" }}
                                                    >
                                                        No reservations found
                                                    </h3>
                                                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                                                        Adjust your filters or search query.
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedData.map((booking) => {
                                        const isRowProcessing = processing.id === booking.id;
                                        const isConfirming = confirmAction.id === booking.id;

                                        return (
                                            <tr key={booking.id} className="table-tr">
                                                <td className="table-td py-3.5">
                                                    <div className="font-bold text-sm text-[var(--text-primary)]">
                                                        {booking.users?.name}
                                                    </div>
                                                    <div className="text-[10px] font-semibold tracking-wider uppercase mt-0.5 text-[var(--text-muted)]">
                                                        ERP: {booking.users?.erp}
                                                    </div>
                                                </td>
                                                <td className="table-td py-3.5">
                                                    <div className="font-bold text-sm flex items-center gap-1.5 text-[var(--iba-red)]">
                                                        <Building2 size={13} /> {booking.rooms?.name}
                                                    </div>
                                                    <div className="text-[11px] font-medium mt-0.5 text-[var(--text-secondary)]">
                                                        {booking.rooms?.buildings?.name}
                                                    </div>
                                                </td>
                                                <td className="table-td py-3.5">
                                                    <div className="font-semibold text-sm text-[var(--text-primary)]">
                                                        {formatDate(booking.date)}
                                                    </div>
                                                    <div className="text-[11px] font-semibold mt-0.5 flex items-center gap-1 text-[var(--text-muted)]">
                                                        <Clock3 size={11} /> {formatTimeSlot(booking.time_slots?.label)}
                                                    </div>
                                                </td>
                                                <td className="table-td py-3.5 max-w-[160px]">
                                                    <div
                                                        className="truncate text-xs font-medium text-[var(--text-secondary)]"
                                                        title={booking.purpose}
                                                    >
                                                        {booking.purpose || "No justification provided."}
                                                    </div>
                                                </td>
                                                <td className="table-td py-3.5">
                                                    <StatusBadge status={booking.status} />
                                                </td>
                                                <td className="table-td py-3.5 text-right">
                                                    <div className="flex justify-end items-center gap-1.5 min-w-[130px]">
                                                        {isConfirming ? (
                                                            <div className="flex items-center gap-1 fade-in bg-[var(--danger-bg)] px-1.5 py-1 rounded-md border border-[var(--danger-border)]">
                                                                <span className="text-[9px] font-bold text-[var(--danger)] px-1 uppercase tracking-tight">
                                                                    Sure?
                                                                </span>
                                                                <button
                                                                    onClick={() =>
                                                                        confirmAction.type === "reject-booking"
                                                                            ? handleRejectBooking(booking.id)
                                                                            : handleCancelBooking(booking.id)
                                                                    }
                                                                    disabled={isRowProcessing}
                                                                    className="h-6 px-2 rounded bg-[var(--danger)] text-white text-[10px] font-bold hover:opacity-90 transition-opacity min-w-[36px]"
                                                                >
                                                                    {isRowProcessing ? (
                                                                        <Loader2
                                                                            size={11}
                                                                            className="animate-spin mx-auto"
                                                                        />
                                                                    ) : (
                                                                        "Yes"
                                                                    )}
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        setConfirmAction({ id: null, type: null })
                                                                    }
                                                                    disabled={isRowProcessing}
                                                                    className="h-6 px-2 rounded bg-white dark:bg-black/20 border border-[var(--border-base)] text-[var(--text-secondary)] text-[10px] font-bold hover:bg-[var(--bg-subtle)]"
                                                                >
                                                                    No
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {booking.status === "pending" && (
                                                                    <>
                                                                        <button
                                                                            onClick={() =>
                                                                                handleApproveBooking(booking.id)
                                                                            }
                                                                            disabled={isRowProcessing}
                                                                            className="h-8 px-2.5 rounded-md bg-[var(--success-bg)] text-[var(--success)] border border-[var(--success-border)] hover:bg-[var(--success)] hover:text-white text-[11px] font-bold transition-all flex items-center justify-center min-w-[65px]"
                                                                        >
                                                                            {isRowProcessing &&
                                                                            processing.action === "approve-booking" ? (
                                                                                <Loader2
                                                                                    size={13}
                                                                                    className="animate-spin"
                                                                                />
                                                                            ) : (
                                                                                "Approve"
                                                                            )}
                                                                        </button>
                                                                        <button
                                                                            onClick={() =>
                                                                                setConfirmAction({
                                                                                    id: booking.id,
                                                                                    type: "reject-booking",
                                                                                })
                                                                            }
                                                                            disabled={isRowProcessing}
                                                                            className="h-8 px-2.5 rounded-md bg-[var(--danger-bg)] text-[var(--danger)] border border-[var(--danger-border)] hover:bg-[var(--danger)] hover:text-white text-[11px] font-bold transition-all"
                                                                        >
                                                                            Reject
                                                                        </button>
                                                                    </>
                                                                )}
                                                                {booking.status === "approved" && (
                                                                    <button
                                                                        onClick={() =>
                                                                            setConfirmAction({
                                                                                id: booking.id,
                                                                                type: "cancel-booking",
                                                                            })
                                                                        }
                                                                        disabled={isRowProcessing}
                                                                        className="h-8 px-3 rounded-md btn-outline text-[11px] font-bold text-red-600 border border-transparent hover:border-red-200"
                                                                    >
                                                                        Revoke
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TABS: ENTITIES (Students, PO, Buildings, Rooms) */}
            {tab !== "bookings" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start fade-in">
                    {/* LEFT COLUMN: Data Entry Form */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="card overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl relative">
                            <div className="bg-[var(--iba-red)] px-5 py-4 text-white relative">
                                <div className="absolute inset-0 bg-brand-pattern opacity-[0.05] pointer-events-none" />
                                <h3 className="font-display text-lg leading-tight mt-0.5 flex items-center gap-2 relative z-10">
                                    <Plus size={18} />
                                    {tab === "students" && "Enroll Student"}
                                    {tab === "po" && "Appoint PO Staff"}
                                    {tab === "buildings" && "Register Building"}
                                    {tab === "rooms" && "Allocate Room"}
                                </h3>
                            </div>
                            <div className="p-5">
                                {/* Students Form */}
                                {tab === "students" && (
                                    <form onSubmit={handleAddStudent} className="space-y-4">
                                        <div>
                                            <label className="label">ERP ID</label>
                                            <div className="input-icon-wrapper">
                                                <Hash size={15} className="input-icon" />
                                                <input
                                                    type="text"
                                                    value={studentForm.erp}
                                                    onChange={(e) =>
                                                        setStudentForm({ ...studentForm, erp: e.target.value })
                                                    }
                                                    required
                                                    placeholder="e.g. 24510"
                                                    className="input-field"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="label">Full Name</label>
                                            <div className="input-icon-wrapper">
                                                <UserCircle size={15} className="input-icon" />
                                                <input
                                                    type="text"
                                                    value={studentForm.name}
                                                    onChange={(e) =>
                                                        setStudentForm({ ...studentForm, name: e.target.value })
                                                    }
                                                    required
                                                    placeholder="Jane Doe"
                                                    className="input-field"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="label">Email Address</label>
                                            <div className="input-icon-wrapper">
                                                <Mail size={15} className="input-icon" />
                                                <input
                                                    type="email"
                                                    value={studentForm.email}
                                                    onChange={(e) =>
                                                        setStudentForm({ ...studentForm, email: e.target.value })
                                                    }
                                                    required
                                                    placeholder="student@iba.edu.pk"
                                                    className="input-field"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="label">Temporary Password</label>
                                            <div className="input-icon-wrapper">
                                                <Lock size={15} className="input-icon" />
                                                <input
                                                    type="password"
                                                    value={studentForm.password}
                                                    onChange={(e) =>
                                                        setStudentForm({ ...studentForm, password: e.target.value })
                                                    }
                                                    required
                                                    placeholder="••••••••"
                                                    className="input-field"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={processing.id === "new"}
                                            className="btn btn-primary w-full py-3 text-sm mt-2 justify-center"
                                        >
                                            {processing.id === "new" && processing.action === "add-student" ? (
                                                <>
                                                    <Loader2 size={16} className="animate-spin mr-1" /> Enrolling...
                                                </>
                                            ) : (
                                                "Enroll Student"
                                            )}
                                        </button>
                                    </form>
                                )}

                                {/* PO Form */}
                                {tab === "po" && (
                                    <form onSubmit={handleAddPO} className="space-y-4">
                                        <div>
                                            <label className="label">Staff ID</label>
                                            <div className="input-icon-wrapper">
                                                <Hash size={15} className="input-icon" />
                                                <input
                                                    type="text"
                                                    value={poForm.erp}
                                                    onChange={(e) => setPoForm({ ...poForm, erp: e.target.value })}
                                                    required
                                                    placeholder="e.g. PO-102"
                                                    className="input-field"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="label">Full Name</label>
                                            <div className="input-icon-wrapper">
                                                <UserCircle size={15} className="input-icon" />
                                                <input
                                                    type="text"
                                                    value={poForm.name}
                                                    onChange={(e) => setPoForm({ ...poForm, name: e.target.value })}
                                                    required
                                                    placeholder="John Smith"
                                                    className="input-field"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="label">Official Email</label>
                                            <div className="input-icon-wrapper">
                                                <Mail size={15} className="input-icon" />
                                                <input
                                                    type="email"
                                                    value={poForm.email}
                                                    onChange={(e) => setPoForm({ ...poForm, email: e.target.value })}
                                                    required
                                                    placeholder="po@iba.edu.pk"
                                                    className="input-field"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="label">Temporary Password</label>
                                            <div className="input-icon-wrapper">
                                                <Lock size={15} className="input-icon" />
                                                <input
                                                    type="password"
                                                    value={poForm.password}
                                                    onChange={(e) => setPoForm({ ...poForm, password: e.target.value })}
                                                    required
                                                    placeholder="••••••••"
                                                    className="input-field"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={processing.id === "new"}
                                            className="btn btn-primary w-full py-3 text-sm mt-2 justify-center"
                                        >
                                            {processing.id === "new" && processing.action === "add-po" ? (
                                                <>
                                                    <Loader2 size={16} className="animate-spin mr-1" /> Appointing...
                                                </>
                                            ) : (
                                                "Appoint Staff"
                                            )}
                                        </button>
                                    </form>
                                )}

                                {/* Buildings Form */}
                                {tab === "buildings" && (
                                    <form onSubmit={handleAddBuilding} className="space-y-4">
                                        <div>
                                            <label className="label">Building Name</label>
                                            <div className="input-icon-wrapper">
                                                <Building2 size={15} className="input-icon" />
                                                <input
                                                    type="text"
                                                    value={buildingForm.name}
                                                    onChange={(e) =>
                                                        setBuildingForm({ ...buildingForm, name: e.target.value })
                                                    }
                                                    required
                                                    placeholder="e.g. Aman CED"
                                                    className="input-field"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="label">Campus Location</label>
                                            <div className="input-icon-wrapper">
                                                <MapPin size={15} className="input-icon" />
                                                <input
                                                    type="text"
                                                    value={buildingForm.location}
                                                    onChange={(e) =>
                                                        setBuildingForm({ ...buildingForm, location: e.target.value })
                                                    }
                                                    required
                                                    placeholder="e.g. Main Campus"
                                                    className="input-field"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={processing.id === "new"}
                                            className="btn btn-primary w-full py-3 text-sm mt-2 justify-center"
                                        >
                                            {processing.id === "new" && processing.action === "add-building" ? (
                                                <>
                                                    <Loader2 size={16} className="animate-spin mr-1" /> Registering...
                                                </>
                                            ) : (
                                                "Register Building"
                                            )}
                                        </button>
                                    </form>
                                )}

                                {/* Rooms Form */}
                                {tab === "rooms" && (
                                    <form onSubmit={handleAddRoom} className="space-y-4">
                                        <div>
                                            <label className="label">Room Name/Number</label>
                                            <div className="input-icon-wrapper">
                                                <DoorOpen size={15} className="input-icon" />
                                                <input
                                                    type="text"
                                                    value={roomForm.name}
                                                    onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                                                    required
                                                    placeholder="e.g. Tabba-201"
                                                    className="input-field"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="label">Parent Building</label>
                                            <div className="input-icon-wrapper">
                                                <Building2 size={15} className="input-icon" />
                                                <select
                                                    value={roomForm.building_id}
                                                    onChange={(e) =>
                                                        setRoomForm({ ...roomForm, building_id: e.target.value })
                                                    }
                                                    required
                                                    className="input-field cursor-pointer"
                                                    style={{ paddingLeft: "2.6rem" }}
                                                >
                                                    <option value="" disabled>
                                                        Select Building
                                                    </option>
                                                    {buildings.map((b) => (
                                                        <option key={b.id} value={b.id}>
                                                            {b.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="label">Capacity</label>
                                                <div className="input-icon-wrapper">
                                                    <Users2 size={15} className="input-icon" />
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={roomForm.capacity}
                                                        onChange={(e) =>
                                                            setRoomForm({ ...roomForm, capacity: e.target.value })
                                                        }
                                                        required
                                                        placeholder="e.g. 50"
                                                        className="input-field"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="label">Type</label>
                                                <select
                                                    value={roomForm.type}
                                                    onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value })}
                                                    required
                                                    className="input-field cursor-pointer"
                                                >
                                                    <option value="" disabled>
                                                        Room Type
                                                    </option>
                                                    <option value="Classroom">Classroom</option>
                                                    <option value="Seminar Hall">Seminar Hall</option>
                                                    <option value="Computer Lab">Computer Lab</option>
                                                    <option value="Meeting Room">Meeting Room</option>
                                                    <option value="Auditorium">Auditorium</option>
                                                </select>
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={processing.id === "new"}
                                            className="btn btn-primary w-full py-3 text-sm mt-2 justify-center"
                                        >
                                            {processing.id === "new" && processing.action === "add-room" ? (
                                                <>
                                                    <Loader2 size={16} className="animate-spin mr-1" /> Allocating...
                                                </>
                                            ) : (
                                                "Allocate Room"
                                            )}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Data Table Workspace */}
                    <div className="lg:col-span-8 flex flex-col space-y-4">
                        <div className="table-container flex-1">
                            <table className="table-base">
                                <thead>
                                    <tr>
                                        {/* Dynamic Headers based on tab */}
                                        {(tab === "students" || tab === "po") && (
                                            <>
                                                <th className="table-th">Profile</th>
                                                <th className="table-th">Contact Info</th>
                                            </>
                                        )}
                                        {tab === "buildings" && (
                                            <>
                                                <th className="table-th">Building Details</th>
                                                <th className="table-th text-right">Actions</th>
                                            </>
                                        )}
                                        {tab === "rooms" && (
                                            <>
                                                <th className="table-th">Room Specs</th>
                                                <th className="table-th">Classification</th>
                                                <th className="table-th text-right">Actions</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedData.length === 0 ? (
                                        <tr>
                                            <td colSpan={3}>
                                                <div className="empty-state py-12">
                                                    <div className="empty-state-icon">
                                                        <Inbox size={22} />
                                                    </div>
                                                    <div>
                                                        <h3
                                                            className="font-display text-lg mb-1"
                                                            style={{ color: "var(--text-primary)" }}
                                                        >
                                                            No records found
                                                        </h3>
                                                        <p
                                                            className="text-xs"
                                                            style={{ color: "var(--text-secondary)" }}
                                                        >
                                                            Adjust your search query or add a new entry.
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedData.map((item) => (
                                            <tr key={item.id} className="table-tr group">
                                                {/* Students / PO Render */}
                                                {(tab === "students" || tab === "po") && (
                                                    <>
                                                        <td className="table-td py-3.5">
                                                            <div className="font-bold text-sm text-[var(--text-primary)]">
                                                                {item.name}
                                                            </div>
                                                            <div className="text-[10px] font-semibold tracking-wider uppercase mt-0.5 text-[var(--text-muted)]">
                                                                ID: {item.erp}
                                                            </div>
                                                        </td>
                                                        <td className="table-td py-3.5 font-medium text-xs text-[var(--text-secondary)]">
                                                            {item.email}
                                                        </td>
                                                    </>
                                                )}

                                                {/* Buildings Render */}
                                                {tab === "buildings" && (
                                                    <>
                                                        <td className="table-td py-3.5">
                                                            <div className="font-bold text-sm text-[var(--text-primary)]">
                                                                {item.name}
                                                            </div>
                                                            <div className="text-xs font-medium text-[var(--text-secondary)] flex items-center gap-1 mt-0.5">
                                                                <MapPin size={12} /> {item.location}
                                                            </div>
                                                        </td>
                                                        <td className="table-td py-3.5 text-right">
                                                            {confirmAction.id === item.id &&
                                                            confirmAction.type === "delete-building" ? (
                                                                <div className="flex items-center justify-end gap-1 fade-in bg-[var(--danger-bg)] px-1.5 py-1 rounded-md border border-[var(--danger-border)] inline-flex">
                                                                    <span className="text-[9px] font-bold text-[var(--danger)] px-1 uppercase">
                                                                        Sure?
                                                                    </span>
                                                                    <button
                                                                        onClick={() => handleDeleteBuilding(item.id)}
                                                                        disabled={processing.id === item.id}
                                                                        className="h-6 px-2 rounded bg-[var(--danger)] text-white text-[10px] font-bold hover:opacity-90 transition-opacity"
                                                                    >
                                                                        {processing.id === item.id ? (
                                                                            <Loader2
                                                                                size={11}
                                                                                className="animate-spin"
                                                                            />
                                                                        ) : (
                                                                            "Yes"
                                                                        )}
                                                                    </button>
                                                                    <button
                                                                        onClick={() =>
                                                                            setConfirmAction({ id: null, type: null })
                                                                        }
                                                                        className="h-6 px-2 rounded bg-white dark:bg-black/20 border border-[var(--border-base)] text-[var(--text-secondary)] text-[10px] font-bold hover:bg-[var(--bg-subtle)]"
                                                                    >
                                                                        No
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() =>
                                                                        setConfirmAction({
                                                                            id: item.id,
                                                                            type: "delete-building",
                                                                        })
                                                                    }
                                                                    className="p-2 text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-bg)] rounded-md transition-all opacity-0 group-hover:opacity-100"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            )}
                                                        </td>
                                                    </>
                                                )}

                                                {/* Rooms Render */}
                                                {tab === "rooms" && (
                                                    <>
                                                        <td className="table-td py-3.5">
                                                            <div className="font-bold text-sm flex items-center gap-1.5 text-[var(--iba-red)]">
                                                                <DoorOpen size={14} /> {item.name}
                                                            </div>
                                                            <div className="text-xs font-semibold text-[var(--text-secondary)] mt-0.5 ml-5">
                                                                {item.buildings?.name}
                                                            </div>
                                                        </td>
                                                        <td className="table-td py-3.5">
                                                            <div className="font-medium text-xs text-[var(--text-primary)]">
                                                                {item.type || "General Space"}
                                                            </div>
                                                            <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase mt-0.5">
                                                                Capacity: {item.capacity} pax
                                                            </div>
                                                        </td>
                                                        <td className="table-td py-3.5 text-right">
                                                            {confirmAction.id === item.id &&
                                                            confirmAction.type === "delete-room" ? (
                                                                <div className="flex items-center justify-end gap-1 fade-in bg-[var(--danger-bg)] px-1.5 py-1 rounded-md border border-[var(--danger-border)] inline-flex">
                                                                    <span className="text-[9px] font-bold text-[var(--danger)] px-1 uppercase">
                                                                        Sure?
                                                                    </span>
                                                                    <button
                                                                        onClick={() => handleDeleteRoom(item.id)}
                                                                        disabled={processing.id === item.id}
                                                                        className="h-6 px-2 rounded bg-[var(--danger)] text-white text-[10px] font-bold hover:opacity-90 transition-opacity"
                                                                    >
                                                                        {processing.id === item.id ? (
                                                                            <Loader2
                                                                                size={11}
                                                                                className="animate-spin"
                                                                            />
                                                                        ) : (
                                                                            "Yes"
                                                                        )}
                                                                    </button>
                                                                    <button
                                                                        onClick={() =>
                                                                            setConfirmAction({ id: null, type: null })
                                                                        }
                                                                        className="h-6 px-2 rounded bg-white dark:bg-black/20 border border-[var(--border-base)] text-[var(--text-secondary)] text-[10px] font-bold hover:bg-[var(--bg-subtle)]"
                                                                    >
                                                                        No
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() =>
                                                                        setConfirmAction({
                                                                            id: item.id,
                                                                            type: "delete-room",
                                                                        })
                                                                    }
                                                                    className="p-2 text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-bg)] rounded-md transition-all opacity-0 group-hover:opacity-100"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            )}
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ── 4. Global Pagination ── */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 fade-in">
                    <span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                        Showing{" "}
                        <span className="font-bold text-[var(--text-primary)]">
                            {(currentPage - 1) * itemsPerPage + 1}
                        </span>{" "}
                        to{" "}
                        <span className="font-bold text-[var(--text-primary)]">
                            {Math.min(currentPage * itemsPerPage, filteredData.length)}
                        </span>{" "}
                        of <span className="font-bold text-[var(--text-primary)]">{filteredData.length}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((p) => p - 1)}
                            className="btn btn-outline p-1.5 rounded-lg"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        {(() => {
                            const pages = [];
                            const delta = 1;
                            const rangeStart = Math.max(2, currentPage - delta);
                            const rangeEnd = Math.min(totalPages - 1, currentPage + delta);

                            pages.push(1);
                            if (rangeStart > 2) pages.push("...");
                            for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);
                            if (rangeEnd < totalPages - 1) pages.push("...");
                            if (totalPages > 1) pages.push(totalPages);

                            return pages.map((p, idx) =>
                                p === "..." ? (
                                    <span
                                        key={`ellipsis-${idx}`}
                                        className="w-8 h-8 flex items-center justify-center text-xs text-[var(--text-muted)] select-none"
                                    >
                                        …
                                    </span>
                                ) : (
                                    <button
                                        key={p}
                                        onClick={() => setCurrentPage(p)}
                                        className="btn w-8 h-8 rounded-lg text-xs font-semibold"
                                        style={{
                                            background: currentPage === p ? "var(--iba-red)" : "var(--bg-surface)",
                                            color: currentPage === p ? "white" : "var(--text-secondary)",
                                            border: `1px solid ${currentPage === p ? "var(--iba-red)" : "var(--border-base)"}`,
                                        }}
                                    >
                                        {p}
                                    </button>
                                ),
                            );
                        })()}
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage((p) => p + 1)}
                            className="btn btn-outline p-1.5 rounded-lg"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
