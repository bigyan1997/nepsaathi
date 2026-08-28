import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BriefcaseIcon,
  HouseIcon,
  ChatCircleDotsIcon,
  StorefrontIcon,
  PlusCircleIcon,
} from "@phosphor-icons/react";
import useAuthStore from "../../store/authStore";

const TABS = [
  { to: "/jobs",       Icon: BriefcaseIcon, label: "Jobs",       color: "#534AB7", bg: "#EEEDFE" },
  { to: "/rooms",      Icon: HouseIcon,     label: "Rooms",      color: "#85510A", bg: "#FFF1E0" },
  { to: "/businesses", Icon: StorefrontIcon,label: "Businesses", color: "#633806", bg: "#FAEEDA" },
  { to: "/forum",      Icon: ChatCircleDotsIcon, label: "Community", color: "#534AB7", bg: "#EEEDFE" },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const handlePost = () => {
    navigate(isAuthenticated ? "/post-ad" : "/login");
  };

  return (
    <nav
      className="bottom-nav"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 110,
        background: "#fff",
        borderTop: "0.5px solid #e5e5e5",
        display: "flex",
        alignItems: "stretch",
        height: "58px",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* First two tabs */}
      {TABS.slice(0, 2).map(({ to, Icon, label, color, bg }) => {
        const active = pathname === to || pathname.startsWith(to + "/");
        return (
          <Link
            key={to}
            to={to}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "3px",
              textDecoration: "none",
              background: active ? bg : "transparent",
              transition: "background 0.15s",
            }}
          >
            <Icon size={20} weight={active ? "fill" : "regular"} color={active ? color : "#999"} />
            <span style={{ fontSize: "10px", fontWeight: active ? 700 : 500, color: active ? color : "#999", lineHeight: 1 }}>
              {label}
            </span>
          </Link>
        );
      })}

      {/* Centre Post button */}
      <div style={{ flex: "0 0 68px", display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: "6px" }}>
        <button
          onClick={handlePost}
          style={{
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #E87722, #534AB7)",
            border: "none",
            boxShadow: "0 4px 14px rgba(83,74,183,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.07)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          aria-label="Post a listing"
        >
          <PlusCircleIcon size={26} weight="fill" color="#fff" />
        </button>
      </div>

      {/* Last two tabs */}
      {TABS.slice(2).map(({ to, Icon, label, color, bg }) => {
        const active = pathname === to || pathname.startsWith(to + "/");
        return (
          <Link
            key={to}
            to={to}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "3px",
              textDecoration: "none",
              background: active ? bg : "transparent",
              transition: "background 0.15s",
            }}
          >
            <Icon size={20} weight={active ? "fill" : "regular"} color={active ? color : "#999"} />
            <span style={{ fontSize: "10px", fontWeight: active ? 700 : 500, color: active ? color : "#999", lineHeight: 1 }}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
