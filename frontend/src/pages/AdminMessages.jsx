import { useEffect, useState } from "react";
import api from "../api/axios";
import DashboardLayout from "../components/DashboardLayout";

const ADMIN_LINKS = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/hosts", label: "Hosts" },
  { to: "/admin/properties", label: "Properties" },
  { to: "/admin/bookings", label: "Bookings" },
  { to: "/admin/reviews", label: "Reviews" },
  { to: "/admin/messages", label: "Contact Messages" },
  { to: "/admin/logs", label: "Activity Logs" },
];

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadMessages();
  }, []);

  function loadMessages() {
    setLoading(true);
    api.get("/admin/messages.php")
      .then((res) => {
        if (res.data.status === "success") setMessages(res.data.messages);
        else setError(res.data.message);
      })
      .catch(() => setError("Unable to connect to the server. Please try again."))
      .finally(() => setLoading(false));
  }

  async function markAsRead(messageId) {
    try {
      const res = await api.post("/admin/messages.php", { message_id: messageId });
      if (res.data.status === "success") {
        setMessages((prev) => prev.map((m) => (m.message_id === messageId ? { ...m, status: "read" } : m)));
      }
    } catch (err) {
      setError("Unable to connect to the server. Please try again.");
    }
  }

  return (
    <DashboardLayout links={ADMIN_LINKS}>
      <h2>Contact Messages</h2>
      {error && <div className="alert alert-error">{error}</div>}
      {loading ? (
        <p>Loading...</p>
      ) : messages.length === 0 ? (
        <p>No messages yet.</p>
      ) : (
        messages.map((m) => (
          <div
            key={m.message_id}
            style={{
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius)",
              padding: 14,
              marginBottom: 10,
              background: m.status === "unread" ? "var(--color-bg-soft)" : "transparent",
            }}
          >
            <strong>{m.name}</strong> · {m.email}
            <p style={{ margin: "6px 0" }}>{m.message}</p>
            <p style={{ fontSize: 12, color: "var(--color-text-light)", margin: "4px 0" }}>
              {new Date(m.created_at).toLocaleString()} · {m.status}
            </p>
            {m.status === "unread" && (
              <button className="btn-link" onClick={() => markAsRead(m.message_id)}>Mark as read</button>
            )}
          </div>
        ))
      )}
    </DashboardLayout>
  );
}
