import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { getAdminStats } from "../api/panel";
import usePageTitle from "../hooks/usePageTitle";
import {
  UserIcon,
  ClipboardTextIcon,
  StorefrontIcon,
  CurrencyDollarIcon,
  WarningIcon,
  ChatDotsIcon,
  ProhibitIcon,
} from "@phosphor-icons/react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fillDates(sparse, days = 30) {
  const map = {};
  sparse.forEach((d) => { map[d.date] = d.count; });
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().split("T")[0];
    result.push({
      date: iso,
      label: d.toLocaleDateString("en-AU", { month: "short", day: "numeric" }),
      count: map[iso] || 0,
    });
  }
  return result;
}

function fmtAUD(n) {
  return "$" + Number(n).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

function fmtDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-AU", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

const TYPE_LABEL = { job: "Jobs", room: "Rooms", event: "Events", notice: "Notices", business: "Businesses" };
const TYPE_COLOR = { job: "#818CF8", room: "#F59E0B", event: "#34D399", notice: "#60A5FA", business: "#F472B6" };
const TYPE_BG    = { job: "#1E1B4B", room: "#2D1900", event: "#022C22", notice: "#0C2042", business: "#2D0A1F" };

const STATE_COLORS = {
  NSW: "#818CF8", VIC: "#38BDF8", QLD: "#FBBF24", WA: "#FB923C",
  SA: "#A78BFA", TAS: "#34D399", ACT: "#F472B6", NT: "#F87171",
};

const STATUS_COLOR = {
  active: "#34D399", expired: "#FBBF24", filled: "#60A5FA", deleted: "#F87171",
};

const BAR_COLORS = ["#818CF8","#38BDF8","#FBBF24","#FB923C","#A78BFA","#34D399","#F472B6","#F87171","#84CC16","#F59E0B"];

const CAT_LABELS = {
  restaurant: "Restaurant", grocery: "Grocery", travel: "Travel",
  beauty: "Beauty", health: "Health", legal: "Legal",
  education: "Education", religious: "Religious", construction: "Construction",
  transport: "Transport", finance: "Finance", freelancer: "Freelancer",
  retail: "Retail", other: "Other",
};

// ── Design tokens (dark theme) ────────────────────────────────────────────────
const T = {
  bg:       "#0B0A18",
  surface:  "#12102A",
  surface2: "#1A1735",
  border:   "#252244",
  text:     "#EAE8F8",
  text2:    "#9B96C4",
  text3:    "#5A5580",
  brand:    "#7C6FEB",
  brandDim: "#3D3780",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent, icon, warn }) {
  return (
    <div style={{
      background: T.surface,
      borderRadius: 14,
      padding: "18px 20px",
      border: `1px solid ${T.border}`,
      borderTop: `3px solid ${warn ? "#EF4444" : accent}`,
      display: "flex", flexDirection: "column", gap: 5,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 11, color: T.text2, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>
          {label}
        </span>
        <span style={{ opacity: 0.85, display: "flex", alignItems: "center" }}>{icon}</span>
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: warn ? "#F87171" : T.text, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11.5, color: T.text3, lineHeight: 1.5 }}>{sub}</div>}
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div style={{
      background: T.surface, borderRadius: 10, padding: "14px 16px",
      border: `1px solid ${T.border}`,
    }}>
      <div style={{ fontSize: 10.5, color: T.text2, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color, fontVariantNumeric: "tabular-nums" }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
    </div>
  );
}

function Card({ title, action, children, style }) {
  return (
    <div style={{
      background: T.surface, borderRadius: 14,
      border: `1px solid ${T.border}`,
      overflow: "hidden",
      ...style,
    }}>
      {title && (
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "14px 20px",
          borderBottom: `1px solid ${T.border}`,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: T.text2, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {title}
          </span>
          {action}
        </div>
      )}
      <div style={{ padding: "16px 20px" }}>
        {children}
      </div>
    </div>
  );
}

function Badge({ children, color, bg }) {
  return (
    <span style={{
      display: "inline-block", fontSize: 10.5, fontWeight: 700,
      padding: "2px 9px", borderRadius: 20,
      background: bg, color,
    }}>
      {children}
    </span>
  );
}

