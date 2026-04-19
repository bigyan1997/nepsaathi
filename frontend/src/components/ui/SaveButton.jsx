import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { saveListing, unsaveListing, checkSaved } from "../../api/listings";
import { useToast } from "./Toast";
import useAuthStore from "../../store/authStore";
import { useNavigate } from "react-router-dom";

export default function SaveButton({ listingId, compact = false }) {
  const { isAuthenticated } = useAuthStore();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Check if already saved
  const { data: savedData } = useQuery({
    queryKey: ["saved", listingId],
    queryFn: () => checkSaved(listingId),
    enabled: isAuthenticated,
  });

  const isSaved = savedData?.is_saved || false;

  const saveMutation = useMutation({
    mutationFn: () =>
      isSaved ? unsaveListing(listingId) : saveListing(listingId),
    onSuccess: (data) => {
      queryClient.invalidateQueries(["saved", listingId]);
      queryClient.invalidateQueries(["saved-listings"]);
      addToast(
        data.is_saved ? "Listing saved! ❤️" : "Listing removed from saved.",
        data.is_saved ? "success" : "info",
      );
    },
    onError: () => {
      addToast("Something went wrong. Please try again.", "error");
    },
  });

  const handleClick = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    saveMutation.mutate();
  };

  return (
    <button
      onClick={handleClick}
      disabled={saveMutation.isPending}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        background: isSaved ? "#FCEBEB" : "#F5F4F0",
        border: `0.5px solid ${isSaved ? "#F09595" : "#e5e5e5"}`,
        borderRadius: "8px",
        padding: compact ? "9px 12px" : "9px 16px",
        fontSize: "13px",
        fontWeight: 500,
        color: isSaved ? "#A32D2D" : "#555",
        cursor: saveMutation.isPending ? "not-allowed" : "pointer",
        transition: "all 0.15s",
        opacity: saveMutation.isPending ? 0.7 : 1,
      }}
      onMouseEnter={(e) => {
        if (!saveMutation.isPending) {
          e.currentTarget.style.background = isSaved ? "#FCEBEB" : "#FFF1E0";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = isSaved ? "#FCEBEB" : "#F5F4F0";
      }}
    >
      <span style={{ fontSize: "16px" }}>{isSaved ? "❤️" : "🤍"}</span>
      {!compact && (isSaved ? "Saved" : "Save")}
    </button>
  );
}
