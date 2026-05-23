import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getForumPosts } from "../../api/forum";
import useAuthStore from "../../store/authStore";
import usePageTitle from "../../hooks/usePageTitle";
import SEO from "../../components/ui/SEO";

const CATEGORIES = [
  { value: "", label: "All", emoji: "🗣️" },
  { value: "visa", label: "Visa & Immigration", emoji: "🛂" },
  { value: "accommodation", label: "Accommodation", emoji: "🏠" },
  { value: "jobs", label: "Jobs & Work", emoji: "💼" },
  { value: "events", label: "Events", emoji: "🎉" },
  { value: "business", label: "Business", emoji: "🏢" },
  { value: "general", label: "General", emoji: "💬" },
];

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
  const w = Math.floor(days / 7);
  if (w < 5) return `${w}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function PostCard({ post }) {
  const cat = CAT_COLORS[post.category] || CAT_COLORS.general;
  const catInfo = CATEGORIES.find((c) => c.value === post.category) || CATEGORIES[6];

  return (
    <Link
      to={`/forum/${post.slug}`}
      style={{ textDecoration: "none" }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "14px",
          border: "0.5px solid #e8e8e8",
          padding: "16px 18px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          transition: "box-shadow 0.15s",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)")}
        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {post.is_pinned && (
            <span style={{ fontSize: "11px", background: "#26215C", color: "#fff", borderRadius: "6px", padding: "2px 7px", fontWeight: 700 }}>
              📌 Pinned
            </span>
          )}
          <span style={{ fontSize: "11px", background: cat.bg, color: cat.color, borderRadius: "6px", padding: "2px 8px", fontWeight: 600 }}>
            {catInfo.emoji} {catInfo.label}
          </span>
          {post.is_closed && (
            <span style={{ fontSize: "11px", background: "#f5f5f5", color: "#888", borderRadius: "6px", padding: "2px 7px" }}>
              🔒 Closed
            </span>
          )}
        </div>

        <div style={{ fontSize: "15px", fontWeight: 700, color: "#1a1a1a", lineHeight: 1.35 }}>
          {post.title}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px", color: "#888", flexWrap: "wrap" }}>
          <span>{post.author?.full_name || "Anonymous"}</span>
          <span>·</span>
          <span>{timeAgo(post.created_at)}</span>
          <span style={{ marginLeft: "auto", display: "flex", gap: "12px" }}>
            <span>▲ {post.upvote_count}</span>
            <span>💬 {post.reply_count}</span>
            <span>👁 {post.view_count}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

function PostSkeleton() {
  return (
    <div style={{ background: "#fff", borderRadius: "14px", border: "0.5px solid #e8e8e8", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ width: "80px", height: "18px", background: "#eee", borderRadius: "6px" }} />
      <div style={{ width: "60%", height: "18px", background: "#eee", borderRadius: "6px" }} />
      <div style={{ width: "40%", height: "13px", background: "#f3f3f3", borderRadius: "6px" }} />
    </div>
  );
}

const ANIM_STYLE = `
  @keyframes forumFadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .forum-post-enter {
    animation: forumFadeIn 0.22s ease both;
  }
`;

export default function ForumPage() {
  usePageTitle("Community Forum");
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const listKey = `${category}-${search}`;

  const { data, isLoading } = useQuery({
    queryKey: ["forum-posts", category, search],
    queryFn: () => getForumPosts({ category: category || undefined, search: search || undefined }),
  });

  const posts = data?.results ?? data ?? [];

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "24px 16px" }}>
      <SEO
        title="Community Forum"
        description="Ask questions, share advice and connect with the Nepalese Australian community. Topics include visa, accommodation, jobs, events and more."
        url="/forum"
        type="website"
      />
      <style>{ANIM_STYLE}</style>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#26215C", margin: 0 }}>Community Forum</h1>
          <p style={{ fontSize: "13px", color: "#888", margin: "4px 0 0" }}>Ask questions, share advice, connect with Nepalese Australians</p>
        </div>
        <button
          onClick={() => isAuthenticated ? navigate("/forum/new") : navigate("/login")}
          style={{
            background: "#26215C",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            padding: "10px 18px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          + New Post
        </button>
      </div>

      {/* Search */}
      <form
        onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); }}
        style={{ display: "flex", gap: "8px", marginBottom: "16px" }}
      >
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search posts..."
          style={{
            flex: 1,
            border: "0.5px solid #ddd",
            borderRadius: "10px",
            padding: "10px 14px",
            fontSize: "14px",
            outline: "none",
            background: "#fff",
          }}
        />
        {search && (
          <button
            type="button"
            onClick={() => { setSearch(""); setSearchInput(""); }}
            style={{ background: "#f0f0f0", border: "none", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", cursor: "pointer", color: "#555" }}
          >
            Clear
          </button>
        )}
      </form>

      {/* Category pills */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            style={{
              border: "none",
              borderRadius: "20px",
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              background: category === c.value ? "#26215C" : "#f0eff8",
              color: category === c.value ? "#fff" : "#26215C",
              transition: "all 0.15s",
            }}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {/* Posts list */}
      <div key={listKey} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="forum-post-enter" style={{ animationDelay: `${i * 0.05}s` }}>
                <PostSkeleton />
              </div>
            ))
          : posts.length === 0
            ? (
              <div className="forum-post-enter" style={{ textAlign: "center", padding: "48px 0", color: "#888" }}>
                <div style={{ fontSize: "36px", marginBottom: "12px" }}>💬</div>
                <div style={{ fontWeight: 600, marginBottom: "6px" }}>No posts yet</div>
                <div style={{ fontSize: "13px" }}>Be the first to start the conversation</div>
              </div>
            )
            : posts.map((post, i) => (
                <div key={post.id} className="forum-post-enter" style={{ animationDelay: `${i * 0.04}s` }}>
                  <PostCard post={post} />
                </div>
              ))
        }
      </div>
    </div>
  );
}
