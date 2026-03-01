"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { Shield, Bell, Palette, Lock, Check } from "lucide-react";

export default function SettingsPage() {
    const supabase = createClient();
    const [notifications, setNotifications] = useState(true);
    const [darkMode] = useState(true); // always dark
    const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
    const [pwStatus, setPwStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [pwError, setPwError] = useState("");

    async function handleChangePassword(e: React.FormEvent) {
        e.preventDefault();
        if (pwForm.next !== pwForm.confirm) { setPwError("Passwords don't match."); return; }
        if (pwForm.next.length < 8) { setPwError("Password must be at least 8 characters."); return; }
        setPwStatus("loading");
        setPwError("");
        const { error } = await supabase.auth.updateUser({ password: pwForm.next });
        if (error) {
            setPwError(error.message);
            setPwStatus("error");
        } else {
            setPwStatus("success");
            setPwForm({ current: "", next: "", confirm: "" });
            setTimeout(() => setPwStatus("idle"), 3000);
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 py-2">
            <div>
                <h1 className="text-2xl font-bold text-white">Settings</h1>
                <p className="text-muted text-sm mt-1">Manage your preferences and account security.</p>
            </div>

            {/* UI Preferences */}
            <div className="glass-panel p-6 space-y-4">
                <h2 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-2">
                    <Palette className="w-4 h-4" /> Preferences
                </h2>

                <div className="flex items-center justify-between py-3 border-b border-border">
                    <div>
                        <p className="text-white text-sm font-medium">Dark Mode</p>
                        <p className="text-muted text-xs">PolyLens AI uses an optimised dark theme</p>
                    </div>
                    <div className="w-10 h-6 rounded-full bg-primary/30 border border-primary/50 flex items-center px-1 cursor-not-allowed">
                        <div className="w-4 h-4 rounded-full bg-primary translate-x-4 transition-transform" />
                    </div>
                </div>

                <div className="flex items-center justify-between py-3">
                    <div>
                        <p className="text-white text-sm font-medium">Email Notifications</p>
                        <p className="text-muted text-xs">Receive alerts and platform updates</p>
                    </div>
                    <button
                        onClick={() => setNotifications(n => !n)}
                        className={`w-10 h-6 rounded-full border flex items-center px-1 transition-colors ${notifications ? "bg-primary/30 border-primary/50" : "bg-white/5 border-border"}`}
                    >
                        <div className={`w-4 h-4 rounded-full transition-transform ${notifications ? "bg-primary translate-x-4" : "bg-muted translate-x-0"}`} />
                    </button>
                </div>
            </div>

            {/* Notifications */}
            <div className="glass-panel p-6 space-y-4">
                <h2 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-2">
                    <Bell className="w-4 h-4" /> Alerts
                </h2>
                <p className="text-muted text-sm">Market alert preferences and watchlist notifications are coming soon in a future release.</p>
                <div className="flex items-center gap-2 text-primary text-xs font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
                    Coming soon
                </div>
            </div>

            {/* Security */}
            <div className="glass-panel p-6 space-y-4">
                <h2 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Security
                </h2>

                <form onSubmit={handleChangePassword} className="space-y-3">
                    <div>
                        <label className="block text-xs text-muted mb-1 flex items-center gap-1">
                            <Lock className="w-3 h-3" /> New Password
                        </label>
                        <input
                            type="password"
                            value={pwForm.next}
                            onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
                            placeholder="At least 8 characters"
                            className="w-full px-3 py-2 bg-background border border-border rounded-md text-white text-sm placeholder-muted focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-muted mb-1">Confirm New Password</label>
                        <input
                            type="password"
                            value={pwForm.confirm}
                            onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                            placeholder="Repeat password"
                            className="w-full px-3 py-2 bg-background border border-border rounded-md text-white text-sm placeholder-muted focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        />
                    </div>
                    {pwError && <p className="text-red-400 text-xs">{pwError}</p>}
                    {pwStatus === "success" && (
                        <p className="text-positive text-xs flex items-center gap-1"><Check className="w-3 h-3" /> Password updated successfully.</p>
                    )}
                    <button
                        type="submit"
                        disabled={pwStatus === "loading" || !pwForm.next}
                        className="px-5 py-2 bg-primary text-background rounded-md font-semibold text-xs hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        {pwStatus === "loading" ? "Updating…" : "Update Password"}
                    </button>
                </form>
            </div>
        </div>
    );
}
