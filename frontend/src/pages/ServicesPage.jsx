import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getServices, createService, deleteService } from "../api/community";
import { useToast } from "../components/ui/Toast";
import useAuthStore from "../store/authStore";
import usePageTitle from "../hooks/usePageTitle";
import useT from "../hooks/useT";

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "tutoring",    label: "Tutoring / Teaching",           emoji: "📚" },
  { value: "translation", label: "Translation / Interpretation",  emoji: "🗣️" },
  { value: "it",          label: "IT & Tech",                     emoji: "💻" },
  { value: "photography", label: "Photography / Video",           emoji: "📷" },
  { value: "cooking",     label: "Cooking / Events",              emoji: "🍽️" },
  { value: "accounting",  label: "Accounting / Tax",              emoji: "📊" },
  { value: "transport",   label: "Transport / Delivery",          emoji: "🚗" },
  { value: "cleaning",    label: "Cleaning",                      emoji: "🧹" },
  { value: "other",       label: "Other",                         emoji: "🔧" },
];

const RATE_TYPES = [
  { value: "hourly",     label: "Per Hour" },
  { value: "fixed",      label: "Fixed Price" },
  { value: "negotiable", label: "Negotiable" },
];

const STATES = ["", "NSW", "VIC", "QLD", "WA", "SA", "ACT", "TAS", "NT"];

const CAT_COLORS = {
  tutoring:    { bg: "#EEEDFE", color: "#3C3489" },
  translation: { bg: "#FFF1E0", color: "#633806" },
  it:          { bg: "#E6F1FB", color: "#0C447C" },
  photography: { bg: "#FDE8EF", color: "#82184A" },
  cooking:     { bg: "#FFF8E7", color: "#7C5000" },
  accounting:  { bg: "#E1F5EE", color: "#085041" },
  transport:   { bg: "#F0F9FF", color: "#0369A1" },
  cleaning:    { bg: "#F0FDF4", color: "#15803D" },
  other:       { bg: "#F3F4F6", color: "#374151" },
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

export default function ServicesPage() {
  usePageTitle("Skills & Services — NepSaathi");
  const { isAuthenticated } = useAuthStore();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const t = useT();

  const [filterCat, setFilterCat] = useState("");
  const [filterState, setFilterState] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "", category: "other", description: "",
    rate: "", rate_type: "negotiable", location: "", state: "",
  });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const { data, isLoading } = useQuery({
    queryKey: ["services", filterCat, filterState],
    queryFn: () => getServices({ category: filterCat || undefined, state: filterState || undefined }),
    staleTime: 60000,
  });

  const createMut = useMutation({
    mutationFn: createService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setForm({ title: "", category: "other", description: "", rate: "", rate_type: "negotiable", location: "", state: "" });
      setShowForm(false);
      addToast("Service listed!", "success");
    },
    onError: () => addToast("Failed to post service.", "error"),
  });

  const deleteMut = useMutation({
    mutationFn: deleteService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      addToast("Listing removed.", "success");
    },
  });

  const services = Array.isArray(data) ? data : data?.results || [];
  const canPost = form.title.trim().length >= 5 && form.description.trim().length >= 10;

  return (
    <div style={{ maxWidth: "780px", margin: "0 auto", padding: "24px 16px" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#26215C", margin: "0 0 6px" }}>
          Skills & Services
        </h1>
        <p style={{ fontSize: "14px", color: "#666", margin: 0 }}>
          Nepali community members offering their skills — tutoring, translation, IT, photography, and more.
        </p>
      </div>

      {/* Filters + Post button */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "18px", alignItems: "center" }}>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} style={{ ...inputStyle, width: "auto", flex: "1 1 180px" }}>
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
            {showForm ? "Cancel" : "+ List a Service"}
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
          <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#26215C", margin: "0 0 14px" }}>List Your Service</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <input type="text" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Service title (e.g. 'English & Nepali Translation — documents, calls')" maxLength={200} style={inputStyle} />
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <select value={form.category} onChange={(e) => set("category", e.target.value)} style={{ ...inputStyle, flex: "1 1 160px" }}>
                {CATEGORIES.slice(1).map((c) => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
              </select>
              <select value={form.state} onChange={(e) => set("state", e.target.value)} style={{ ...inputStyle, flex: "1 1 120px" }}>
                {STATES.map((s) => <option key={s} value={s}>{s || "Any State"}</option>)}
              </select>
            </div>
            <input type="text" value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Suburb / City (optional)" maxLength={100} style={inputStyle} />
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe your service — what you offer, experience, availability..." rows={5} maxLength={2000} style={{ ...inputStyle, resize: "vertical" }} />
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <input type="text" value={form.rate} onChange={(e) => set("rate", e.target.value)} placeholder="Rate (e.g. $40/hr, $200 flat)" maxLength={100} style={{ ...inputStyle, flex: "1 1 160px" }} />
              <select value={form.rate_type} onChange={(e) => set("rate_type", e.target.value)} style={{ ...inputStyle, flex: "1 1 140px" }}>
                {RATE_TYPES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <button
              onClick={() => createMut.mutate(form)}
              disabled={!canPost || createMut.isPending}
              style={{ background: "#26215C", color: "#fff", border: "none", borderRadius: "10px", padding: "11px", fontSize: "14px", fontWeight: 700, cursor: canPost ? "pointer" : "default", opacity: !canPost || createMut.isPending ? 0.6 : 1 }}
            >
              {createMut.isPending ? "Posting..." : "List Service"}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ background: "#e5e5e5", borderRadius: "12px", height: "110px", animation: "pulse 1.5s infinite" }} />
          ))}
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
        </div>
      )}

      {!isLoading && services.length === 0 && (
        <div style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: "14px", padding: "40px", textAlign: "center" }}>
          <div style={{ fontSize: "36px", marginBottom: "10px" }}>🛠️</div>
          <p style={{ fontSize: "14px", color: "#888", margin: 0 }}>No services listed yet. Be the first to offer yours!</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {services.map((svc) => {
          const cat = CAT_COLORS[svc.category] || CAT_COLORS.other;
          const catLabel = CATEGORIES.find((c) => c.value === svc.category);
          const rateLabel = RATE_TYPES.find((r) => r.value === svc.rate_type)?.label;
          const isOwn = currentUser?.id === svc.provider_id;
          return (
            <div key={svc.id} style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: "14px", padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ background: cat.bg, color: cat.color, fontSize: "11px", fontWeight: 600, padding: "2px 9px", borderRadius: "8px" }}>
                    {catLabel?.emoji} {catLabel?.label}
                  </span>
                  {svc.state && <span style={{ fontSize: "12px", color: "#888" }}>📍 {svc.location ? `${svc.location}, ` : ""}{svc.state}</span>}
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", color: "#aaa" }}>{timeAgo(svc.created_at)}</span>
                  {isOwn && (
                    <button onClick={() => deleteMut.mutate(svc.id)} style={{ fontSize: "11px", color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#26215C", marginBottom: "6px" }}>{svc.title}</div>
              <div style={{ fontSize: "13px", color: "#555", lineHeight: 1.6, marginBottom: "10px" }}>{svc.description}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                  {svc.rate && (
                    <span style={{ fontSize: "13px", color: "#1D9E75", fontWeight: 700 }}>
                      💰 {svc.rate} <span style={{ fontWeight: 400, color: "#888" }}>({rateLabel})</span>
                    </span>
                  )}
                </div>
                <Link to={`/users/${svc.provider_id}`} style={{ fontSize: "12px", color: "#534AB7", textDecoration: "none", fontWeight: 500 }}>
                  by {svc.provider_name} →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
