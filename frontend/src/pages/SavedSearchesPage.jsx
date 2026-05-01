import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSavedSearches, deleteSavedSearch, updateSavedSearch } from "../api/listings";
import { useToast } from "../components/ui/Toast";

const TYPE_LABELS = {
  job: { label: "Jobs", emoji: "💼", color: "#EEEDFE" },
  room: { label: "Rooms", emoji: "🏠", color: "#FFF1E0" },
  event: { label: "Events", emoji: "🎉", color: "#E1F5EE" },
  announcement: { label: "Announcements", emoji: "📢", color: "#F5F4F0" },
};

export default function SavedSearchesPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data: searches = [], isLoading } = useQuery({
    queryKey: ["saved-searches"],
    queryFn: getSavedSearches,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSavedSearch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-searches"] });
      addToast("Search alert deleted.", "success");
    },
    onError: () => addToast("Failed to delete. Please try again.", "error"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => updateSavedSearch(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved-searches"] }),
    onError: () => addToast("Failed to update alert. Please try again.", "error"),
  });

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#26215C", margin: "0 0 6px" }}>
          Saved Search Alerts
        </h1>
        <p style={{ fontSize: 13, color: "#888", margin: 0 }}>
          Get email alerts when new listings matching your saved searches are posted.
        </p>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 68, borderRadius: 12, background: "#e8e8e8", animation: "pulse 1.5s infinite" }} />
          ))}
        </div>
      ) : searches.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#888" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#26215C", marginBottom: 6 }}>No saved searches yet</div>
          <div style={{ fontSize: 13 }}>
            Browse listings and click <strong>"Save this search"</strong> to get email alerts for new matches.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {searches.map((s) => {
            const type = TYPE_LABELS[s.listing_type] || { label: s.listing_type, emoji: "📋", color: "#F5F4F0" };
            const filters = s.filters || {};
            const filterParts = [];
            if (filters.search) filterParts.push(`"${filters.search}"`);
            if (filters.state) filterParts.push(filters.state);

            return (
              <div key={s.id} style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 16px",
                background: s.is_active ? "#fff" : "#fafafa",
                border: `1px solid ${s.is_active ? "#e8e8e8" : "#f0f0f0"}`,
                borderRadius: 12,
                opacity: s.is_active ? 1 : 0.6,
              }}>
                {/* Type icon */}
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: type.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  flexShrink: 0,
                }}>
                  {type.emoji}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#26215C" }}>
                    {s.label || type.label}
                  </div>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                    {filterParts.length > 0 ? filterParts.join(" · ") : "All listings"}
                    {s.last_notified && (
                      <span style={{ marginLeft: 6 }}>
                        · Last alerted: {new Date(s.last_notified).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => toggleMutation.mutate({ id: s.id, is_active: !s.is_active })}
                    style={{
                      fontSize: 12,
                      padding: "4px 10px",
                      borderRadius: 6,
                      border: "1px solid #e0e0e0",
                      background: s.is_active ? "#E1F5EE" : "#F5F4F0",
                      color: s.is_active ? "#085041" : "#888",
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                  >
                    {s.is_active ? "Active" : "Paused"}
                  </button>
                  <button
                    onClick={() => { if (confirm("Delete this search alert?")) deleteMutation.mutate(s.id); }}
                    style={{
                      fontSize: 12,
                      padding: "4px 10px",
                      borderRadius: 6,
                      border: "1px solid #f0c0c0",
                      background: "transparent",
                      color: "#A32D2D",
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}
