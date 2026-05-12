import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getConversation, sendMessage, deleteConversation } from "../api/messages";
import useAuthStore from "../store/authStore";

const WS_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/^http/, "ws");

function timeStr(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function usePageVisible() {
  const [visible, setVisible] = useState(!document.hidden);
  useEffect(() => {
    const handler = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);
  return visible;
}

export default function ConversationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const messagesContainerRef = useRef(null);
  const prevMsgCountRef = useRef(0);
  const initialScrollDone = useRef(false);
  const isVisible = usePageVisible();
  const wsRef = useRef(null);
  const [wsConnected, setWsConnected] = useState(false);

  // WebSocket — real-time receive; HTTP send still goes through REST
  useEffect(() => {
    let ws;
    let reconnectTimer;
    let dead = false;
    let delay = 2000; // backoff: 2s → 4s → 8s … capped at 30s

    const connect = () => {
      const token = localStorage.getItem("nepsaathi_access_token");
      if (!token || dead) return;
      ws = new WebSocket(`${WS_BASE}/ws/messages/${id}/?token=${token}`);
      wsRef.current = ws;
      ws.onopen = () => { setWsConnected(true); delay = 2000; }; // reset backoff on success
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "ping") return;
          queryClient.setQueryData(["conversation", id], (old) => {
            if (!old) return old;
            if (old.messages.some((m) => m.id === msg.id)) return old;
            return { ...old, messages: [...old.messages, msg] };
          });
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          // For messages from the other user: re-fetch conversation so backend marks them as read,
          // which then updates the unread badge via useEffect([data]) below.
          if (msg.sender_id !== user?.id) {
            queryClient.invalidateQueries({ queryKey: ["conversation", id] });
          }
        } catch {}
      };
      ws.onclose = () => {
        setWsConnected(false);
        if (!dead) {
          reconnectTimer = setTimeout(connect, delay);
          delay = Math.min(delay * 2, 30000);
        }
      };
      ws.onerror = () => setWsConnected(false);
    };

    connect();
    return () => {
      dead = true;
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [id]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["conversation", id],
    queryFn: () => getConversation(id),
    // Fall back to polling when WebSocket isn't connected
    refetchInterval: wsConnected ? false : isVisible ? 3000 : false,
    retry: false,
  });

  const sendMutation = useMutation({
    mutationFn: () => sendMessage(id, content.trim()),
    onSuccess: (newMsg) => {
      setContent("");
      queryClient.setQueryData(["conversation", id], (old) => {
        if (!old) return old;
        if (old.messages.some((m) => m.id === newMsg.id)) return old;
        return { ...old, messages: [...old.messages, newMsg] };
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
      // Scroll immediately after optimistic update — don't wait for the effect
      requestAnimationFrame(() => scrollToBottom("smooth"));
    },
  });

  // Force-refetch unread count after each data update (backend marks messages read on GET).
  // refetchQueries is unconditional — it bypasses staleTime, unlike invalidateQueries.
  useEffect(() => {
    if (data) {
      queryClient.refetchQueries({ queryKey: ["unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
  }, [data]);

  const deleteMutation = useMutation({
    mutationFn: () => deleteConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      navigate("/messages");
    },
  });

  const scrollToBottom = (behavior = "smooth") => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  };

  // Scroll to bottom on initial load (instant), then smooth for new messages
  useEffect(() => {
    const count = data?.messages?.length ?? 0;
    if (count === 0) return;
    if (!initialScrollDone.current) {
      scrollToBottom("instant");
      initialScrollDone.current = true;
      prevMsgCountRef.current = count;
    } else if (count > prevMsgCountRef.current) {
      scrollToBottom("smooth");
      prevMsgCountRef.current = count;
    }
  }, [data?.messages?.length]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!content.trim() || sendMutation.isPending) return;
    sendMutation.mutate();
  };

  if (isLoading) {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px" }}>
        <div style={{ height: 20, width: "40%", borderRadius: 8, background: "#e8e8e8", marginBottom: 24 }} />
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ height: 48, borderRadius: 12, background: "#e8e8e8", marginBottom: 8, animation: "pulse 1.5s infinite" }} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px", textAlign: "center", color: "#888" }}>
        Conversation not found.
      </div>
    );
  }

  const { conversation, messages } = data;
  const other = conversation?.other_user;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px", display: "flex", flexDirection: "column", height: "calc(100vh - 100px)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => navigate("/messages")}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#534AB7", fontSize: 20, padding: 0, display: "flex", alignItems: "center" }}
        >
          ←
        </button>
        <Link to={`/users/${other?.id}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: "#534AB7",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 14,
            overflow: "hidden",
            flexShrink: 0,
          }}>
            {other?.avatar
              ? <img src={other.avatar} alt={other.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : other?.name?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#26215C" }}>{other?.name}</div>
            {conversation.listing_title && (
              <div style={{ fontSize: 11, color: "#888" }}>Re: {conversation.listing_title}</div>
            )}
          </div>
        </Link>
        {confirmDelete ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#888" }}>Delete chat?</span>
            <button
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              style={{ background: "#A32D2D", color: "#fff", border: "none", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              {deleteMutation.isPending ? "..." : "Yes"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              style={{ background: "#f0f0f0", color: "#444", border: "none", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              No
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            title="Delete chat"
            style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb", fontSize: 18, padding: 4, display: "flex", alignItems: "center", flexShrink: 0 }}
          >
            🗑
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, paddingBottom: 12 }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", color: "#aaa", fontSize: 13, marginTop: 40 }}>No messages yet. Say hi!</div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === user?.id;
            return (
              <div key={msg.id} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "75%",
                  background: isMine ? "#534AB7" : "#fff",
                  color: isMine ? "#fff" : "#333",
                  border: isMine ? "none" : "1px solid #e8e8e8",
                  borderRadius: isMine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  padding: "10px 14px",
                  fontSize: 14,
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}>
                  {msg.content}
                  <div style={{ fontSize: 10, color: isMine ? "rgba(255,255,255,0.6)" : "#bbb", marginTop: 4, textAlign: "right" }}>
                    {timeStr(msg.created_at)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} style={{ display: "flex", gap: 8, paddingTop: 12, borderTop: "1px solid #f0f0f0" }}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); }
          }}
          placeholder="Type a message..."
          rows={2}
          maxLength={2000}
          style={{
            flex: 1,
            border: "1px solid #e0e0e0",
            borderRadius: 12,
            padding: "10px 14px",
            fontSize: 14,
            resize: "none",
            outline: "none",
            fontFamily: "inherit",
            background: "#fff",
            lineHeight: 1.5,
          }}
        />
        <button
          type="submit"
          disabled={!content.trim() || sendMutation.isPending}
          style={{
            background: "#534AB7",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: "0 20px",
            fontSize: 14,
            fontWeight: 600,
            cursor: content.trim() && !sendMutation.isPending ? "pointer" : "not-allowed",
            opacity: content.trim() && !sendMutation.isPending ? 1 : 0.5,
            flexShrink: 0,
            alignSelf: "stretch",
          }}
        >
          {sendMutation.isPending ? "..." : "Send"}
        </button>
      </form>

      {sendMutation.isError && (
        <div style={{ fontSize: 12, color: "#A32D2D", marginTop: 4 }}>
          {sendMutation.error?.response?.data?.detail || "Failed to send message."}
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}
