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

  const mutation = useMutation({
    mutationFn: () => createForumPost(form),
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

  const canSubmit = form.title.trim().length >= 5 && form.body.trim().length >= 10;

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
