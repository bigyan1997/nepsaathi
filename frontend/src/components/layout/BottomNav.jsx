import { useState, useRef, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  HouseIcon,
  BriefcaseIcon,
  ChatDotsIcon,
  BedIcon,
  PlusCircleIcon,
  ChatCircleDotsIcon,
  CurrencyCircleDollarIcon,
  BookOpenIcon,
  AirplaneTakeoffIcon,
  WhatsappLogoIcon,
  CompassIcon,
  WrenchIcon,
  SparkleIcon,
} from "@phosphor-icons/react";
import useAuthStore from "../../store/authStore";
import { getUnreadCount } from "../../api/messages";

const TABS = [
  { to: "/",         Icon: HouseIcon,    label: "Home",  color: "#534AB7", bg: "#EEEDFE", exact: true },
  { to: "/jobs",     Icon: BriefcaseIcon,label: "Jobs",  color: "#534AB7", bg: "#EEEDFE" },
  { to: "/messages", Icon: ChatDotsIcon, label: "Inbox", color: "#534AB7", bg: "#EEEDFE", showBadge: true },
  { to: "/rooms",    Icon: BedIcon,      label: "Rooms", color: "#E87722", bg: "#FFF1E0" },
];

const MORE_LINKS = [
  { to: "/forum",            Icon: ChatCircleDotsIcon,      label: "Community",  color: "#534AB7", bg: "#EEEDFE" },
  { to: "/send-money",       Icon: CurrencyCircleDollarIcon,label: "Send Money", color: "#1D9E75", bg: "#E1F5EE" },
  { to: "/guides/banking",   Icon: BookOpenIcon,            label: "Guides",     color: "#0C447C", bg: "#E6F1FB" },
  { to: "/visa",             Icon: AirplaneTakeoffIcon,     label: "Visa Hub",   color: "#534AB7", bg: "#EEEDFE" },
  { to: "/whatsapp-groups",  Icon: WhatsappLogoIcon,        label: "WhatsApp",   color: "#1D9E75", bg: "#E1F5EE" },
  { to: "/new-to-australia", Icon: CompassIcon,             label: "New Here?",  color: "#E87722", bg: "#FFF1E0" },
  { to: "/services",         Icon: WrenchIcon,              label: "Services",   color: "#8B5E00", bg: "#FAEEDA" },
  { to: "/new-listings",     Icon: SparkleIcon,             label: "New Today",  color: "#534AB7", bg: "#EEEDFE" },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Swipe-up detection on the nav bar
  const navTouchStartY = useRef(null);
  const handleNavTouchStart = useCallback((e) => {
    navTouchStartY.current = e.touches[0].clientY;
  }, []);
  const handleNavTouchEnd = useCallback((e) => {
    if (navTouchStartY.current === null) return;
    const dy = navTouchStartY.current - e.changedTouches[0].clientY;
    if (dy > 30) setSheetOpen(true);
    navTouchStartY.current = null;
  }, []);

  // Swipe-down detection on the sheet to close it
  const sheetTouchStartY = useRef(null);
  const handleSheetTouchStart = useCallback((e) => {
    sheetTouchStartY.current = e.touches[0].clientY;
  }, []);
  const handleSheetTouchEnd = useCallback((e) => {
    if (sheetTouchStartY.current === null) return;
    const dy = e.changedTouches[0].clientY - sheetTouchStartY.current;
    if (dy > 50) setSheetOpen(false);
    sheetTouchStartY.current = null;
  }, []);

  const { data: unreadData } = useQuery({
    queryKey: ["unread-count"],
    queryFn: getUnreadCount,
    enabled: isAuthenticated,
    refetchInterval: 15000,
    staleTime: 0,
  });
  const unreadCount = unreadData?.unread_count || 0;

  const handlePost = () => navigate(isAuthenticated ? "/post-ad" : "/login");

  const isActive = (tab) =>
    tab.exact ? pathname === tab.to : pathname === tab.to || pathname.startsWith(tab.to + "/");

  const renderTab = (tab) => {
    const active = isActive(tab);
    const badge = tab.showBadge && unreadCount > 0 ? unreadCount : 0;
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
          position: "relative",
        }}
      >
        <div style={{ position: "relative" }}>
          <tab.Icon size={20} weight={active ? "fill" : "regular"} color={active ? tab.color : "#999"} />
          {badge > 0 && (
            <span style={{ position: "absolute", top: "-4px", right: "-6px", background: "#A32D2D", color: "#fff", fontSize: "9px", fontWeight: 700, borderRadius: "10px", padding: "1px 4px", lineHeight: 1.4, minWidth: "14px", textAlign: "center" }}>
              {badge > 9 ? "9+" : badge}
            </span>
          )}
        </div>
        <span style={{ fontSize: "10px", fontWeight: active ? 700 : 500, color: active ? tab.color : "#999", lineHeight: 1 }}>
          {tab.label}
        </span>
      </Link>
    );
  };

  return (
    <>
      {/* ── BACKDROP ── */}
      {sheetOpen && (
        <div
          onClick={() => setSheetOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 108,
            backdropFilter: "blur(2px)",
          }}
        />
      )}

      {/* ── MORE SHEET ── */}
      <div
        onTouchStart={handleSheetTouchStart}
        onTouchEnd={handleSheetTouchEnd}
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: "58px",
          zIndex: 109,
          background: "#fff",
          borderRadius: "20px 20px 0 0",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
          padding: "12px 20px 20px",
          transform: sheetOpen ? "translateY(0)" : "translateY(110%)",
          transition: "transform 0.32s cubic-bezier(0.34,1.2,0.64,1)",
          willChange: "transform",
        }}
      >
        {/* drag handle */}
        <div style={{ width: "36px", height: "4px", background: "#e0e0e0", borderRadius: "2px", margin: "0 auto 16px" }} />
        <div style={{ fontSize: "11px", fontWeight: 700, color: "#999", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "14px" }}>
          More
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
          {MORE_LINKS.map(({ to, Icon, label, color, bg }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setSheetOpen(false)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                textDecoration: "none",
                padding: "14px 4px 10px",
                borderRadius: "14px",
                background: bg,
                border: "0.5px solid rgba(0,0,0,0.06)",
              }}
            >
              <Icon size={24} weight="duotone" color={color} />
              <span style={{ fontSize: "10px", fontWeight: 600, color: "#444", textAlign: "center", lineHeight: 1.2 }}>{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── BOTTOM NAV BAR ── */}
      <nav
        className="bottom-nav"
        onTouchStart={handleNavTouchStart}
        onTouchEnd={handleNavTouchEnd}
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
          overflow: "visible",
        }}
      >
        {/* Swipe hint — pill at top centre */}
        <div style={{
          position: "absolute",
          top: "5px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "28px",
          height: "3px",
          background: "#d4d4d4",
          borderRadius: "2px",
          pointerEvents: "none",
        }} />

        {TABS.slice(0, 2).map(renderTab)}

        {/* Centre Post button — lifted 14px above the nav bar */}
        <div style={{ flex: "0 0 68px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", top: "-14px" }}>
          <button
            onClick={handlePost}
            style={{
              width: "54px",
              height: "54px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #E87722, #534AB7)",
              border: "3px solid #fff",
              boxShadow: "0 4px 16px rgba(83,74,183,0.4)",
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

        {TABS.slice(2).map(renderTab)}
      </nav>
    </>
  );
}
