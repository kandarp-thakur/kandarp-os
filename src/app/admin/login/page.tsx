"use client";

/**
 * Login page — the single public admin route.
 *
 * A centered glass card with email/password fields, a remember-me checkbox,
 * and a forgot-password link. On submit, POSTs to /api/admin/auth/login.
 * On success, redirects to the `next` param (or /admin).
 *
 * Wrapped in <Suspense> because useSearchParams() requires it in Next.js 14.
 */

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
                </div>
            }
        >
            <LoginForm />
        </Suspense>
    );
}

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const next = searchParams.get("next") ?? "/admin";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [totpChallenge, setTotpChallenge] = useState<string | null>(null);
    const [totpCode, setTotpCode] = useState("");
    const [remember, setRemember] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const res = await fetch("/api/admin/auth/login", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ email, password, remember }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.error ?? "Login failed. Please try again.");
                setLoading(false);
                return;
            }

            const data = await res.json();
            if (data.requiresTotp && typeof data.challenge === "string") {
                setTotpChallenge(data.challenge);
                setError(null);
                setLoading(false);
                return;
            }

            router.push(next);
            router.refresh();
        } catch {
            setError("Network error. Please check your connection.");
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {/* Brand */}
                <div className="mb-8 flex flex-col items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-gradient)] text-lg font-bold text-white shadow-lg">
                        K
                    </div>
                    <div className="text-center">
                        <h1 className="text-lg font-semibold text-[var(--text-primary)]">
                            Kandarp OS
                        </h1>
                        <p className="text-sm text-[var(--text-tertiary)]">
                            Engineering Console
                        </p>
                    </div>
                </div>

                {/* Login card */}
                <div className="admin-glass rounded-2xl p-6">
                    <h2 className="mb-1 text-base font-semibold text-[var(--text-primary)]">
                        Sign in to your account
                    </h2>
                    <p className="mb-5 text-sm text-[var(--text-tertiary)]">
                        Enter your credentials to access the console.
                    </p>

                    {error && (
                        <div className="mb-4 flex items-start gap-2 rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 px-3 py-2.5 text-sm text-[var(--error)]">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {totpChallenge ? (
                        <form
                            onSubmit={async (event) => {
                                event.preventDefault();
                                setLoading(true);
                                setError(null);
                                try {
                                    const res = await fetch(
                                        "/api/admin/auth/verify-totp",
                                        {
                                            method: "POST",
                                            headers: {
                                                "content-type":
                                                    "application/json",
                                            },
                                            body: JSON.stringify({
                                                challenge: totpChallenge,
                                                code: totpCode,
                                            }),
                                        },
                                    );
                                    if (!res.ok) {
                                        const data = await res
                                            .json()
                                            .catch(() => ({}));
                                        setError(
                                            data.error ??
                                                "Invalid authenticator code.",
                                        );
                                        return;
                                    }
                                    router.push(next);
                                    router.refresh();
                                } catch {
                                    setError(
                                        "Network error. Please try again.",
                                    );
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            className="space-y-4"
                        >
                            <p className="text-sm text-[var(--text-secondary)]">
                                Enter the six-digit code from your authenticator
                                app.
                            </p>
                            <input
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                pattern="[0-9]{6}"
                                maxLength={6}
                                value={totpCode}
                                onChange={(event) =>
                                    setTotpCode(event.target.value)
                                }
                                required
                                autoFocus
                                className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--canvas-elevated)] px-3.5 py-2.5 text-center text-lg tracking-[0.4em] text-[var(--text-primary)] outline-none focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--accent-subtle)]"
                                placeholder="000000"
                            />
                            <button
                                type="submit"
                                disabled={loading || totpCode.length !== 6}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent-gradient)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                            >
                                {loading && (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                )}
                                Verify code
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setTotpChallenge(null);
                                    setTotpCode("");
                                    setError(null);
                                }}
                                className="w-full text-sm text-[var(--accent-solid)] hover:underline"
                            >
                                Back to sign in
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                    autoFocus
                                    className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--canvas-elevated)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-quaternary)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--accent-subtle)]"
                                    placeholder="you@example.com"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        required
                                        autoComplete="current-password"
                                        className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--canvas-elevated)] px-3.5 py-2.5 pr-10 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-quaternary)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--accent-subtle)]"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword((s) => !s)
                                        }
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                    <input
                                        type="checkbox"
                                        checked={remember}
                                        onChange={(e) =>
                                            setRemember(e.target.checked)
                                        }
                                        className="h-4 w-4 rounded border-[var(--border-default)] accent-[var(--accent-solid)]"
                                    />
                                    Remember me
                                </label>
                                <button
                                    type="button"
                                    onClick={() =>
                                        router.push("/admin/login?forgot=1")
                                    }
                                    className="text-sm text-[var(--accent-solid)] hover:underline"
                                >
                                    Forgot password?
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent-gradient)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                            >
                                {loading && (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                )}
                                {loading ? "Signing in…" : "Sign in"}
                            </button>
                        </form>
                    )}
                </div>

                <p className="mt-6 text-center text-xs text-[var(--text-quaternary)]">
                    Default: admin@kandarp.online / ChangeMe!2026
                </p>
            </div>
        </div>
    );
}
