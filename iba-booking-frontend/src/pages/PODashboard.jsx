import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { api } from "../api";
import { Toaster, toast } from "sonner";
import {
    Clock3,
    CheckCircle2,
    XCircle,
    Ban,
    Search,
    Building2,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Loader2,
    AlertTriangle,
    Eye,
    X,
    Inbox,
    RefreshCw,
    Mail,
    LayoutGrid,
} from "lucide-react";

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

export default function PODashboard() {
    // --- State Management ---
    const [bookings, setBookings] = useState([]);
    const [filterStatus, setFilterStatus] = useState("pending");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedBuilding, setSelectedBuilding] = useState("all");
    const [selectedBooking, setSelectedBooking] = useState(null);

    // UX States
    const [isFetching, setIsFetching] = useState(true);
    const [processing, setProcessing] = useState({ id: null, action: null });
    const [confirmAction, setConfirmAction] = useState({ id: null, action: null });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // --- Load Data ---
    const loadBookings = async () => {
        setIsFetching(true);
        try {
            const bookingsData = await api.bookings.list({});
            setBookings(bookingsData);
        } catch (err) {
            toast.error(err.message || "Failed to load facility requests.");
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => {
        loadBookings();
    }, []);

    // --- Reset Pagination on Filter Changes ---
    useEffect(() => {
        setCurrentPage(1);
        setConfirmAction({ id: null, action: null });
    }, [filterStatus, searchQuery, selectedBuilding]);

    // --- Actions ---
    const handleApprove = async (bookingId) => {
        setProcessing({ id: bookingId, action: "approve" });
        try {
            await api.bookings.approve(bookingId);
            toast.success("Reservation request formally approved.");
            await loadBookings();
            if (selectedBooking?.id === bookingId) {
                setSelectedBooking((prev) => (prev ? { ...prev, status: "approved" } : null));
            }
        } catch (err) {
            toast.error(err.message || "Failed to approve request.");
        } finally {
            setProcessing({ id: null, action: null });
        }
    };

    const executeReject = async (bookingId) => {
        setProcessing({ id: bookingId, action: "reject" });
        try {
            await api.bookings.reject(bookingId);
            toast.success("Reservation request rejected.");
            await loadBookings();
            if (selectedBooking?.id === bookingId) {
                setSelectedBooking((prev) => (prev ? { ...prev, status: "rejected" } : null));
            }
        } catch (err) {
            toast.error(err.message || "Failed to reject request.");
        } finally {
            setProcessing({ id: null, action: null });
            setConfirmAction({ id: null, action: null });
        }
    };

    const executeCancel = async (bookingId) => {
        setProcessing({ id: bookingId, action: "cancel" });
        try {
            await api.bookings.cancel(bookingId);
            toast.success("Reservation cancelled and slot released.");
            await loadBookings();
            if (selectedBooking?.id === bookingId) {
                setSelectedBooking((prev) => (prev ? { ...prev, status: "cancelled" } : null));
            }
        } catch (err) {
            toast.error(err.message || "Failed to cancel reservation.");
        } finally {
            setProcessing({ id: null, action: null });
            setConfirmAction({ id: null, action: null });
        }
    };

    // --- Conflict Detection Logic ---
    const conflictsMap = useMemo(() => {
        const map = {};
        const approveds = bookings.filter((b) => b.status === "approved");

        bookings.forEach((b) => {
            if (b.status === "pending") {
                const hasConflict = approveds.some(
                    (appr) => appr.date === b.date && appr.slot_id === b.slot_id && appr.rooms?.id === b.rooms?.id,
                );
                if (hasConflict) {
                    map[b.id] = true;
                }
            }
        });
        return map;
    }, [bookings]);

    // --- Dynamic Stats Summary ---
    const stats = useMemo(() => {
        const result = { pending: 0, approved: 0, conflicts: 0, today: 0 };
        const todayStr = new Date().toISOString().split("T")[0];

        bookings.forEach((b) => {
            if (b.status === "pending") result.pending++;
            if (b.status === "approved") result.approved++;
            if (conflictsMap[b.id]) result.conflicts++;
            if (b.date === todayStr) result.today++;
        });
        return result;
    }, [bookings, conflictsMap]);

    // --- Dynamic Building Options ---
    const buildingsList = useMemo(() => {
        const set = new Set();
        const list = [];
        bookings.forEach((b) => {
            const bld = b.rooms?.buildings;
            if (bld && !set.has(bld.id)) {
                set.add(bld.id);
                list.push(bld);
            }
        });
        return list;
    }, [bookings]);

    // --- Multi-Criteria Filtering & Search ---
    const filteredBookings = useMemo(() => {
        return bookings.filter((b) => {
            if (filterStatus && b.status !== filterStatus) return false;
            if (selectedBuilding !== "all" && b.rooms?.buildings?.id !== selectedBuilding) return false;

            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const userName = (b.users?.name || "").toLowerCase();
                const userErp = (b.users?.erp || "").toLowerCase();
                const roomName = (b.rooms?.name || "").toLowerCase();
                const buildingName = (b.rooms?.buildings?.name || "").toLowerCase();
                const purpose = (b.purpose || "").toLowerCase();

                return (
                    userName.includes(query) ||
                    userErp.includes(query) ||
                    roomName.includes(query) ||
                    buildingName.includes(query) ||
                    purpose.includes(query)
                );
            }
            return true;
        });
    }, [bookings, filterStatus, selectedBuilding, searchQuery]);

    // --- Pagination Calculation ---
    const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
    const paginatedItems = useMemo(() => {
        const offset = (currentPage - 1) * itemsPerPage;
        return filteredBookings.slice(offset, offset + itemsPerPage);
    }, [filteredBookings, currentPage]);

    // --- Format Date Helper ---
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
    };

    return (
        <div className="space-y-4 page-enter pb-12">
            <Toaster position="top-center" richColors />

            {/* ── 1. Compact Header & Micro KPIs ── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[var(--border-base)]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--iba-red-muted)]">
                        <LayoutGrid size={20} className="text-[var(--iba-red)]" />
                    </div>
                    <div>
                        <h1 className="font-display text-2xl text-[var(--text-primary)]">Program Office</h1>
                        <p className="text-xs text-[var(--text-secondary)]">Manage facility bookings & conflicts.</p>
                    </div>
                </div>

                {/* Micro KPIs (Replaces the bulky cards) */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning)] text-xs font-bold">
                        <Clock3 size={12} /> {stats.pending} Pending
                    </div>
                    {stats.conflicts > 0 && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--danger-border)] bg-[var(--danger-bg)] text-[var(--danger)] text-xs font-bold">
                            <AlertTriangle size={12} /> {stats.conflicts} Conflicts
                        </div>
                    )}
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/30 dark:bg-blue-900/20 dark:text-blue-400 text-xs font-bold">
                        <CalendarDays size={12} /> {stats.today} Today
                    </div>
                </div>
            </div>

            {/* ── 2. One-Line Filter Bar ── */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                {/* Left: Tabs */}
                <div className="nav-tabs w-full xl:w-auto overflow-x-auto hide-scrollbar shrink-0">
                    {[
                        { id: "pending", label: "Pending" },
                        { id: "approved", label: "Approved" },
                        { id: "rejected", label: "Rejected" },
                        { id: "cancelled", label: "Cancelled" },
                        { id: "", label: "All Requests" },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            className={`nav-tab text-[13px] ${filterStatus === tab.id ? "active" : ""}`}
                            onClick={() => setFilterStatus(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Right: Search + Dropdown + Refresh */}
                <div className="flex items-center gap-2 w-full xl:w-auto">
                    <div className="input-icon-wrapper flex-1 xl:w-56">
                        <Search size={14} className="input-icon" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-field h-9 py-0 text-xs"
                        />
                    </div>

                    <div className="input-icon-wrapper flex-1 xl:w-48">
                        <Building2 size={14} className="input-icon" />
                        <select
                            value={selectedBuilding}
                            onChange={(e) => setSelectedBuilding(e.target.value)}
                            className="input-field h-9 py-0 text-xs cursor-pointer"
                            style={{ paddingLeft: "2.2rem" }}
                        >
                            <option value="all">All Buildings</option>
                            {buildingsList.map((bld) => (
                                <option key={bld.id} value={bld.id}>
                                    {bld.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={loadBookings}
                        className="btn btn-outline h-9 px-3 gap-1 shrink-0"
                        title="Reload Bookings"
                    >
                        <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                </div>
            </div>

            {/* Quick Clear Filter Indicator */}
            {(searchQuery || selectedBuilding !== "all") && (
                <div className="flex justify-end -mt-2">
                    <button
                        onClick={() => {
                            setSearchQuery("");
                            setSelectedBuilding("all");
                        }}
                        className="text-[10px] font-bold uppercase tracking-wider text-[var(--iba-red)] hover:underline flex items-center gap-1"
                    >
                        <X size={11} /> Clear Filters
                    </button>
                </div>
            )}

            {/* ── 3. Table Workspace ── */}
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
                        {isFetching ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i} className="table-tr">
                                    <td className="table-td py-4">
                                        <div className="skeleton h-4 w-32 mb-1.5" />
                                        <div className="skeleton h-3 w-20" />
                                    </td>
                                    <td className="table-td py-4">
                                        <div className="skeleton h-4 w-24 mb-1.5" />
                                        <div className="skeleton h-3 w-16" />
                                    </td>
                                    <td className="table-td py-4">
                                        <div className="skeleton h-4 w-28 mb-1.5" />
                                        <div className="skeleton h-3 w-24" />
                                    </td>
                                    <td className="table-td py-4">
                                        <div className="skeleton h-4 w-36" />
                                    </td>
                                    <td className="table-td py-4">
                                        <div className="skeleton h-6 w-20 rounded-full" />
                                    </td>
                                    <td className="table-td py-4 text-right">
                                        <div className="skeleton h-8 w-16 ml-auto" />
                                    </td>
                                </tr>
                            ))
                        ) : paginatedItems.length === 0 ? (
                            <tr>
                                <td colSpan={6}>
                                    <div className="empty-state py-12">
                                        <div className="empty-state-icon">
                                            <Inbox size={22} />
                                        </div>
                                        <div>
                                            <h3 className="font-display text-lg mb-1 text-[var(--text-primary)]">
                                                No reservations found
                                            </h3>
                                            <p className="text-xs text-[var(--text-secondary)]">
                                                No booking applications correspond to your search criteria.
                                            </p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            paginatedItems.map((booking) => {
                                const isRowProcessing = processing.id === booking.id;
                                const isConfirming = confirmAction.id === booking.id;
                                const hasConflict = conflictsMap[booking.id];

                                return (
                                    <tr key={booking.id} className="table-tr">
                                        {/* Requester */}
                                        <td className="table-td font-body py-3.5">
                                            <div className="font-bold text-sm text-[var(--text-primary)]">
                                                {booking.users?.name}
                                            </div>
                                            <div className="text-[10px] font-semibold tracking-wider uppercase mt-0.5 text-[var(--text-muted)]">
                                                ERP: {booking.users?.erp}
                                            </div>
                                        </td>

                                        {/* Facility */}
                                        <td className="table-td py-3.5">
                                            <div className="font-bold text-sm flex items-center gap-1.5 text-[var(--iba-red)]">
                                                <Building2 size={13} /> {booking.rooms?.name}
                                            </div>
                                            <div className="text-[11px] font-medium mt-0.5 text-[var(--text-secondary)]">
                                                {booking.rooms?.buildings?.name}
                                            </div>
                                        </td>

                                        {/* Schedule */}
                                        <td className="table-td py-3.5">
                                            <div className="font-semibold text-sm text-[var(--text-primary)]">
                                                {formatDate(booking.date)}
                                            </div>
                                            <div className="text-[11px] font-semibold mt-0.5 flex items-center gap-1 text-[var(--text-muted)]">
                                                <Clock3 size={11} /> {formatTimeSlot(booking.time_slots?.label)}
                                            </div>
                                        </td>

                                        {/* Purpose */}
                                        <td className="table-td py-3.5 max-w-[160px]">
                                            <div
                                                className="truncate text-xs font-medium text-[var(--text-secondary)]"
                                                title={booking.purpose}
                                            >
                                                {booking.purpose || "No justification provided."}
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="table-td py-3.5">
                                            <div className="flex flex-col gap-1.5 items-start">
                                                <StatusBadge status={booking.status} />
                                                {hasConflict && (
                                                    <span className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-[var(--danger)] bg-[var(--danger-bg)] border border-[var(--danger-border)] px-1.5 py-0.5 rounded">
                                                        <AlertTriangle size={10} /> Conflict
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="table-td py-3.5 text-right">
                                            <div className="flex justify-end items-center gap-1.5 min-w-[150px]">
                                                {/* Inspect Info */}
                                                <button
                                                    onClick={() => setSelectedBooking(booking)}
                                                    className="btn btn-ghost p-1.5 h-8 w-8 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye size={15} />
                                                </button>

                                                {/* Inline Confirm */}
                                                {isConfirming ? (
                                                    <div className="flex items-center gap-1 fade-in bg-[var(--danger-bg)] px-1.5 py-1 rounded-md border border-[var(--danger-border)]">
                                                        <span className="text-[9px] font-bold text-[var(--danger)] px-1 uppercase tracking-tight">
                                                            Sure?
                                                        </span>
                                                        <button
                                                            onClick={() =>
                                                                confirmAction.action === "reject"
                                                                    ? executeReject(booking.id)
                                                                    : executeCancel(booking.id)
                                                            }
                                                            disabled={isRowProcessing}
                                                            className="h-6 px-2 rounded bg-[var(--danger)] text-white text-[10px] font-bold hover:opacity-90 transition-opacity min-w-[36px]"
                                                        >
                                                            {isRowProcessing ? (
                                                                <Loader2 size={11} className="animate-spin mx-auto" />
                                                            ) : (
                                                                "Yes"
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmAction({ id: null, action: null })}
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
                                                                    onClick={() => handleApprove(booking.id)}
                                                                    disabled={isRowProcessing}
                                                                    className="h-8 px-2.5 rounded-md bg-[var(--success-bg)] text-[var(--success)] border border-[var(--success-border)] hover:bg-[var(--success)] hover:text-white text-[11px] font-bold transition-all flex items-center justify-center min-w-[65px]"
                                                                >
                                                                    {isRowProcessing &&
                                                                    processing.action === "approve" ? (
                                                                        <Loader2 size={13} className="animate-spin" />
                                                                    ) : (
                                                                        "Approve"
                                                                    )}
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        setConfirmAction({
                                                                            id: booking.id,
                                                                            action: "reject",
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
                                                                        action: "cancel",
                                                                    })
                                                                }
                                                                disabled={isRowProcessing}
                                                                className="h-8 px-3 rounded-md btn-outline text-[11px] font-bold text-red-600 dark:text-red-400 border border-transparent hover:border-red-200"
                                                            >
                                                                Revoke
                                                            </button>
                                                        )}
                                                        {booking.status !== "pending" &&
                                                            booking.status !== "approved" && (
                                                                <span className="text-[11px] text-[var(--text-muted)] font-medium px-2 select-none">
                                                                    Archived
                                                                </span>
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

            {/* ── 4. Pagination ── */}
            {!isFetching && totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                    <span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                        Showing{" "}
                        <span className="font-bold text-[var(--text-primary)]">
                            {(currentPage - 1) * itemsPerPage + 1}
                        </span>{" "}
                        to{" "}
                        <span className="font-bold text-[var(--text-primary)]">
                            {Math.min(currentPage * itemsPerPage, filteredBookings.length)}
                        </span>{" "}
                        of <span className="font-bold text-[var(--text-primary)]">{filteredBookings.length}</span>
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
                            const delta = 1; // neighbours around current page
                            const rangeStart = Math.max(2, currentPage - delta);
                            const rangeEnd = Math.min(totalPages - 1, currentPage + delta);

                            // Always show page 1
                            pages.push(1);

                            // Left ellipsis
                            if (rangeStart > 2) pages.push("...");

                            // Middle range
                            for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);

                            // Right ellipsis
                            if (rangeEnd < totalPages - 1) pages.push("...");

                            // Always show last page
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

            {/* ── 5. Detail Modal ── */}
            {selectedBooking && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm fade-in">
                    <div className="card w-full max-w-lg overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-2xl relative shadow-lg">
                        <div className="bg-[var(--iba-red)] px-6 py-5 text-white relative">
                            <div className="absolute inset-0 bg-brand-pattern opacity-[0.05] pointer-events-none" />
                            <div className="flex items-center justify-between relative z-10">
                                <div>
                                    <span className="text-[10px] font-bold tracking-widest uppercase text-white/70">
                                        App ID: {selectedBooking.id.slice(0, 8)}
                                    </span>
                                    <h3 className="font-display text-xl leading-tight mt-0.5">Booking Details</h3>
                                </div>
                                <button
                                    onClick={() => setSelectedBooking(null)}
                                    className="p-1 rounded-full hover:bg-white/10 text-white transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4 relative">
                            <div className="flex items-start gap-3 p-3.5 rounded-xl border border-[var(--border-base)] bg-[var(--bg-subtle)]">
                                <div className="w-9 h-9 rounded-full bg-white text-[var(--iba-red)] flex items-center justify-center font-bold text-xs shadow-sm">
                                    {selectedBooking.users?.name?.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-[var(--text-primary)]">
                                        {selectedBooking.users?.name}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--text-secondary)]">
                                        <span>ERP: {selectedBooking.users?.erp}</span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--border-strong)]" />
                                        <span className="flex items-center gap-1">
                                            <Mail size={11} /> {selectedBooking.users?.email}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="block text-[10px] uppercase tracking-wider font-bold text-[var(--text-muted)]">
                                        Room
                                    </span>
                                    <div className="text-xs font-bold flex items-center gap-1.5 text-[var(--text-primary)]">
                                        <Building2 size={13} className="text-[var(--iba-red)]" />{" "}
                                        {selectedBooking.rooms?.name}
                                    </div>
                                    <div className="text-[11px] pl-5 text-[var(--text-secondary)]">
                                        {selectedBooking.rooms?.buildings?.name}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <span className="block text-[10px] uppercase tracking-wider font-bold text-[var(--text-muted)]">
                                        Schedule
                                    </span>
                                    <div className="text-xs font-bold flex items-center gap-1.5 text-[var(--text-primary)]">
                                        <CalendarDays size={13} className="text-[var(--iba-red)]" />{" "}
                                        {formatDate(selectedBooking.date)}
                                    </div>
                                    <div className="text-[11px] pl-5 text-[var(--text-secondary)]">
                                        {formatTimeSlot(selectedBooking.time_slots?.label)}
                                    </div>
                                </div>
                            </div>

                            <hr className="divider" />

                            <div className="space-y-1.5">
                                <span className="block text-[10px] uppercase tracking-wider font-bold text-[var(--text-muted)]">
                                    Purpose
                                </span>
                                <div className="p-3 rounded-lg border border-[var(--border-base)] bg-[var(--bg-base)] text-xs text-[var(--text-secondary)] leading-relaxed max-h-32 overflow-y-auto font-medium">
                                    "{selectedBooking.purpose || "No additional parameters provided."}"
                                </div>
                            </div>

                            {conflictsMap[selectedBooking.id] && (
                                <div className="flex items-start gap-2 text-xs p-3 rounded-lg border border-[var(--danger-border)] bg-[var(--danger-bg)] text-[var(--danger)]">
                                    <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
                                    <div>
                                        <span className="font-bold block">Conflict Warning</span>
                                        This slot is already reserved and approved for another activity. You must revoke
                                        the conflicting reservation before approving this request.
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-[var(--bg-subtle)] border-t border-[var(--border-base)] flex items-center justify-between">
                            <StatusBadge status={selectedBooking.status} />

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setSelectedBooking(null)}
                                    className="btn btn-outline py-2 text-xs"
                                >
                                    Close
                                </button>
                                {selectedBooking.status === "pending" && (
                                    <>
                                        <button
                                            onClick={() => executeReject(selectedBooking.id)}
                                            disabled={processing.id === selectedBooking.id}
                                            className="h-9 px-4 rounded-md bg-[var(--danger)] hover:opacity-90 text-white text-xs font-bold transition-all"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleApprove(selectedBooking.id)}
                                            disabled={
                                                processing.id === selectedBooking.id || conflictsMap[selectedBooking.id]
                                            }
                                            className="h-9 px-4 rounded-md bg-[var(--success)] hover:opacity-90 text-white text-xs font-bold transition-all disabled:opacity-50"
                                        >
                                            Approve
                                        </button>
                                    </>
                                )}
                                {selectedBooking.status === "approved" && (
                                    <button
                                        onClick={() => executeCancel(selectedBooking.id)}
                                        disabled={processing.id === selectedBooking.id}
                                        className="h-9 px-4 rounded-md bg-[var(--danger)] hover:opacity-90 text-white text-xs font-bold transition-all"
                                    >
                                        Revoke Booking
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            , document.body)}
        </div>
    );
}
