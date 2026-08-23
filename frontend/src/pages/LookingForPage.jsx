import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRequests, createRequest, deleteRequest } from "../api/community";
import { useToast } from "../components/ui/Toast";
import useAuthStore from "../store/authStore";
import usePageMeta from "../hooks/usePageMeta";
import useT from "../hooks/useT";
import MessageButton from "../components/ui/MessageButton";
import { BriefcaseIcon, HouseIcon, WrenchIcon, PushPinIcon, MapPinIcon, CurrencyDollarIcon, PhoneIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "job",      label: "Looking for Work",     emoji: "💼", Icon: BriefcaseIcon },
  { value: "room",     label: "Looking for Room",     emoji: "🏠", Icon: HouseIcon },
  { value: "services", label: "Looking for Services", emoji: "🔧", Icon: WrenchIcon },
  { value: "other",    label: "Other",                emoji: "📌", Icon: PushPinIcon },
];

const STATES = ["", "NSW", "VIC", "QLD", "WA", "SA", "ACT", "TAS", "NT"];

const CAT_STYLES = {
  job:      { bg: "#EEEDFE", color: "#3C3489" },
  room:     { bg: "#FFF1E0", color: "#633806" },
  services: { bg: "#E1F5EE", color: "#085041" },
  other:    { bg: "#E6F1FB", color: "#0C447C" },
};

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const inputStyle = {
  width: "100%", border: "0.5px solid #ddd", borderRadius: "10px",
  padding: "10px 14px", fontSize: "14px", outline: "none",
  boxSizing: "border-box", fontFamily: "inherit", background: "#fff",
};

