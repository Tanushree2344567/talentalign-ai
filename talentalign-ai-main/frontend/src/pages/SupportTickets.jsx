import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import "./SupportTickets.css";

const STATUS_COLORS = {
  open: { bg: "#dbeafe", color: "#1d4ed8", label: "Open" },
  in_progress: { bg: "#fef3c7", color: "#d97706", label: "In Progress" },
  resolved: { bg: "#dcfce7", color: "#15803d", label: "Resolved" },
  closed: { bg: "#f1f5f9", color: "#64748b", label: "Closed" },
};

const PRIORITY_COLORS = {
  low: { bg: "#f0fdf4", color: "#16a34a" },
  medium: { bg: "#fffbeb", color: "#d97706" },
  high: { bg: "#fef2f2", color: "#dc2626" },
};

const SupportTickets = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priority: "medium" });
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = () => {
    api.get("/support/tickets")
      .then((res) => setTickets(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.description.trim()) return;
    setSubmitting(true);
    try {
      await api.post("/support/tickets", form);
      setForm({ title: "", description: "", priority: "medium" });
      setShowForm(false);
      fetchTickets();
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    await api.patch(`/support/tickets/${id}`, { status });
    fetchTickets();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this ticket?")) return;
    await api.delete(`/support/tickets/${id}`);
    fetchTickets();
  };

  return (
    <div className="tickets-page">
      <Navbar />
      <div className="tickets-content">

        {/* Header */}
        <div className="tickets-header">
          <div>
            <h1>Support Tickets</h1>
            <p>Track and manage your support requests</p>
          </div>
          <div className="tickets-header-actions">
            <button className="btn-back" onClick={() => navigate("/dashboard")}>← Dashboard</button>
            <button className="btn-new-ticket" onClick={() => setShowForm(!showForm)}>
              + New Ticket
            </button>
          </div>
        </div>

        {/* Create Ticket Form */}
        {showForm && (
          <div className="ticket-form-card">
            <h3>Create New Ticket</h3>
            <input
              className="ticket-input"
              placeholder="Issue title..."
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <textarea
              className="ticket-textarea"
              placeholder="Describe your issue in detail..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
            />
            <div className="ticket-form-row">
              <select
                className="ticket-select"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <div className="ticket-form-btns">
                <button className="btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn-submit" onClick={handleCreate} disabled={submitting}>
                  {submitting ? "Creating..." : "Create Ticket"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="tickets-loading">
            <div className="spinner" />
            <p>Loading tickets...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && tickets.length === 0 && (
          <div className="tickets-empty">
            <div className="tickets-empty-icon">🎫</div>
            <h3>No support tickets yet</h3>
            <p>Use the chat widget or create a ticket if you need help.</p>
          </div>
        )}

        {/* Tickets List */}
        {!loading && tickets.length > 0 && (
          <div className="tickets-list">
            {tickets.map((t) => {
              const status = STATUS_COLORS[t.status] || STATUS_COLORS.open;
              const priority = PRIORITY_COLORS[t.priority] || PRIORITY_COLORS.medium;
              return (
                <div key={t.id} className="ticket-card">
                  <div className="ticket-card-top">
                    <div className="ticket-card-left">
                      <div className="ticket-id">#{t.id}</div>
                      <div className="ticket-title">{t.title}</div>
                      <div className="ticket-desc">{t.description}</div>
                    </div>
                    <div className="ticket-card-right">
                      <span className="ticket-badge" style={{ background: status.bg, color: status.color }}>
                        {status.label}
                      </span>
                      <span className="ticket-badge" style={{ background: priority.bg, color: priority.color }}>
                        {t.priority} priority
                      </span>
                    </div>
                  </div>
                  <div className="ticket-card-bottom">
                    <span className="ticket-date">
                      {new Date(t.created_at).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric"
                      })}
                    </span>
                    <div className="ticket-actions">
                      <select
                        className="ticket-status-select"
                        value={t.status}
                        onChange={(e) => handleStatusChange(t.id, e.target.value)}
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                      <button className="btn-delete-ticket" onClick={() => handleDelete(t.id)}>
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default SupportTickets;
