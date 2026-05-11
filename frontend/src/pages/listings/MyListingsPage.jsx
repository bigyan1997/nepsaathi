import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyListings,
  deleteListing,
  getSavedListings,
  unsaveListing,
  markListingStatus,
  renewListing,
} from "../../api/listings";
import { createCheckoutSession, downloadInvoice } from "../../api/payments";
import { getMyBusinesses, deleteBusiness } from "../../api/businesses";
import { SkeletonCard } from "../../components/ui/Skeleton";
import usePageTitle from "../../hooks/usePageTitle";
import { useToast } from "../../components/ui/Toast";

/* ── constants ── */
const STATUS_COLORS = {
  active: { bg: "#E1F5EE", color: "#085041", dot: "#1D9E75" },
  expired: { bg: "#F1EFE8", color: "#444441", dot: "#aaa" },
  filled: { bg: "#FAEEDA", color: "#633806", dot: "#E87722" },
  deleted: { bg: "#FCEBEB", color: "#A32D2D", dot: "#A32D2D" },
};

const TYPE_COLORS = {
  job: { bg: "#EEEDFE", color: "#3C3489", border: "#1D9E75" },
  room: { bg: "#FFF1E0", color: "#633806", border: "#E87722" },
  event: { bg: "#E1F5EE", color: "#085041", border: "#1D9E75" },
  notice: { bg: "#E6F1FB", color: "#0C447C", border: "#1D9E75" },
};

const TYPE_EMOJIS = { job: "💼", room: "🏠", event: "🎉", notice: "📢" };

const CATEGORY_EMOJIS = {
  restaurant: "🍛",
  grocery: "🛒",
  travel: "✈️",
  beauty: "💇",
  health: "🏥",
  legal: "⚖️",
  education: "📚",
  religious: "🙏",
  construction: "🔨",
  transport: "🚗",
  finance: "💸",
  freelancer: "🧑‍💻",
  retail: "🏪",
  other: "🏪",
};

const CATEGORY_COLORS = {
  restaurant: { bg: "#FFF1E0", color: "#633806" },
  grocery: { bg: "#E1F5EE", color: "#085041" },
  travel: { bg: "#E6F1FB", color: "#0C447C" },
  beauty: { bg: "#FBEAF0", color: "#4B1528" },
  health: { bg: "#EAF3DE", color: "#27500A" },
  legal: { bg: "#EEEDFE", color: "#3C3489" },
  education: { bg: "#E6F1FB", color: "#0C447C" },
  religious: { bg: "#FAEEDA", color: "#633806" },
  construction: { bg: "#F1EFE8", color: "#444441" },
  transport: { bg: "#E1F5EE", color: "#085041" },
  finance: { bg: "#EEEDFE", color: "#3C3489" },
  freelancer: { bg: "#FFF1E0", color: "#633806" },
  retail: { bg: "#FAECE7", color: "#4A1B0C" },
  other: { bg: "#F1EFE8", color: "#444441" },
};

/* ── helpers ── */
const isExpiringSoon = (expires_at) =>
  expires_at && new Date(expires_at) - new Date() < 1000 * 60 * 60 * 24 * 5;

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short" });

const getDetailPath = (listing) => {
  const map = {
    job: "jobs",
    room: "rooms",
    event: "events",
    notice: "notices",
  };
  return `/${map[listing.listing_type] || "listings"}/${listing.slug}`;
};

const getSavedPath = (saved) => {
  const map = {
    job: "jobs",
    room: "rooms",
    event: "events",
    notice: "notices",
  };
  return `/${map[saved.listing_type] || "listings"}/${saved.listing_slug}`;
};