function EmptyState({ msg = "No data" }) {
  return (
    <div style={{ textAlign: "center", padding: "32px 0", color: T.text3, fontSize: 13 }}>
      {msg}
    </div>
  );
}

const DarkTooltip = ({ active, payload, label, prefix = "", suffix = "" }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: T.surface2, color: T.text, borderRadius: 8, border: `1px solid ${T.border}`,
      padding: "8px 14px", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
    }}>
      <div style={{ marginBottom: 4, color: T.text2 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontWeight: 700, color: p.color || T.text }}>
          {prefix}{typeof p.value === "number" ? p.value.toLocaleString() : p.value}{suffix}
        </div>
      ))}
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminPanelPage() {
  usePageTitle("Panel");

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-panel-stats"],
    queryFn: getAdminStats,
    staleTime: 1000 * 60 * 2,
    retry: false,
  });

  if (error) {
    return (
      <div style={{ background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: 28 }}>
          <div style={{ marginBottom: 12 }}><ProhibitIcon size={40} weight="duotone" color="#DC2626" /></div>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Access denied</div>
          <div style={{ fontSize: 13, color: T.text2, marginTop: 6 }}>
            {error?.response?.status === 403 ? "You don't have permission to view this page." : "Failed to load panel data."}
          </div>
        </div>
      </div>
    );
  }

  const ov = data?.overview || {};
  const pendingReports = (ov.pending_listing_reports || 0) + (ov.pending_business_reports || 0);

  const usersTimeSeries    = data ? fillDates(data.users_over_time) : [];
  const listingsTimeSeries = data ? fillDates(data.listings_over_time) : [];

  const listingsByTypeArr = data
    ? Object.entries(data.listings_by_type).map(([k, v]) => ({ name: TYPE_LABEL[k] || k, value: v, key: k }))
    : [];

  const listingsByStateArr = data
    ? Object.entries(data.listings_by_state).map(([k, v]) => ({ name: k, value: v })).sort((a, b) => b.value - a.value)
    : [];

  const listingsByStatusArr = data
    ? Object.entries(data.listings_by_status).map(([k, v]) => ({ name: k, value: v }))
    : [];

  const bizByCatArr = data
    ? Object.entries(data.businesses_by_category)
        .map(([k, v]) => ({ name: CAT_LABELS[k] || k, value: v }))
        .sort((a, b) => b.value - a.value)
    : [];

  const feedbackArr = data
    ? [1, 2, 3, 4, 5].map((s) => ({
        name: "★".repeat(s),
        value: data.feedback.by_score?.[String(s)] || 0,
      }))
    : [];

  const allPendingReports = [
    ...(data?.pending_listing_reports || []).map((r) => ({
      id: r.id, kind: "listing", reason: r.reason,
      subject: r["listing__title"], slug: r["listing__slug"],
      listingType: r["listing__listing_type"],
      reporter: `${r["user__first_name"]} ${r["user__last_name"]}`.trim() || r["user__email"],
      created_at: r.created_at,
    })),
    ...(data?.pending_business_reports || []).map((r) => ({
      id: r.id, kind: "business", reason: r.reason,
      subject: r["business__business_name"], slug: r["business__slug"],
      listingType: "business",
      reporter: `${r["user__first_name"]} ${r["user__last_name"]}`.trim() || r["user__email"],
      created_at: r.created_at,
    })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const recentPayments = (data?.recent_payments || []).map((p) => ({
    id: p.id, amount: p.amount_paid / 100, duration: p.duration_days, status: p.status,
    created_at: p.created_at, completed_at: p.completed_at,
    subject: p["listing__title"] || p["business__business_name"] || "—",
    slug: p["listing__slug"] || p["business__slug"],
    listingType: p["listing__listing_type"] || "business",
    user: `${p["user__first_name"] || ""} ${p["user__last_name"] || ""}`.trim() || p["user__email"],
  }));

  const topListings  = data?.top_listings  || [];
  const recentUsers  = data?.recent_users  || [];

  const axisStyle    = { tick: { fontSize: 10, fill: T.text3 } };
  const gridStyle    = { strokeDasharray: "3 3", stroke: T.border };

  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: T.surface,
        borderBottom: `1px solid ${T.border}`,
        padding: "0 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 56,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "linear-gradient(135deg, #26215C, #534AB7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 800, color: "#fff",
          }}>N</div>
          <div>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>NepSaathi</span>
            <span style={{ fontSize: 12, color: T.text3, marginLeft: 6 }}>Internal Panel</span>
          </div>
          {pendingReports > 0 && (
            <span style={{
              background: "#EF4444", color: "#fff", fontSize: 10.5, fontWeight: 700,
              padding: "2px 8px", borderRadius: 20,
            }}>
              {pendingReports} reports
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, color: T.text3 }}>
            {isLoading ? "Loading…" : `Updated ${new Date().toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}`}
          </span>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            style={{
              background: isFetching ? T.surface2 : T.brandDim,
              color: isFetching ? T.text3 : "#C4BFFF",
              border: `1px solid ${T.border}`,
              borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600,
              cursor: isFetching ? "default" : "pointer",
            }}
          >
            {isFetching ? "Refreshing…" : "↻ Refresh"}
          </button>
          <a
            href="/nepsaathi-admin/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: T.surface2, color: T.text2, border: `1px solid ${T.border}`,
              borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Django Admin ↗
          </a>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 24px 72px" }}>

        {isLoading ? <LoadingSkeleton /> : (
          <>
            {/* ── Primary stat cards ─────────────────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 16 }}>
              <StatCard label="Total Users" value={ov.total_users?.toLocaleString() || 0}
                sub={`+${ov.new_users_today || 0} today · +${ov.new_users_week || 0} this week`}
                accent="#818CF8" icon={<UserIcon size={28} weight="duotone" color="#818CF8" />} />
              <StatCard label="Active Listings" value={ov.active_listings?.toLocaleString() || 0}
                sub={`${ov.total_listings || 0} total · ${ov.featured_listings || 0} featured`}
                accent="#34D399" icon={<ClipboardTextIcon size={28} weight="duotone" color="#34D399" />} />
              <StatCard label="Businesses" value={ov.total_businesses?.toLocaleString() || 0}
                sub={`${ov.verified_businesses || 0} verified · ${ov.featured_businesses || 0} featured`}
                accent="#FBBF24" icon={<StorefrontIcon size={28} weight="duotone" color="#FBBF24" />} />
              <StatCard label="Revenue (AUD)" value={fmtAUD(ov.total_revenue_aud || 0)}
                sub={`${ov.total_payments || 0} completed payments`}
                accent="#A78BFA" icon={<CurrencyDollarIcon size={28} weight="duotone" color="#A78BFA" />} />
              <StatCard label="Pending Reports" value={pendingReports}
                sub={`${ov.pending_listing_reports || 0} listings · ${ov.pending_business_reports || 0} businesses`}
                accent="#F87171" icon={<WarningIcon size={28} weight="duotone" color="#F87171" />} warn={pendingReports > 0} />
              <StatCard label="Messages" value={ov.total_messages?.toLocaleString() || 0}
                sub={`${ov.total_conversations || 0} threads · +${ov.new_messages_week || 0} this week`}
                accent="#38BDF8" icon={<ChatDotsIcon size={28} weight="duotone" color="#38BDF8" />} />
            </div>

            {/* ── Mini stat row ───────────────────────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10, marginBottom: 20 }}>
              <MiniStat label="Under Review"    value={ov.under_review_listings || 0} color="#FBBF24" />
              <MiniStat label="Banned Users"    value={ov.banned_users || 0}          color="#F87171" />
              <MiniStat label="Verified Users"  value={ov.verified_users || 0}        color="#34D399" />
              <MiniStat label="New Listings/Wk" value={ov.new_listings_week || 0}     color="#818CF8" />
              <MiniStat label="Avg Feedback"    value={data?.feedback?.avg_score ? `${data.feedback.avg_score}/5` : "—"} color="#FBBF24" />
              <MiniStat label="Feedback Responses" value={data?.feedback?.total_responses || 0} color="#A78BFA" />
            </div>

            {/* ── Time series ─────────────────────────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 14, marginBottom: 14 }}>
              <Card title="New Users — Last 30 Days">
                {usersTimeSeries.every((d) => d.count === 0) ? <EmptyState msg="No new users in 30 days" /> : (
                  <ResponsiveContainer width="100%" height={190}>
                    <LineChart data={usersTimeSeries}>
                      <CartesianGrid {...gridStyle} />
                      <XAxis dataKey="label" {...axisStyle} interval={6} />
                      <YAxis {...axisStyle} allowDecimals={false} width={28} />
                      <Tooltip content={<DarkTooltip suffix=" users" />} />
                      <Line type="monotone" dataKey="count" stroke="#818CF8" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: "#818CF8" }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Card>

              <Card title="New Listings — Last 30 Days">
                {listingsTimeSeries.every((d) => d.count === 0) ? <EmptyState msg="No new listings in 30 days" /> : (
                  <ResponsiveContainer width="100%" height={190}>
                    <LineChart data={listingsTimeSeries}>
                      <CartesianGrid {...gridStyle} />
                      <XAxis dataKey="label" {...axisStyle} interval={6} />
                      <YAxis {...axisStyle} allowDecimals={false} width={28} />
                      <Tooltip content={<DarkTooltip suffix=" listings" />} />
                      <Line type="monotone" dataKey="count" stroke="#34D399" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: "#34D399" }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </div>

            {/* ── Breakdown charts ─────────────────────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 14, marginBottom: 14 }}>
              <Card title="Active Listings by Type">
                {listingsByTypeArr.length === 0 ? <EmptyState /> : (
                  <ResponsiveContainer width="100%" height={210}>
                    <BarChart data={listingsByTypeArr} barSize={34}>
                      <CartesianGrid {...gridStyle} />
                      <XAxis dataKey="name" {...axisStyle} />
                      <YAxis {...axisStyle} allowDecimals={false} width={28} />
                      <Tooltip content={<DarkTooltip />} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {listingsByTypeArr.map((e) => <Cell key={e.key} fill={TYPE_COLOR[e.key] || "#818CF8"} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>

              <Card title="Active Listings by State">
                {listingsByStateArr.length === 0 ? <EmptyState /> : (
                  <ResponsiveContainer width="100%" height={210}>
                    <BarChart data={listingsByStateArr} barSize={30}>
                      <CartesianGrid {...gridStyle} />
                      <XAxis dataKey="name" {...axisStyle} />
                      <YAxis {...axisStyle} allowDecimals={false} width={28} />
                      <Tooltip content={<DarkTooltip />} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {listingsByStateArr.map((e) => <Cell key={e.name} fill={STATE_COLORS[e.name] || "#818CF8"} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </div>

            {/* ── Revenue + Feedback ─────────────────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 14, marginBottom: 14 }}>
              <Card title="Revenue by Month (AUD)">
                {!data?.revenue_by_month?.length ? <EmptyState msg="No completed payments yet" /> : (
                  <ResponsiveContainer width="100%" height={190}>
                    <BarChart data={data.revenue_by_month} barSize={34}>
                      <CartesianGrid {...gridStyle} />
                      <XAxis dataKey="month" {...axisStyle} />
                      <YAxis {...axisStyle} width={42} tickFormatter={(v) => `$${v}`} />
                      <Tooltip content={({ active, payload, label }) =>
                        active && payload?.length ? (
                          <div style={{ background: T.surface2, color: T.text, borderRadius: 8, border: `1px solid ${T.border}`, padding: "8px 14px", fontSize: 12 }}>
                            <div style={{ color: T.text2, marginBottom: 4 }}>{label}</div>
                            <div style={{ fontWeight: 700 }}>{fmtAUD(payload[0].value)}</div>
                            <div style={{ color: T.text3 }}>{payload[0]?.payload?.count} payments</div>
                          </div>
                        ) : null
                      } />
                      <Bar dataKey="total_aud" fill="#A78BFA" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>

              <Card title="User Feedback Scores">
                {feedbackArr.every((f) => f.value === 0) ? <EmptyState msg="No feedback yet" /> : (
                  <>
                    <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
                      <div style={{ fontSize: 30, fontWeight: 800, color: "#FBBF24", fontVariantNumeric: "tabular-nums" }}>
                        {data?.feedback?.avg_score || "—"}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Average score</div>
                        <div style={{ fontSize: 12, color: T.text3 }}>{data?.feedback?.total_responses} responses</div>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={130}>
                      <BarChart data={feedbackArr} barSize={30}>
                        <CartesianGrid {...gridStyle} />
                        <XAxis dataKey="name" {...axisStyle} />
                        <YAxis {...axisStyle} allowDecimals={false} width={24} />
                        <Tooltip content={<DarkTooltip suffix=" responses" />} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {feedbackArr.map((_, i) => (
                            <Cell key={i} fill={["#F87171","#FB923C","#FBBF24","#86EFAC","#34D399"][i]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </>
                )}
              </Card>
            </div>

            {/* ── Status + Biz category ─────────────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 14, marginBottom: 14 }}>
              <Card title="All Listings by Status">
                {listingsByStatusArr.length === 0 ? <EmptyState /> : (
                  <ResponsiveContainer width="100%" height={170}>
                    <BarChart data={listingsByStatusArr} barSize={38}>
                      <CartesianGrid {...gridStyle} />
                      <XAxis dataKey="name" {...axisStyle} />
                      <YAxis {...axisStyle} allowDecimals={false} width={28} />
                      <Tooltip content={<DarkTooltip />} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {listingsByStatusArr.map((e) => <Cell key={e.name} fill={STATUS_COLOR[e.name] || "#aaa"} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>

              <Card title="Businesses by Category">
                {bizByCatArr.length === 0 ? <EmptyState /> : (
                  <ResponsiveContainer width="100%" height={170}>
                    <BarChart data={bizByCatArr} barSize={16} layout="vertical">
                      <CartesianGrid {...gridStyle} horizontal={false} />
                      <XAxis type="number" {...axisStyle} allowDecimals={false} />
                      <YAxis dataKey="name" type="category" {...axisStyle} width={80} />
                      <Tooltip content={<DarkTooltip />} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {bizByCatArr.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </div>

            {/* ── Pending Reports ───────────────────────────────────────── */}
            <Card
              title={`Pending Reports (${allPendingReports.length})`}
              action={allPendingReports.length > 0 && (
                <a href="/nepsaathi-admin/listings/listingreport/" target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 11, color: T.brand, textDecoration: "none", fontWeight: 600 }}>
                  Open in Admin ↗
                </a>
              )}
              style={{ marginBottom: 14 }}
            >
              {allPendingReports.length === 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 0", color: "#34D399", fontSize: 13, fontWeight: 600 }}>
                  <span>✓</span><span>No pending reports — all clear</span>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                        {["Type", "Subject", "Reason", "Reporter", "Date", ""].map((h) => (
                          <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: T.text3, fontWeight: 600, fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {allPendingReports.map((r, i) => (
                        <tr key={`${r.kind}-${r.id}`}
                          style={{ borderBottom: i < allPendingReports.length - 1 ? `1px solid ${T.border}` : "none" }}>
                          <td style={{ padding: "10px 12px" }}>
                            <Badge
                              color={r.kind === "business" ? "#FBBF24" : TYPE_COLOR[r.listingType] || T.text}
                              bg={r.kind === "business" ? "#2D1900" : TYPE_BG[r.listingType] || T.surface2}
                            >
                              {r.kind === "business" ? "Business" : TYPE_LABEL[r.listingType] || r.listingType}
                            </Badge>
                          </td>
                          <td style={{ padding: "10px 12px", fontWeight: 600, color: T.text, maxWidth: 200 }}>
                            <Link
                              to={r.kind === "business" ? `/businesses/${r.slug}` : `/${r.listingType}s/${r.slug}`}
                              target="_blank"
                              style={{ color: T.text, textDecoration: "none" }}
                            >
                              {r.subject || "—"}
                            </Link>
                          </td>
                          <td style={{ padding: "10px 12px", color: "#F87171", fontWeight: 600 }}>{r.reason}</td>
                          <td style={{ padding: "10px 12px", color: T.text2 }}>{r.reporter}</td>
                          <td style={{ padding: "10px 12px", color: T.text3, whiteSpace: "nowrap" }}>{fmtDate(r.created_at)}</td>
                          <td style={{ padding: "10px 12px" }}>
                            <a href="/nepsaathi-admin/listings/listingreport/" target="_blank" rel="noopener noreferrer"
                              style={{ fontSize: 11, fontWeight: 700, color: T.brand, textDecoration: "none" }}>
                              Review →
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* ── Payments + Top listings ────────────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 14, marginBottom: 14 }}>
              <Card title="Recent Payments">
                {recentPayments.length === 0 ? <EmptyState msg="No payments yet" /> : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {recentPayments.map((p, i) => (
                      <div key={p.id} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "10px 0",
                        borderBottom: i < recentPayments.length - 1 ? `1px solid ${T.border}` : "none",
                      }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 2 }}>
                            {p.subject}
                          </div>
                          <div style={{ fontSize: 11, color: T.text3 }}>
                            {p.user} · {p.duration}d · {fmtDate(p.created_at)}
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                          <div style={{ fontSize: 15, fontWeight: 800, color: "#A78BFA", fontVariantNumeric: "tabular-nums" }}>
                            {fmtAUD(p.amount)}
                          </div>
                          <Badge
                            color={p.status === "completed" ? "#34D399" : p.status === "pending" ? "#FBBF24" : "#F87171"}
                            bg={p.status === "completed" ? "#022C22" : p.status === "pending" ? "#2D1900" : "#2D0A0A"}
                          >
                            {p.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card title="Top Listings by Views">
                {topListings.length === 0 ? <EmptyState msg="No listing views yet" /> : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {topListings.map((l, i) => (
                      <div key={l.id} style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "9px 0",
                        borderBottom: i < topListings.length - 1 ? `1px solid ${T.border}` : "none",
                      }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: "50%",
                          background: i === 0 ? "#2D2400" : i === 1 ? "#1A1A24" : i === 2 ? "#1F1506" : T.surface2,
                          color: i === 0 ? "#FBBF24" : i === 1 ? "#94A3B8" : i === 2 ? "#FB923C" : T.text3,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10.5, fontWeight: 800, flexShrink: 0,
                        }}>
                          {i + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            <Link to={`/${l.listing_type}s/${l.slug}`} target="_blank"
                              style={{ color: T.text, textDecoration: "none" }}>
                              {l.title}
                            </Link>
                          </div>
                          <div style={{ fontSize: 11, color: T.text3 }}>
                            {TYPE_LABEL[l.listing_type] || l.listing_type} · {l.state}
                            {l.is_featured && <span style={{ color: "#FBBF24", marginLeft: 4 }}>⭐ Featured</span>}
                          </div>
                        </div>
                        <div style={{ fontSize: 12.5, fontWeight: 800, color: "#818CF8", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                          {l.view_count.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* ── Recent Signups ────────────────────────────────────────── */}
            <Card title="Recent Signups">
              {recentUsers.length === 0 ? <EmptyState /> : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                        {["Name", "Email", "Joined", "Status"].map((h) => (
                          <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: T.text3, fontWeight: 600, fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentUsers.map((u, i) => (
                        <tr key={u.id} style={{ borderBottom: i < recentUsers.length - 1 ? `1px solid ${T.border}` : "none" }}>
                          <td style={{ padding: "10px 12px", fontWeight: 600, color: T.text }}>
                            {`${u.first_name} ${u.last_name}`.trim() || "—"}
                          </td>
                          <td style={{ padding: "10px 12px", color: T.text2 }}>{u.email}</td>
                          <td style={{ padding: "10px 12px", color: T.text3, whiteSpace: "nowrap" }}>{fmtDateTime(u.created_at)}</td>
                          <td style={{ padding: "10px 12px" }}>
                            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                              {u.is_verified && <Badge color="#34D399" bg="#022C22">Verified</Badge>}
                              {u.is_banned  && <Badge color="#F87171" bg="#2D0A0A">Banned</Badge>}
                              {!u.is_verified && !u.is_banned && <Badge color={T.text3} bg={T.surface2}>New</Badge>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  const pulse = {
    background: `linear-gradient(90deg, #1A1735 25%, #252244 50%, #1A1735 75%)`,
    backgroundSize: "200% 100%",
    animation: "shimmer 1.4s infinite",
    borderRadius: 10,
  };
  return (
    <>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 16 }}>
        {[...Array(6)].map((_, i) => <div key={i} style={{ ...pulse, height: 94 }} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10, marginBottom: 20 }}>
        {[...Array(6)].map((_, i) => <div key={i} style={{ ...pulse, height: 64 }} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 14 }}>
        {[...Array(4)].map((_, i) => <div key={i} style={{ ...pulse, height: 240 }} />)}
      </div>
    </>
  );
}
