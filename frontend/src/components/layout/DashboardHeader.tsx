import { useRef, useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../hooks/useTheme";

export function DashboardHeader() {
    const { user, logout } = useAuth();
    const { mode, toggle } = useTheme();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!showUserMenu) return;
        function handleClickOutside(e: MouseEvent) {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setShowUserMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showUserMenu]);

    if (!user) return null;

    const initials =
        (user.firstName?.[0] ?? "").toUpperCase() + (user.lastName?.[0] ?? "").toUpperCase();

    return (
        <header className="relative z-30 flex h-16 flex-shrink-0 items-center justify-between border-b border-senti-border bg-senti-dark/70 px-4 backdrop-blur md:px-6">
            <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-senti-muted">Projects</span>
                <span className="hidden text-xs text-senti-muted md:inline">• Create & manage brand keywords</span>
            </div>
            <div className="flex items-center gap-3">
                <button
                    onClick={() => void logout()}
                    className="flex items-center gap-2 rounded-lg border border-senti-border/50 bg-senti-dark/50 px-3 py-1.5 text-xs font-medium text-senti-muted transition-colors hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-300"
                    title="Logout"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    <span className="hidden sm:inline">Logout</span>
                </button>
                <div ref={userMenuRef} className="relative flex items-center gap-3">
                    <button
                        onClick={toggle}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-senti-dark/50 border border-senti-border text-senti-text transition-colors hover:bg-senti-card"
                        title={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {mode === 'dark' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
                        )}
                    </button>
                    <div className="hidden text-right text-xs leading-tight sm:block">
                        <div className="font-medium text-senti-text">
                            {user.firstName} {user.lastName ?? ""}
                        </div>
                        <div className="text-senti-muted">{user.email}</div>
                    </div>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowUserMenu((open) => !open);
                        }}
                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-senti-purple/30 text-sm font-semibold text-white ring-senti-purple/50 transition hover:ring-2"
                        aria-expanded={showUserMenu}
                        aria-haspopup="true"
                    >
                        {initials || "U"}
                    </button>
                    {showUserMenu && (
                        <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-senti-border bg-senti-card shadow-xl ring-1 ring-black/10">
                            <div className="p-1">
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setShowUserMenu(false);
                                        window.dispatchEvent(new CustomEvent('open-profile-modal'));
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-senti-text hover:bg-senti-card"
                                >
                                    Profile
                                </button>
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setShowUserMenu(false);
                                        void logout();
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-300 hover:bg-red-500/10"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
