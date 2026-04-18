import { useState, useEffect } from "react";
import { deleteAccount } from "../api/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProfile, updateProfile } from "../api/auth";
import useAuthStore from "../store/authStore";
import usePageTitle from "../hooks/usePageTitle";
import { useToast } from "../components/ui/Toast";
import { useNavigate } from "react-router-dom";

const inputStyle = {
  width: "100%",
  border: "0.5px solid #ccc",
  borderRadius: "8px",
  padding: "10px 14px",
  fontSize: "14px",
  outline: "none",
  background: "#fff",
  color: "#333",
};

const labelStyle = {
  fontSize: "13px",
  fontWeight: 500,
  color: "#444",
  display: "block",
  marginBottom: "6px",
};

export default function ProfilePage() {
  usePageTitle("Profile Settings");
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    location: "",
    bio: "",
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
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

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      queryClient.invalidateQueries(["profile"]);
      updateUser(data);
      addToast("Profile updated successfully!", "success");
    },
    onError: (err) => {
      const errors = err.response?.data;
      if (errors) {
        const firstError = Object.values(errors)[0];
        addToast(
          Array.isArray(firstError) ? firstError[0] : firstError,
          "error",
        );
      } else {
        addToast("Something went wrong. Please try again.", "error");
      }
    },
  });

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

  if (isLoading)
    return (
      <div style={{ textAlign: "center", padding: "60px", color: "#888" }}>
        Loading profile...
      </div>
    );

  return (
    <div style={{ maxWidth: "620px", margin: "0 auto", padding: "28px" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 600,
            color: "#26215C",
            marginBottom: "6px",
          }}
        >
          Profile settings
        </h1>
        <p style={{ fontSize: "13px", color: "#888" }}>
          Update your NepSaathi profile
        </p>
      </div>

      {/* Avatar section */}
      <div
        style={{
          background: "#fff",
          border: "0.5px solid #e5e5e5",
          borderRadius: "14px",
          padding: "24px",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          gap: "20px",
        }}
      >
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background: "#534AB7",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "28px",
            fontWeight: 600,
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          {profile?.google_avatar ? (
            <img
              src={profile.google_avatar}
              alt={profile.first_name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            form.first_name?.[0]?.toUpperCase() ||
            user?.first_name?.[0]?.toUpperCase()
          )}
        </div>
        <div>
          <div
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: "#26215C",
              marginBottom: "4px",
            }}
          >
            {form.first_name} {form.last_name}
          </div>
          <div style={{ fontSize: "13px", color: "#888", marginBottom: "4px" }}>
            {profile?.email}
          </div>
          {profile?.is_verified && (
            <span
              style={{
                background: "#E1F5EE",
                color: "#085041",
                fontSize: "11px",
                fontWeight: 500,
                padding: "2px 8px",
                borderRadius: "8px",
              }}
            >
              ✓ Verified
            </span>
          )}
        </div>
      </div>

      {/* Profile form */}
      <div
        style={{
          background: "#fff",
          border: "0.5px solid #e5e5e5",
          borderRadius: "14px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <h2 style={{ fontSize: "15px", fontWeight: 600, color: "#26215C" }}>
          Personal info
        </h2>

        {/* Name */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          <div>
            <label style={labelStyle}>First name *</label>
            <input
              style={inputStyle}
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              placeholder="Bigyan"
            />
          </div>
          <div>
            <label style={labelStyle}>Last name *</label>
            <input
              style={inputStyle}
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              placeholder="Karki"
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
              color: "#888",
              cursor: "not-allowed",
            }}
            value={profile?.email || ""}
            disabled
          />
          <p style={{ fontSize: "11px", color: "#aaa", marginTop: "4px" }}>
            Email cannot be changed
          </p>
        </div>

        {/* Phone */}
        <div>
          <label style={labelStyle}>Phone number</label>
          <input
            style={inputStyle}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="e.g. 0412 345 678"
          />
        </div>

        {/* Location */}
        <div>
          <label style={labelStyle}>Location</label>
          <input
            style={inputStyle}
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="e.g. Parramatta, Sydney"
          />
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
          <p style={{ fontSize: "11px", color: "#aaa", marginTop: "4px" }}>
            {form.bio.length}/500 characters
          </p>
        </div>

        {/* Save button */}
        <button
          onClick={handleSubmit}
          disabled={updateMutation.isPending}
          style={{
            background: updateMutation.isPending ? "#ccc" : "#534AB7",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "12px",
            fontSize: "14px",
            fontWeight: 500,
            cursor: updateMutation.isPending ? "not-allowed" : "pointer",
          }}
        >
          {updateMutation.isPending ? "Saving..." : "Save changes"}
        </button>
      </div>

      {/* Account info */}
      <div
        style={{
          background: "#fff",
          border: "0.5px solid #e5e5e5",
          borderRadius: "14px",
          padding: "24px",
          marginTop: "16px",
        }}
      >
        <h2
          style={{
            fontSize: "15px",
            fontWeight: 600,
            color: "#26215C",
            marginBottom: "16px",
          }}
        >
          Account info
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}
        >
          {[
            {
              label: "Member since",
              value: profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString("en-AU", {
                    month: "long",
                    year: "numeric",
                  })
                : "—",
            },
            {
              label: "Account status",
              value: profile?.is_verified ? "✓ Verified" : "Active",
            },
          ].map(({ label, value }) => (
            <div key={label}>
              <div
                style={{
                  fontSize: "11px",
                  color: "#aaa",
                  marginBottom: "3px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {label}
              </div>
              <div style={{ fontSize: "14px", color: "#333", fontWeight: 500 }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div
        style={{
          background: "#fff",
          border: "0.5px solid #F09595",
          borderRadius: "14px",
          padding: "24px",
          marginTop: "16px",
        }}
      >
        <h2
          style={{
            fontSize: "15px",
            fontWeight: 600,
            color: "#A32D2D",
            marginBottom: "6px",
          }}
        >
          Danger zone
        </h2>
        <p style={{ fontSize: "13px", color: "#888", marginBottom: "14px" }}>
          Once you delete your account all your listings and data will be
          permanently removed.
        </p>

        {!showDeleteConfirm ? (
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
            }}
          >
            Delete account
          </button>
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
                fontWeight: 500,
              }}
            >
              ⚠️ Are you absolutely sure? This cannot be undone!
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
                  fontWeight: 500,
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
  );
}
