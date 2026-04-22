"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API, setToken } from "../lib/api";

type Tab = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let res: Response;

      if (tab === "register") {
        res = await fetch(`${API}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
        });
      } else {
        const fd = new URLSearchParams();
        fd.append("username", form.email);
        fd.append("password", form.password);
        res = await fetch(`${API}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: fd,
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? "Something went wrong");
      }

      const data = await res.json();
      setToken(data.access_token);
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 style={{ marginBottom: "0.25rem" }}>Order Management System</h1>
        <p className="subtitle">Sign in to place and track orders.</p>

        <div className="tabs">
          <button className={tab === "login" ? "tab active" : "tab"} onClick={() => setTab("login")}>
            Login
          </button>
          <button className={tab === "register" ? "tab active" : "tab"} onClick={() => setTab("register")}>
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {tab === "register" && (
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input id="name" name="name" placeholder="Alice" value={form.name} onChange={handleChange} required />
            </div>
          )}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" placeholder="alice@example.com" value={form.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" placeholder="••••••" value={form.password} onChange={handleChange} required minLength={6} />
          </div>

          {error && <div className="alert alert-error" style={{ marginTop: "0.75rem" }}>{error}</div>}

          <button className="btn" type="submit" disabled={loading} style={{ width: "100%", marginTop: "1.25rem" }}>
            {loading ? "Please wait…" : tab === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
