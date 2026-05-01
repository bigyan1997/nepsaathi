import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSavedSearch } from "../../api/listings";
import useAuthStore from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import { useToast } from "./Toast";

export default function SaveSearchButton({ listingType, filters = {} }) {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [saved, setSaved] = useState(false);

  const mutation = useMutation({
    mutationFn: () => createSavedSearch({
      listing_type: listingType,
      filters,
      label: "",
    }),
    onSuccess: () => {
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ["saved-searches"] });
      addToast("Search alert saved! You'll get emails for new matches. 🔔", "success");
    },
    onError: (err) => {
      const msg = err?.response?.data?.non_field_errors?.[0]
        || err?.response?.data?.detail
        || "Failed to save search.";
      addToast(msg, "error");
    },
  });

  const handleClick = () => {
    if (!isAuthenticated) { navigate("/login"); return; }
    if (saved || mutation.isPending) return;
    mutation.mutate();
  };

  return (
    <button
      onClick={handleClick}
      disabled={saved || mutation.isPending}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        background: saved ? "#E1F5EE" : "#F5F4F0",
        border: `0.5px solid ${saved ? "#9FE1CB" : "#e5e5e5"}`,
        borderRadius: "8px",
        padding: "8px 14px",
        fontSize: "12px",
        fontWeight: 500,
        color: saved ? "#085041" : "#555",
        cursor: saved || mutation.isPending ? "default" : "pointer",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => { if (!saved && !mutation.isPending) e.currentTarget.style.background = "#EEEDFE"; }}
      onMouseLeave={(e) => { if (!saved) e.currentTarget.style.background = "#F5F4F0"; }}
    >
      <span style={{ fontSize: "13px" }}>{saved ? "✅" : "🔔"}</span>
      {saved ? "Alert saved" : mutation.isPending ? "Saving..." : "Save this search"}
    </button>
  );
}
