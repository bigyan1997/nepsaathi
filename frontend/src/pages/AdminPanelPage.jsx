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

const STATE_COLORS = ["#534AB7","#6B5ED6","#8A80E0","#A9A3EA","#C7C3F2","#E87722","#F0A060","#F7CDA8"];
const TYPE_COLORS  = ["#534AB7","#6B5ED6","#8A80E0","#A9A3EA","#E87722"];

const CAT_LABELS = {
  restaurant: "Restaurant", grocery: "Grocery", travel: "Travel",
  beauty: "Beauty", health: "Health", legal: "Legal",
  education: "Education", religious: "Religious", construction: "Construction",
  transport: "Transport", finance: "Finance", freelancer: "Freelancer",
  retail: "Retail", other: "Other",
};

// ── Design tokens (NepSaathi brand — light) ──────────────────────────────────
const T = {
  bg:         "#F7F6F2",
  surface:    "#FFFFFF",
  surface2:   "#F0EEE8",
  border:     "#E4E1D8",
  text:       "#1A1520",
  text2:      "#6B6478",
  text3:      "#A8A2B4",
  saffron:    "#E87722",
  saffronDim: "#FEF0E3",
  purple:     "#534AB7",
  purpleDim:  "#EEEDFE",
  green:      "#16A34A",
  greenDim:   "#DCFCE7",
  red:        "#DC2626",
  redDim:     "#FEE2E2",
  amber:      "#D97706",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon, alert }) {
  return (
    <div style={{
      background: T.surface,
      borderRadius: 10,
      padding: "20px 22px",
      border: `1px solid ${alert ? T.red : T.border}`,
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 10.5, color: T.text3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          {label}
        </span>
        <span style={{ color: alert ? T.red : T.text3, opacity: 0.6 }}>{icon}</span>
      </div>
      <div style={{
        fontSize: 32, fontWeight: 700, color: alert ? T.red : T.text,
        lineHeight: 1, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em",
      }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11.5, color: T.text3, lineHeight: 1.5 }}>{sub}</div>}
    </div>
  );
}

