import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyListings, deleteListing } from "../../api/listings";
import { getMyBusinesses, deleteBusiness } from "../../api/businesses";
import useAuthStore from "../../store/authStore";
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

export default function MyListingsPage() {
  usePageTitle("My Listings");
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("listings");
  const [deletingId, setDeletingId] = useState(null);

  // Fetch my listings
  const { data: listingsData, isLoading: listingsLoading } = useQuery({
    queryKey: ["my-listings"],
    queryFn: getMyListings,
  });

  // Fetch my businesses
  const { data: businessesData, isLoading: businessesLoading } = useQuery({
    queryKey: ["my-businesses"],
    queryFn: getMyBusinesses,
  });

  // Delete listing mutation
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

  // Delete business mutation
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

  const handleDeleteListing = (id) => {
    if (window.confirm("Are you sure you want to delete this listing?")) {
      setDeletingId(id);
      deleteListingMutation.mutate(id);
    }
  };

  const handleDeleteBusiness = (id) => {
    if (window.confirm("Are you sure you want to remove this business?")) {
      setDeletingId(id);
      deleteBusinessMutation.mutate(id);
    }
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

  const listings = (listingsData?.results || []).filter(
    (l) => l.status !== "deleted",
  );
  const businesses = (businessesData?.results || []).filter(
    (b) => b.is_active !== false,
  );

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "28px" }}>
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
              style={{ textAlign: "center", padding: "40px", color: "#888" }}
            >
              Loading your listings...
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
                  }}
                >
                  {/* Type icon */}
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

                  {/* Content */}
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
                    </div>
                    <p style={{ fontSize: "12px", color: "#888" }}>
                      📍 {listing.location}, {listing.state} · Posted{" "}
                      {new Date(listing.created_at).toLocaleDateString("en-AU")}
                    </p>
                  </div>

                  {/* Actions */}
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
              style={{ textAlign: "center", padding: "40px", color: "#888" }}
            >
              Loading your businesses...
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
                }}
              >
                {/* Icon */}
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

                {/* Content */}
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
                    {business.is_verified && (
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
                    )}
                    {!business.is_verified && (
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

                {/* Actions */}
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
    </div>
  );
}
