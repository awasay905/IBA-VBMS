import React, { useState } from "react";
import { api, setToken, setStoredUser } from "../api";
import { ArrowRight, Loader2, Building2, KeyRound, User, Sun, Moon, AlertCircle } from "lucide-react";
import { Toaster, toast } from "sonner";

export default function LoginPage({ onLogin = () => {}, dark, setDark }) {
    const [erp, setErp] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [activeDemo, setActiveDemo] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { access_token, user } = await api.auth.login(erp, password);
            setToken(access_token);
            setStoredUser(user);
            toast.success(`Welcome back, ${user.name || "User"}!`);
            setTimeout(() => onLogin(user), 400);
        } catch (err) {
            toast.error(err.message || "Authentication failed. Please verify your credentials.");
        } finally {
            setLoading(false);
        }
    };

    const handleDemoClick = (role, user, pass) => {
        setErp(user);
        setPassword(pass);
        setActiveDemo(role);
    };

    const demoAccounts = [
        { role: "Admin", label: "Administrator", user: "test-admin", pass: "testpass" },
        { role: "Student", label: "Student", user: "test-student", pass: "testpass" },
        { role: "PO", label: "Program Office", user: "test-po", pass: "testpass" },
    ];

    return (
        <div
            className="min-h-screen w-full flex font-body"
            style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
        >
            <Toaster position="top-center" richColors />

            {/* ── Left Branding Panel ───────────────────────── */}
            <div
                className="hidden lg:flex flex-col justify-between w-[420px] xl:w-[480px] flex-shrink-0 relative overflow-hidden p-12"
                style={{ background: "var(--iba-red)" }}
            >
                {/* Subtle pattern overlay */}
                <div
                    className="absolute inset-0 opacity-[0.06]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                />
                <div
                    className="absolute bottom-0 right-0 w-72 h-72 rounded-full opacity-10 -mb-16 -mr-16"
                    style={{ background: "rgba(0,0,0,0.5)" }}
                />

                {/* Logo */}
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
                            <Building2 size={20} className="text-white" strokeWidth={1.75} />
                        </div>
                        <div>
                            <div className="font-display text-xl text-white leading-none">IBA University</div>
                            <div className="text-[10px] text-white/60 font-semibold tracking-widest uppercase mt-0.5">
                                Karachi
                            </div>
                        </div>
                    </div>
                </div>

                {/* Headline */}
                <div className="relative z-10">
                    <h1 className="font-display text-5xl xl:text-6xl text-white leading-[1.08] mb-6">
                        Reserve
                        <br />
                        your
                        <br />
                        <span className="italic text-white/80">space.</span>
                    </h1>
                    <p className="text-white/65 text-base leading-relaxed max-w-xs font-light">
                        The official portal for booking lecture halls, seminar rooms, labs, and campus facilities.
                    </p>

                    {/* Feature list */}
                    <div className="mt-10 space-y-3">
                        {["Instant booking requests", "Real-time availability", "Multi-role access control"].map(
                            (f) => (
                                <div key={f} className="flex items-center gap-2.5 text-white/70 text-sm font-medium">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white/50 flex-shrink-0" />
                                    {f}
                                </div>
                            ),
                        )}
                    </div>
                </div>

                <div className="relative z-10 text-white/40 text-xs font-medium">
                    © {new Date().getFullYear()} Institute of Business Administration
                </div>
            </div>

            {/* ── Right Form Panel ─────────────────────────── */}
            <div className="flex-1 flex flex-col" style={{ background: "var(--bg-base)" }}>
                {/* Top bar */}
                <div className="flex justify-between items-center px-6 sm:px-10 py-4">
                    {/* Mobile logo */}
                    <div className="flex items-center gap-2 lg:hidden">
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: "var(--iba-red)" }}
                        >
                            <Building2 size={15} className="text-white" />
                        </div>
                        <span className="font-display text-sm" style={{ color: "var(--text-primary)" }}>
                            IBA University
                        </span>
                    </div>
                    <div className="hidden lg:block" />

                    {/* Dark mode toggle */}
                    <button
                        onClick={() => setDark?.(!dark)}
                        className="btn btn-ghost p-2 rounded-lg"
                        style={{ color: "var(--text-secondary)" }}
                        title={dark ? "Light mode" : "Dark mode"}
                    >
                        {dark ? <Sun size={17} /> : <Moon size={17} />}
                    </button>
                </div>

                {/* Form */}
                <div className="flex-1 flex items-center justify-center px-6 sm:px-12 py-8">
                    <div className="w-full max-w-[400px]">
                        <div className="mb-10">
                            <h2 className="font-display text-3xl mb-2" style={{ color: "var(--text-primary)" }}>
                                Welcome back
                            </h2>
                            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                                Sign in to your IBA Facility Portal account.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* ERP Field */}
                            <div>
                                <label className="label" style={{ color: "var(--text-secondary)" }}>
                                    ERP ID / Username
                                </label>
                                <div className="input-icon-wrapper">
                                    <User size={16} className="input-icon" />
                                    <input
                                        type="text"
                                        value={erp}
                                        onChange={(e) => setErp(e.target.value)}
                                        placeholder="e.g. 12345"
                                        required
                                        disabled={loading}
                                        className="input-field"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div>
                                <label className="label" style={{ color: "var(--text-secondary)" }}>
                                    Password
                                </label>
                                <div className="input-icon-wrapper">
                                    <KeyRound size={16} className="input-icon" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        required
                                        disabled={loading}
                                        className="input-field"
                                    />
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading || !erp || !password}
                                className="btn btn-primary w-full py-3 text-sm mt-2"
                                style={{ marginTop: "1.25rem" }}
                            >
                                {loading ? (
                                    <>
                                        <div className="spinner w-4 h-4" />
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        Sign In to Portal
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Demo Credentials */}
                        <div className="mt-10 pt-8" style={{ borderTop: "1px solid var(--border-base)" }}>
                            <p
                                className="text-xs font-semibold uppercase tracking-wider mb-3"
                                style={{ color: "var(--text-muted)" }}
                            >
                                Quick access — test accounts
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {demoAccounts.map((demo) => (
                                    <button
                                        key={demo.role}
                                        type="button"
                                        onClick={() => handleDemoClick(demo.role, demo.user, demo.pass)}
                                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                        style={{
                                            background:
                                                activeDemo === demo.role ? "var(--iba-red)" : "var(--bg-surface)",
                                            color: activeDemo === demo.role ? "white" : "var(--text-secondary)",
                                            border: `1px solid ${activeDemo === demo.role ? "var(--iba-red)" : "var(--border-base)"}`,
                                        }}
                                    >
                                        {demo.label}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs mt-3 font-medium" style={{ color: "var(--text-muted)" }}>
                                Password for all test accounts:{" "}
                                <code
                                    className="font-mono px-1 py-0.5 rounded text-xs"
                                    style={{ background: "var(--bg-muted)", color: "var(--text-secondary)" }}
                                >
                                    testpass
                                </code>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
