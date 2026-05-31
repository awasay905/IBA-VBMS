import { useState, useEffect } from "react";
import { getStoredUser, clearToken, clearStoredUser } from "./api";
import LoginPage from "./pages/LoginPage";
import StudentDashboard from "./pages/StudentDashboard";
import PODashboard from "./pages/PODashboard";
import AdminDashboard from "./pages/AdminDashboard";
import { Sun, Moon, LogOut, Building2, User } from "lucide-react";

// ── Dark Mode Hook ────────────────────────────────────────────
function useDarkMode() {
    const [dark, setDark] = useState(() => {
        const stored = localStorage.getItem("iba_dark_mode");
        if (stored !== null) return stored === "true";
        return window.matchMedia("(prefers-color-scheme: dark)").matches;
    });

    useEffect(() => {
        const root = document.documentElement;
        if (dark) root.classList.add("dark");
        else root.classList.remove("dark");
        localStorage.setItem("iba_dark_mode", dark);
    }, [dark]);

    return [dark, setDark];
}

// ── Role Label Map ─────────────────────────────────────────────
const roleLabels = {
    student: "Student",
    admin: "Administrator",
    programoffice: "Program Office",
    po: "Program Office",
};

export default function App() {
    const [user, setUser] = useState(getStoredUser());
    const [dark, setDark] = useDarkMode();

    const handleLogout = () => {
        clearToken();
        clearStoredUser();
        setUser(null);
    };

    if (!user) {
        return <LoginPage onLogin={(userData) => setUser(userData)} dark={dark} setDark={setDark} />;
    }

    // Helper for Initials
    const getInitials = (name) => {
        return name
            ? name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .substring(0, 2)
            : "U";
    };

    return (
        <div
            className="min-h-screen flex flex-col font-body"
            style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
        >
            {/* ── Sticky Header (Updated Height & Color) ────────── */}
            <header
                className="sticky top-0 z-50 w-full transition-all duration-300"
                style={{
                    background: "var(--iba-red)", // Royal Red Background
                    boxShadow: "var(--shadow-lg)",
                }}
            >
                {/* Layer 1: Geometric pattern */}
                <div className="absolute inset-0 bg-brand-pattern opacity-[0.04] pointer-events-none" />

                {/* Layer 2: Soft dark ambient shadow in the bottom corner */}
                {/* <div
                    className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full opacity-[0.15] blur-xl pointer-events-none"
                    style={{ background: "black" }}
                /> */}

                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10">
                    {/* Height changed from h-16 to h-16 lg:h-22 */}
                    <div className="flex items-center justify-between h-16 lg:h-22 my-1 lg:my-0">
                        {/* Logo Area */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-10 h-10 lg:w-11 lg:h-11 rounded-xl bg-white/15 backdrop-blur-md border border-white/20">
                                <Building2 size={22} className="text-white" strokeWidth={1.5} />
                            </div>
                            <div>
                                <div className="font-display text-lg lg:text-xl leading-none text-white">
                                    IBA University
                                </div>
                                <div className="text-[10px] lg:text-[11px] font-bold tracking-[0.15em] uppercase mt-1 text-white/70">
                                    Facility Booking
                                </div>
                            </div>
                        </div>

                        {/* Right Controls */}
                        <div className="flex items-center gap-4">
                            {/* NEW DESIGN: User Profile Badge */}
                            <div className="hidden md:flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full bg-white/10 border border-white/10 hover:bg-white/15 transition-colors cursor-default">
                                {/* Avatar Circle */}
                                <div className="w-8 h-8 rounded-full bg-white text-[var(--iba-red)] flex items-center justify-center font-bold text-xs shadow-sm">
                                    {getInitials(user.name)}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-white leading-tight">
                                        {user.name || "User"}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-medium text-white/60">{user.erp}</span>
                                        <span className="w-1 h-1 rounded-full bg-white/30"></span>
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-white/90 bg-white/20 px-1.5 py-0.5 rounded">
                                            {roleLabels[user.role] || user.role}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions Group */}
                            <div className="flex items-center gap-2 border-l border-white/20 pl-4 ml-2">
                                {/* Dark Mode Toggle */}
                                <button
                                    onClick={() => setDark(!dark)}
                                    className="p-2.5 rounded-full hover:bg-white/10 text-white transition-all"
                                    title={dark ? "Switch to light mode" : "Switch to dark mode"}
                                >
                                    {dark ? <Sun size={19} /> : <Moon size={19} />}
                                </button>

                                {/* Sign Out */}
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-[var(--iba-red)] text-xs font-bold hover:bg-white/90 transition-all active:scale-95 shadow-sm"
                                >
                                    <LogOut size={15} />
                                    <span className="hidden sm:inline">Logout</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Main Content ───────────────────────────────── */}
            <main className="flex-1 w-full max-w-6xl mx-auto px-12 lg:px-10 py-6">
                <div className="page-enter">
                    {user.role === "student" && <StudentDashboard user={user} />}
                    {user.role === "admin" && <AdminDashboard user={user} />}
                    {(user.role === "po" || user.role === "programoffice") && <PODashboard user={user} />}
                </div>
            </main>

            {/* ── Footer ─────────────────────────────────────── */}
            <footer className="py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <span className="text-xs font-medium text-[var(--text-muted)]">
                        © {new Date().getFullYear()} Institute of Business Administration, Karachi
                    </span>
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                            Portal Version 2.0
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
