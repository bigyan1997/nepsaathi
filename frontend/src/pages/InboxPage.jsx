import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getConversations } from "../api/messages";
import useAuthStore from "../store/authStore";
import api from "../utils/axios";
import { registerPushSubscription } from "../hooks/usePushNotifications";

function PushDebugButton() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post("/api/users/push/test/");
      setResult({ ok: true, data: res.data });
    } catch (err) {
      setResult({ ok: false, data: err.response?.data || { error: err.message } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: "right" }}>
      <button
        onClick={handleTest}
        disabled={loading}
        style={{ fontSize: 11, color: "#888", background: "none", border: "1px solid #ddd", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}
      >
        {loading ? "Sending…" : "Test push"}
      </button>
      {result && (
        <div style={{ fontSize: 11, marginTop: 4, color: result.ok ? "#166534" : "#A32D2D" }}>
          {result.ok
            ? `✓ Sent (${result.data.subscriptions} subscription${result.data.subscriptions !== 1 ? "s" : ""})`
            : `✗ ${result.data.error}`}
        </div>
      )}
    </div>
  );
}

function NotificationBanner() {
  const [permission, setPermission] = useState(
    "Notification" in window ? Notification.permission : "granted"
  );

  if (permission === "granted") return null;

  const handleEnable = async () => {
    if (permission === "default") {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") {
        await registerPushSubscription();
      }
    } else {
      // denied — open browser settings guidance
      alert("To enable notifications, click the lock icon in your browser address bar → Notifications → Allow.");
    }
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      background: "#F8F7FF", border: "0.5px solid #C8C4EE", borderRadius: 10,
      padding: "10px 14px", marginBottom: 20,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 18 }}>🔔</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#26215C" }}>Enable message notifications</div>
          <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
            {permission === "denied"
              ? "Notifications are blocked — update your browser settings to allow them."
              : "Get notified when you receive a new message, even with the tab closed."}
          </div>
        </div>
      </div>
      <button
        onClick={handleEnable}
        style={{
          flexShrink: 0, background: "#534AB7", color: "#fff", border: "none",
          borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
        }}
      >
        {permission === "denied" ? "How to enable" : "Enable"}
      </button>
    </div>
  );
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function InboxPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(!document.hidden);
  useEffect(() => {
    const handler = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: getConversations,
    refetchInterval: visible ? 5000 : false,
  });

  // Derive the total unread count from the conversation list (already polling every 5s)
  // and push it into the shared Navbar cache so the badge updates without a separate API call.
  useEffect(() => {
    if (!isLoading) {
      const total = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);
      queryClient.setQueryData(["unread-count"], { unread_count: total });
    }
  }, [conversations, isLoading]);

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#26215C", margin: 0 }}>
          Messages
        </h1>
        <PushDebugButton />
      </div>

      <NotificationBanner />

      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 72, borderRadius: 12, background: "#e8e8e8", animation: "pulse 1.5s infinite" }} />
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#888" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#26215C", marginBottom: 6 }}>No messages yet</div>
          <div style={{ fontSize: 13 }}>When you message someone about a listing, it'll appear here.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {conversations.map((convo) => {
            const other = convo.other_user;
            const last = convo.last_message;
            const unread = convo.unread_count > 0;

            return (
              <button
                key={convo.id}
                onClick={() => navigate(`/messages/${convo.id}`)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 16px",
                  background: unread ? "#EEEDFE" : "#fff",
                  border: `1px solid ${unread ? "#AFA9EC" : "#f0f0f0"}`,
                  borderRadius: 12,
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => { if (!unread) e.currentTarget.style.background = "#F5F4F0"; }}
                onMouseLeave={(e) => { if (!unread) e.currentTarget.style.background = "#fff"; }}
              >
                {/* Avatar */}
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "#534AB7",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 16,
                  flexShrink: 0,
                  overflow: "hidden",
                }}>
                  {other?.avatar
                    ? <img src={other.avatar} alt={other.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : other?.name?.[0]?.toUpperCase() || "?"}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: unread ? 700 : 500, color: "#26215C", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {other?.name || "Unknown"}
                    </div>
                    <div style={{ fontSize: 11, color: "#aaa", flexShrink: 0 }}>
                      {timeAgo(last?.created_at)}
                    </div>
                  </div>
                  {convo.listing_title && (
                    <div style={{ fontSize: 11, color: "#888", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      Re: {convo.listing_title}
                    </div>
                  )}
                  <div style={{ fontSize: 13, color: unread ? "#3C3489" : "#777", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: unread ? 500 : 400 }}>
                    {last?.sender_id === user?.id ? "You: " : ""}{last?.content || "No messages yet"}
                  </div>
                </div>

                {/* Unread badge */}
                {unread && (
                  <div style={{
                    minWidth: 20,
                    height: 20,
                    borderRadius: 10,
                    background: "#534AB7",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    padding: "0 5px",
                  }}>
                    {convo.unread_count}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}
