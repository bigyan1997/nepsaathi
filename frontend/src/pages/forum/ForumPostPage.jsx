import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getForumPost, voteForumPost, createForumReply, deleteForumPost, deleteForumReply, voteForumReply } from "../../api/forum";
import useAuthStore from "../../store/authStore";
import usePageTitle from "../../hooks/usePageTitle";
import { useToast } from "../../components/ui/Toast";

const CAT_COLORS = {
  visa: { bg: "#E6F1FB", color: "#0C447C" },
  accommodation: { bg: "#EEEDFE", color: "#3C3489" },
  jobs: { bg: "#E1F5EE", color: "#085041" },
  events: { bg: "#FFF1E0", color: "#633806" },
  business: { bg: "#FCF0FB", color: "#6B2077" },
  general: { bg: "#F1EFE8", color: "#444441" },
};

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const secs = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function Avatar({ user, size = 36 }) {
  const initials = (user?.full_name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  if (user?.avatar) {
    return <img src={user.avatar} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "#EEEDFE", color: "#534AB7", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.38, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function ReplyCard({ reply, currentUser, onDelete, onVote }) {
  return (
    <div style={{ background: "#fff", borderRadius: "12px", border: "0.5px solid #e8e8e8", padding: "14px 16px" }}>
      <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
        <Avatar user={reply.author} size={32} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "4px" }}>
            <span style={{ fontWeight: 700, fontSize: "13px", color: "#26215C" }}>
              {reply.author?.full_name || "Anonymous"}
              {reply.author?.is_verified && <span style={{ marginLeft: "4px", fontSize: "11px", color: "#534AB7" }}>✓</span>}
            </span>
            <span style={{ fontSize: "11px", color: "#aaa" }}>{timeAgo(reply.created_at)}</span>
          </div>
          <p style={{ margin: "8px 0 0", fontSize: "14px", color: "#333", lineHeight: 1.55, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{reply.body}</p>
          <div style={{ display: "flex", gap: "12px", marginTop: "10px", alignItems: "center" }}>
            <button
              onClick={() => onVote(reply.id)}
              style={{ background: "none", border: "none", cursor: currentUser ? "pointer" : "default", fontSize: "12px", color: reply.has_upvoted ? "#534AB7" : "#888", fontWeight: reply.has_upvoted ? 700 : 400, padding: 0, display: "flex", alignItems: "center", gap: "4px" }}
            >
              ▲ {reply.upvote_count}
            </button>
            {currentUser?.id === reply.author?.id && (
              <button
                onClick={() => onDelete(reply.id)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "#A32D2D", padding: 0 }}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ForumPostPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { showToast } = useToast();
  const qc = useQueryClient();
  const [replyBody, setReplyBody] = useState("");

  const { data: post, isLoading } = useQuery({
    queryKey: ["forum-post", slug],
    queryFn: () => getForumPost(slug),
  });

  usePageTitle(post?.title || "Forum Post");

  const voteMutation = useMutation({
    mutationFn: () => voteForumPost(slug),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["forum-post", slug] }),
  });

  const replyMutation = useMutation({
    mutationFn: (body) => createForumReply(slug, { body }),
    onSuccess: () => {
      setReplyBody("");
      qc.invalidateQueries({ queryKey: ["forum-post", slug] });
    },
    onError: (e) => showToast(e?.response?.data?.detail || "Failed to post reply.", "error"),
  });

  const deletePostMutation = useMutation({
    mutationFn: () => deleteForumPost(slug),
    onSuccess: () => { showToast("Post deleted."); navigate("/forum"); },
  });

  const deleteReplyMutation = useMutation({
    mutationFn: (id) => deleteForumReply(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["forum-post", slug] }),
  });

  const voteReplyMutation = useMutation({
    mutationFn: (id) => voteForumReply(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["forum-post", slug] }),
  });

  if (isLoading) {
    return (
      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "24px 16px" }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ height: "80px", background: "#eee", borderRadius: "12px", marginBottom: "12px" }} />
        ))}
      </div>
    );
  }

  if (!post) return <div style={{ padding: "48px", textAlign: "center", color: "#888" }}>Post not found.</div>;

  const cat = CAT_COLORS[post.category] || CAT_COLORS.general;
  const isOwner = user?.id === post.author?.id;

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "24px 16px" }}>
      {/* Back */}
      <Link to="/forum" style={{ fontSize: "13px", color: "#534AB7", textDecoration: "none", display: "inline-block", marginBottom: "16px" }}>
        ← Back to Forum
      </Link>

      {/* Post */}
      <div style={{ background: "#fff", borderRadius: "16px", border: "0.5px solid #e8e8e8", padding: "20px 22px", marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
          {post.is_pinned && <span style={{ fontSize: "11px", background: "#26215C", color: "#fff", borderRadius: "6px", padding: "2px 7px", fontWeight: 700 }}>📌 Pinned</span>}
          <span style={{ fontSize: "11px", background: cat.bg, color: cat.color, borderRadius: "6px", padding: "2px 8px", fontWeight: 600 }}>{post.category_display}</span>
          {post.is_closed && <span style={{ fontSize: "11px", background: "#f5f5f5", color: "#888", borderRadius: "6px", padding: "2px 7px" }}>🔒 Closed</span>}
        </div>

        <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#1a1a1a", margin: "0 0 14px", lineHeight: 1.3 }}>{post.title}</h1>

        <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "16px" }}>
          <Avatar user={post.author} size={38} />
          <div>
            <div style={{ fontWeight: 700, fontSize: "13px", color: "#26215C" }}>
              {post.author?.full_name || "Anonymous"}
              {post.author?.is_verified && <span style={{ marginLeft: "4px", fontSize: "11px", color: "#534AB7" }}>✓</span>}
            </div>
            <div style={{ fontSize: "11px", color: "#aaa" }}>{timeAgo(post.created_at)} · {post.view_count} views</div>
          </div>
        </div>

        <p style={{ fontSize: "15px", color: "#333", lineHeight: 1.65, margin: "0 0 18px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{post.body}</p>

        <div style={{ display: "flex", gap: "16px", alignItems: "center", borderTop: "0.5px solid #f0f0f0", paddingTop: "14px" }}>
          <button
            onClick={() => isAuthenticated ? voteMutation.mutate() : navigate("/login")}
            style={{
              background: post.has_upvoted ? "#EEEDFE" : "#f5f5f5",
              border: "none",
              borderRadius: "8px",
              padding: "7px 14px",
              fontSize: "13px",
              fontWeight: 700,
              color: post.has_upvoted ? "#534AB7" : "#555",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            ▲ {post.upvote_count}
          </button>
          <span style={{ fontSize: "13px", color: "#888" }}>💬 {(post.replies || []).length} replies</span>
          {isOwner && (
            <button
              onClick={() => { if (window.confirm("Delete this post?")) deletePostMutation.mutate(); }}
              style={{ marginLeft: "auto", background: "none", border: "none", fontSize: "13px", color: "#A32D2D", cursor: "pointer" }}
            >
              Delete post
            </button>
          )}
        </div>
      </div>

      {/* Replies */}
      {(post.replies || []).length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#555", marginBottom: "4px" }}>
            {post.replies.length} {post.replies.length === 1 ? "Reply" : "Replies"}
          </div>
          {post.replies.map((reply) => (
            <ReplyCard
              key={reply.id}
              reply={reply}
              currentUser={user}
              onDelete={(id) => { if (window.confirm("Delete reply?")) deleteReplyMutation.mutate(id); }}
              onVote={(id) => isAuthenticated ? voteReplyMutation.mutate(id) : navigate("/login")}
            />
          ))}
        </div>
      )}

      {/* Reply form */}
      {!post.is_closed ? (
        isAuthenticated ? (
          <div style={{ background: "#fff", borderRadius: "14px", border: "0.5px solid #e8e8e8", padding: "16px" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#26215C", marginBottom: "10px" }}>Add a reply</div>
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Share your thoughts or answer..."
              rows={4}
              style={{
                width: "100%",
                border: "0.5px solid #ddd",
                borderRadius: "10px",
                padding: "10px 12px",
                fontSize: "14px",
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
              <button
                onClick={() => { if (replyBody.trim()) replyMutation.mutate(replyBody.trim()); }}
                disabled={!replyBody.trim() || replyMutation.isPending}
                style={{
                  background: "#26215C",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "9px 20px",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: replyBody.trim() ? "pointer" : "default",
                  opacity: !replyBody.trim() || replyMutation.isPending ? 0.6 : 1,
                }}
              >
                {replyMutation.isPending ? "Posting..." : "Post Reply"}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "20px", background: "#fff", borderRadius: "14px", border: "0.5px solid #e8e8e8" }}>
            <span style={{ fontSize: "13px", color: "#888" }}>
              <Link to="/login" style={{ color: "#534AB7", fontWeight: 700, textDecoration: "none" }}>Log in</Link> to join the conversation
            </span>
          </div>
        )
      ) : (
        <div style={{ textAlign: "center", padding: "16px", background: "#f9f9f9", borderRadius: "12px", fontSize: "13px", color: "#888" }}>
          🔒 This post is closed for new replies.
        </div>
      )}
    </div>
  );
}
