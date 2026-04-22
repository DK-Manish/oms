"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, clearToken, getToken } from "./lib/api";

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;
type Status = (typeof STATUSES)[number];

interface User { id: number; name: string; email: string }
interface Order {
  id: number;
  customer_name: string;
  item: string;
  quantity: number;
  price: string;
  status: string;
  created_at: string;
  created_by: User;
}
interface PaginatedOrders { items: Order[]; total: number; page: number; pages: number; limit: number }
interface FormState { customer_name: string; item: string; quantity: string; price: string }

const emptyForm: FormState = { customer_name: "", item: "", quantity: "", price: "" };

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [paginated, setPaginated] = useState<PaginatedOrders | null>(null);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    if (!getToken()) { router.replace("/login"); return; }
    apiFetch("/auth/me").then((r) => r.json()).then(setUser).catch(() => router.replace("/login"));
  }, [router]);

  const fetchOrders = async (p = page) => {
    try {
      const res = await apiFetch(`/orders?page=${p}&limit=5`);
      if (res.ok) setPaginated(await res.json());
    } catch { /* handled by apiFetch */ }
  };

  useEffect(() => { if (user) fetchOrders(page); }, [user, page]);

  const logout = () => { clearToken(); router.replace("/login"); };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await apiFetch("/orders", {
        method: "POST",
        body: JSON.stringify({
          customer_name: form.customer_name,
          item: form.item,
          quantity: Number(form.quantity),
          price: Number(form.price),
        }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail ?? "Failed"); }
      setMessage({ type: "success", text: "Order placed successfully!" });
      setForm(emptyForm);
      setPage(1);
      fetchOrders(1);
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (orderId: number, status: Status) => {
    setUpdatingId(orderId);
    try {
      await apiFetch(`/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      fetchOrders(page);
    } finally {
      setUpdatingId(null);
    }
  };

  const statusColor: Record<string, string> = {
    pending: "#854d0e",
    processing: "#1e40af",
    shipped: "#065f46",
    delivered: "#166534",
    cancelled: "#991b1b",
  };
  const statusBg: Record<string, string> = {
    pending: "#fef9c3",
    processing: "#dbeafe",
    shipped: "#d1fae5",
    delivered: "#bbf7d0",
    cancelled: "#fee2e2",
  };

  if (!user) return null;

  return (
    <div className="container">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
        <h1>Order Management System</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontSize: "0.9rem", color: "#555" }}>Hello, <strong>{user.name}</strong></span>
          <button className="btn btn-outline" onClick={logout}>Logout</button>
        </div>
      </div>
      <p className="subtitle">Place orders and track them in real time.</p>

      {/* Order Form */}
      <div className="card">
        <h2>Place a New Order</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="customer_name">Customer Name</label>
              <input id="customer_name" name="customer_name" placeholder="Alice" value={form.customer_name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="item">Item</label>
              <input id="item" name="item" placeholder="Laptop" value={form.item} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="quantity">Quantity</label>
              <input id="quantity" name="quantity" type="number" min="1" placeholder="1" value={form.quantity} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="price">Price ($)</label>
              <input id="price" name="price" type="number" min="0.01" step="0.01" placeholder="99.99" value={form.price} onChange={handleChange} required />
            </div>
          </div>
          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? "Placing…" : "Place Order"}
          </button>
          {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}
        </form>
      </div>

      {/* Orders Table */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ marginBottom: 0 }}>All Orders</h2>
          {paginated && (
            <span style={{ fontSize: "0.85rem", color: "#888" }}>
              {paginated.total} total order{paginated.total !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {!paginated || paginated.items.length === 0 ? (
          <p className="empty">No orders yet. Place one above.</p>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Customer</th>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Placed By</th>
                  <th>Status</th>
                  <th>Placed At</th>
                </tr>
              </thead>
              <tbody>
                {paginated.items.map((o) => (
                  <tr key={o.id}>
                    <td>{o.id}</td>
                    <td>{o.customer_name}</td>
                    <td>{o.item}</td>
                    <td>{o.quantity}</td>
                    <td>${Number(o.price).toFixed(2)}</td>
                    <td style={{ fontSize: "0.82rem", color: "#666" }}>{o.created_by.name}</td>
                    <td>
                      <select
                        className="status-select"
                        value={o.status}
                        disabled={updatingId === o.id}
                        style={{ background: statusBg[o.status] ?? "#f3f4f6", color: statusColor[o.status] ?? "#374151" }}
                        onChange={(e) => handleStatusChange(o.id, e.target.value as Status)}
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td>{new Date(o.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="pagination">
              <button className="page-btn" onClick={() => setPage(page - 1)} disabled={page === 1}>← Prev</button>
              <span className="page-info">Page {paginated.page} of {paginated.pages}</span>
              <button className="page-btn" onClick={() => setPage(page + 1)} disabled={page >= paginated.pages}>Next →</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
