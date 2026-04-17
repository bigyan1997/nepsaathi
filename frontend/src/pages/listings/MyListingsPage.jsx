import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyListings,
  deleteListing,
  getSavedListings,
  unsaveListing,
} from "../../api/listings";
import { getMyBusinesses, deleteBusiness } from "../../api/businesses";
import { SkeletonCard } from "../../components/ui/Skeleton";
import usePageTitle from "../../hooks/usePageTitle";
import { useToast } from "../../components/ui/Toast";

const STATUS_COLORS = {
  active: { bg: "#E1F5EE", color: "#085041" },
  expired: { bg: "#F1EFE8", color: "#444441" },
  filled: { bg: "#FAEEDA", color: "#633806" },
  deleted: { bg: "#FCEBEB", color: "#A32D2D" },
};

const TYPE_COLORS = {
  job: { bg: "#EEEDFE", color: "#3C3489" },
  room: { bg: "#FFF1E0", color: "#633806" },
  event: { bg: "#E1F5EE", color: "#085041" },
  announcement: { bg: "#E6F1FB", color: "#0C447C" },
};

const TYPE_EMOJIS = {
  job: "💼",
  room: "🏠",
  event: "🎉",
  announcement: "📢",
};

// Confirmation modal component
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <>
      <div
        onClick={onCancel}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          zIndex: 200,
        }}
      />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "#fff",
          borderRadius: "14px",
          padding: "28px",
          width: "100%",
          maxWidth: "380px",
          zIndex: 201,
          boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "32px", marginBottom: "12px" }}>⚠️</div>
        <h3
          style={{
            fontSize: "16px",
            fontWeight: 600,
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
              borderRadius: "8px",
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
              borderRadius: "8px",
              padding: "11px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Yes, delete
          </button>
        </div>
      </div>
    </>
  );
}

