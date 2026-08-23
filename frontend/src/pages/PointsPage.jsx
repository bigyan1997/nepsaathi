import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMyPoints } from "../api/auth";
import usePageTitle from "../hooks/usePageTitle";
import useAuthStore from "../store/authStore";
import { Link } from "react-router-dom";
import { ConfettiIcon, ClipboardTextIcon, HandshakeIcon, CheckCircleIcon, StarIcon } from "@phosphor-icons/react";

const EVENT_ICONS = {
  signup:           ConfettiIcon,
  post_ad:          ClipboardTextIcon,
  referral:         HandshakeIcon,
  profile_complete: CheckCircleIcon,
};

const HOW_TO_EARN = [
  { Icon: ConfettiIcon,    label: "Join NepSaathi", points: 10, desc: "Awarded automatically when you create your account." },
  { Icon: ClipboardTextIcon, label: "Post a listing", points: 5,  desc: "Each job, room, event or notice you post earns you 5 pts." },
  { Icon: HandshakeIcon,   label: "Refer a friend", points: 25, desc: "Share your referral link. You earn 25 pts when they sign up." },
];

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

export default function PointsPage() {
  usePageTitle("Points & Referrals — NepSaathi");
  const { isAuthenticated } = useAuthStore();
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["my-points"],
    queryFn: getMyPoints,
    enabled: isAuthenticated,
    staleTime: 60000,
  });

  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: "500px", margin: "60px auto", padding: "0 20px", textAlign: "center" }}>
        <div style={{ marginBottom: "14px" }}><StarIcon size={48} weight="duotone" color="#534AB7" /></div>
        <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#26215C", marginBottom: "8px" }}>Points & Referrals</h1>
        <p style={{ fontSize: "14px", color: "#666", marginBottom: "20px" }}>Sign in to see your points and referral link.</p>
        <Link to="/login" style={{ background: "#26215C", color: "#fff", borderRadius: "10px", padding: "11px 24px", fontSize: "14px", fontWeight: 700, textDecoration: "none" }}>
          Sign In
        </Link>
      </div>
    );
  }

  const referralLink = data
    ? `${window.location.origin}/register?ref=${data.referral_code}`
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto", padding: "24px 16px" }}>
      <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#26215C", margin: "0 0 20px" }}>Points & Referrals</h1>

      {/* Balance card */}
      <div style={{ background: "#26215C", borderRadius: "16px", padding: "28px", marginBottom: "16px", textAlign: "center" }}>
        {isLoading ? (
          <div style={{ height: "60px", background: "rgba(255,255,255,0.1)", borderRadius: "10px", animation: "pulse 1.5s infinite" }} />
        ) : (
          <>
            <div style={{ fontSize: "52px", fontWeight: 900, color: "#fff", lineHeight: 1 }}>{data?.points ?? 0}</div>
            <div style={{ fontSize: "15px", color: "#AFA9EC", marginTop: "6px" }}>community points</div>
          </>
        )}
      </div>

      {/* Referral card */}
      <div style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: "14px", padding: "20px", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#26215C", margin: "0 0 6px" }}>Your Referral Link</h2>
        <p style={{ fontSize: "13px", color: "#666", margin: "0 0 12px" }}>
          Share this with friends. When they sign up using your link, you both benefit — you earn <strong>25 points</strong>.
        </p>
        {isLoading ? (
          <div style={{ background: "#f5f5f5", borderRadius: "8px", height: "40px", animation: "pulse 1.5s infinite" }} />
        ) : (
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <div style={{ flex: 1, background: "#f8f8f8", border: "1px solid #e5e5e5", borderRadius: "8px", padding: "9px 12px", fontSize: "12px", color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {referralLink}
            </div>
            <button
              onClick={copyLink}
              style={{ background: copied ? "#1D9E75" : "#534AB7", color: "#fff", border: "none", borderRadius: "8px", padding: "9px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", transition: "background 0.2s" }}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        )}
      </div>

      {/* How to earn */}
      <div style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: "14px", padding: "20px", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#26215C", margin: "0 0 14px" }}>How to Earn Points</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {HOW_TO_EARN.map((item) => (
            <div key={item.label} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <item.Icon size={22} weight="duotone" color="#534AB7" style={{ flexShrink: 0, marginTop: "1px" }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#26215C" }}>{item.label}</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#1D9E75" }}>+{item.points} pts</span>
                </div>
                <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      <div style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: "14px", padding: "20px" }}>
        <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#26215C", margin: "0 0 14px" }}>
          Recent Activity {data?.events?.length > 0 && <span style={{ color: "#888", fontWeight: 400 }}>({data.events.length})</span>}
        </h2>

        {isLoading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ background: "#f5f5f5", borderRadius: "8px", height: "44px", animation: "pulse 1.5s infinite" }} />
            ))}
          </div>
        )}

        {!isLoading && (!data?.events || data.events.length === 0) && (
          <p style={{ fontSize: "13px", color: "#888", margin: 0 }}>No activity yet. Post a listing or invite a friend to earn your first points!</p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {(data?.events || []).map((ev, i) => (
            <div key={i} style={{ display: "flex", gap: "10px", alignItems: "center", padding: "10px 12px", background: "#f9f9f9", borderRadius: "10px" }}>
              {(() => { const EvIcon = EVENT_ICONS[ev.event_type] || StarIcon; return <EvIcon size={18} weight="fill" color="#534AB7" style={{ flexShrink: 0 }} />; })()}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", color: "#333" }}>{ev.description}</div>
                <div style={{ fontSize: "11px", color: "#aaa", marginTop: "1px" }}>{timeAgo(ev.created_at)}</div>
              </div>
              <span style={{ fontSize: "13px", fontWeight: 700, color: ev.delta >= 0 ? "#1D9E75" : "#ef4444", flexShrink: 0 }}>
                {ev.delta >= 0 ? "+" : ""}{ev.delta}
              </span>
            </div>
          ))}
        </div>
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  );
}
