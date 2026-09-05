import { useState, useEffect } from "react";
import { deleteAccount, changePassword } from "../api/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProfile, updateProfile } from "../api/auth";
import { getMyListings, getSavedListings } from "../api/listings";
import useAuthStore from "../store/authStore";
import usePageTitle from "../hooks/usePageTitle";
import { useToast } from "../components/ui/Toast";
import { friendlyError } from "../utils/axios";
import { useNavigate } from "react-router-dom";
import VerifiedBadge from "../components/ui/VerifiedBadge";
import { ClipboardTextIcon, PlusIcon, WarningIcon } from "@phosphor-icons/react";

const inputStyle = {
  width: "100%",
  border: "0.5px solid #ddd",
  borderRadius: "8px",
  padding: "10px 14px",
  fontSize: "13px",
  outline: "none",
  background: "#fff",
  color: "#26215C",
  boxSizing: "border-box",
};

const labelStyle = {
  fontSize: "12px",
  fontWeight: 600,
  color: "#555",
  display: "block",
  marginBottom: "5px",
};

export default function ProfilePage() {
  usePageTitle("Profile Settings");
  const navigate = useNavigate();
  const { logout, user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pwForm, setPwForm] = useState({ old_password: "", new_password1: "", new_password2: "" });

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    location: "",
    bio: "",
  });

  /* ── queries ── */
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
  });

  const { data: listingsData } = useQuery({
    queryKey: ["my-listings"],
    queryFn: getMyListings,
  });

  const { data: savedData } = useQuery({
    queryKey: ["saved-listings"],
    queryFn: getSavedListings,
  });

  useEffect(() => {
    if (profile) {
      setForm({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        phone: profile.phone || "",
        location: profile.location || "",
        bio: profile.bio || "",
      });
    }
  }, [profile]);

  /* ── mutations ── */
  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      updateUser(data);
      addToast("Profile updated successfully!", "success");
    },
    onError: (err) => {
      addToast(friendlyError(err) || "Something went wrong. Please try again.", "error");
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setPwForm({ old_password: "", new_password1: "", new_password2: "" });
      addToast("Password changed successfully!", "success");
    },
    onError: (err) => {
      addToast(friendlyError(err) || "Something went wrong. Please try again.", "error");
    },
  });

  const handleChangePassword = () => {
    if (!pwForm.old_password || !pwForm.new_password1 || !pwForm.new_password2) {
      addToast("All password fields are required.", "error");
      return;
    }
    if (pwForm.new_password1 !== pwForm.new_password2) {
      addToast("New passwords do not match.", "error");
      return;
    }
    if (pwForm.new_password1.length < 8) {
      addToast("New password must be at least 8 characters.", "error");
      return;
    }
    changePasswordMutation.mutate(pwForm);
  };

  const deleteAccountMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      logout();
      navigate("/");
      addToast("Your account has been permanently deleted.", "info");
    },
    onError: () => {
      addToast(
        "Failed to delete account. Please contact support@nepsaathi.com",
        "error",
      );
    },
  });

  const handleSubmit = () => {
    if (!form.first_name || !form.last_name) {
      addToast("First name and last name are required.", "error");
      return;
    }
    updateMutation.mutate(form);
  };

  /* ── derived stats ── */
  const allListings = (listingsData?.results || []).filter(
    (l) => l.status !== "deleted",
  );
  const totalViews = allListings.reduce((s, l) => s + (l.view_count || 0), 0);
  const savedCount = savedData?.results?.length || 0;

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-AU", {
        month: "long",
        year: "numeric",
      })
    : "—";

  const initial = (
    form.first_name?.[0] ||
    user?.first_name?.[0] ||
    "?"
  ).toUpperCase();

  if (isLoading)
    return (
      <div style={{ textAlign: "center", padding: "60px", color: "#888" }}>
        Loading profile...
      </div>
    );

  return (
    <>
      <style>{`
        .prof-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .prof-stats  { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .prof-links  { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        @media (max-width: 600px) {
          .prof-grid-2 { grid-template-columns: 1fr !important; }
          .prof-stats  { grid-template-columns: repeat(2, 1fr) !important; }
          .prof-links  { grid-template-columns: 1fr !important; }
          .prof-outer  { padding: 12px !important; }
        }
      `}</style>

      <div
        className="prof-outer"
        style={{
          maxWidth: "680px",
          margin: "0 auto",
          padding: "28px",
          background: "#F5F4F0",
          minHeight: "100vh",
        }}
      >
        {/* ── Dark hero banner ── */}
        <div
          style={{
            background: "#26215C",
            borderRadius: "16px",
            padding: "28px",
            marginBottom: "14px",
            display: "flex",
            alignItems: "center",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "#534AB7",
              border: "3px solid #AFA9EC",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              fontWeight: 700,
              color: "#fff",
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            {profile?.google_avatar ? (
              <img
                src={profile.google_avatar}
                alt={form.first_name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              initial
            )}
          </div>

          {/* Name + badges */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "#fff",
                marginBottom: "4px",
                display: "flex",
                alignItems: "center",
                gap: "7px",
                flexWrap: "wrap",
              }}
            >
              {form.first_name} {form.last_name}
              {profile?.is_verified && <VerifiedBadge size={20} />}
            </div>
            <div
              style={{
                fontSize: "13px",
                color: "#AFA9EC",
                marginBottom: "10px",
              }}
            >
              {profile?.email}
            </div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {profile?.is_verified && (
                <span
                  style={{
                    background: "#E1F5EE",
                    color: "#085041",
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "3px 10px",
                    borderRadius: "20px",
                  }}
                >
                  ✓ Verified
                </span>
              )}
              <span
                style={{
                  background: "#EEEDFE",
                  color: "#3C3489",
                  fontSize: "11px",
                  fontWeight: 500,
                  padding: "3px 10px",
                  borderRadius: "20px",
                }}
              >
                Member since {memberSince}
              </span>
              {profile?.google_avatar && (
                <span
                  style={{
                    background: "#FFF1E0",
                    color: "#633806",
                    fontSize: "11px",
                    fontWeight: 500,
                    padding: "3px 10px",
                    borderRadius: "20px",
                  }}
                >
                  G Google
                </span>
              )}
            </div>
          </div>

          {/* Save button — promoted to top */}
          <button
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            style={{
              background: updateMutation.isPending ? "#AFA9EC" : "#E87722",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              padding: "11px 22px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: updateMutation.isPending ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {updateMutation.isPending ? "Saving..." : "Save changes"}
          </button>
        </div>

        {/* ── Stat cards ── */}
        <div className="prof-stats" style={{ marginBottom: "14px" }}>
          {[
            {
              label: "Listings",
              value: allListings.length,
              sub: "posted by you",
              accent: "#534AB7",
            },
            {
              label: "Total views",
              value: totalViews,
              sub: "across all listings",
              accent: "#1D9E75",
            },
            {
              label: "Saved",
              value: savedCount,
              sub: "by you",
              accent: "#E87722",
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

        {/* ── Quick links ── */}
        <div className="prof-links" style={{ marginBottom: "14px" }}>
          <div
            onClick={() => navigate("/my-listings")}
            style={{
              background: "#EEEDFE",
              border: "0.5px solid #AFA9EC",
              borderRadius: "12px",
              padding: "16px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              cursor: "pointer",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <ClipboardTextIcon size={26} weight="duotone" color="#534AB7" style={{ flexShrink: 0 }} />
            <div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#26215C",
                  marginBottom: "2px",
                }}
              >
                My listings
              </div>
              <div style={{ fontSize: "11px", color: "#534AB7" }}>
                View and manage your ads
              </div>
            </div>
          </div>
          <div
            onClick={() => navigate("/post-ad")}
            style={{
              background: "#FFF1E0",
              border: "0.5px solid #EFD9C0",
              borderRadius: "12px",
              padding: "16px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              cursor: "pointer",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <PlusIcon size={26} weight="bold" color="#E87722" style={{ flexShrink: 0 }} />
            <div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#26215C",
                  marginBottom: "2px",
                }}
              >
                Post a free ad
              </div>
              <div style={{ fontSize: "11px", color: "#E87722" }}>
                Job, room, event or notice
              </div>
            </div>
          </div>
        </div>

        {/* ── Personal info form ── */}
        <div
          style={{
            background: "#fff",
            border: "0.5px solid #e5e5e5",
            borderRadius: "16px",
            overflow: "hidden",
            marginBottom: "14px",
          }}
        >
          <div style={{ background: "#26215C", padding: "14px 20px" }}>
            <h2
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#fff",
                margin: 0,
              }}
            >
              Personal info
            </h2>
          </div>
          <div
            style={{
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            {/* First + Last name */}
            <div className="prof-grid-2">
              <div>
                <label style={labelStyle}>First name *</label>
                <input
                  style={inputStyle}
                  value={form.first_name}
                  onChange={(e) =>
                    setForm({ ...form, first_name: e.target.value })
                  }
                  placeholder="First name"
                />
              </div>
              <div>
                <label style={labelStyle}>Last name *</label>
                <input
                  style={inputStyle}
                  value={form.last_name}
                  onChange={(e) =>
                    setForm({ ...form, last_name: e.target.value })
                  }
                  placeholder="Last name"
                />
              </div>
            </div>

            {/* Email — read only */}
            <div>
              <label style={labelStyle}>Email</label>
              <input
                style={{
                  ...inputStyle,
                  background: "#F5F4F0",
                  color: "#aaa",
                  cursor: "not-allowed",
                }}
                value={`${profile?.email || ""}`}
                disabled
              />
            </div>

            {/* Phone + Location */}
            <div className="prof-grid-2">
              <div>
                <label style={labelStyle}>Phone number</label>
                <input
                  style={inputStyle}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="e.g. 0412 345 678"
                />
              </div>
              <div>
                <label style={labelStyle}>Location</label>
                <input
                  style={inputStyle}
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  placeholder="e.g. Parramatta, Sydney"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label style={labelStyle}>Bio</label>
              <textarea
                style={{ ...inputStyle, minHeight: "90px", resize: "vertical" }}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Tell the community a little about yourself..."
                maxLength={500}
              />
              <div
                style={{
                  fontSize: "11px",
                  color: form.bio.length > 450 ? "#E87722" : "#ccc",
                  marginTop: "4px",
                  textAlign: "right",
                }}
              >
                {form.bio.length}/500
              </div>
            </div>

            {/* Save button — also at bottom of form for convenience */}
            <button
              onClick={handleSubmit}
              disabled={updateMutation.isPending}
              style={{
                background: updateMutation.isPending ? "#ccc" : "#534AB7",
                color: "#fff",
                border: "none",
                borderRadius: "9px",
                padding: "12px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: updateMutation.isPending ? "not-allowed" : "pointer",
              }}
            >
              {updateMutation.isPending ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>

        {/* ── Account info ── */}
        <div
          style={{
            background: "#fff",
            border: "0.5px solid #e5e5e5",
            borderRadius: "16px",
            overflow: "hidden",
            marginBottom: "14px",
          }}
        >
          <div
            style={{
              background: "#EEEDFE",
              borderBottom: "0.5px solid #AFA9EC",
              padding: "14px 20px",
            }}
          >
            <h2
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#3C3489",
                margin: 0,
              }}
            >
              Account info
            </h2>
          </div>
          <div style={{ padding: "20px" }}>
            <div className="prof-grid-2">
              {[
                { label: "Member since", value: memberSince },
                {
                  label: "Account status",
                  value: profile?.is_verified ? "✓ Verified" : "Active",
                },
                {
                  label: "Login method",
                  value: profile?.google_avatar
                    ? "Google sign-in"
                    : "Email & password",
                },
                { label: "Email", value: profile?.email || "—" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#534AB7",
                      marginBottom: "4px",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      fontWeight: 700,
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#26215C",
                      fontWeight: 600,
                    }}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Security / Change password ── */}
        {!profile?.google_avatar && (
          <div
            style={{
              background: "#fff",
              border: "0.5px solid #e5e5e5",
              borderRadius: "16px",
              overflow: "hidden",
              marginBottom: "14px",
            }}
          >
            <div style={{ background: "#26215C", padding: "14px 20px" }}>
              <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#fff", margin: 0 }}>
                Change password
              </h2>
            </div>
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={labelStyle}>Current password</label>
                <input
                  type="password"
                  style={inputStyle}
                  value={pwForm.old_password}
                  onChange={(e) => setPwForm({ ...pwForm, old_password: e.target.value })}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                />
              </div>
              <div className="prof-grid-2">
                <div>
                  <label style={labelStyle}>New password</label>
                  <input
                    type="password"
                    style={inputStyle}
                    value={pwForm.new_password1}
                    onChange={(e) => setPwForm({ ...pwForm, new_password1: e.target.value })}
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Confirm new password</label>
                  <input
                    type="password"
                    style={inputStyle}
                    value={pwForm.new_password2}
                    onChange={(e) => setPwForm({ ...pwForm, new_password2: e.target.value })}
                    placeholder="Repeat new password"
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <button
                onClick={handleChangePassword}
                disabled={changePasswordMutation.isPending}
                style={{
                  background: changePasswordMutation.isPending ? "#ccc" : "#534AB7",
                  color: "#fff",
                  border: "none",
                  borderRadius: "9px",
                  padding: "12px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: changePasswordMutation.isPending ? "not-allowed" : "pointer",
                }}
              >
                {changePasswordMutation.isPending ? "Saving..." : "Update password"}
              </button>
            </div>
          </div>
        )}

        {/* ── Danger zone ── */}
        <div
          style={{
            background: "#fff",
            border: "0.5px solid #F09595",
            borderRadius: "16px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              background: "#FCEBEB",
              borderBottom: "0.5px solid #F09595",
              padding: "14px 20px",
            }}
          >
            <h2
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#A32D2D",
                margin: 0,
              }}
            >
              Danger zone
            </h2>
          </div>
          <div style={{ padding: "20px" }}>
            {!showDeleteConfirm ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#26215C",
                      marginBottom: "3px",
                    }}
                  >
                    Delete your account
                  </div>
                  <div style={{ fontSize: "12px", color: "#888" }}>
                    All your listings and data will be permanently removed.
                  </div>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  style={{
                    background: "transparent",
                    color: "#A32D2D",
                    border: "0.5px solid #F09595",
                    borderRadius: "8px",
                    padding: "9px 18px",
                    fontSize: "13px",
                    cursor: "pointer",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                  }}
                >
                  Delete account
                </button>
              </div>
            ) : (
              <div
                style={{
                  background: "#FCEBEB",
                  border: "0.5px solid #F09595",
                  borderRadius: "10px",
                  padding: "16px",
                }}
              >
                <p
                  style={{
                    fontSize: "13px",
                    color: "#A32D2D",
                    marginBottom: "14px",
                    fontWeight: 600,
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}><WarningIcon size={14} weight="fill" color="#A32D2D" style={{ flexShrink: 0 }} />Are you absolutely sure? This cannot be undone!</span>
                </p>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    style={{
                      flex: 1,
                      background: "#fff",
                      color: "#555",
                      border: "0.5px solid #ccc",
                      borderRadius: "8px",
                      padding: "10px",
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteAccountMutation.mutate()}
                    disabled={deleteAccountMutation.isPending}
                    style={{
                      flex: 1,
                      background: "#A32D2D",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      padding: "10px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                      opacity: deleteAccountMutation.isPending ? 0.6 : 1,
                    }}
                  >
                    {deleteAccountMutation.isPending
                      ? "Deleting..."
                      : "Yes, delete forever"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