export default function MyListingsPage() {
  usePageTitle("My Listings");
  const navigate = useNavigate();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("listings");
  const [deletingId, setDeletingId] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

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

  const deleteListingMutation = useMutation({
    mutationFn: deleteListing,
    onSuccess: () => {
      queryClient.invalidateQueries(["my-listings"]);
      queryClient.invalidateQueries(["jobs"]);
      queryClient.invalidateQueries(["rooms"]);
      queryClient.invalidateQueries(["events"]);
      queryClient.invalidateQueries(["announcements"]);
      queryClient.invalidateQueries(["home-jobs"]);
      queryClient.invalidateQueries(["home-rooms"]);
      queryClient.invalidateQueries(["home-events"]);
      setDeletingId(null);
      addToast("Listing deleted successfully!", "success");
    },
    onError: () => {
      setDeletingId(null);
      addToast("Failed to delete listing. Please try again.", "error");
    },
  });

  const deleteBusinessMutation = useMutation({
    mutationFn: deleteBusiness,
    onSuccess: () => {
      queryClient.invalidateQueries(["my-businesses"]);
      queryClient.invalidateQueries(["businesses"]);
      setDeletingId(null);
      addToast("Business removed successfully!", "success");
    },
    onError: () => {
      setDeletingId(null);
      addToast("Failed to remove business. Please try again.", "error");
    },
  });

  const unsaveMutation = useMutation({
    mutationFn: unsaveListing,
    onSuccess: () => {
      queryClient.invalidateQueries(["saved-listings"]);
      addToast("Removed from saved listings.", "info");
    },
    onError: () => {
      addToast("Failed to remove. Please try again.", "error");
    },
  });

  const handleDeleteListing = (id) => {
    setConfirmModal({
      message: "This listing will be permanently deleted.",
      onConfirm: () => {
        setConfirmModal(null);
        setDeletingId(id);
        deleteListingMutation.mutate(id);
      },
      onCancel: () => setConfirmModal(null),
    });
  };

  const handleDeleteBusiness = (id) => {
    setConfirmModal({
      message: "This business will be removed from NepSaathi.",
      onConfirm: () => {
        setConfirmModal(null);
        setDeletingId(id);
        deleteBusinessMutation.mutate(id);
      },
      onCancel: () => setConfirmModal(null),
    });
  };

  const getDetailPath = (listing) => {
    switch (listing.listing_type) {
      case "job":
        return `/jobs/listing/${listing.id}`;
      case "room":
        return `/rooms/listing/${listing.id}`;
      case "event":
        return `/events/listing/${listing.id}`;
      case "announcement":
        return `/announcements/listing/${listing.id}`;
      default:
        return "/";
    }
  };

  const getSavedPath = (saved) => {
    switch (saved.listing_type) {
      case "job":
        return `/jobs/listing/${saved.listing}`;
      case "room":
        return `/rooms/listing/${saved.listing}`;
      case "event":
        return `/events/listing/${saved.listing}`;
      case "announcement":
        return `/announcements/listing/${saved.listing}`;
      default:
        return "/";
    }
  };

  const listings = (listingsData?.results || []).filter(
    (l) => l.status !== "deleted",
  );
  const businesses = (businessesData?.results || []).filter(
    (b) => b.is_active !== false,
  );
  const saved = savedData?.results || [];

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "28px" }}>
      {/* Confirm modal */}
      {confirmModal && (
        <ConfirmModal
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={confirmModal.onCancel}
        />
      )}

      {/* Header */}
      <div
        style={{
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "26px",
              fontWeight: 600,
              color: "#26215C",
              marginBottom: "6px",
            }}
          >
            My listings
          </h1>
          <p style={{ fontSize: "14px", color: "#888" }}>
            Everything you've posted on NepSaathi
          </p>
        </div>
        <button
          onClick={() => navigate("/post-ad")}
          style={{
            background: "#E87722",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "10px 20px",
            fontSize: "13px",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          + Post new ad
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          marginBottom: "24px",
          background: "#F5F4F0",
          padding: "4px",
          borderRadius: "10px",
          width: "fit-content",
        }}
      >
        {[
          { key: "listings", label: `Listings (${listings.length})` },
          { key: "businesses", label: `Businesses (${businesses.length})` },
          { key: "saved", label: `Saved (${saved.length})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              background: activeTab === key ? "#fff" : "transparent",
              border: activeTab === key ? "0.5px solid #e5e5e5" : "none",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: activeTab === key ? 500 : 400,
              color: activeTab === key ? "#26215C" : "#888",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── LISTINGS TAB ── */}
      {activeTab === "listings" && (
        <div>
          {listingsLoading && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {!listingsLoading && listings.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "48px",
                background: "#fff",
                borderRadius: "14px",
                border: "0.5px solid #e5e5e5",
              }}
            >
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>📭</div>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
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
                Post a job, room, event or announcement for free
              </p>
              <button
                onClick={() => navigate("/post-ad")}
                style={{
                  background: "#534AB7",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 24px",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Post your first ad →
              </button>
            </div>
          )}

          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {listings.map((listing) => {
              const typeColor =
                TYPE_COLORS[listing.listing_type] || TYPE_COLORS.job;
              const statusColor =
                STATUS_COLORS[listing.status] || STATUS_COLORS.active;
              const typeEmoji = TYPE_EMOJIS[listing.listing_type] || "📌";
              const isExpiringSoon =
                listing.expires_at &&
                new Date(listing.expires_at) - new Date() <
                  1000 * 60 * 60 * 24 * 5;

              return (
                <div
                  key={listing.id}
                  style={{
                    background: "#fff",
                    border: "0.5px solid #e5e5e5",
                    borderRadius: "12px",
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = "#AFA9EC")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = "#e5e5e5")
                  }
                >
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "10px",
                      background: typeColor.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
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
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {listing.title}
                      </h3>
                      <span
                        style={{
                          background: typeColor.bg,
                          color: typeColor.color,
                          fontSize: "10px",
                          fontWeight: 500,
                          padding: "2px 8px",
                          borderRadius: "8px",
                          flexShrink: 0,
                        }}
                      >
                        {listing.listing_type}
                      </span>
                      <span
                        style={{
                          background: statusColor.bg,
                          color: statusColor.color,
                          fontSize: "10px",
                          fontWeight: 500,
                          padding: "2px 8px",
                          borderRadius: "8px",
                          flexShrink: 0,
                        }}
                      >
                        {listing.status}
                      </span>
                      {isExpiringSoon && (
                        <span
                          style={{
                            background: "#FFF1E0",
                            color: "#633806",
                            fontSize: "10px",
                            fontWeight: 500,
                            padding: "2px 8px",
                            borderRadius: "8px",
                            flexShrink: 0,
                          }}
                        >
                          ⚠️ Expiring soon
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: "12px", color: "#888" }}>
                      📍 {listing.location}, {listing.state} · Posted{" "}
                      {new Date(listing.created_at).toLocaleDateString("en-AU")}
                      {listing.expires_at && (
                        <span
                          style={{
                            marginLeft: "8px",
                            color: isExpiringSoon ? "#E87722" : "#aaa",
                          }}
                        >
                          · Expires{" "}
                          {new Date(listing.expires_at).toLocaleDateString(
                            "en-AU",
                          )}
                        </span>
                      )}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                    <button
                      onClick={() => navigate(getDetailPath(listing))}
                      style={{
                        background: "#EEEDFE",
                        color: "#534AB7",
                        border: "none",
                        borderRadius: "7px",
                        padding: "7px 14px",
                        fontSize: "12px",
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDeleteListing(listing.id)}
                      disabled={deletingId === listing.id}
                      style={{
                        background: "#FCEBEB",
                        color: "#A32D2D",
                        border: "none",
                        borderRadius: "7px",
                        padding: "7px 14px",
                        fontSize: "12px",
                        fontWeight: 500,
                        cursor: "pointer",
                        opacity: deletingId === listing.id ? 0.6 : 1,
                      }}
                    >
                      {deletingId === listing.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── BUSINESSES TAB ── */}
      {activeTab === "businesses" && (
        <div>
          {businessesLoading && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {!businessesLoading && businesses.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "48px",
                background: "#fff",
                borderRadius: "14px",
                border: "0.5px solid #e5e5e5",
              }}
            >
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>🏪</div>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
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
                  borderRadius: "8px",
                  padding: "10px 24px",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Register your business →
              </button>
            </div>
          )}

          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {businesses.map((business) => (
              <div
                key={business.id}
                style={{
                  background: "#fff",
                  border: "0.5px solid #e5e5e5",
                  borderRadius: "12px",
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "#AFA9EC")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "#e5e5e5")
                }
              >
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "10px",
                    background: "#FFF1E0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                    flexShrink: 0,
                  }}
                >
                  🏪
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
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {business.business_name}
                    </h3>
                    {business.is_verified ? (
                      <span
                        style={{
                          background: "#E1F5EE",
                          color: "#085041",
                          fontSize: "10px",
                          fontWeight: 500,
                          padding: "2px 8px",
                          borderRadius: "8px",
                        }}
                      >
                        ✓ Verified
                      </span>
                    ) : (
                      <span
                        style={{
                          background: "#FAEEDA",
                          color: "#633806",
                          fontSize: "10px",
                          fontWeight: 500,
                          padding: "2px 8px",
                          borderRadius: "8px",
                        }}
                      >
                        Pending verification
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: "12px", color: "#888" }}>
                    {business.category?.replace("_", " ")} · 📍{" "}
                    {business.suburb}, {business.state}
                  </p>
                </div>

                <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                  <button
                    onClick={() => navigate(`/businesses/${business.id}`)}
                    style={{
                      background: "#EEEDFE",
                      color: "#534AB7",
                      border: "none",
                      borderRadius: "7px",
                      padding: "7px 14px",
                      fontSize: "12px",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDeleteBusiness(business.id)}
                    disabled={deletingId === business.id}
                    style={{
                      background: "#FCEBEB",
                      color: "#A32D2D",
                      border: "none",
                      borderRadius: "7px",
                      padding: "7px 14px",
                      fontSize: "12px",
                      fontWeight: 500,
                      cursor: "pointer",
                      opacity: deletingId === business.id ? 0.6 : 1,
                    }}
                  >
                    {deletingId === business.id ? "Removing..." : "Remove"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SAVED TAB ── */}
      {activeTab === "saved" && (
        <div>
          {savedLoading && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {!savedLoading && saved.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "48px",
                background: "#fff",
                borderRadius: "14px",
                border: "0.5px solid #e5e5e5",
              }}
            >
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>🤍</div>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#26215C",
                  marginBottom: "6px",
                }}
              >
                No saved listings yet
              </h3>
              <p style={{ fontSize: "14px", color: "#888" }}>
                Click the heart button on any listing to save it
              </p>
            </div>
          )}

          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {saved.map((item) => {
              const typeColor =
                TYPE_COLORS[item.listing_type] || TYPE_COLORS.job;
              const typeEmoji = TYPE_EMOJIS[item.listing_type] || "📌";

              return (
                <div
                  key={item.id}
                  style={{
                    background: "#fff",
                    border: "0.5px solid #e5e5e5",
                    borderRadius: "12px",
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = "#AFA9EC")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = "#e5e5e5")
                  }
                >
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "10px",
                      background: typeColor.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
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
                        gap: "8px",
                        marginBottom: "4px",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#26215C",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.listing_title}
                      </h3>
                      <span
                        style={{
                          background: typeColor.bg,
                          color: typeColor.color,
                          fontSize: "10px",
                          fontWeight: 500,
                          padding: "2px 8px",
                          borderRadius: "8px",
                          flexShrink: 0,
                        }}
                      >
                        {item.listing_type}
                      </span>
                      {item.listing_status === "expired" && (
                        <span
                          style={{
                            background: "#F1EFE8",
                            color: "#444441",
                            fontSize: "10px",
                            fontWeight: 500,
                            padding: "2px 8px",
                            borderRadius: "8px",
                            flexShrink: 0,
                          }}
                        >
                          Expired
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: "12px", color: "#888" }}>
                      📍 {item.listing_location}, {item.listing_state}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                    <button
                      onClick={() => navigate(getSavedPath(item))}
                      style={{
                        background: "#EEEDFE",
                        color: "#534AB7",
                        border: "none",
                        borderRadius: "7px",
                        padding: "7px 14px",
                        fontSize: "12px",
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      View
                    </button>
                    <button
                      onClick={() => unsaveMutation.mutate(item.listing)}
                      disabled={unsaveMutation.isPending}
                      style={{
                        background: "#FCEBEB",
                        color: "#A32D2D",
                        border: "none",
                        borderRadius: "7px",
                        padding: "7px 14px",
                        fontSize: "12px",
                        fontWeight: 500,
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
          </div>
        </div>
      )}
    </div>
  );
}
