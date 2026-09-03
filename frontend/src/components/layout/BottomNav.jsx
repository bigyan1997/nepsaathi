import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  HouseIcon,
  BriefcaseIcon,
  BedIcon,
  ChatCircleDotsIcon,
  PlusCircleIcon,
} from "@phosphor-icons/react";
import useAuthStore from "../../store/authStore";

const TABS = [
  { to: "/",      Icon: HouseIcon,          label: "Home",      color: "#534AB7", bg: "#EEEDFE", exact: true },
  { to: "/jobs",  Icon: BriefcaseIcon,       label: "Jobs",      color: "#534AB7", bg: "#EEEDFE" },
  { to: "/rooms", Icon: BedIcon,             label: "Rooms",     color: "#85510A", bg: "#FFF1E0" },
  { to: "/forum", Icon: ChatCircleDotsIcon,  label: "Community", color: "#534AB7", bg: "#EEEDFE" },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const handlePost = () => {
    navigate(isAuthenticated ? "/post-ad" : "/login");
  };

  const isActive = (tab) =>
    tab.exact ? pathname === tab.to : pathname === tab.to || pathname.startsWith(tab.to + "/");

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
      {TABS.slice(0, 2).map((tab) => {
        const active = isActive(tab);
        return (
          <Link
            key={tab.to}
            to={tab.to}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "3px",
              textDecoration: "none",
              background: active ? tab.bg : "transparent",
              transition: "background 0.15s",
            }}
          >
            <tab.Icon size={20} weight={active ? "fill" : "regular"} color={active ? tab.color : "#999"} />
            <span style={{ fontSize: "10px", fontWeight: active ? 700 : 500, color: active ? tab.color : "#999", lineHeight: 1 }}>
              {tab.label}
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

      {TABS.slice(2).map((tab) => {
        const active = isActive(tab);
        return (
          <Link
            key={tab.to}
            to={tab.to}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "3px",
              textDecoration: "none",
              background: active ? tab.bg : "transparent",
              transition: "background 0.15s",
            }}
          >
            <tab.Icon size={20} weight={active ? "fill" : "regular"} color={active ? tab.color : "#999"} />
            <span style={{ fontSize: "10px", fontWeight: active ? 700 : 500, color: active ? tab.color : "#999", lineHeight: 1 }}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