export default function LookingForPage() {
  usePageMeta("Looking For Board", "Post what you are looking for and get help from the Nepalese community in Australia. Find jobs, rooms, items and services on NepSaathi.");
  const { isAuthenticated } = useAuthStore();
  const t = useT();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [filterCat, setFilterCat] = useState("");
  const [filterState, setFilterState] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", category: "other", state: "", budget: "", contact: "" });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const { data, isLoading } = useQuery({
    queryKey: ["requests", filterCat, filterState],
    queryFn: () => getRequests({ category: filterCat || undefined, state: filterState || undefined }),
    staleTime: 60000,
  });

  const createMut = useMutation({
    mutationFn: createRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      setForm({ title: "", body: "", category: "other", state: "", budget: "", contact: "" });
      setShowForm(false);
      addToast("Request posted!", "success");
    },
    onError: () => addToast("Failed to post request.", "error"),
  });

  const deleteMut = useMutation({
    mutationFn: deleteRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      addToast("Request removed.", "success");
    },
  });

  const { user: currentUser } = useAuthStore();
  const requests = Array.isArray(data) ? data : data?.results || [];
  const canPost = form.title.trim().length >= 5 && form.body.trim().length >= 10;

  return (
    <div style={{ maxWidth: "780px", margin: "0 auto", padding: "24px 16px" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#26215C", margin: "0 0 6px" }}>
          Looking For Board
        </h1>
        <p style={{ fontSize: "14px", color: "#666", margin: 0 }}>
          Post what you're looking for — work, a room, a service, or anything else — and let the community help.
        </p>
      </div>

      {/* Filters + Post button */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "18px", alignItems: "center" }}>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} style={{ ...inputStyle, width: "auto", flex: "1 1 140px" }}>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select value={filterState} onChange={(e) => setFilterState(e.target.value)} style={{ ...inputStyle, width: "auto", flex: "1 1 120px" }}>
          {STATES.map((s) => <option key={s} value={s}>{s || "All States"}</option>)}
        </select>
        {isAuthenticated ? (
          <button
            onClick={() => setShowForm((v) => !v)}
            style={{ background: "#26215C", color: "#fff", border: "none", borderRadius: "10px", padding: "10px 18px", fontSize: "13px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
          >
            {showForm ? "Cancel" : "+ Post a Request"}
          </button>
        ) : (
          <Link to="/login" style={{ background: "#26215C", color: "#fff", borderRadius: "10px", padding: "10px 18px", fontSize: "13px", fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>
            {t("common.signIn")}
          </Link>
        )}
      </div>

      {/* Post form */}
      {showForm && (
        <div style={{ background: "#fff", border: "1.5px solid #AFA9EC", borderRadius: "14px", padding: "20px", marginBottom: "18px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#26215C", margin: "0 0 14px" }}>New Request</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <select value={form.category} onChange={(e) => set("category", e.target.value)} style={{ ...inputStyle, flex: "1 1 160px" }}>
                {CATEGORIES.slice(1).map((c) => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
              </select>
              <select value={form.state} onChange={(e) => set("state", e.target.value)} style={{ ...inputStyle, flex: "1 1 120px" }}>
                {STATES.map((s) => <option key={s} value={s}>{s || "Any State"}</option>)}
              </select>
            </div>
            <input type="text" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="What are you looking for? (e.g. 'Looking for a Nepali accountant in Sydney')" maxLength={200} style={inputStyle} />
            <textarea value={form.body} onChange={(e) => set("body", e.target.value)} placeholder="Add more details — when, budget, specific requirements..." rows={4} maxLength={2000} style={{ ...inputStyle, resize: "vertical" }} />
            <input type="text" value={form.budget} onChange={(e) => set("budget", e.target.value)} placeholder="Budget (optional, e.g. $50/hr, $200 negotiable)" maxLength={100} style={inputStyle} />
            <input type="text" value={form.contact} onChange={(e) => set("contact", e.target.value)} placeholder="Contact info (optional — WhatsApp number, email, or phone)" maxLength={100} style={inputStyle} />
            <button
              onClick={() => createMut.mutate(form)}
              disabled={!canPost || createMut.isPending}
              style={{ background: "#26215C", color: "#fff", border: "none", borderRadius: "10px", padding: "11px", fontSize: "14px", fontWeight: 700, cursor: canPost ? "pointer" : "default", opacity: !canPost || createMut.isPending ? 0.6 : 1 }}
            >
              {createMut.isPending ? "Posting..." : "Post Request"}
            </button>
            {!canPost && (
              <p style={{ fontSize: "12px", color: "#888", margin: 0, textAlign: "center" }}>
                Add a title (5+ chars) and description (10+ chars) to enable posting.
              </p>
            )}
          </div>
        </div>
      )}

      {/* List */}
      {isLoading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ background: "#e5e5e5", borderRadius: "12px", height: "100px", animation: "pulse 1.5s infinite" }} />
          ))}
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
        </div>
      )}

      {!isLoading && requests.length === 0 && (
        <div style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: "14px", padding: "40px", textAlign: "center" }}>
          <MagnifyingGlassIcon size={36} weight="duotone" color="#534AB7" style={{ marginBottom: "10px", opacity: 0.6 }} />
          <p style={{ fontSize: "14px", color: "#888", margin: 0 }}>No requests yet. Be the first to post!</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {requests.map((req) => {
          const cat = CAT_STYLES[req.category] || CAT_STYLES.other;
          const catLabel = CATEGORIES.find((c) => c.value === req.category);
          const isOwn = currentUser?.id === req.poster_id;
          return (
            <div key={req.id} style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: "14px", padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap", marginBottom: "8px" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ background: cat.bg, color: cat.color, fontSize: "11px", fontWeight: 600, padding: "2px 9px", borderRadius: "8px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    {catLabel?.Icon && <catLabel.Icon size={11} weight="regular" color={cat.color} />} {catLabel?.label}
                  </span>
                  {req.state && <span style={{ fontSize: "12px", color: "#888", display: "inline-flex", alignItems: "center", gap: "3px" }}><MapPinIcon size={12} weight="fill" color="#E87722" />{req.state}</span>}
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", color: "#aaa" }}>{timeAgo(req.created_at)}</span>
                  {isOwn && (
                    <button onClick={() => deleteMut.mutate(req.id)} style={{ fontSize: "11px", color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#26215C", marginBottom: "4px" }}>{req.title}</div>
              <div style={{ fontSize: "13px", color: "#555", lineHeight: 1.6, marginBottom: "8px" }}>{req.body}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                  {req.budget && <span style={{ fontSize: "12px", color: "#1D9E75", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "3px" }}><CurrencyDollarIcon size={13} weight="fill" color="#1D9E75" />{req.budget}</span>}
                  {req.contact && <span style={{ fontSize: "12px", color: "#555", display: "inline-flex", alignItems: "center", gap: "3px" }}><PhoneIcon size={12} weight="regular" color="#888" />{req.contact}</span>}
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <Link to={`/users/${req.poster_id}`} style={{ fontSize: "12px", color: "#534AB7", textDecoration: "none", fontWeight: 500 }}>
                    by {req.poster_name} →
                  </Link>
                  {!isOwn && (
                    <MessageButton
                      recipientId={req.poster_id}
                      listingTitle={req.title}
                      listingType="looking-for"
                      compact
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