/* ── Confirm modal ── */
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "32px 28px",
          width: "100%",
          maxWidth: "380px",
          textAlign: "center",
          margin: "0 16px",
        }}
      >
        <div style={{ fontSize: "32px", marginBottom: "12px" }}>⚠️</div>
        <h3
          style={{
            fontSize: "16px",
            fontWeight: 700,
            color: "#26215C",
            marginBottom: "8px",
          }}
        >
          Are you sure?
        </h3>
        <p style={{ fontSize: "14px", color: "#888", marginBottom: "24px" }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              background: "#fff",
              color: "#555",
              border: "0.5px solid #ccc",
              borderRadius: "9px",
              padding: "11px",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              background: "#A32D2D",
              color: "#fff",
              border: "none",
              borderRadius: "9px",
              padding: "11px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Three-dot dropdown menu ── */
function ActionMenu({ items, open, onToggle }) {
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={onToggle}
        style={{
          background: "#F5F4F0",
          border: "none",
          borderRadius: "8px",
          width: "34px",
          height: "34px",
          fontSize: "18px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#555",
        }}
      >
        ⋮
      </button>
      {open && (
        <>
          <div
            onClick={onToggle}
            style={{ position: "fixed", inset: 0, zIndex: 10 }}
          />
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "40px",
              background: "#fff",
              borderRadius: "12px",
              border: "0.5px solid #e5e5e5",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              zIndex: 11,
              minWidth: "170px",
              overflow: "hidden",
            }}
          >
            {items.map(
              (item, i) =>
                item && (
                  <button
                    key={i}
                    onClick={item.onClick}
                    style={{
                      width: "100%",
                      padding: "11px 16px",
                      background: "none",
                      border: "none",
                      textAlign: "left",
                      fontSize: "13px",
                      color: item.danger
                        ? "#A32D2D"
                        : item.highlight
                          ? "#534AB7"
                          : "#333",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      borderTop: i > 0 ? "0.5px solid #f5f5f5" : "none",
                    }}
                  >
                    {item.label}
                  </button>
                ),
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Pagination component ── */
function Pagination({ page, count, pageSize, onChange }) {
  const totalPages = Math.ceil(count / pageSize);
  if (totalPages <= 1) return null;

  const pages = [];
  // show at most 5 page buttons centered around current page
  let start = Math.max(1, page - 2);
  let end = Math.min(totalPages, start + 4);
  if (end - start < 4) start = Math.max(1, end - 4);
  for (let i = start; i <= end; i++) pages.push(i);

  const btnStyle = (active) => ({
    background: active ? "#26215C" : "#fff",
    color: active ? "#fff" : "#555",
    border: `0.5px solid ${active ? "#26215C" : "#e5e5e5"}`,
    borderRadius: "8px",
    width: "36px",
    height: "36px",
    fontSize: "13px",
    fontWeight: active ? 700 : 400,
    cursor: active ? "default" : "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s",
  });

  const navStyle = (disabled) => ({
    background: "#fff",
    color: disabled ? "#ccc" : "#534AB7",
    border: "0.5px solid #e5e5e5",
    borderRadius: "8px",
    width: "36px",
    height: "36px",
    fontSize: "16px",
    fontWeight: 500,
    cursor: disabled ? "not-allowed" : "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        paddingTop: "20px",
      }}
    >
      {/* Prev */}
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        style={navStyle(page === 1)}
      >
        ‹
      </button>

      {start > 1 && (
        <>
          <button onClick={() => onChange(1)} style={btnStyle(false)}>
            1
          </button>
          {start > 2 && (
            <span style={{ color: "#aaa", fontSize: "13px", padding: "0 2px" }}>
              …
            </span>
          )}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          style={btnStyle(p === page)}
        >
          {p}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && (
            <span style={{ color: "#aaa", fontSize: "13px", padding: "0 2px" }}>
              …
            </span>
          )}
          <button onClick={() => onChange(totalPages)} style={btnStyle(false)}>
            {totalPages}
          </button>
        </>
      )}

      {/* Next */}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        style={navStyle(page === totalPages)}
      >
        ›
      </button>

      <span style={{ fontSize: "12px", color: "#aaa", marginLeft: "8px" }}>
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, count)} of{" "}
        {count}
      </span>
    </div>
  );
}

