import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyListings,
  deleteListing,
  getSavedListings,
  unsaveListing,
  markListingStatus,
  renewListing,
  getMyAnalytics,
} from "../../api/listings";
import { createCheckoutSession, downloadInvoice } from "../../api/payments";
import { getMyBusinesses, deleteBusiness } from "../../api/businesses";
import {
  StorefrontIcon, BriefcaseIcon, HouseIcon, CalendarBlankIcon, MegaphoneIcon,
  WarningIcon, FlagIcon, ClockIcon, MapPinIcon, EyeIcon, ProhibitIcon,
  ArrowsClockwiseIcon, PencilSimpleIcon, ReceiptIcon, CheckCircleIcon,
  TrashIcon, SealCheckIcon, HeartIcon, ChartBarIcon, LightbulbIcon,
  ChatDotsIcon, ArchiveIcon, PushPinIcon,
  ForkKnifeIcon, ShoppingCartIcon, AirplaneIcon, ScissorsIcon, FirstAidKitIcon,
  ScalesIcon, BookOpenIcon, SunIcon, HammerIcon, CarIcon, CurrencyDollarIcon, LaptopIcon,
} from "@phosphor-icons/react";
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

const TYPE_ICONS = { job: BriefcaseIcon, room: HouseIcon, event: CalendarBlankIcon, notice: MegaphoneIcon };

