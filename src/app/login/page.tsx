"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/toast";
import Spinner from "@/components/spinner";

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-line" style={{ width: "40%", height: 18, marginBottom: 10 }} />
      <div className="skeleton-line" style={{ width: "65%", marginBottom: 26 }} />
      <div className="skeleton-line" style={{ width: "100%", height: 40, marginBottom: 12, borderRadius: 8 }} />
      <div className="skeleton-line" style={{ width: "100%", height: 40, marginBottom: 20, borderRadius: 8 }} />
      <div className="skeleton-line" style={{ width: "100%", height: 40, borderRadius: 8 }} />
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { login, register, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return; // guard against double-click
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      showToast("Logged in successfully", "success");
      router.push("/books");
    } catch (err: any) {
      setError(err.message);
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);
    try {
      await register(name, email, password);
      showToast("Account created", "success");
      router.push("/");
    } catch (err: any) {
      setError(err.message);
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-shell">
      {/* Left: brand visual */}
      <div className="login-visual">
        <div className="glow" />
        <div className="stack">
          <span className="book-bar" />
          <span className="book-bar" />
          <span className="book-bar" />
          <span className="book-bar" />
          <span className="book-bar" />
        </div>
        <h1>Book Store</h1>
        <p>
          Browse titles, manage your cart, and track orders — all from one
          simple, fast dashboard.
        </p>
      </div>

      {/* Right: form */}
      <div className="login-panel">
        {authLoading ? (
          <SkeletonCard />
        ) : (
          <div className="auth-card">
            <h2>{tab === "login" ? "Welcome back" : "Create your account"}</h2>
            <p className="sub">
              {tab === "login"
                ? "Login to continue browsing books."
                : "Sign up to start shopping."}
            </p>

            <div className="tabs" data-active={tab}>
              <div className="tab-slider" />
              <button
                type="button"
                className={`tab-btn ${tab === "login" ? "active" : ""}`}
                onClick={() => setTab("login")}
              >
                Login
              </button>
              <button
                type="button"
                className={`tab-btn ${tab === "register" ? "active" : ""}`}
                onClick={() => setTab("register")}
              >
                Register
              </button>
            </div>

            {tab === "login" ? (
              <form onSubmit={handleLogin} className="form-col">
                <div className="field">
                  <MailIcon />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <LockIcon />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting && <Spinner />}
                  {submitting ? "Logging in..." : "Login"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="form-col">
                <div className="field">
                  <UserIcon />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <MailIcon />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <LockIcon />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting && <Spinner />}
                  {submitting ? "Creating..." : "Create Account"}
                </button>
              </form>
            )}

            {error && <p className="field-error">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}