import { useState, useEffect } from "react";
import { api } from "../api";
import { Toaster, toast } from "sonner";
import {
    Calendar,
    Clock,
    MapPin,
    Building,
    Monitor,
    Mic,
    BookOpen,
    DoorOpen,
    CheckCircle2,
    Clock3,
    ChevronLeft,
    ChevronRight,
    Plus,
    List,
    Info,
    Loader2,
    AlertTriangle,
    XCircle,
    Ban,
    GraduationCap,
    Search,
    X,
    Lock,
    Users,
    Sparkles,
} from "lucide-react";

// ── Helpers ────────────────────────────────────────────────────
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

// Map beautiful room icons based on name patterns
function getRoomIcon(roomName) {
    const name = (roomName || "").toLowerCase();
    if (name.includes("lab") || name.includes("computer")) {
        return <Monitor size={16} />;
    }
    if (name.includes("seminar") || name.includes("auditorium") || name.includes("hall")) {
        return <Mic size={16} />;
    }
    if (name.includes("study") || name.includes("library") || name.includes("reading")) {
        return <BookOpen size={16} />;
    }
    return <DoorOpen size={16} />;
}

// ── Time Slot AM/PM Formatter Utility ────────────────────────
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
    }

    return slotLabel;
}

// ── Inline Confirm Dialog ────────────────────────────────────
// ── Inline Confirm Dialog ────────────────────────────────────
function InlineConfirm({ onConfirm, onCancel, loading, label = "Cancel booking?" }) {
    return (
        <div className="flex items-center gap-1.5 fade-in bg-red-50 dark:bg-red-950/20 px-2 py-1 rounded-lg border border-red-200 dark:border-red-900/30">
            <span className="text-[10px] font-bold uppercase tracking-tight text-red-700 dark:text-red-400">
                {label}
            </span>
            <div className="flex gap-1">
                <button
                    onClick={onConfirm}
                    disabled={loading}
                    className="h-6 px-2 rounded bg-red-600 text-white text-[10px] font-bold hover:bg-red-700 transition-colors flex items-center justify-center min-w-[36px]"
                >
                    {loading ? <div className="spinner w-2.5 h-2.5" /> : "Yes"}
                </button>
                <button
                    onClick={onCancel}
                    disabled={loading}
                    className="h-6 px-2 rounded bg-white dark:bg-white/10 text-[var(--text-secondary)] text-[10px] font-bold border border-[var(--border-base)] hover:bg-[var(--bg-subtle)] transition-colors"
                >
                    No
                </button>
            </div>
        </div>
    );
}
// ── Booking Card ───────────────────────────────────────────────
function BookingCard({ booking, onCancel, cancelling, confirmId, onConfirmOpen, onConfirmClose }) {
    const date = new Date(booking.date);
    const dayNum = date.getDate();
    const weekdayStr = date.toLocaleString("default", { weekday: "short" }).toUpperCase();
    const monthStr = date.toLocaleString("default", { month: "short" }).toUpperCase();
    const yearStr = date.getFullYear();

    const canCancel = booking.status === "pending" || booking.status === "approved";
    const formattedTime = formatTimeSlot(booking.time_slots?.label);

    return (
        <div
            className="card card-hover flex flex-col sm:flex-row overflow-hidden"
            style={{ transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
            {/* Left Date Block */}
            <div
                className="flex-shrink-0 flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-1.5 px-5 py-3 sm:py-6 sm:w-24 text-center select-none relative overflow-hidden"
                style={{ background: "var(--iba-red)" }}
            >
                {/* Subtle geometric pattern overlay inside card date tag */}
                <div className="absolute inset-0 bg-brand-pattern opacity-5 pointer-events-none" />

                <span className="text-[10px] font-bold tracking-widest text-white/70 uppercase relative z-10">
                    {weekdayStr}
                </span>
                <span className="font-display text-2xl sm:text-4xl font-bold text-white leading-none my-0.5 relative z-10">
                    {dayNum}
                </span>
                <div className="flex sm:flex-col items-center gap-1.5 sm:gap-0 relative z-10">
                    <span className="text-[11px] font-semibold text-white/90 uppercase tracking-wider">{monthStr}</span>
                    <span className="text-[10px] font-medium text-white/55 hidden sm:inline">{yearStr}</span>
                </div>
            </div>

            {/* Content & Header Block */}
            <div className="flex-1 p-5 flex flex-col justify-between">
                <div>
                    {/* Header Zone */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span style={{ color: "var(--iba-red)" }}>{getRoomIcon(booking.rooms?.name)}</span>
                                <h3
                                    className="font-semibold text-base leading-snug"
                                    style={{ color: "var(--text-primary)" }}
                                >
                                    {booking.rooms?.name}
                                </h3>
                            </div>
                            <div
                                className="flex items-center gap-1.5 text-xs font-medium"
                                style={{ color: "var(--text-secondary)" }}
                            >
                                <Building size={13} className="opacity-80" />
                                {booking.rooms?.buildings?.name}
                            </div>
                        </div>

                        {/* Inline Status and Action Cluster */}
                        <div className="flex items-center justify-end gap-2 self-start flex-shrink-0">
                            {canCancel && (
                                <div className="transition-all duration-200">
                                    {confirmId === booking.id ? (
                                        <InlineConfirm
                                            onConfirm={() => onCancel(booking.id)}
                                            onCancel={onConfirmClose}
                                            loading={cancelling === booking.id}
                                        />
                                    ) : (
                                        <button
                                            onClick={() => onConfirmOpen(booking.id)}
                                            className="h-7 px-2.5 rounded-md text-[11px] font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 border border-transparent hover:border-red-200 dark:hover:border-red-900/30 transition-all flex items-center gap-1"
                                        >
                                            <X size={12} strokeWidth={2.5} />
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            )}
                            {confirmId !== booking.id && <StatusBadge status={booking.status} />}
                        </div>
                    </div>

                    <hr className="divider mb-4" />

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        {/* Time Slot */}
                        <div className="md:col-span-5 flex items-start gap-2.5">
                            <Clock size={15} className="mt-0.5 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                            <div>
                                <span
                                    className="block text-[9px] font-bold uppercase tracking-wider mb-0.5"
                                    style={{ color: "var(--text-muted)" }}
                                >
                                    Time Slot
                                </span>
                                <span
                                    className="text-sm font-semibold tracking-tight"
                                    style={{ color: "var(--text-primary)" }}
                                >
                                    {formattedTime}
                                </span>
                            </div>
                        </div>

                        {/* Purpose */}
                        <div className="md:col-span-7 flex items-start gap-2.5">
                            <Info size={15} className="mt-0.5 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                            <div className="w-full">
                                <span
                                    className="block text-[9px] font-bold uppercase tracking-wider mb-0.5"
                                    style={{ color: "var(--text-muted)" }}
                                >
                                    Purpose
                                </span>
                                <p
                                    className="text-xs sm:text-sm font-medium leading-relaxed break-words line-clamp-2 md:line-clamp-3"
                                    title={booking.purpose}
                                    style={{ color: "var(--text-secondary)" }}
                                >
                                    {booking.purpose || "No purpose specified"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Calendar Component ─────────────────────────────────────────
function BookingCalendar({ selectedDate, onSelect }) {
    const [month, setMonth] = useState(new Date());
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const year = month.getFullYear();
    const monthIdx = month.getMonth();
    const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
    const firstDay = new Date(year, monthIdx, 1).getDay();

    const prevMonth = () => {
        const prev = new Date(year, monthIdx - 1, 1);
        if (prev < new Date(today.getFullYear(), today.getMonth(), 1)) return;
        setMonth(prev);
    };

    const nextMonth = () => setMonth(new Date(year, monthIdx + 1, 1));

    const monthName = month.toLocaleString("default", { month: "long", year: "numeric" });

    return (
        <div>
            {/* Month Nav */}
            <div className="flex items-center justify-between mb-4">
                <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                    {monthName}
                </span>
                <div className="flex gap-1">
                    <button
                        type="button"
                        onClick={prevMonth}
                        className="btn btn-ghost p-1.5 rounded-md"
                        style={{ color: "var(--text-secondary)" }}
                    >
                        <ChevronLeft size={15} />
                    </button>
                    <button
                        type="button"
                        onClick={nextMonth}
                        className="btn btn-ghost p-1.5 rounded-md"
                        style={{ color: "var(--text-secondary)" }}
                    >
                        <ChevronRight size={15} />
                    </button>
                </div>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 mb-1">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                    <div
                        key={d}
                        className="text-center text-[10px] font-bold uppercase tracking-wider py-1.5"
                        style={{ color: "var(--text-muted)" }}
                    >
                        {d}
                    </div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
                {[...Array(firstDay)].map((_, i) => (
                    <div key={`e-${i}`} />
                ))}
                {[...Array(daysInMonth)].map((_, i) => {
                    const day = i + 1;
                    const dateObj = new Date(year, monthIdx, day);
                    const dateStr = `${year}-${String(monthIdx + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const disabled = dateObj < today;
                    const selected = selectedDate === dateStr;
                    const isToday = dateObj.toDateString() === today.toDateString();

                    return (
                        <button
                            key={day}
                            type="button"
                            disabled={disabled}
                            onClick={() => onSelect(dateStr)}
                            className="h-9 w-full rounded-lg flex items-center justify-center text-sm font-medium transition-all"
                            style={{
                                background: selected
                                    ? "var(--iba-red)"
                                    : isToday
                                      ? "var(--iba-red-muted)"
                                      : "transparent",
                                color: selected
                                    ? "white"
                                    : disabled
                                      ? "var(--text-muted)"
                                      : isToday
                                        ? "var(--iba-red)"
                                        : "var(--text-primary)",
                                cursor: disabled ? "not-allowed" : "pointer",
                                border: isToday && !selected ? "1px solid var(--iba-red)" : "1px solid transparent",
                                opacity: disabled ? 0.35 : 1,
                            }}
                            onMouseEnter={(e) => {
                                if (!disabled && !selected) e.currentTarget.style.background = "var(--bg-muted)";
                            }}
                            onMouseLeave={(e) => {
                                if (!disabled && !selected)
                                    e.currentTarget.style.background = isToday ? "var(--iba-red-muted)" : "transparent";
                            }}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ── Dynamic Step Label ─────────────────────────────────────────

function StepLabel({ number, status = "pending", children }) {
    // status can be: "locked", "active", "completed"
    return (
        <h2
            className="font-display text-lg mb-4 flex items-center justify-between"
            style={{ color: "var(--text-primary)" }}
        >
            <div className="flex items-center gap-3">
                {status === "completed" ? (
                    <span
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 "
                        style={{ background: "var(--success)" }}
                    >
                        <CheckCircle2 size={15} />
                    </span>
                ) : status === "active" ? (
                    <span
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0  "
                        style={{
                            background: "var(--iba-red)",
                            boxShadow: "0 0 0 4px var(--iba-red-glow)",
                        }}
                    >
                        {number}
                    </span>
                ) : (
                    <span
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0  border border-[var(--border-strong)]"
                        style={{ background: "var(--bg-subtle)", color: "var(--text-muted)" }}
                    >
                        <Lock size={12} className="opacity-60" />
                    </span>
                )}
                <span className={status === "locked" ? "text-[var(--text-muted)]" : ""}>{children}</span>
            </div>
            {status === "completed" && (
                <span className="text-[10px] font-bold text-[var(--success)] uppercase tracking-wider bg-[var(--success-bg)] px-2 py-0.5 rounded border border-[var(--success-border)]">
                    Done
                </span>
            )}
        </h2>
    );
}

// ── Main Component ─────────────────────────────────────────────
export default function StudentDashboard({ user }) {
    const [view, setView] = useState("list");

    const [buildings, setBuildings] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [slots, setSlots] = useState([]);
    const [bookings, setBookings] = useState([]);

    const [isFetching, setIsFetching] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cancelling, setCancelling] = useState(null);
    const [confirmId, setConfirmId] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const PER_PAGE = 5;

    // Form states
    const [selectedBuilding, setSelectedBuilding] = useState("");
    const [selectedRoom, setSelectedRoom] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedSlot, setSelectedSlot] = useState("");
    const [purpose, setPurpose] = useState("");

    // Setup active steps dynamically
    const step1Status = selectedDate ? "completed" : "active";
    const step2Status = !selectedDate ? "locked" : selectedBuilding && selectedRoom ? "completed" : "active";
    const step3Status = !selectedDate || !selectedRoom ? "locked" : selectedSlot ? "completed" : "active";
    const step4Status =
        !selectedDate || !selectedRoom || !selectedSlot ? "locked" : purpose.trim() ? "completed" : "active";

    const activeRoomObj = rooms.find((r) => String(r.id) === String(selectedRoom));
    const activeBuildingObj = buildings.find((b) => String(b.id) === String(selectedBuilding));
    const activeSlotObj = slots.find((s) => String(s.id) === String(selectedSlot));

    // Load data
    const loadBookings = async () => {
        try {
            const data = await api.bookings.list({ mine: true });
            setBookings(data);
        } catch (err) {
            toast.error(err.message || "Failed to load your reservations.");
        }
    };

    useEffect(() => {
        const init = async () => {
            setIsFetching(true);
            try {
                const [buildingsData, slotsData] = await Promise.all([api.buildings.list(), api.timeSlots.list()]);
                setBuildings(buildingsData);
                setSlots(slotsData);
                await loadBookings();
            } catch (err) {
                console.error(err);
                toast.error("Failed to load data. Please refresh.");
            } finally {
                setIsFetching(false);
            }
        };
        init();
    }, []);

    const loadRooms = async (buildingId) => {
        setSelectedRoom("");
        setRooms([]);
        if (!buildingId) return;
        try {
            const data = await api.rooms.list(buildingId);
            setRooms(data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load rooms for this building.");
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!selectedRoom || !selectedDate || !selectedSlot || !purpose.trim()) {
            toast.error("Please complete all required fields.");
            return;
        }
        setIsSubmitting(true);
        try {
            window.scrollTo({ top: 0, behavior: "smooth" });
            await api.bookings.create({
                room_id: selectedRoom,
                date: selectedDate,
                slot_id: parseInt(selectedSlot),
                purpose,
            });
            toast.success("Reservation submitted successfully!");
            setSelectedBuilding("");
            setSelectedRoom("");
            setSelectedDate("");
            setSelectedSlot("");
            setPurpose("");
            setRooms([]);
            setView("list");
            await loadBookings();
        } catch (err) {
            toast.error(err.message || "Failed to submit booking.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = async (id) => {
        setCancelling(id);
        try {
            await api.bookings.cancel(id);
            toast.success("Reservation cancelled.");
            await loadBookings();
        } catch (err) {
            toast.error(err.message || "Failed to cancel reservation.");
        } finally {
            setCancelling(null);
            setConfirmId(null);
        }
    };

    // Pagination
    const totalPages = Math.ceil(bookings.length / PER_PAGE);
    const pageItems = bookings.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

    if (isFetching) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
                <Loader2 size={36} className="animate-spin" style={{ color: "var(--iba-red)" }} />
                <p className="text-sm font-medium " style={{ color: "var(--text-secondary)" }}>
                    Loading your portal...
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 page-enter">
            <Toaster position="top-center" richColors />

            {/* ── Header ─────────────────────────────────────── */}
            <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6"
                style={{ borderBottom: "1px solid var(--border-base)" }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: "var(--iba-red-muted)" }}
                    >
                        <GraduationCap size={20} style={{ color: "var(--iba-red)" }} />
                    </div>
                    <div>
                        <h1 className="font-display text-2xl" style={{ color: "var(--text-primary)" }}>
                            Student Portal
                        </h1>
                        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                            Welcome, {user?.name?.split(" ")[0] || "Student"}
                        </p>
                    </div>
                </div>

                <div className="nav-tabs">
                    <button className={`nav-tab ${view === "list" ? "active" : ""}`} onClick={() => setView("list")}>
                        <List size={15} /> My Reservations
                    </button>
                    <button className={`nav-tab ${view === "book" ? "active" : ""}`} onClick={() => setView("book")}>
                        <Plus size={15} /> New Request
                    </button>
                </div>
            </div>

            {/* ── List View ──────────────────────────────────── */}
            {view === "list" && (
                <div className="space-y-4 fade-in">
                    {bookings.length === 0 ? (
                        <div className="card">
                            <div className="empty-state">
                                <div className="empty-state-icon">
                                    <Calendar size={22} />
                                </div>
                                <div>
                                    <h3 className="font-display text-xl mb-1" style={{ color: "var(--text-primary)" }}>
                                        No reservations yet
                                    </h3>
                                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                                        You have no upcoming room bookings. Submit a new request to get started.
                                    </p>
                                </div>
                                <button onClick={() => setView("book")} className="btn btn-primary gap-2">
                                    <Plus size={15} /> New Request
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {pageItems.map((b) => (
                                <BookingCard
                                    key={b.id}
                                    booking={b}
                                    onCancel={handleCancel}
                                    cancelling={cancelling}
                                    confirmId={confirmId}
                                    onConfirmOpen={setConfirmId}
                                    onConfirmClose={() => setConfirmId(null)}
                                />
                            ))}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-1.5 pt-2">
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage((p) => p - 1)}
                                        className="btn btn-outline p-2 rounded-lg"
                                    >
                                        <ChevronLeft size={15} />
                                    </button>
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className="btn w-9 h-9 rounded-lg text-xs font-semibold"
                                            style={{
                                                background:
                                                    currentPage === i + 1 ? "var(--iba-red)" : "var(--bg-surface)",
                                                color: currentPage === i + 1 ? "white" : "var(--text-secondary)",
                                                border: `1px solid ${currentPage === i + 1 ? "var(--iba-red)" : "var(--border-base)"}`,
                                            }}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                    <button
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage((p) => p - 1)}
                                        className="btn btn-outline p-2 rounded-lg"
                                    >
                                        <ChevronRight size={15} />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* ── New Booking View ────────────────────────────── */}
            {view === "book" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start fade-in">
                    {/* Left Forms Workspace Column */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Step 1: Date */}
                        <div
                            className="card p-6 "
                            style={{
                                borderColor: step1Status === "active" ? "var(--iba-red)" : "var(--border-base)",
                                boxShadow: step1Status === "active" ? "var(--shadow-brand)" : "var(--shadow-sm)",
                            }}
                        >
                            <StepLabel number="1" status={step1Status}>
                                Select Reservation Date
                            </StepLabel>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                                <div className="md:col-span-7">
                                    <BookingCalendar selectedDate={selectedDate} onSelect={setSelectedDate} />
                                </div>
                                <div className="md:col-span-5 flex flex-col justify-center h-full p-4 rounded-xl border border-dashed border-[var(--border-base)] bg-[var(--bg-subtle)] text-center">
                                    <Calendar size={28} className="mx-auto mb-2 text-[var(--text-muted)]" />
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                                        Chosen Date
                                    </h4>
                                    {selectedDate ? (
                                        <div className="text-sm font-semibold text-[var(--iba-red)] ">
                                            {new Date(selectedDate).toLocaleDateString("en-US", {
                                                weekday: "long",
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-[var(--text-muted)]">
                                            Please choose a active calendar day to proceed.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Step 2: Location */}
                        <div
                            className={`card p-6  ${step2Status === "locked" ? "opacity-45 pointer-events-none" : ""}`}
                            style={{
                                borderColor: step2Status === "active" ? "var(--iba-red)" : "var(--border-base)",
                                boxShadow: step2Status === "active" ? "var(--shadow-brand)" : "var(--shadow-sm)",
                            }}
                        >
                            <StepLabel number="2" status={step2Status}>
                                Choose Location & Room
                            </StepLabel>
                            <div className="space-y-5">
                                <div>
                                    <label className="label">Building</label>
                                    <div className="input-icon-wrapper">
                                        <Building size={15} className="input-icon" />
                                        <select
                                            value={selectedBuilding}
                                            onChange={(e) => {
                                                setSelectedBuilding(e.target.value);
                                                loadRooms(e.target.value);
                                            }}
                                            className="input-field cursor-pointer"
                                            style={{ paddingLeft: "2.6rem" }}
                                        >
                                            <option value="">Select a campus building...</option>
                                            {buildings.map((b) => (
                                                <option key={b.id} value={b.id}>
                                                    {b.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {selectedBuilding && (
                                    <div className="slide-up">
                                        <label className="label">Available Rooms</label>
                                        {rooms.length === 0 ? (
                                            <p className="text-xs text-[var(--text-muted)] bg-[var(--bg-subtle)] p-3 rounded-lg border border-[var(--border-base)]">
                                                No rooms currently configured or active for this building.
                                            </p>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                                                {rooms.map((r) => {
                                                    const isSelected = String(selectedRoom) === String(r.id);
                                                    return (
                                                        <button
                                                            key={r.id}
                                                            type="button"
                                                            onClick={() => setSelectedRoom(r.id)}
                                                            className="flex items-center justify-between p-3.5 rounded-xl border text-left transition-all duration-200"
                                                            style={{
                                                                background: isSelected
                                                                    ? "var(--iba-red-muted)"
                                                                    : "var(--bg-surface)",
                                                                borderColor: isSelected
                                                                    ? "var(--iba-red)"
                                                                    : "var(--border-base)",
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div
                                                                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                                                                    style={{
                                                                        background: isSelected
                                                                            ? "var(--bg-surface)"
                                                                            : "var(--bg-subtle)",
                                                                        color: isSelected
                                                                            ? "var(--iba-red)"
                                                                            : "var(--text-secondary)",
                                                                    }}
                                                                >
                                                                    {getRoomIcon(r.name)}
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-bold text-[var(--text-primary)]">
                                                                        {r.name}
                                                                    </div>
                                                                    <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                                                                        <Users size={11} /> Capacity: {r.capacity}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div
                                                                className="w-4 h-4 rounded-full border flex items-center justify-center transition-all"
                                                                style={{
                                                                    borderColor: isSelected
                                                                        ? "var(--iba-red)"
                                                                        : "var(--border-strong)",
                                                                    background: isSelected
                                                                        ? "var(--iba-red)"
                                                                        : "transparent",
                                                                }}
                                                            >
                                                                {isSelected && (
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                                                )}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Step 3: Time Slot */}
                        <div
                            className={`card p-6  ${step3Status === "locked" ? "opacity-45 pointer-events-none" : ""}`}
                            style={{
                                borderColor: step3Status === "active" ? "var(--iba-red)" : "var(--border-base)",
                                boxShadow: step3Status === "active" ? "var(--shadow-brand)" : "var(--shadow-sm)",
                            }}
                        >
                            <StepLabel number="3" status={step3Status}>
                                Pick Time Slot
                            </StepLabel>
                            {step3Status === "locked" ? (
                                <div className="flex items-center gap-2 text-xs p-3 rounded-lg border border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning)]">
                                    <AlertTriangle size={13} />
                                    Configure reservation date and room selection first.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {slots.map((s) => {
                                        const isSelected = String(selectedSlot) === String(s.id);
                                        return (
                                            <button
                                                key={s.id}
                                                type="button"
                                                onClick={() => setSelectedSlot(s.id)}
                                                className="flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all"
                                                style={{
                                                    background: isSelected ? "var(--iba-red)" : "var(--bg-subtle)",
                                                    color: isSelected ? "white" : "var(--text-primary)",
                                                    border: `1.5px solid ${isSelected ? "var(--iba-red)" : "var(--border-base)"}`,
                                                }}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Clock size={13} style={{ opacity: isSelected ? 0.9 : 0.5 }} />
                                                    <span>{formatTimeSlot(s.label)}</span>
                                                </div>
                                                {isSelected && (
                                                    <CheckCircle2 size={13} className="text-white opacity-90" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Step 4: Purpose */}
                        <div
                            className={`card p-6  ${step4Status === "locked" ? "opacity-45 pointer-events-none" : ""}`}
                            style={{
                                borderColor: step4Status === "active" ? "var(--iba-red)" : "var(--border-base)",
                                boxShadow: step4Status === "active" ? "var(--shadow-brand)" : "var(--shadow-sm)",
                            }}
                        >
                            <StepLabel number="4" status={step4Status}>
                                Reservation Purpose
                            </StepLabel>
                            <div className="space-y-3">
                                <label className="label">Describe Your Reservation Activity</label>
                                <textarea
                                    value={purpose}
                                    onChange={(e) => setPurpose(e.target.value)}
                                    placeholder="e.g., Society meeting, Academic project work, Study session..."
                                    rows={3}
                                    className="input-field resize-none"
                                />
                                <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                                    <span>Please provide explicit reasoning for quicker review.</span>
                                    <span>{purpose.length} characters</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Sticky Reservation Slip Ticket Column */}
                    <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-4">
                        <div className="card overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl relative">
                            {/* Visual Jagged Ticket Header divider decorative line */}
                            <div className="bg-[var(--iba-red)] px-5 py-4 text-white relative">
                                <div className="absolute inset-0 bg-brand-pattern opacity-[0.05] pointer-events-none" />
                                <h3 className="font-display text-xl leading-tight mt-0.5">Reservation Summary</h3>
                            </div>

                            {/* Ticket Inner Details */}
                            <div className="p-5 space-y-4 relative">
                                {/* Segment 1: Location details */}
                                <div className="space-y-1">
                                    <span className="block text-[10px] uppercase tracking-wider font-bold text-[var(--text-muted)]">
                                        Destination Space
                                    </span>
                                    {activeBuildingObj || activeRoomObj ? (
                                        <div>
                                            <div className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                                                <DoorOpen size={14} className="text-[var(--iba-red)]" />
                                                {activeRoomObj?.name || "Room Selection Pending"}
                                            </div>
                                            <div className="text-xs text-[var(--text-secondary)] pl-5">
                                                {activeBuildingObj?.name || "Building Selection Pending"}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-xs italic text-[var(--text-muted)]">
                                            No venue configured yet
                                        </div>
                                    )}
                                </div>

                                <hr className="border-t border-dashed border-[var(--border-base)]" />

                                {/* Segment 2: Date Details */}
                                <div className="space-y-1">
                                    <span className="block text-[10px] uppercase tracking-wider font-bold text-[var(--text-muted)]">
                                        Date Selected
                                    </span>
                                    {selectedDate ? (
                                        <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                                            <Calendar size={14} className="text-[var(--iba-red)]" />
                                            {new Date(selectedDate).toLocaleDateString("en-US", {
                                                weekday: "long",
                                                month: "long",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-xs italic text-[var(--text-muted)]">
                                            No date selected yet
                                        </div>
                                    )}
                                </div>

                                <hr className="border-t border-dashed border-[var(--border-base)]" />

                                {/* Segment 3: Hours details */}
                                <div className="space-y-1">
                                    <span className="block text-[10px] uppercase tracking-wider font-bold text-[var(--text-muted)]">
                                        Session Slot
                                    </span>
                                    {activeSlotObj ? (
                                        <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                                            <Clock size={14} className="text-[var(--iba-red)]" />
                                            {formatTimeSlot(activeSlotObj.label)}
                                        </div>
                                    ) : (
                                        <div className="text-xs italic text-[var(--text-muted)]">
                                            No time slot configured yet
                                        </div>
                                    )}
                                </div>

                                <hr className="border-t border-dashed border-[var(--border-base)]" />

                                {/* Segment 4: Brief purpose statement */}
                                <div className="space-y-1">
                                    <span className="block text-[10px] uppercase tracking-wider font-bold text-[var(--text-muted)]">
                                        Stated Purpose
                                    </span>
                                    {purpose.trim() ? (
                                        <p className="text-xs text-[var(--text-secondary)] italic leading-relaxed line-clamp-3">
                                            "{purpose}"
                                        </p>
                                    ) : (
                                        <div className="text-xs italic text-[var(--text-muted)]">
                                            Purpose details incomplete
                                        </div>
                                    )}
                                </div>

                                {/* Punch Holes in Visual Ticket Layout */}
                                <div className="absolute left-0 top-[28%] -translate-x-1/2 w-4 h-4 bg-[var(--bg-base)] rounded-full border border-[var(--border-base)]" />
                                <div className="absolute right-0 top-[28%] translate-x-1/2 w-4 h-4 bg-[var(--bg-base)] rounded-full border border-[var(--border-base)]" />
                            </div>

                            {/* Ticket Footer Action zone */}
                            <div className="p-4 bg-[var(--bg-subtle)] border-t border-[var(--border-base)]">
                                <button
                                    onClick={handleSubmit}
                                    type="button"
                                    disabled={
                                        isSubmitting ||
                                        !selectedRoom ||
                                        !selectedDate ||
                                        !selectedSlot ||
                                        !purpose.trim()
                                    }
                                    className="btn btn-primary w-full py-3 text-sm justify-center rounded-xl"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="spinner w-4 h-4 mr-1" /> Submitting...
                                        </>
                                    ) : (
                                        <>
                                            Submit Request <ChevronRight size={15} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
