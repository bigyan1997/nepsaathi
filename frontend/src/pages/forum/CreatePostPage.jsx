import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { createForumPost } from "../../api/forum";
import { useToast } from "../../components/ui/Toast";
import usePageTitle from "../../hooks/usePageTitle";

const CATEGORIES = [
  { value: "visa", label: "Visa & Immigration", emoji: "🛂" },
  { value: "accommodation", label: "Accommodation", emoji: "🏠" },
  { value: "jobs", label: "Jobs & Work", emoji: "💼" },
  { value: "events", label: "Events", emoji: "🎉" },
  { value: "business", label: "Business", emoji: "🏢" },
  { value: "general", label: "General", emoji: "💬" },
];

export default function CreatePostPage() {
  usePageTitle("New Forum Post");
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [form, setForm] = useState({ title: "", category: "general", body: "" });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const [isPoll, setIsPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState(["", ""]);

  const mutation = useMutation({
    mutationFn: () => createForumPost({
      ...form,
      ...(isPoll ? { poll_options: pollOptions.filter((o) => o.trim()) } : {}),
    }),
    onSuccess: (data) => {
      addToast("Post created!", "success");
      navigate(`/forum/${data.slug}`);
    },
    onError: (e) => {
      const msg = e?.response?.data?.detail || Object.values(e?.response?.data || {})?.[0]?.[0] || "Failed to create post.";
      addToast(msg, "error");
    },
  });

  const inputStyle = {
    width: "100%",
    border: "0.5px solid #ddd",
    borderRadius: "10px",
    padding: "11px 14px",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    background: "#fff",
  };

  const canSubmit = form.title.trim().length >= 5 && form.body.trim().length >= 10
    && (!isPoll || pollOptions.filter((o) => o.trim()).length >= 2);

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto", padding: "24px 16px" }}>
      <button onClick={() => navigate("/forum")} style={{ background: "none", border: "none", color: "#534AB7", fontSize: "13px", cursor: "pointer", padding: 0, marginBottom: "20px" }}>
        ← Back to Forum
      </button>

      <div style={{ background: "#fff", borderRadius: "16px", border: "0.5px solid #e8e8e8", padding: "24px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#26215C", margin: "0 0 20px" }}>New Post</h1>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "#444", display: "block", marginBottom: "6px" }}>Category</label>
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              style={{ ...inputStyle, appearance: "none" }}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "#444", display: "block", marginBottom: "6px" }}>Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="What's your question or topic?"
              maxLength={200}
              style={inputStyle}
            />
            <div style={{ fontSize: "11px", color: "#bbb", textAlign: "right", marginTop: "4px" }}>{form.title.length}/200</div>
          </div>

          <div>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "#444", display: "block", marginBottom: "6px" }}>Body</label>
            <textarea
              value={form.body}
              onChange={(e) => set("body", e.target.value)}
              placeholder="Share as much detail as you can — the community will help!"
              rows={8}
              maxLength={5000}
              style={{ ...inputStyle, resize: "vertical" }}
            />
            <div style={{ fontSize: "11px", color: "#bbb", textAlign: "right", marginTop: "4px" }}>{form.body.length}/5000</div>
          </div>

          {/* Poll toggle */}
          <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: "14px" }}>
            <button
              type="button"
              onClick={() => setIsPoll((v) => !v)}
              style={{ display: "flex", alignItems: "center", gap: "8px", background: isPoll ? "#EEEDFE" : "#f8f8f8", border: `1.5px solid ${isPoll ? "#AFA9EC" : "#e5e5e5"}`, borderRadius: "10px", padding: "9px 16px", cursor: "pointer", fontSize: "13px", fontWeight: 600, color: isPoll ? "#534AB7" : "#666" }}
            >
              <span style={{ fontSize: "16px" }}>📊</span>
              {isPoll ? "Remove poll" : "Add a poll"}
            </button>

            {isPoll && (
              <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "#444" }}>Poll options (2–4)</label>
                {pollOptions.map((opt, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <input
                      type="text"
                      value={opt}
                      placeholder={`Option ${i + 1}`}
                      maxLength={200}
                      onChange={(e) => setPollOptions((prev) => prev.map((o, j) => j === i ? e.target.value : o))}
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    {pollOptions.length > 2 && (
                      <button type="button" onClick={() => setPollOptions((prev) => prev.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "16px", padding: "4px" }}>✕</button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 4 && (
                  <button type="button" onClick={() => setPollOptions((prev) => [...prev, ""])} style={{ alignSelf: "flex-start", background: "none", border: "1.5px dashed #ddd", borderRadius: "8px", padding: "7px 14px", fontSize: "13px", color: "#888", cursor: "pointer" }}>
                    + Add option
                  </button>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => mutation.mutate()}
            disabled={!canSubmit || mutation.isPending}
            style={{
              background: "#26215C",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              padding: "13px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: canSubmit ? "pointer" : "default",
              opacity: !canSubmit || mutation.isPending ? 0.6 : 1,
              width: "100%",
            }}
          >
            {mutation.isPending ? "Posting..." : "Post to Community"}
          </button>
        </div>
      </div>
    </div>
  );
}
