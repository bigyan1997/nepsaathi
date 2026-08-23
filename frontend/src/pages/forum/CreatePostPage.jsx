import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { createForumPost, aiImproveForumPost } from "../../api/forum";
import { useToast } from "../../components/ui/Toast";
import usePageTitle from "../../hooks/usePageTitle";
import { SparkleIcon, ChartBarIcon } from "@phosphor-icons/react";

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
  const [aiState, setAiState] = useState({ loading: false, preview: null, error: null });

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

  const handleAiImprove = async () => {
    if (!form.body.trim() || aiState.loading) return;
    setAiState({ loading: true, preview: null, error: null });
    try {
      const data = await aiImproveForumPost({ title: form.title, category: form.category, body: form.body });
      setAiState({ loading: false, preview: data.improved || null, error: data.error || null });
    } catch (e) {
      const msg = e?.response?.data?.error || "AI service temporarily unavailable.";
      setAiState({ loading: false, preview: null, error: msg });
    }
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "#444" }}>Body</label>
              <button
                type="button"
                onClick={handleAiImprove}
                disabled={!form.body.trim() || aiState.loading}
                style={{
                  display: "flex", alignItems: "center", gap: "5px",
                  background: form.body.trim() && !aiState.loading ? "linear-gradient(135deg, #7C3AED, #4F46E5)" : "#e5e5e5",
                  color: form.body.trim() && !aiState.loading ? "#fff" : "#aaa",
                  border: "none", borderRadius: "8px", padding: "5px 12px",
                  fontSize: "12px", fontWeight: 600, cursor: form.body.trim() && !aiState.loading ? "pointer" : "not-allowed",
                }}
              >
                {aiState.loading ? "Improving…" : <><SparkleIcon size={13} weight="fill" style={{ verticalAlign: "middle", marginRight: "4px" }} />Improve with AI</>}
              </button>
            </div>
            <textarea
              value={form.body}
              onChange={(e) => { set("body", e.target.value); setAiState({ loading: false, preview: null, error: null }); }}
              placeholder="Share as much detail as you can — the community will help!"
              rows={8}
              maxLength={5000}
              style={{ ...inputStyle, resize: "vertical" }}
            />
            <div style={{ fontSize: "11px", color: "#bbb", textAlign: "right", marginTop: "4px" }}>{form.body.length}/5000</div>

            {aiState.error && (
              <div style={{ marginTop: "8px", padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "10px", fontSize: "13px", color: "#991B1B" }}>
                {aiState.error}
              </div>
            )}
            {aiState.preview && (
              <div style={{ marginTop: "10px", background: "#F5F3FF", border: "1.5px solid #C4B5FD", borderRadius: "12px", padding: "14px 16px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#7C3AED", marginBottom: "8px", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: "4px" }}><SparkleIcon size={11} weight="fill" color="#7C3AED" /> AI SUGGESTION</div>
                <div style={{ fontSize: "13px", color: "#333", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{aiState.preview}</div>
                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                  <button
                    type="button"
                    onClick={() => { set("body", aiState.preview); setAiState({ loading: false, preview: null, error: null }); }}
                    style={{ background: "#7C3AED", color: "#fff", border: "none", borderRadius: "8px", padding: "7px 16px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                  >
                    Use this
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiState({ loading: false, preview: null, error: null })}
                    style={{ background: "#fff", color: "#666", border: "1px solid #ddd", borderRadius: "8px", padding: "7px 16px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Poll toggle */}
          <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: "14px" }}>
            <button
              type="button"
              onClick={() => setIsPoll((v) => !v)}
              style={{ display: "flex", alignItems: "center", gap: "8px", background: isPoll ? "#EEEDFE" : "#f8f8f8", border: `1.5px solid ${isPoll ? "#AFA9EC" : "#e5e5e5"}`, borderRadius: "10px", padding: "9px 16px", cursor: "pointer", fontSize: "13px", fontWeight: 600, color: isPoll ? "#534AB7" : "#666" }}
            >
              <ChartBarIcon size={16} weight="regular" color="#534AB7" />
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