function MiniStat({ label, value, highlight }) {
  return (
    <div style={{
      background: T.surface, borderRadius: 10, padding: "14px 18px",
      border: `1px solid ${T.border}`,
    }}>
      <div style={{ fontSize: 10.5, color: T.text3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{
        fontSize: 24, fontWeight: 700,
        color: highlight === "red" ? T.red : highlight === "green" ? T.green : highlight === "amber" ? T.saffron : T.text,
        fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em",
      }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
    </div>
  );
}

function Card({ title, action, children, style }) {
  return (
    <div style={{
      background: T.surface, borderRadius: 10,
      border: `1px solid ${T.border}`,
      overflow: "hidden",
      ...style,
    }}>
      {title && (
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "13px 20px",
          borderBottom: `1px solid ${T.border}`,
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: T.text3, textTransform: "uppercase", letterSpacing: "0.1em" }}>
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

function Badge({ children, variant = "neutral" }) {
  const styles = {
    neutral: { color: T.text3,   bg: T.surface2 },
    green:   { color: T.green,   bg: T.greenDim },
    red:     { color: T.red,     bg: T.redDim   },
    amber:   { color: T.amber,   bg: "#1A1000"  },
  };
  const s = styles[variant] || styles.neutral;
  return (
    <span style={{
      display: "inline-block", fontSize: 10.5, fontWeight: 600,
      padding: "2px 8px", borderRadius: 4,
      background: s.bg, color: s.color,
      letterSpacing: "0.04em",
    }}>
      {children}
    </span>
  );
}

function EmptyState({ msg = "No data" }) {
  return (
    <div style={{ textAlign: "center", padding: "32px 0", color: T.text3, fontSize: 12 }}>
      {msg}
    </div>
  );
}

const ChartTooltip = ({ active, payload, label, prefix = "", suffix = "" }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: T.surface2, color: T.text, borderRadius: 6,
      border: `1px solid ${T.border}`,
      padding: "8px 12px", fontSize: 12,
    }}>
      <div style={{ marginBottom: 3, color: T.text3, fontSize: 11 }}>{label}</div>
      <div style={{ fontWeight: 700 }}>
        {prefix}{typeof payload[0].value === "number" ? payload[0].value.toLocaleString() : payload[0].value}{suffix}
      </div>
    </div>
  );
};

const axisStyle = { tick: { fontSize: 10, fill: T.text3 }, axisLine: false, tickLine: false };
const gridStyle = { strokeDasharray: "2 4", stroke: T.border };

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
          <div style={{ marginBottom: 12 }}><ProhibitIcon size={36} weight="thin" color={T.red} /></div>
          <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>Access denied</div>
          <div style={{ fontSize: 13, color: T.text3, marginTop: 6 }}>
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
        name: `${s}★`,
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
    created_at: p.created_at,
    subject: p["listing__title"] || p["business__business_name"] || "—",
    slug: p["listing__slug"] || p["business__slug"],
    listingType: p["listing__listing_type"] || "business",
    user: `${p["user__first_name"] || ""} ${p["user__last_name"] || ""}`.trim() || p["user__email"],
  }));

  const topListings = data?.top_listings  || [];
  const recentUsers = data?.recent_users  || [];

  return (
    <div style={{
      background: T.bg, minHeight: "100vh",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif",
      color: T.text,
    }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: T.surface,
        borderBottom: `1px solid ${T.border}`,
        padding: "0 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 52,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 6,
            background: `linear-gradient(135deg, ${T.purple}, ${T.saffron})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 800, color: "#fff",
          }}>N</div>
          <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>NepSaathi</span>
          <span style={{ fontSize: 12, color: T.text3 }}>Internal Panel</span>
          {pendingReports > 0 && (
            <span style={{
              background: T.red, color: "#fff", fontSize: 10.5, fontWeight: 700,
              padding: "2px 8px", borderRadius: 4,
            }}>
              {pendingReports} {pendingReports === 1 ? "report" : "reports"}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: T.text3 }}>
            {isLoading ? "Loading…" : `Updated ${new Date().toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}`}
          </span>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            style={{
              background: isFetching ? "transparent" : T.purple,
              color: isFetching ? T.text3 : "#fff",
              border: `1px solid ${isFetching ? T.border : T.purple}`,
              borderRadius: 6, padding: "5px 14px", fontSize: 12, fontWeight: 500,
              cursor: isFetching ? "default" : "pointer",
            }}
          >
            {isFetching ? "Refreshing…" : "Refresh"}
          </button>
          <a
            href="/nepsaathi-admin/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: "transparent", color: T.text2,
              border: `1px solid ${T.border}`,
              borderRadius: 6, padding: "5px 14px", fontSize: 12, fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Django Admin ↗
          </a>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 24px 72px" }}>

        {isLoading ? <LoadingSkeleton /> : (
          <>
            {/* ── Primary stats ──────────────────────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10, marginBottom: 10 }}>
              <StatCard label="Total Users" value={ov.total_users?.toLocaleString() || 0}
                sub={`+${ov.new_users_today || 0} today · +${ov.new_users_week || 0} this week`}
                icon={<UserIcon size={16} weight="regular" />} />
              <StatCard label="Active Listings" value={ov.active_listings?.toLocaleString() || 0}
                sub={`${ov.total_listings || 0} total · ${ov.featured_listings || 0} featured`}
                icon={<ClipboardTextIcon size={16} weight="regular" />} />
              <StatCard label="Businesses" value={ov.total_businesses?.toLocaleString() || 0}
                sub={`${ov.verified_businesses || 0} verified · ${ov.featured_businesses || 0} featured`}
                icon={<StorefrontIcon size={16} weight="regular" />} />
              <StatCard label="Revenue (AUD)" value={fmtAUD(ov.total_revenue_aud || 0)}
                sub={`${ov.total_payments || 0} completed payments`}
                icon={<CurrencyDollarIcon size={16} weight="regular" />} />
              <StatCard label="Pending Reports" value={pendingReports}
                sub={`${ov.pending_listing_reports || 0} listings · ${ov.pending_business_reports || 0} businesses`}
                icon={<WarningIcon size={16} weight="regular" />} alert={pendingReports > 0} />
              <StatCard label="Messages" value={ov.total_messages?.toLocaleString() || 0}
                sub={`${ov.total_conversations || 0} threads · +${ov.new_messages_week || 0} this week`}
                icon={<ChatDotsIcon size={16} weight="regular" />} />
            </div>

            {/* ── Mini stats ─────────────────────────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10, marginBottom: 20 }}>
              <MiniStat label="Under Review"    value={ov.under_review_listings || 0}  highlight={ov.under_review_listings > 0 ? "amber" : null} />
              <MiniStat label="Banned Users"    value={ov.banned_users || 0}            highlight={ov.banned_users > 0 ? "red" : null} />
              <MiniStat label="Verified Users"  value={ov.verified_users || 0}          highlight="green" />
              <MiniStat label="New Listings/Wk" value={ov.new_listings_week || 0} />
              <MiniStat label="Avg Feedback"    value={data?.feedback?.avg_score ? `${data.feedback.avg_score}/5` : "—"} />
              <MiniStat label="Feedback Responses" value={data?.feedback?.total_responses || 0} />
            </div>

            {/* ── Time series ─────────────────────────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 10, marginBottom: 10 }}>
              <Card title="New Users — Last 30 Days">
                {usersTimeSeries.every((d) => d.count === 0) ? <EmptyState msg="No new users in 30 days" /> : (
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={usersTimeSeries}>
                      <CartesianGrid {...gridStyle} />
                      <XAxis dataKey="label" {...axisStyle} interval={6} />
                      <YAxis {...axisStyle} allowDecimals={false} width={24} />
                      <Tooltip content={<ChartTooltip suffix=" users" />} />
                      <Line type="monotone" dataKey="count" stroke={T.purple} strokeWidth={2} dot={false} activeDot={{ r: 3, fill: T.purple }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Card>

              <Card title="New Listings — Last 30 Days">
                {listingsTimeSeries.every((d) => d.count === 0) ? <EmptyState msg="No new listings in 30 days" /> : (
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={listingsTimeSeries}>
                      <CartesianGrid {...gridStyle} />
                      <XAxis dataKey="label" {...axisStyle} interval={6} />
                      <YAxis {...axisStyle} allowDecimals={false} width={24} />
                      <Tooltip content={<ChartTooltip suffix=" listings" />} />
                      <Line type="monotone" dataKey="count" stroke={T.saffron} strokeWidth={2} dot={false} activeDot={{ r: 3, fill: T.saffron }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </div>

            {/* ── Breakdown charts ─────────────────────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 10, marginBottom: 10 }}>
              <Card title="Active Listings by Type">
                {listingsByTypeArr.length === 0 ? <EmptyState /> : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={listingsByTypeArr} barSize={32}>
                      <CartesianGrid {...gridStyle} />
                      <XAxis dataKey="name" {...axisStyle} />
                      <YAxis {...axisStyle} allowDecimals={false} width={24} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                        {listingsByTypeArr.map((_, i) => <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>

              <Card title="Active Listings by State">
                {listingsByStateArr.length === 0 ? <EmptyState /> : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={listingsByStateArr} barSize={28}>
                      <CartesianGrid {...gridStyle} />
                      <XAxis dataKey="name" {...axisStyle} />
                      <YAxis {...axisStyle} allowDecimals={false} width={24} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                        {listingsByStateArr.map((_, i) => <Cell key={i} fill={STATE_COLORS[i % STATE_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </div>

            {/* ── Revenue + Feedback ─────────────────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 10, marginBottom: 10 }}>
              <Card title="Revenue by Month (AUD)">
                {!data?.revenue_by_month?.length ? <EmptyState msg="No completed payments yet" /> : (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={data.revenue_by_month} barSize={32}>
                      <CartesianGrid {...gridStyle} />
                      <XAxis dataKey="month" {...axisStyle} />
                      <YAxis {...axisStyle} width={40} tickFormatter={(v) => `$${v}`} />
                      <Tooltip content={({ active, payload, label }) =>
                        active && payload?.length ? (
                          <div style={{ background: T.surface2, color: T.text, borderRadius: 6, border: `1px solid ${T.border}`, padding: "8px 12px", fontSize: 12 }}>
                            <div style={{ color: T.text3, fontSize: 11, marginBottom: 3 }}>{label}</div>
                            <div style={{ fontWeight: 700 }}>{fmtAUD(payload[0].value)}</div>
                            <div style={{ color: T.text3, fontSize: 11 }}>{payload[0]?.payload?.count} payments</div>
                          </div>
                        ) : null
                      } />
                      <Bar dataKey="total_aud" fill={T.saffron} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>

              <Card title="User Feedback Scores">
                {feedbackArr.every((f) => f.value === 0) ? <EmptyState msg="No feedback yet" /> : (
                  <>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
                      <div style={{ fontSize: 36, fontWeight: 700, color: T.text, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em" }}>
                        {data?.feedback?.avg_score || "—"}
                      </div>
                      <div style={{ fontSize: 12, color: T.text3 }}>/ 5 · {data?.feedback?.total_responses} responses</div>
                    </div>
                    <ResponsiveContainer width="100%" height={120}>
                      <BarChart data={feedbackArr} barSize={28}>
                        <CartesianGrid {...gridStyle} />
                        <XAxis dataKey="name" {...axisStyle} />
                        <YAxis {...axisStyle} allowDecimals={false} width={20} />
                        <Tooltip content={<ChartTooltip suffix=" responses" />} />
                        <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                          {feedbackArr.map((_, i) => (
                            <Cell key={i} fill={["#E4E1D8","#C8C3B8","#A09880","#C46318","#E87722"][i]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </>
                )}
              </Card>
            </div>

            {/* ── Status + Biz category ─────────────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 10, marginBottom: 10 }}>
              <Card title="All Listings by Status">
                {listingsByStatusArr.length === 0 ? <EmptyState /> : (
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={listingsByStatusArr} barSize={36}>
                      <CartesianGrid {...gridStyle} />
                      <XAxis dataKey="name" {...axisStyle} />
                      <YAxis {...axisStyle} allowDecimals={false} width={24} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                        {listingsByStatusArr.map((e) => (
                          <Cell key={e.name} fill={
                            e.name === "active"  ? T.saffron :
                            e.name === "expired" ? T.text3   :
                            e.name === "deleted" ? T.red     :
                            T.purple
                          } />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>

              <Card title="Businesses by Category">
                {bizByCatArr.length === 0 ? <EmptyState /> : (
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={bizByCatArr} barSize={14} layout="vertical">
                      <CartesianGrid {...gridStyle} horizontal={false} />
                      <XAxis type="number" {...axisStyle} allowDecimals={false} />
                      <YAxis dataKey="name" type="category" {...axisStyle} width={80} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="value" fill={T.purple} radius={[0, 3, 3, 0]} />
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
                  style={{ fontSize: 11, color: T.saffron, textDecoration: "none", fontWeight: 500 }}>
                  Open in Admin ↗
                </a>
              )}
              style={{ marginBottom: 10 }}
            >
              {allPendingReports.length === 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 0", color: T.green, fontSize: 12 }}>
                  <span>✓</span><span>No pending reports</span>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                        {["Type", "Subject", "Reason", "Reporter", "Date", ""].map((h) => (
                          <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: T.text3, fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>
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
                            <Badge variant="neutral">
                              {r.kind === "business" ? "Business" : TYPE_LABEL[r.listingType] || r.listingType}
                            </Badge>
                          </td>
                          <td style={{ padding: "10px 12px", fontWeight: 500, color: T.text, maxWidth: 200 }}>
                            <Link
                              to={r.kind === "business" ? `/businesses/${r.slug}` : `/${r.listingType}s/${r.slug}`}
                              target="_blank"
                              style={{ color: T.text, textDecoration: "none" }}
                            >
                              {r.subject || "—"}
                            </Link>
                          </td>
                          <td style={{ padding: "10px 12px", color: T.red, fontWeight: 500 }}>{r.reason}</td>
                          <td style={{ padding: "10px 12px", color: T.text2 }}>{r.reporter}</td>
                          <td style={{ padding: "10px 12px", color: T.text3, whiteSpace: "nowrap" }}>{fmtDate(r.created_at)}</td>
                          <td style={{ padding: "10px 12px" }}>
                            <a href="/nepsaathi-admin/listings/listingreport/" target="_blank" rel="noopener noreferrer"
                              style={{ fontSize: 11, fontWeight: 600, color: T.saffron, textDecoration: "none" }}>
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

            {/* ── Payments + Top Listings ───────────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 10, marginBottom: 10 }}>
              <Card title="Recent Payments">
                {recentPayments.length === 0 ? <EmptyState msg="No payments yet" /> : (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {recentPayments.map((p, i) => (
                      <div key={p.id} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "10px 0",
                        borderBottom: i < recentPayments.length - 1 ? `1px solid ${T.border}` : "none",
                      }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: T.text, marginBottom: 2 }}>
                            {p.subject}
                          </div>
                          <div style={{ fontSize: 11, color: T.text3 }}>
                            {p.user} · {p.duration}d · {fmtDate(p.created_at)}
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: T.saffron, fontVariantNumeric: "tabular-nums", marginBottom: 3 }}>
                            {fmtAUD(p.amount)}
                          </div>
                          <Badge variant={p.status === "completed" ? "green" : p.status === "pending" ? "amber" : "red"}>
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
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {topListings.map((l, i) => (
                      <div key={l.id} style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "9px 0",
                        borderBottom: i < topListings.length - 1 ? `1px solid ${T.border}` : "none",
                      }}>
                        <div style={{
                          width: 20, minWidth: 20, textAlign: "center",
                          fontSize: 11, fontWeight: 700,
                          color: i === 0 ? T.text : T.text3,
                          fontVariantNumeric: "tabular-nums",
                        }}>
                          {i + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 500, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            <Link to={`/${l.listing_type}s/${l.slug}`} target="_blank"
                              style={{ color: T.text, textDecoration: "none" }}>
                              {l.title}
                            </Link>
                          </div>
                          <div style={{ fontSize: 11, color: T.text3 }}>
                            {TYPE_LABEL[l.listing_type] || l.listing_type} · {l.state}
                            {l.is_featured && <span style={{ marginLeft: 6, color: T.saffron }}>Featured</span>}
                          </div>
                        </div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: T.purple, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                          {l.view_count.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* ── Recent Signups ─────────────────────────────────────────── */}
            <Card title="Recent Signups">
              {recentUsers.length === 0 ? <EmptyState /> : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                        {["Name", "Email", "Joined", "Status"].map((h) => (
                          <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: T.text3, fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentUsers.map((u, i) => (
                        <tr key={u.id} style={{ borderBottom: i < recentUsers.length - 1 ? `1px solid ${T.border}` : "none" }}>
                          <td style={{ padding: "10px 12px", fontWeight: 500, color: T.text }}>
                            {`${u.first_name} ${u.last_name}`.trim() || "—"}
                          </td>
                          <td style={{ padding: "10px 12px", color: T.text2 }}>{u.email}</td>
                          <td style={{ padding: "10px 12px", color: T.text3, whiteSpace: "nowrap" }}>{fmtDateTime(u.created_at)}</td>
                          <td style={{ padding: "10px 12px" }}>
                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                              {u.is_verified && <Badge variant="green">Verified</Badge>}
                              {u.is_banned  && <Badge variant="red">Banned</Badge>}
                              {!u.is_verified && !u.is_banned && <Badge variant="neutral">New</Badge>}
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
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: 10,
    animation: "pulse 1.6s ease-in-out infinite",
  };
  return (
    <>
      <style>{`@keyframes pulse { 0%,100%{background:#fff} 50%{background:#F0EEE8} }`}</style>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10, marginBottom: 10 }}>
        {[...Array(6)].map((_, i) => <div key={i} style={{ ...pulse, height: 90 }} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10, marginBottom: 20 }}>
        {[...Array(6)].map((_, i) => <div key={i} style={{ ...pulse, height: 60 }} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 10 }}>
        {[...Array(4)].map((_, i) => <div key={i} style={{ ...pulse, height: 230 }} />)}
      </div>
    </>
  );
}