const CATEGORY_ICONS = {
  restaurant: ForkKnifeIcon,
  grocery: ShoppingCartIcon,
  travel: AirplaneIcon,
  beauty: ScissorsIcon,
  health: FirstAidKitIcon,
  legal: ScalesIcon,
  education: BookOpenIcon,
  religious: SunIcon,
  construction: HammerIcon,
  transport: CarIcon,
  finance: CurrencyDollarIcon,
  freelancer: LaptopIcon,
  retail: StorefrontIcon,
  other: PushPinIcon,
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
function ConfirmModal({ message, onConfirm, onCancel, confirmLabel = "Yes, Delete", confirmColor = "#A32D2D" }) {
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
        <div style={{ marginBottom: "12px" }}><WarningIcon size={32} weight="fill" color="#E87722" /></div>
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
              background: confirmColor,
              color: "#fff",
              border: "none",
              borderRadius: "9px",
              padding: "11px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Three-dot dropdown menu ── */
function ActionMenu({ items, open, onToggle }) {
  const btnRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
    }
  }, [open]);

  // Close on scroll so menu doesn't drift away from its button
  useEffect(() => {
    if (!open) return;
    const close = () => onToggle();
    window.addEventListener("scroll", close, { passive: true });
    return () => window.removeEventListener("scroll", close);
  }, [open, onToggle]);

  return (
    <div style={{ flexShrink: 0 }}>
      <button
        ref={btnRef}
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
      {open && createPortal(
        <>
          <div onClick={onToggle} style={{ position: "fixed", inset: 0, zIndex: 1000 }} />
          <div
            style={{
              position: "fixed",
              top: pos.top,
              right: pos.right,
              background: "#fff",
              borderRadius: "12px",
              border: "0.5px solid #e5e5e5",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              zIndex: 1001,
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
                    {item.icon && <span style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>{item.icon}</span>}
                    {item.label}
                  </button>
                ),
            )}
          </div>
        </>,
        document.body,
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

/* ── Section divider with label ── */
function SectionHeader({ icon, label, count, accent, bg, line, collapsible, open, onToggle }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "10px 0 4px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "5px", background: bg, borderRadius: "20px", padding: "3px 10px", flexShrink: 0 }}>
        <span style={{ fontSize: "11px", fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {icon} {label}
        </span>
        <span style={{ fontSize: "11px", fontWeight: 700, color: accent }}>· {count}</span>
      </div>
      <div style={{ flex: 1, height: "0.5px", background: line }} />
      {collapsible && (
        <button onClick={onToggle} style={{ background: "none", border: "none", color: accent, fontSize: "12px", cursor: "pointer", fontWeight: 600, padding: "2px 6px", flexShrink: 0 }}>
          {open ? "▲ Hide" : "▼ Show"}
        </button>
      )}
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

  const [archiveOpen, setArchiveOpen] = useState(false);

  /* ── pagination state (businesses + saved only) ── */
  const [businessesPage, setBusinessesPage] = useState(1);
  const [savedPage, setSavedPage] = useState(1);
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
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ["my-analytics"],
    queryFn: getMyAnalytics,
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
      ["my-listings", "jobs", "rooms", "events", "notices", "home-jobs", "home-rooms", "home-events", "home-notices", "home-featured", "listings"].forEach(
        (k) => queryClient.invalidateQueries({ queryKey: [k] })
      );
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

  // Stats
  const activeCount = allListings.filter((l) => l.status === "active").length;
  const expiringCount = allListings.filter(
    (l) => isExpiringSoon(l.expires_at) && l.status === "active",
  ).length;
  const totalViews = allListings.reduce((s, l) => s + (l.view_count || 0), 0);

  // Listing groups (API already returns priority-sorted)
  const needsAttention = allListings.filter(
    (l) => l.is_under_review || (isExpiringSoon(l.expires_at) && l.status === "active"),
  );
  const activeListings = allListings.filter(
    (l) => l.status === "active" && !l.is_under_review && !isExpiringSoon(l.expires_at),
  );
  const archiveListings = allListings.filter(
    (l) => l.status === "filled" || l.status === "expired",
  );

  // Paginated slices (businesses + saved only)
  const businesses = allBusinesses.slice(
    (businessesPage - 1) * PAGE_SIZE,
    businessesPage * PAGE_SIZE,
  );
  const saved = allSaved.slice(
    (savedPage - 1) * PAGE_SIZE,
    savedPage * PAGE_SIZE,
  );

  /* ── bulk selection helpers ── */
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const selectableListings = [...needsAttention, ...activeListings];
  const selectAllActive = () => setSelectedIds(new Set(selectableListings.map((l) => l.id)));
  const clearSelection = () => setSelectedIds(new Set());

  const bulkDelete = () => {
    confirmDelete(
      `Delete ${selectedIds.size} selected listing${selectedIds.size > 1 ? "s" : ""}? This cannot be undone.`,
      async () => {
        const count = selectedIds.size;
        try {
          await Promise.all([...selectedIds].map((id) => {
            const listing = allListings.find((l) => l.id === id);
            return deleteListing(listing?.slug ?? id);
          }));
          ["my-listings","jobs","rooms","events","notices","home-jobs","home-rooms","home-events"].forEach(
            (k) => queryClient.invalidateQueries({ queryKey: [k] })
          );
          queryClient.invalidateQueries({ queryKey: ["stats"] });
          clearSelection();
          addToast(`${count} listing${count > 1 ? "s" : ""} deleted.`, "success");
        } catch {
          addToast("Failed to delete some listings. Please try again.", "error");
        }
      }
    );
  };

  const bulkMarkFilled = () => {
    confirmDelete(
      `Mark ${selectedIds.size} listing${selectedIds.size > 1 ? "s" : ""} as filled?`,
      async () => {
        try {
          await Promise.all([...selectedIds].map((id) => markListingStatus(id, "filled")));
          ["my-listings", "jobs", "rooms", "events", "notices", "home-jobs", "home-rooms", "home-events", "home-notices", "home-featured", "listings"].forEach(
            (k) => queryClient.invalidateQueries({ queryKey: [k] })
          );
          clearSelection();
          addToast("Listings marked as filled.", "success");
        } catch {
          addToast("Failed to update some listings. Please try again.", "error");
        }
      },
      "Yes, Mark filled",
      "#534AB7"
    );
  };

  /* ── modal helpers ── */
  const confirmDelete = (message, fn, confirmLabel = "Yes, Delete", confirmColor = "#A32D2D") =>
    setConfirmModal({
      message,
      confirmLabel,
      confirmColor,
      onConfirm: () => {
        setConfirmModal(null);
        fn();
      },
      onCancel: () => setConfirmModal(null),
    });

  /* ── render a single listing card (used by all three groups) ── */
  const renderListingCard = (listing) => {
    const typeColor = TYPE_COLORS[listing.listing_type] || TYPE_COLORS.job;
    const statusColor = STATUS_COLORS[listing.status] || STATUS_COLORS.active;
    const ListingTypeIcon = TYPE_ICONS[listing.listing_type] || StorefrontIcon;
    const expiring = isExpiringSoon(listing.expires_at) && listing.status === "active";
    const isExpired = listing.status === "expired";
    const isArchive = listing.status === "filled" || isExpired;

    const borderLeft = listing.is_under_review
      ? "3px solid #E87722"
      : expiring
        ? "3px solid #E87722"
        : isExpired
          ? "3px solid #ccc"
          : listing.status === "filled"
            ? "3px solid #aaa"
            : `3px solid ${statusColor.dot}`;

    return (
      <div
        key={listing.id}
        style={{
          background: isArchive ? "#F9F8F5" : "#fff",
          border: "0.5px solid #e5e5e5",
          borderRadius: "12px",
          padding: "16px",
          display: "flex",
          gap: "12px",
          alignItems: "flex-start",
          borderLeft,
          opacity: isExpired ? 0.72 : 1,
          transition: "transform 0.2s, box-shadow 0.2s, border-color 0.15s",
        }}
        onMouseEnter={(e) => {
          if (!isArchive) {
            e.currentTarget.style.borderColor = "#AFA9EC";
            e.currentTarget.style.transform = "translateY(-3px)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(83,74,183,0.10)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#e5e5e5";
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }}
        onTouchStart={(e) => {
          if (!isArchive) {
            e.currentTarget.style.transform = "translateY(-3px)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(83,74,183,0.10)";
          }
        }}
        onTouchEnd={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {/* Checkbox (not on archive cards) */}
        {!isArchive && (
          <input
            type="checkbox"
            checked={selectedIds.has(listing.id)}
            onChange={() => toggleSelect(listing.id)}
            onClick={(e) => e.stopPropagation()}
            style={{ width: "15px", height: "15px", flexShrink: 0, cursor: "pointer", accentColor: "#534AB7", marginTop: "2px" }}
          />
        )}

        {/* Type icon */}
        <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: typeColor.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <ListingTypeIcon size={20} weight="duotone" color={typeColor.color} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title + badges */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px", flexWrap: "wrap" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#26215C", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {listing.title}
            </h3>
            <span style={{ background: statusColor.bg, color: statusColor.color, fontSize: "10px", fontWeight: 600, padding: "2px 9px", borderRadius: "20px", whiteSpace: "nowrap" }}>
              ● {listing.status}
            </span>
            {listing.is_featured && (
              <span style={{ background: "#FFF1E0", color: "#E87722", fontSize: "10px", fontWeight: 600, padding: "2px 9px", borderRadius: "20px", whiteSpace: "nowrap", border: "0.5px solid #EFD9C0" }}>
                ⭐ Featured
              </span>
            )}
            {listing.is_under_review && (
              <span style={{ background: "#FFF8E0", color: "#8B6914", fontSize: "10px", fontWeight: 600, padding: "2px 9px", borderRadius: "20px", whiteSpace: "nowrap", border: "0.5px solid #E8D5A0", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                <ClockIcon size={10} weight="fill" color="currentColor" style={{ flexShrink: 0 }} />Under Review
              </span>
            )}
            {listing.is_reported && !listing.is_under_review && (
              <span title="A user has reported this listing. Our team will review it." style={{ background: "#FEECEC", color: "#A32D2D", fontSize: "10px", fontWeight: 600, padding: "2px 9px", borderRadius: "20px", whiteSpace: "nowrap", border: "0.5px solid #F09595", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                <FlagIcon size={10} weight="fill" color="currentColor" style={{ flexShrink: 0 }} />Reported
              </span>
            )}
            {expiring && (
              <span style={{ background: "#FFF1E0", color: "#633806", fontSize: "10px", fontWeight: 600, padding: "2px 9px", borderRadius: "20px", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                <WarningIcon size={10} weight="fill" color="currentColor" style={{ flexShrink: 0 }} />Expires soon
              </span>
            )}
          </div>

          {/* Meta */}
          <div style={{ fontSize: "12px", color: "#888", marginBottom: "6px", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "4px" }}>
            <span style={{ background: typeColor.bg, color: typeColor.color, fontSize: "10px", fontWeight: 500, padding: "1px 7px", borderRadius: "8px" }}>
              {listing.listing_type}
            </span>
            <MapPinIcon size={11} weight="fill" color="#E87722" style={{ flexShrink: 0 }} />{listing.location}, {listing.state}
            {listing.view_count > 0 && (
              <span style={{ marginLeft: "8px", display: "inline-flex", alignItems: "center", gap: "2px" }}>· <EyeIcon size={11} weight="regular" color="#aaa" style={{ flexShrink: 0 }} />{listing.view_count} views</span>
            )}
          </div>

          {/* Dates */}
          <div style={{ fontSize: "11px", color: "#aaa" }}>
            Posted {fmtDate(listing.created_at)}
            {listing.expires_at && (
              <span style={{ color: expiring ? "#E87722" : "#aaa" }}>
                {" "}· {isExpired ? "Expired" : "Expires"} {fmtDate(listing.expires_at)}
              </span>
            )}
          </div>

          {/* Renew pill — for expiring/expired */}
          {(expiring || isExpired) && (
            listing.is_under_review || listing.renewal_blocked ? (
              <span title={listing.is_under_review ? "Under review — cannot renew" : "Renewal restricted"} style={{ marginTop: "8px", display: "inline-flex", alignItems: "center", gap: "3px", background: "#FFF1E0", color: "#E87722", border: "0.5px solid #EFD9C0", borderRadius: "20px", padding: "4px 12px", fontSize: "11px", fontWeight: 600 }}>
                <ProhibitIcon size={11} weight="fill" color="currentColor" style={{ flexShrink: 0 }} />Renewal blocked
              </span>
            ) : (
              <button onClick={() => renewMutation.mutate(listing.id)} disabled={renewMutation.isPending} style={{ marginTop: "8px", background: "#EEEDFE", color: "#534AB7", border: "none", borderRadius: "20px", padding: "4px 12px", fontSize: "11px", fontWeight: 600, cursor: "pointer", opacity: renewMutation.isPending ? 0.6 : 1, display: "inline-flex", alignItems: "center", gap: "3px" }}>
                <ArrowsClockwiseIcon size={11} weight="regular" color="currentColor" style={{ flexShrink: 0 }} />Renew for 30 days
              </button>
            )
          )}
        </div>

        {/* ⋮ menu */}
        <ActionMenu
          open={openMenu === listing.id}
          onToggle={() => setOpenMenu(openMenu === listing.id ? null : listing.id)}
          items={[
            { icon: <EyeIcon size={14} weight="regular" />, label: "View listing", onClick: () => { setOpenMenu(null); navigate(getDetailPath(listing)); } },
            { icon: <PencilSimpleIcon size={14} weight="regular" />, label: "Edit listing", onClick: () => { setOpenMenu(null); navigate(`/edit-listing/${listing.slug}`); } },
            (listing.status === "active" || listing.status === "expired") && !listing.is_under_review && !listing.is_reported && !listing.renewal_blocked && {
              icon: <ArrowsClockwiseIcon size={14} weight="regular" />, label: "Renew 30 days", highlight: true,
              onClick: () => { setOpenMenu(null); renewMutation.mutate(listing.id); },
            },
            listing.status === "active" && !listing.is_featured && !listing.is_under_review && !listing.is_reported && {
              label: "⭐ Feature listing — $9.99",
              onClick: () => { setOpenMenu(null); featureMutation.mutate(listing.id); },
            },
            listing.is_featured && {
              icon: <ReceiptIcon size={14} weight="regular" />, label: "Download invoice",
              onClick: () => { setOpenMenu(null); downloadInvoice(listing.id, `NepSaathi-Invoice-${listing.id}.pdf`); },
            },
            listing.status === "active" && {
              icon: <CheckCircleIcon size={14} weight="regular" />, label: "Mark as filled",
              onClick: () => {
                setOpenMenu(null);
                confirmDelete(`Mark "${listing.title}" as filled/taken?`, () => markStatusMutation.mutate({ id: listing.id, status: "filled" }), "Yes, Mark filled", "#534AB7");
              },
            },
            listing.status === "filled" && {
              label: "↺ Reopen listing",
              onClick: () => {
                setOpenMenu(null);
                confirmDelete(`Reopen "${listing.title}" as active?`, () => markStatusMutation.mutate({ id: listing.id, status: "active" }), "Yes, Reopen", "#534AB7");
              },
            },
            {
              icon: <TrashIcon size={14} weight="regular" />, label: "Delete listing", danger: true,
              onClick: () => {
                setOpenMenu(null);
                confirmDelete("This listing will be permanently deleted.", () => { setDeletingId(listing.id); deleteListingMutation.mutate(listing.slug); });
              },
            },
          ].filter(Boolean)}
        />
      </div>
    );
  };

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
            { key: "analytics", label: "Analytics", count: null },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => {
                setActiveTab(key);
                setOpenMenu(null);
              }}
              style={{
                flex: 1,
                minWidth: "fit-content",
                background: activeTab === key ? "#26215C" : "transparent",
                border: "none",
                borderRadius: "8px",
                padding: "8px 12px",
                fontSize: "13px",
                fontWeight: activeTab === key ? 600 : 400,
                color: activeTab === key ? "#fff" : "#888",
                cursor: "pointer",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              {label}
              {count !== null && (
                <span style={{
                  marginLeft: "5px",
                  background: activeTab === key ? "rgba(255,255,255,0.25)" : "#f0f0f0",
                  color: activeTab === key ? "#fff" : "#666",
                  borderRadius: "10px",
                  padding: "1px 6px",
                  fontSize: "11px",
                  fontWeight: 600,
                }}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ══ LISTINGS TAB ══ */}
        {activeTab === "listings" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

            {/* Select all + floating bulk bar */}
            {selectableListings.length > 0 && (
              <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#888", cursor: "pointer", userSelect: "none", alignSelf: "flex-start" }}>
                <input
                  type="checkbox"
                  checked={selectableListings.length > 0 && selectableListings.every((l) => selectedIds.has(l.id))}
                  onChange={(e) => e.target.checked ? selectAllActive() : clearSelection()}
                  style={{ width: "15px", height: "15px", cursor: "pointer", accentColor: "#534AB7" }}
                />
                Select all
              </label>
            )}
            <style>{`
              @keyframes slideDown { from { transform: translateX(-50%) translateY(-20px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }
            `}</style>
            {selectedIds.size > 0 && (
              <div style={{ position: "fixed", top: "80px", left: "50%", transform: "translateX(-50%)", background: "#fff", borderRadius: "16px", padding: "10px 16px", display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 4px 24px rgba(0,0,0,0.14)", border: "0.5px solid #e5e5e5", zIndex: 1000, animation: "slideDown 0.2s ease", whiteSpace: "nowrap", maxWidth: "calc(100vw - 32px)", overflowX: "auto" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#26215C" }}>{selectedIds.size} selected</span>
                <div style={{ width: "1px", height: "20px", background: "#e5e5e5" }} />
                <button onClick={bulkMarkFilled} style={{ background: "#F0EFF9", color: "#534AB7", border: "none", borderRadius: "9px", padding: "7px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}><CheckCircleIcon size={13} weight="regular" color="currentColor" /> Mark filled</button>
                <button onClick={bulkDelete} style={{ background: "#FCEBEB", color: "#A32D2D", border: "none", borderRadius: "9px", padding: "7px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}><TrashIcon size={13} weight="regular" color="currentColor" /> Delete</button>
                <button onClick={clearSelection} style={{ background: "none", border: "none", color: "#aaa", fontSize: "20px", cursor: "pointer", lineHeight: 1, padding: "0 2px" }}>×</button>
              </div>
            )}

            {listingsLoading && [1, 2, 3].map((i) => <SkeletonCard key={i} />)}

            {/* Empty state */}
            {!listingsLoading && allListings.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px", background: "#fff", borderRadius: "16px", border: "0.5px solid #e5e5e5" }}>
                <div style={{ marginBottom: "14px" }}><MegaphoneIcon size={36} weight="duotone" color="#534AB7" style={{ opacity: 0.4 }} /></div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#26215C", marginBottom: "6px" }}>No listings yet</h3>
                <p style={{ fontSize: "14px", color: "#888", marginBottom: "20px" }}>Post a job, room, event or notice for free</p>
                <button onClick={() => navigate("/post-ad")} style={{ background: "#534AB7", color: "#fff", border: "none", borderRadius: "9px", padding: "11px 24px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                  Post your first ad →
                </button>
              </div>
            )}

            {/* ── Group: Needs Attention ── */}
            {!listingsLoading && needsAttention.length > 0 && (
              <>
                <SectionHeader icon={<WarningIcon size={11} weight="fill" color="#8B4800" />} label="Needs attention" count={needsAttention.length} accent="#8B4800" bg="#FFF1E0" line="#EFD9C0" />
                {needsAttention.map((listing) => renderListingCard(listing))}
              </>
            )}

            {/* ── Group: Active ── */}
            {!listingsLoading && activeListings.length > 0 && (
              <>
                {needsAttention.length > 0 && (
                  <SectionHeader icon={<CheckCircleIcon size={11} weight="fill" color="#085041" />} label="Active" count={activeListings.length} accent="#085041" bg="#E1F5EE" line="#B6DCC7" />
                )}
                {activeListings.map((listing) => renderListingCard(listing))}
              </>
            )}

            {/* ── Group: Archive ── */}
            {!listingsLoading && archiveListings.length > 0 && (
              <>
                <SectionHeader
                  icon={<ArchiveIcon size={11} weight="fill" color="#666" />} label="Archive" count={archiveListings.length}
                  accent="#666" bg="#F1EFE8" line="#e5e5e5"
                  collapsible open={archiveOpen} onToggle={() => setArchiveOpen((v) => !v)}
                />
                {archiveOpen && archiveListings.map((listing) => renderListingCard(listing))}
              </>
            )}
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
                <StorefrontIcon size={36} weight="duotone" color="#534AB7" style={{ marginBottom: "14px", opacity: 0.6 }} />
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
              const catColor = CATEGORY_COLORS[business.category] || CATEGORY_COLORS.other;
              const BizCatIcon = CATEGORY_ICONS[business.category] || PushPinIcon;
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
                    transition: "transform 0.2s, box-shadow 0.2s, border-color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#FAC775";
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e5e5e5";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  onTouchStart={(e) => {
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.08)";
                  }}
                  onTouchEnd={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
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
                      flexShrink: 0,
                    }}
                  >
                    <BizCatIcon size={22} weight="duotone" color={catColor.color} />
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
                        <span style={{ background: "#E1F5EE", color: "#085041", fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "20px", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                          <SealCheckIcon size={10} weight="fill" color="#085041" /> Verified
                        </span>
                      ) : (
                        <span style={{ background: "#FAEEDA", color: "#633806", fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "20px" }}>
                          Pending verification
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "12px", color: "#888", display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
                      <span
                        style={{
                          background: catColor.bg,
                          color: catColor.color,
                          fontSize: "10px",
                          fontWeight: 500,
                          padding: "1px 7px",
                          borderRadius: "8px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                        }}
                      >
                        <BizCatIcon size={10} weight="fill" color={catColor.color} style={{ flexShrink: 0 }} />{business.category?.replace("_", " ")}
                      </span>
                      <MapPinIcon size={11} weight="fill" color="#E87722" style={{ flexShrink: 0 }} />{business.suburb}, {business.state}
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
                        icon: <EyeIcon size={14} weight="regular" />, label: "View business",
                        onClick: () => {
                          setOpenMenu(null);
                          navigate(`/businesses/${business.slug}`);
                        },
                      },
                      {
                        icon: <PencilSimpleIcon size={14} weight="regular" />, label: "Edit business",
                        onClick: () => {
                          setOpenMenu(null);
                          navigate(`/businesses/${business.slug}`, { state: { editMode: true } });
                        },
                      },
                      {
                        icon: <TrashIcon size={14} weight="regular" />, label: "Remove business",
                        danger: true,
                        onClick: () => {
                          setOpenMenu(null);
                          confirmDelete(
                            "This business will be removed from NepSaathi.",
                            () => {
                              setDeletingId(business.id);
                              deleteBusinessMutation.mutate(business.slug);
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
                <div style={{ marginBottom: "14px" }}><HeartIcon size={36} weight="duotone" color="#534AB7" style={{ opacity: 0.4 }} /></div>
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
              const SavedTypeIcon = TYPE_ICONS[item.listing_type] || StorefrontIcon;
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
                      flexShrink: 0,
                    }}
                  >
                    <SavedTypeIcon size={20} weight="duotone" color={typeColor.color} />
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
                    <p style={{ fontSize: "12px", color: "#888", margin: 0, display: "flex", alignItems: "center", gap: "3px" }}>
                      <MapPinIcon size={11} weight="fill" color="#E87722" />{item.listing_location}, {item.listing_state}
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

        {/* ══ ANALYTICS TAB ══ */}
        {activeTab === "analytics" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {analyticsLoading && [1, 2, 3].map((i) => <SkeletonCard key={i} />)}

            {!analyticsLoading && (!analyticsData || analyticsData.length === 0) && (
              <div style={{ textAlign: "center", padding: "48px", background: "#fff", borderRadius: "16px", border: "0.5px solid #e5e5e5" }}>
                <div style={{ marginBottom: "14px" }}><ChartBarIcon size={36} weight="duotone" color="#534AB7" /></div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#26215C", marginBottom: "6px" }}>No listings yet</h3>
                <p style={{ fontSize: "14px", color: "#888" }}>Post a listing to start seeing views, saves, and messages.</p>
              </div>
            )}

            {analyticsData && analyticsData.length > 0 && (
              <>
                {/* Summary totals */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "10px", marginBottom: "4px" }}>
                  {[
                    { label: "Total Views", value: analyticsData.reduce((s, l) => s + l.views, 0), Icon: EyeIcon, color: "#6C3FD6" },
                    { label: "Total Saves", value: analyticsData.reduce((s, l) => s + l.saves, 0), Icon: HeartIcon, color: "#e11d48" },
                    { label: "Total Messages", value: analyticsData.reduce((s, l) => s + l.messages, 0), Icon: ChatDotsIcon, color: "#0284c7" },
                    { label: "Active Listings", value: analyticsData.filter(l => l.status === "active").length, Icon: CheckCircleIcon, color: "#16a34a" },
                  ].map(({ label, value, Icon: StatIcon, color }) => (
                    <div key={label} style={{ background: "#fff", border: "0.5px solid #e5e5e5", borderRadius: "12px", padding: "14px 16px", textAlign: "center" }}>
                      <div style={{ marginBottom: "4px", display: "flex", justifyContent: "center" }}><StatIcon size={22} weight="duotone" color={color} /></div>
                      <div style={{ fontSize: "22px", fontWeight: 800, color }}>{value}</div>
                      <div style={{ fontSize: "11px", color: "#888", marginTop: "2px", fontWeight: 500 }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* Per-listing rows */}
                {analyticsData.map((l) => {
                  const typeColor = TYPE_COLORS[l.listing_type] || TYPE_COLORS.job;
                  const ListingTypeIcon = TYPE_ICONS[l.listing_type] || PushPinIcon;
                  const totalEngagement = l.views + l.saves * 3 + l.messages * 5;
                  const tip =
                    l.views === 0 ? "No views yet — try adding more photos or a clearer title." :
                    l.messages === 0 && l.views > 10 ? "People are looking but not messaging — check your contact details." :
                    l.saves > 0 && l.messages === 0 ? "Saved by people but no messages — consider adding a WhatsApp number." :
                    null;

                  return (
                    <div key={l.id} style={{ background: "#fff", border: "0.5px solid #e5e5e5", borderRadius: "12px", padding: "16px", borderLeft: `3px solid ${typeColor.dot || "#534AB7"}` }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "12px" }}>
                        <ListingTypeIcon size={18} weight="duotone" color={typeColor.color} style={{ flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "14px", fontWeight: 700, color: "#1e1e2e", marginBottom: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.title}</div>
                          <div style={{ fontSize: "12px", color: "#888" }}>{l.location} · {l.status}</div>
                        </div>
                        <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "6px", background: l.status === "active" ? "#f0fdf4" : "#f5f5f5", color: l.status === "active" ? "#16a34a" : "#888", flexShrink: 0 }}>
                          {l.status}
                        </span>
                      </div>

                      {/* Stats row */}
                      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                        {[
                          { Icon: EyeIcon, label: "Views", value: l.views, color: "#6C3FD6" },
                          { Icon: HeartIcon, label: "Saves", value: l.saves, color: "#e11d48" },
                          { Icon: ChatDotsIcon, label: "Messages", value: l.messages, color: "#0284c7" },
                        ].map(({ Icon: StatIcon, label, value, color }) => (
                          <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <StatIcon size={14} weight="duotone" color={color} />
                            <span style={{ fontSize: "18px", fontWeight: 700, color }}>{value}</span>
                            <span style={{ fontSize: "11px", color: "#aaa", fontWeight: 500 }}>{label}</span>
                          </div>
                        ))}
                      </div>

                      {/* Engagement bar */}
                      {l.views > 0 && (
                        <div style={{ marginTop: "10px" }}>
                          <div style={{ height: "4px", background: "#f0f0f0", borderRadius: "4px", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${Math.min(100, totalEngagement / 2)}%`, background: "linear-gradient(90deg, #6C3FD6, #4F46E5)", borderRadius: "4px", transition: "width 0.5s" }} />
                          </div>
                        </div>
                      )}

                      {/* Tip */}
                      {tip && (
                        <div style={{ marginTop: "10px", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "8px", padding: "8px 12px", fontSize: "12px", color: "#9a3412", display: "flex", gap: "8px", alignItems: "flex-start" }}>
                          <LightbulbIcon size={12} weight="fill" color="#c2410c" style={{ flexShrink: 0, marginTop: "1px" }} />
                          <span>{tip}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
