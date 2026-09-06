import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import usePageMeta from "../hooks/usePageMeta";
import { getWhatsAppGroups } from "../api/visa";
import { UsersIcon, GraduationCapIcon, BriefcaseIcon, HouseIcon, StorefrontIcon, SunIcon, FootballIcon, UserIcon, ChatDotsIcon, MapPinIcon, MegaphoneIcon } from "@phosphor-icons/react";

const AU_STATES = [
  { value: "", label: "All states" },
  { value: "NSW", label: "NSW" },
  { value: "VIC", label: "VIC" },
  { value: "QLD", label: "QLD" },
  { value: "WA", label: "WA" },
  { value: "SA", label: "SA" },
  { value: "TAS", label: "TAS" },
  { value: "ACT", label: "ACT" },
  { value: "NT", label: "NT" },
];

const CATEGORIES = [
  { value: "", label: "All categories" },
  { value: "general", label: "General Community" },
  { value: "students", label: "Students" },
  { value: "jobs", label: "Jobs & Work" },
  { value: "accommodation", label: "Accommodation" },
  { value: "business", label: "Business" },
  { value: "religion", label: "Religion & Culture" },
  { value: "sports", label: "Sports & Fitness" },
  { value: "women", label: "Women" },
  { value: "other", label: "Other" },
];

const CATEGORY_ICONS = {
  general:       UsersIcon,
  students:      GraduationCapIcon,
  jobs:          BriefcaseIcon,
  accommodation: HouseIcon,
  business:      StorefrontIcon,
  religion:      SunIcon,
  sports:        FootballIcon,
  women:         UserIcon,
  other:         ChatDotsIcon,
};

function SelectInput({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        border: "1.5px solid #ddd",
        borderRadius: "9px",
        padding: "9px 14px",
        fontSize: "13px",
        background: "#fff",
        cursor: "pointer",
        fontFamily: "inherit",
        color: "#333",
        outline: "none",
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function GroupCard({ group }) {
  const CatIcon = CATEGORY_ICONS[group.category] || ChatDotsIcon;
  return (
    <div style={{
      background: "#fff",
      border: "1.5px solid #e8e6f8",
      borderRadius: "14px",
      padding: "18px 20px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
    }}>
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", flex: 1 }}>
          <div style={{
            width: "44px", height: "44px", borderRadius: "12px",
            background: "#EEEDFE", display: "flex", alignItems: "center",
            justifyContent: "center", flexShrink: 0,
          }}>
            <CatIcon size={22} weight="duotone" color="#534AB7" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              <span style={{ fontWeight: 700, fontSize: "14.5px", color: "#26215C" }}>{group.name}</span>
              {group.is_verified && (
                <span style={{ background: "#dcfce7", color: "#16a34a", fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "20px", letterSpacing: ".04em" }}>
                  ✓ VERIFIED
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "5px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "12px", color: "#666", display: "inline-flex", alignItems: "center", gap: "3px" }}><MapPinIcon size={12} weight="fill" color="#E87722" />{group.city}, {group.state}</span>
              <span style={{ fontSize: "12px", color: "#666", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                <CatIcon size={12} weight="regular" color="#666" /> {CATEGORIES.find((c) => c.value === group.category)?.label || group.category}
              </span>
              {group.member_count && (
                <span style={{ fontSize: "12px", color: "#666", display: "inline-flex", alignItems: "center", gap: "3px" }}><UsersIcon size={12} weight="regular" color="#666" />{group.member_count} members</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {group.description && (
        <p style={{ margin: 0, fontSize: "13px", color: "#555", lineHeight: 1.5 }}>{group.description}</p>
      )}

      <a
        href={group.link}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          background: "#25D366",
          color: "#fff",
          textDecoration: "none",
          borderRadius: "10px",
          padding: "10px 20px",
          fontSize: "13.5px",
          fontWeight: 600,
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        Join Group
      </a>
    </div>
  );
}

export default function WhatsAppGroupsPage() {
  const [state, setState] = useState("");
  const [category, setCategory] = useState("");

  usePageMeta(
    "Nepali Community WhatsApp Groups Australia — NepSaathi",
    "Find verified Nepali Australian WhatsApp community groups by city, state, and category.",
    "nepali whatsapp group australia, nepali community sydney melbourne brisbane"
  );

  const { data, isLoading } = useQuery({
    queryKey: ["whatsapp-groups", state, category],
    queryFn: () => getWhatsAppGroups({ state, category }),
    staleTime: 1000 * 60 * 10,
  });
  const groups = data?.results ?? data ?? [];

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "32px 16px 64px" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "#25D366", marginBottom: "8px" }}>
          Community Groups
        </div>
        <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#26215C", letterSpacing: "-.02em", margin: "0 0 10px" }}>
          Nepali WhatsApp Groups in Australia
        </h1>
        <p style={{ fontSize: "14px", color: "#666", margin: 0, lineHeight: 1.6 }}>
          Verified community WhatsApp groups for Nepali Australians — by city, state, and interest.
          Groups marked <strong style={{ color: "#16a34a" }}>✓ VERIFIED</strong> have been confirmed by the NepSaathi team.
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "24px" }}>
        <SelectInput value={state} onChange={setState} options={AU_STATES} />
        <SelectInput value={category} onChange={setCategory} options={CATEGORIES} />
      </div>

      {/* Submit a group callout */}
      <div style={{
        background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: "12px",
        padding: "14px 18px", marginBottom: "24px",
        display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap",
      }}>
        <MegaphoneIcon size={20} weight="duotone" color="#15803d" />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: "13.5px", color: "#15803d" }}>Know a group that should be listed?</div>
          <div style={{ fontSize: "12.5px", color: "#166534", marginTop: "2px" }}>
            Use the <a href="/contact" style={{ color: "#16a34a", fontWeight: 600 }}>contact page</a> to submit a group for verification. We review all submissions before listing.
          </div>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div style={{ color: "#888", fontSize: "14px", padding: "20px 0" }}>Loading groups…</div>
      ) : groups.length === 0 ? (
        <div style={{ background: "#fff", border: "1.5px solid #e8e6f8", borderRadius: "14px", padding: "48px", textAlign: "center" }}>
          <ChatDotsIcon size={36} weight="duotone" color="#534AB7" style={{ marginBottom: "12px", opacity: 0.6 }} />
          <div style={{ fontWeight: 700, fontSize: "15px", color: "#26215C", marginBottom: "6px" }}>No groups listed yet</div>
          <div style={{ fontSize: "13px", color: "#888" }}>
            Groups are added by the NepSaathi team. Use the <a href="/contact" style={{ color: "#534AB7" }}>contact page</a> to suggest one.
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "14px" }}>
          {groups.map((g) => <GroupCard key={g.id} group={g} />)}
        </div>
      )}
    </div>
  );
}