/* ════════════════════════════════════════════════════ */
export default function MyListingsPage() {
  usePageTitle("My Listings");
  const navigate = useNavigate();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("listings");
  const [deletingId, setDeletingId] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

  /* ── pagination state (one per tab) ── */
  const [listingsPage, setListingsPage] = useState(1);
  const [businessesPage, setBusinessesPage] = useState(1);
  const [savedPage, setSavedPage] = useState(1);
  const [underReviewPage, setUnderReviewPage] = useState(1);
  const PAGE_SIZE = 5;

  /* ── queries — fetch all results, paginate client-side ── */
  const { data: listingsData, isLoading: listingsLoading } = useQuery({
    queryKey: ["my-listings"],
    queryFn: getMyListings,
  });
  const { data: businessesData, isLoading: businessesLoading } = useQuery({
    queryKey: ["my-businesses"],
    queryFn: getMyBusinesses,
  });
  const { data: savedData, isLoading: savedLoading } = useQuery({
    queryKey: ["saved-listings"],
    queryFn: getSavedListings,
  });

  /* ── mutations ── */
  const deleteListingMutation = useMutation({
    mutationFn: deleteListing,
    onSuccess: () => {
      [
        "my-listings",
        "jobs",
        "rooms",
        "events",
        "notices",
        "home-jobs",
        "home-rooms",
        "home-events",
      ].forEach((k) => queryClient.invalidateQueries({ queryKey: [k] }));
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      setDeletingId(null);
      addToast("Listing deleted successfully!", "success");
    },
    onError: () => {
      setDeletingId(null);
      addToast("Failed to delete listing.", "error");
    },
  });

  const deleteBusinessMutation = useMutation({
    mutationFn: deleteBusiness,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-businesses"] });
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
      setDeletingId(null);
      addToast("Business removed successfully!", "success");
    },
    onError: () => {
      setDeletingId(null);
      addToast("Failed to remove business.", "error");
    },
  });

  const unsaveMutation = useMutation({
    mutationFn: unsaveListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-listings"] });
      addToast("Removed from saved listings.", "info");
    },
    onError: () => addToast("Failed to remove.", "error"),
  });

  const markStatusMutation = useMutation({
    mutationFn: ({ id, status }) => markListingStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      addToast("Listing status updated!", "success");
    },
    onError: () => addToast("Failed to update status.", "error"),
  });

  const renewMutation = useMutation({
    mutationFn: renewListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      addToast("Listing renewed for 30 more days! ✅", "success");
    },
    onError: (err) => {
      const msg = err?.response?.data?.detail || "Failed to renew listing.";
      addToast(msg, "error");
    },
  });

  const featureMutation = useMutation({
    mutationFn: createCheckoutSession,
    onSuccess: (data) => {
      if (data.checkout_url) window.location.href = data.checkout_url;
    },
    onError: (err) => {
      const data = err?.response?.data;
      const msg = (Array.isArray(data) ? data[0] : data?.detail) || "Failed to start checkout.";
      addToast(msg, "error");
    },
  });


  /* ── derived data ── */
  const allListings = (listingsData?.results || []).filter(
    (l) => l.status !== "deleted",
  );
  const allBusinesses = (businessesData?.results || []).filter(
    (b) => b.is_active !== false,
  );
  const allSaved = savedData?.results || [];

  // Stats always computed from ALL results (not just current page)
  const activeCount = allListings.filter((l) => l.status === "active").length;
  const expiringCount = allListings.filter(
    (l) => isExpiringSoon(l.expires_at) && l.status === "active",
  ).length;
  const totalViews = allListings.reduce((s, l) => s + (l.view_count || 0), 0);

  // Paginated slices shown in each tab
  const listings = allListings.slice(
    (listingsPage - 1) * PAGE_SIZE,
    listingsPage * PAGE_SIZE,
  );
  const businesses = allBusinesses.slice(
    (businessesPage - 1) * PAGE_SIZE,
    businessesPage * PAGE_SIZE,
  );
  const saved = allSaved.slice(
    (savedPage - 1) * PAGE_SIZE,
    savedPage * PAGE_SIZE,
  );
  const allUnderReview = allListings.filter((l) => l.is_under_review);
  const underReview = allUnderReview.slice(
    (underReviewPage - 1) * PAGE_SIZE,
    underReviewPage * PAGE_SIZE,
  );

  /* ── bulk selection helpers ── */
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const selectAllPage = () => setSelectedIds(new Set(listings.map((l) => l.id)));
  const clearSelection = () => setSelectedIds(new Set());

  const bulkDelete = () => {
    confirmDelete(
      `Delete ${selectedIds.size} selected listing${selectedIds.size > 1 ? "s" : ""}? This cannot be undone.`,
      async () => {
        await Promise.all([...selectedIds].map((id) => deleteListing(id)));
        ["my-listings","jobs","rooms","events","notices","home-jobs","home-rooms","home-events"].forEach(
          (k) => queryClient.invalidateQueries({ queryKey: [k] })
        );
        queryClient.invalidateQueries({ queryKey: ["stats"] });
        clearSelection();
        addToast(`${selectedIds.size} listing${selectedIds.size > 1 ? "s" : ""} deleted.`, "success");
      }
    );
  };

  const bulkMarkFilled = () => {
    confirmDelete(
      `Mark ${selectedIds.size} listing${selectedIds.size > 1 ? "s" : ""} as filled?`,
      async () => {
        await Promise.all([...selectedIds].map((id) => markListingStatus(id, "filled")));
        queryClient.invalidateQueries({ queryKey: ["my-listings"] });
        clearSelection();
        addToast("Listings marked as filled.", "success");
      }
    );
  };

  /* ── modal helpers ── */
  const confirmDelete = (message, fn) =>
    setConfirmModal({
      message,
      onConfirm: () => {
        setConfirmModal(null);
        fn();
      },
      onCancel: () => setConfirmModal(null),
    });

  return (
    <>
      <style>{`
        .myl-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        @media (max-width: 600px) {
          .myl-stats { grid-template-columns: repeat(2, 1fr); }
          .myl-wrap { padding: 16px !important; }
          .myl-header { padding: 18px 16px !important; }
        }
      `}</style>

      <div
        className="myl-wrap"
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "28px",
          background: "#F5F4F0",
          minHeight: "100vh",
        }}
      >
        {confirmModal && <ConfirmModal {...confirmModal} />}

        {/* ── Dark header banner ── */}
        <div
          className="myl-header"
          style={{
            background: "#26215C",
            borderRadius: "16px",
            padding: "24px 28px",
            marginBottom: "14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "11px",
                color: "#AFA9EC",
                letterSpacing: "0.06em",
                marginBottom: "6px",
              }}
            >
              MY ACCOUNT
            </div>
            <h1
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "#fff",
                margin: "0 0 4px",
              }}
            >
              My listings
            </h1>
            <p style={{ fontSize: "13px", color: "#AFA9EC", margin: 0 }}>
              Everything you've posted on NepSaathi
            </p>
          </div>
          <button
            onClick={() => navigate("/post-ad")}
            style={{
              background: "#E87722",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              padding: "11px 22px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            + Post new ad
          </button>
        </div>

        {/* ── Stat cards ── */}
        <div className="myl-stats" style={{ marginBottom: "14px" }}>
          {[
            {
              label: "Active",
              value: activeCount,
              sub: "listings live",
              accent: "#1D9E75",
            },
            {
              label: "Expiring",
              value: expiringCount,
              sub: "within 5 days",
              accent: "#E87722",
            },
            {
              label: "Total views",
              value: totalViews,
              sub: "across all listings",
              accent: "#534AB7",
            },
            {
              label: "Saved",
              value: allSaved.length,
              sub: "by you",
              accent: "#26215C",
            },
          ].map(({ label, value, sub, accent }) => (
            <div
              key={label}
              style={{
                background: "#fff",
                border: "0.5px solid #e5e5e5",
                borderRadius: "12px",
                padding: "14px 16px",
                borderTop: `3px solid ${accent}`,
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  color: "#aaa",
                  marginBottom: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontSize: "26px",
                  fontWeight: 700,
                  color: accent,
                  lineHeight: 1,
                }}
              >
                {value}
              </div>
              <div
                style={{ fontSize: "11px", color: "#888", marginTop: "4px" }}
              >
                {sub}
              </div>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div
          style={{
            display: "flex",
            gap: "4px",
            background: "#fff",
            border: "0.5px solid #e5e5e5",
            padding: "4px",
            borderRadius: "12px",
            width: "100%",
            marginBottom: "16px",
            flexWrap: "wrap",
          }}
        >
          {[
            { key: "listings", label: "Listings", count: allListings.length },
            { key: "businesses", label: "Businesses", count: allBusinesses.length },
            { key: "saved", label: "Saved", count: allSaved.length },
            ...(allUnderReview.length > 0
              ? [{ key: "under-review", label: "Under Review", count: allUnderReview.length, alert: true }]
              : []),
          ].map(({ key, label, count, alert }) => (
            <button
              key={key}
              onClick={() => {
                setActiveTab(key);
                setOpenMenu(null);
              }}
              style={{
                flex: 1,
                minWidth: "fit-content",
                background: activeTab === key ? (alert ? "#E87722" : "#26215C") : "transparent",
                border: "none",
                borderRadius: "8px",
                padding: "8px 12px",
                fontSize: "13px",
                fontWeight: activeTab === key ? 600 : 400,
                color: activeTab === key ? "#fff" : alert ? "#E87722" : "#888",
                cursor: "pointer",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              {alert && activeTab !== key ? "⚠️ " : ""}{label}
              <span style={{
                marginLeft: "5px",
                background: activeTab === key ? "rgba(255,255,255,0.25)" : "#f0f0f0",
                color: activeTab === key ? "#fff" : alert ? "#E87722" : "#666",
                borderRadius: "10px",
                padding: "1px 6px",
                fontSize: "11px",
                fontWeight: 600,
              }}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* ══ LISTINGS + UNDER REVIEW TABS ══ */}
        {(activeTab === "listings" || activeTab === "under-review") && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {/* Bulk action toolbar */}
            {activeTab === "listings" && listings.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#555", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.size === listings.length && listings.length > 0}
                    onChange={(e) => e.target.checked ? selectAllPage() : clearSelection()}
                    style={{ width: "15px", height: "15px", cursor: "pointer", accentColor: "#534AB7" }}
                  />
                  {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select all"}
                </label>
                {selectedIds.size > 0 && (
                  <>
                    <button onClick={bulkMarkFilled} style={{ background: "#FFF1E0", color: "#633806", border: "0.5px solid #EFD9C0", borderRadius: "8px", padding: "6px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                      ✓ Mark filled
                    </button>
                    <button onClick={bulkDelete} style={{ background: "#FCEBEB", color: "#A32D2D", border: "0.5px solid #F09595", borderRadius: "8px", padding: "6px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                      🗑️ Delete selected
                    </button>
                    <button onClick={clearSelection} style={{ background: "transparent", color: "#aaa", border: "none", fontSize: "12px", cursor: "pointer" }}>
                      Clear
                    </button>
                  </>
                )}
              </div>
            )}

            {listingsLoading && [1, 2, 3].map((i) => <SkeletonCard key={i} />)}

            {!listingsLoading && underReview.length === 0 && activeTab === "under-review" && (
              <div style={{ textAlign: "center", padding: "48px", background: "#fff", borderRadius: "16px", border: "0.5px solid #e5e5e5" }}>
                <div style={{ fontSize: "36px", marginBottom: "14px" }}>✅</div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#26215C", marginBottom: "6px" }}>No listings under review</h3>
                <p style={{ fontSize: "14px", color: "#888" }}>All your listings are in good standing</p>
              </div>
            )}

            {!listingsLoading && allListings.length === 0 && activeTab === "listings" && (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px",
                  background: "#fff",
                  borderRadius: "16px",
                  border: "0.5px solid #e5e5e5",
                }}
              >
                <div style={{ fontSize: "36px", marginBottom: "14px" }}>📭</div>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#26215C",
                    marginBottom: "6px",
                  }}
                >
                  No listings yet
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#888",
                    marginBottom: "20px",
                  }}
                >
                  Post a job, room, event or notice for free
                </p>
                <button
                  onClick={() => navigate("/post-ad")}
                  style={{
                    background: "#534AB7",
                    color: "#fff",
                    border: "none",
                    borderRadius: "9px",
                    padding: "11px 24px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Post your first ad →
                </button>
              </div>
            )}

            {(activeTab === "under-review" ? underReview : listings).map((listing) => {
              const typeColor =
                TYPE_COLORS[listing.listing_type] || TYPE_COLORS.job;
              const statusColor =
                STATUS_COLORS[listing.status] || STATUS_COLORS.active;
              const typeEmoji = TYPE_EMOJIS[listing.listing_type] || "📌";
              const expiring =
                isExpiringSoon(listing.expires_at) &&
                listing.status === "active";
              const isExpired = listing.status === "expired";

              const borderLeft = isExpired
                ? "3px solid #ccc"
                : expiring
                  ? "3px solid #E87722"
                  : listing.status === "filled"
                    ? "3px solid #E87722"
                    : `3px solid ${statusColor.dot}`;

              return (
                <div
                  key={listing.id}
                  style={{
                    background: isExpired ? "#F5F4F0" : "#fff",
                    border: "0.5px solid #e5e5e5",
                    borderRadius: "12px",
                    padding: "16px",
                    display: "flex",
                    gap: "12px",
                    alignItems: "flex-start",
                    borderLeft,
                    opacity: isExpired ? 0.75 : 1,
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    !isExpired &&
                    (e.currentTarget.style.borderColor = "#AFA9EC")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = "#e5e5e5")
                  }
                >
                  {/* Checkbox — only on listings tab */}
                  {activeTab === "listings" && (
                    <input
                      type="checkbox"
                      checked={selectedIds.has(listing.id)}
                      onChange={() => toggleSelect(listing.id)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ width: "15px", height: "15px", flexShrink: 0, cursor: "pointer", accentColor: "#534AB7", marginTop: "2px" }}
                    />
                  )}

                  {/* Type icon */}
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      background: typeColor.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                      flexShrink: 0,
                    }}
                  >
                    {typeEmoji}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Title + status */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "5px",
                        flexWrap: "wrap",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#26215C",
                          margin: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {listing.title}
                      </h3>
                      <span
                        style={{
                          background: statusColor.bg,
                          color: statusColor.color,
                          fontSize: "10px",
                          fontWeight: 600,
                          padding: "2px 9px",
                          borderRadius: "20px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        ● {listing.status}
                      </span>
                      {listing.is_featured && (
                        <span
                          style={{
                            background: "#FFF1E0",
                            color: "#E87722",
                            fontSize: "10px",
                            fontWeight: 600,
                            padding: "2px 9px",
                            borderRadius: "20px",
                            whiteSpace: "nowrap",
                            border: "0.5px solid #EFD9C0",
                          }}
                        >
                          ⭐ Featured
                        </span>
                      )}
                      {listing.is_under_review && (
                        <span
                          style={{
                            background: "#FFF8E0",
                            color: "#8B6914",
                            fontSize: "10px",
                            fontWeight: 600,
                            padding: "2px 9px",
                            borderRadius: "20px",
                            whiteSpace: "nowrap",
                            border: "0.5px solid #E8D5A0",
                          }}
                        >
                          🔍 Under Review
                        </span>
                      )}
                      {expiring && (
                        <span
                          style={{
                            background: "#FFF1E0",
                            color: "#633806",
                            fontSize: "10px",
                            fontWeight: 600,
                            padding: "2px 9px",
                            borderRadius: "20px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          ⚠️ Expires soon
                        </span>
                      )}
                    </div>

                    {/* Meta */}
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#888",
                        marginBottom: "6px",
                      }}
                    >
                      <span
                        style={{
                          background: typeColor.bg,
                          color: typeColor.color,
                          fontSize: "10px",
                          fontWeight: 500,
                          padding: "1px 7px",
                          borderRadius: "8px",
                          marginRight: "6px",
                        }}
                      >
                        {listing.listing_type}
                      </span>
                      📍 {listing.location}, {listing.state}
                      {listing.view_count > 0 && (
                        <span style={{ marginLeft: "8px" }}>
                          · 👁️ {listing.view_count} views
                        </span>
                      )}
                    </div>

                    {/* Dates */}
                    <div style={{ fontSize: "11px", color: "#aaa" }}>
                      Posted {fmtDate(listing.created_at)}
                      {listing.expires_at && (
                        <span style={{ color: expiring ? "#E87722" : "#aaa" }}>
                          {" "}
                          · {isExpired ? "Expired" : "Expires"}{" "}
                          {fmtDate(listing.expires_at)}
                        </span>
                      )}
                    </div>

                    {/* Renew pill — inline for expiring */}
                    {(expiring || isExpired) && (
                      <>
                        {listing.is_under_review || listing.renewal_blocked ? (
                          <span
                            title={
                              listing.is_under_review
                                ? "This listing is under review and cannot be renewed"
                                : "Renewal has been restricted on this listing"
                            }
                            style={{
                              marginTop: "8px",
                              display: "inline-block",
                              background: "#FFF1E0",
                              color: "#E87722",
                              border: "0.5px solid #EFD9C0",
                              borderRadius: "20px",
                              padding: "4px 12px",
                              fontSize: "11px",
                              fontWeight: 600,
                            }}
                          >
                            🚫 Renewal blocked
                          </span>
                        ) : (
                          <button
                            onClick={() => renewMutation.mutate(listing.id)}
                            disabled={renewMutation.isPending}
                            style={{
                              marginTop: "8px",
                              background: "#EEEDFE",
                              color: "#534AB7",
                              border: "none",
                              borderRadius: "20px",
                              padding: "4px 12px",
                              fontSize: "11px",
                              fontWeight: 600,
                              cursor: "pointer",
                              opacity: renewMutation.isPending ? 0.6 : 1,
                            }}
                          >
                            🔄 Renew for 30 days
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {/* ⋮ menu */}
                  <ActionMenu
                    open={openMenu === listing.id}
                    onToggle={() =>
                      setOpenMenu(openMenu === listing.id ? null : listing.id)
                    }
                    items={[
                      {
                        label: "👁️ View listing",
                        onClick: () => {
                          setOpenMenu(null);
                          navigate(getDetailPath(listing));
                        },
                      },
                      {
                        label: "✏️ Edit listing",
                        onClick: () => {
                          setOpenMenu(null);
                          navigate(`/edit-listing/${listing.slug}`);
                        },
                      },
                      (listing.status === "active" ||
                        listing.status === "expired") &&
                        !listing.is_under_review &&
                        !listing.renewal_blocked && {
                          label: "🔄 Renew 30 days",
                          highlight: true,
                          onClick: () => {
                            setOpenMenu(null);
                            renewMutation.mutate(listing.id);
                          },
                        },
                      listing.status === "active" &&
                        !listing.is_featured && {
                          label: "⭐ Feature listing — $9.99",
                          onClick: () => {
                            setOpenMenu(null);
                            featureMutation.mutate(listing.id);
                          },
                        },
                      listing.is_featured && {
                        label: "🧾 Download invoice",
                        onClick: () => {
                          setOpenMenu(null);
                          downloadInvoice(listing.id, `NepSaathi-Invoice-${listing.id}.pdf`);
                        },
                      },
                      listing.status === "active" && {
                        label: "✓ Mark as filled",
                        onClick: () => {
                          setOpenMenu(null);
                          confirmDelete(
                            `Mark "${listing.title}" as filled/taken?`,
                            () =>
                              markStatusMutation.mutate({
                                id: listing.id,
                                status: "filled",
                              }),
                          );
                        },
                      },
                      listing.status === "filled" && {
                        label: "↺ Reopen listing",
                        onClick: () => {
                          setOpenMenu(null);
                          markStatusMutation.mutate({
                            id: listing.id,
                            status: "active",
                          });
                        },
                      },
                      {
                        label: "🗑️ Delete listing",
                        danger: true,
                        onClick: () => {
                          setOpenMenu(null);
                          confirmDelete(
                            "This listing will be permanently deleted.",
                            () => {
                              setDeletingId(listing.id);
                              deleteListingMutation.mutate(listing.id);
                            },
                          );
                        },
                      },
                    ].filter(Boolean)}
                  />
                </div>
              );
            })}
            <Pagination
              page={activeTab === "under-review" ? underReviewPage : listingsPage}
              count={activeTab === "under-review" ? allUnderReview.length : allListings.length}
              pageSize={PAGE_SIZE}
              onChange={(p) => {
                activeTab === "under-review" ? setUnderReviewPage(p) : setListingsPage(p);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </div>
        )}
        {activeTab === "businesses" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {businessesLoading &&
              [1, 2, 3].map((i) => <SkeletonCard key={i} />)}

            {!businessesLoading && allBusinesses.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px",
                  background: "#fff",
                  borderRadius: "16px",
                  border: "0.5px solid #e5e5e5",
                }}
              >
                <div style={{ fontSize: "36px", marginBottom: "14px" }}>🏪</div>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#26215C",
                    marginBottom: "6px",
                  }}
                >
                  No businesses registered yet
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#888",
                    marginBottom: "20px",
                  }}
                >
                  List your Nepalese business for free
                </p>
                <button
                  onClick={() => navigate("/register-business")}
                  style={{
                    background: "#534AB7",
                    color: "#fff",
                    border: "none",
                    borderRadius: "9px",
                    padding: "11px 24px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Register your business →
                </button>
              </div>
            )}

            {businesses.map((business) => {
              const catColor =
                CATEGORY_COLORS[business.category] || CATEGORY_COLORS.other;
              const catEmoji = CATEGORY_EMOJIS[business.category] || "🏪";
              return (
                <div
                  key={business.id}
                  style={{
                    background: "#fff",
                    border: "0.5px solid #e5e5e5",
                    borderRadius: "12px",
                    padding: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    borderLeft: "3px solid #8B5E00",
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = "#FAC775")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = "#e5e5e5")
                  }
                >
                  {/* Category icon */}
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "10px",
                      background: catColor.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                      flexShrink: 0,
                    }}
                  >
                    {catEmoji}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "4px",
                        flexWrap: "wrap",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#26215C",
                          margin: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {business.business_name}
                      </h3>
                      {business.is_verified ? (
                        <span style={{ background: "#E1F5EE", color: "#085041", fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "20px" }}>
                          ✓ Verified
                        </span>
                      ) : (
                        <span style={{ background: "#FAEEDA", color: "#633806", fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "20px" }}>
                          Pending verification
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "12px", color: "#888" }}>
                      <span
                        style={{
                          background: catColor.bg,
                          color: catColor.color,
                          fontSize: "10px",
                          fontWeight: 500,
                          padding: "1px 7px",
                          borderRadius: "8px",
                          marginRight: "6px",
                        }}
                      >
                        {catEmoji} {business.category?.replace("_", " ")}
                      </span>
                      📍 {business.suburb}, {business.state}
                    </div>
                    {/* Rating if available */}
                    {business.avg_rating > 0 && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          marginTop: "5px",
                        }}
                      >
                        {[1, 2, 3, 4, 5].map((s) => (
                          <span
                            key={s}
                            style={{
                              fontSize: "11px",
                              color:
                                s <= Math.round(business.avg_rating)
                                  ? "#E87722"
                                  : "#ddd",
                            }}
                          >
                            ★
                          </span>
                        ))}
                        <span
                          style={{
                            fontSize: "11px",
                            color: "#E87722",
                            fontWeight: 600,
                          }}
                        >
                          {Number(business.avg_rating).toFixed(1)}
                        </span>
                        <span style={{ fontSize: "11px", color: "#aaa" }}>
                          ({business.review_count})
                        </span>
                      </div>
                    )}
                  </div>

                  <ActionMenu
                    open={openMenu === `b-${business.id}`}
                    onToggle={() =>
                      setOpenMenu(
                        openMenu === `b-${business.id}`
                          ? null
                          : `b-${business.id}`,
                      )
                    }
                    items={[
                      {
                        label: "👁️ View business",
                        onClick: () => {
                          setOpenMenu(null);
                          navigate(`/businesses/${business.slug}`);
                        },
                      },
                      {
                        label: "🗑️ Remove business",
                        danger: true,
                        onClick: () => {
                          setOpenMenu(null);
                          confirmDelete(
                            "This business will be removed from NepSaathi.",
                            () => {
                              setDeletingId(business.id);
                              deleteBusinessMutation.mutate(business.id);
                            },
                          );
                        },
                      },
                    ].filter(Boolean)}
                  />
                </div>
              );
            })}
            <Pagination
              page={businessesPage}
              count={allBusinesses.length}
              pageSize={PAGE_SIZE}
              onChange={(p) => {
                setBusinessesPage(p);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </div>
        )}

        {/* ══ SAVED TAB ══ */}
        {activeTab === "saved" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {savedLoading && [1, 2, 3].map((i) => <SkeletonCard key={i} />)}

            {!savedLoading && allSaved.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px",
                  background: "#fff",
                  borderRadius: "16px",
                  border: "0.5px solid #e5e5e5",
                }}
              >
                <div style={{ fontSize: "36px", marginBottom: "14px" }}>🤍</div>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#26215C",
                    marginBottom: "6px",
                  }}
                >
                  No saved listings yet
                </h3>
                <p style={{ fontSize: "14px", color: "#888" }}>
                  Tap the heart on any listing to save it here
                </p>
              </div>
            )}

            {saved.map((item) => {
              const typeColor =
                TYPE_COLORS[item.listing_type] || TYPE_COLORS.job;
              const typeEmoji = TYPE_EMOJIS[item.listing_type] || "📌";
              const isExpiredSaved = item.listing_status === "expired";

              return (
                <div
                  key={item.id}
                  style={{
                    background: isExpiredSaved ? "#F5F4F0" : "#fff",
                    border: "0.5px solid #e5e5e5",
                    borderRadius: "12px",
                    padding: "16px",
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                    opacity: isExpiredSaved ? 0.7 : 1,
                    borderLeft: `3px solid ${isExpiredSaved ? "#ccc" : typeColor.dot || "#534AB7"}`,
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      background: typeColor.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                      flexShrink: 0,
                    }}
                  >
                    {typeEmoji}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "7px",
                        marginBottom: "4px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          background: typeColor.bg,
                          color: typeColor.color,
                          fontSize: "10px",
                          fontWeight: 500,
                          padding: "1px 7px",
                          borderRadius: "8px",
                        }}
                      >
                        {item.listing_type}
                      </span>
                      {isExpiredSaved && (
                        <span
                          style={{
                            background: "#F1EFE8",
                            color: "#444441",
                            fontSize: "10px",
                            fontWeight: 500,
                            padding: "1px 7px",
                            borderRadius: "8px",
                          }}
                        >
                          Expired
                        </span>
                      )}
                    </div>
                    <h3
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#26215C",
                        margin: "0 0 3px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.listing_title}
                    </h3>
                    <p style={{ fontSize: "12px", color: "#888", margin: 0 }}>
                      📍 {item.listing_location}, {item.listing_state}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                    <button
                      onClick={() => navigate(getSavedPath(item))}
                      style={{
                        background: "#EEEDFE",
                        color: "#534AB7",
                        border: "none",
                        borderRadius: "8px",
                        padding: "8px 14px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      View →
                    </button>
                    <button
                      onClick={() => unsaveMutation.mutate(item.listing)}
                      disabled={unsaveMutation.isPending}
                      style={{
                        background: "#FCEBEB",
                        color: "#A32D2D",
                        border: "none",
                        borderRadius: "8px",
                        padding: "8px 14px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        opacity: unsaveMutation.isPending ? 0.6 : 1,
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
            <Pagination
              page={savedPage}
              count={allSaved.length}
              pageSize={PAGE_SIZE}
              onChange={(p) => {
                setSavedPage(p);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </div>
        )}
      </div>
    </>
  );
}
