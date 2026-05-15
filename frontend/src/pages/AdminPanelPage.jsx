import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from "recharts";
import { getAdminStats } from "../api/panel";
import usePageTitle from "../hooks/usePageTitle";

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
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function fmtDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-AU", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const TYPE_LABEL = { job: "Jobs", room: "Rooms", event: "Events", notice: "Notices", business: "Businesses" };
const TYPE_COLOR = { job: "#3C3489", room: "#9B5A00", event: "#085041", notice: "#0C447C", business: "#7A3B00" };
const TYPE_BG    = { job: "#EEEDFE", room: "#FFF1E0", event: "#E1F5EE", notice: "#E6F1FB", business: "#FFF3E0" };

const STATE_COLORS = {
  NSW: "#4F46E5", VIC: "#0891B2", QLD: "#D97706", WA: "#EA580C",
  SA: "#7C3AED", TAS: "#059669", ACT: "#DB2777", NT: "#DC2626",
};

const CAT_LABELS = {
  restaurant: "Restaurant", grocery: "Grocery", travel: "Travel",
  beauty: "Beauty", health: "Health", legal: "Legal",
  education: "Education", religious: "Religious", construction: "Construction",
  transport: "Transport", finance: "Finance", freelancer: "Freelancer",
  retail: "Retail", other: "Other",
};

const STATUS_COLOR = {
  active: "#059669", expired: "#D97706", filled: "#2563EB", deleted: "#DC2626",
};

const BAR_COLORS = ["#4F46E5","#0891B2","#D97706","#EA580C","#7C3AED","#059669","#DB2777","#DC2626","#65A30D","#F59E0B"];

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent, icon, warn }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 14,
      padding: "18px 20px",
      borderLeft: `4px solid ${warn ? "#EF4444" : accent}`,
      display: "flex",
      flexDirection: "column",
      gap: 4,
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 12, color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {label}
        </span>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: warn ? "#EF4444" : "#1E1B4B", lineHeight: 1.1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: "#999" }}>{sub}</div>
      )}
    </div>
  );
}

function Card({ title, children, style }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 14,
      padding: "20px 22px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      ...style,
    }}>
      {title && (
        <div style={{
          fontSize: 13,
          fontWeight: 700,
          color: "#26215C",
          marginBottom: 16,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}>
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

function EmptyState({ msg = "No data" }) {
  return (
    <div style={{ textAlign: "center", padding: "32px 0", color: "#bbb", fontSize: 13 }}>
      {msg}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label, prefix = "", suffix = "" }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#26215C", color: "#fff", borderRadius: 8,
      padding: "8px 14px", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    }}>
      <div style={{ marginBottom: 4, color: "#AFA9EC" }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontWeight: 700 }}>
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
      <div style={{ maxWidth: 600, margin: "80px auto", textAlign: "center", padding: 28 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🚫</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#26215C" }}>Access denied</div>
        <div style={{ fontSize: 13, color: "#888", marginTop: 6 }}>
          {error?.response?.status === 403 ? "You don't have permission to view this page." : "Failed to load panel data."}
        </div>
      </div>
    );
  }

  const ov = data?.overview || {};
  const pendingReports = (ov.pending_listing_reports || 0) + (ov.pending_business_reports || 0);

  const usersTimeSeries = data ? fillDates(data.users_over_time) : [];
  const listingsTimeSeries = data ? fillDates(data.listings_over_time) : [];

  const listingsByTypeArr = data
    ? Object.entries(data.listings_by_type).map(([k, v]) => ({
        name: TYPE_LABEL[k] || k, value: v, key: k,
      }))
    : [];

  const listingsByStateArr = data
    ? Object.entries(data.listings_by_state)
        .map(([k, v]) => ({ name: k, value: v }))
        .sort((a, b) => b.value - a.value)
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
      id: r.id,
      kind: "listing",
      reason: r.reason,
      subject: r["listing__title"],
      slug: r["listing__slug"],
      listingType: r["listing__listing_type"],
      reporter: `${r["user__first_name"]} ${r["user__last_name"]}`.trim() || r["user__email"],
      created_at: r.created_at,
    })),
    ...(data?.pending_business_reports || []).map((r) => ({
      id: r.id,
      kind: "business",
      reason: r.reason,
      subject: r["business__business_name"],
      slug: r["business__slug"],
      listingType: "business",
      reporter: `${r["user__first_name"]} ${r["user__last_name"]}`.trim() || r["user__email"],
      created_at: r.created_at,
    })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const recentPayments = (data?.recent_payments || []).map((p) => ({
    id: p.id,
    amount: p.amount_paid / 100,
    duration: p.duration_days,
    status: p.status,
    created_at: p.created_at,
    completed_at: p.completed_at,
    subject: p["listing__title"] || p["business__business_name"] || "—",
    slug: p["listing__slug"] || p["business__slug"],
    listingType: p["listing__listing_type"] || "business",
    user: `${p["user__first_name"] || ""} ${p["user__last_name"] || ""}`.trim() || p["user__email"],
  }));

  const topListings = data?.top_listings || [];
  const recentUsers = data?.recent_users || [];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 20px 60px", background: "#F5F4F0", minHeight: "100vh" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: "#26215C",
        borderRadius: 16,
        padding: "22px 28px",
        marginBottom: 20,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 3 }}>
            NepSaathi — Internal Panel
          </div>
          <div style={{ fontSize: 12, color: "#AFA9EC" }}>
            {isLoading ? "Loading data..." : `Data as of ${new Date().toLocaleString("en-AU")}`}
          </div>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          style={{
            background: isFetching ? "#3D3780" : "#4F46E5",
            color: "#fff", border: "none", borderRadius: 10,
            padding: "10px 20px", fontSize: 13, fontWeight: 600,
            cursor: isFetching ? "default" : "pointer",
          }}
        >
          {isFetching ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {/* ── Stat cards ────────────────────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 12, marginBottom: 20 }}>
            <StatCard
              label="Total Users" value={ov.total_users?.toLocaleString() || 0}
              sub={`+${ov.new_users_today || 0} today · +${ov.new_users_week || 0} this week`}
              accent="#4F46E5" icon="👤"
            />
            <StatCard
              label="Active Listings" value={ov.active_listings?.toLocaleString() || 0}
              sub={`${ov.total_listings || 0} total · ${ov.featured_listings || 0} featured`}
              accent="#059669" icon="📋"
            />
            <StatCard
              label="Businesses" value={ov.total_businesses?.toLocaleString() || 0}
              sub={`${ov.verified_businesses || 0} verified · ${ov.featured_businesses || 0} featured`}
              accent="#D97706" icon="🏪"
            />
            <StatCard
              label="Revenue (AUD)" value={fmtAUD(ov.total_revenue_aud || 0)}
              sub={`${ov.total_payments || 0} completed payments`}
              accent="#7C3AED" icon="💰"
            />
            <StatCard
              label="Pending Reports" value={pendingReports}
              sub={`${ov.pending_listing_reports || 0} listings · ${ov.pending_business_reports || 0} businesses`}
              accent="#EF4444" icon="⚠️" warn={pendingReports > 0}
            />
            <StatCard
              label="Messages" value={ov.total_messages?.toLocaleString() || 0}
              sub={`${ov.total_conversations || 0} threads · +${ov.new_messages_week || 0} this week`}
              accent="#0891B2" icon="💬"
            />
          </div>

          {/* ── Secondary stat row ─────────────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10, marginBottom: 20 }}>
            {[
              { label: "Under Review", value: ov.under_review_listings || 0, color: "#D97706" },
              { label: "Banned Users", value: ov.banned_users || 0, color: "#DC2626" },
              { label: "Verified Users", value: ov.verified_users || 0, color: "#059669" },
              { label: "New Listings/Week", value: ov.new_listings_week || 0, color: "#4F46E5" },
              { label: "Avg Feedback", value: data?.feedback?.avg_score ? `${data.feedback.avg_score}/5` : "—", color: "#F59E0B" },
              { label: "Feedback Count", value: data?.feedback?.total_responses || 0, color: "#7C3AED" },
            ].map((s) => (
              <div key={s.label} style={{
                background: "#fff", borderRadius: 10, padding: "12px 16px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}>
                <div style={{ fontSize: 11, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>
                  {typeof s.value === "number" ? s.value.toLocaleString() : s.value}
                </div>
              </div>
            ))}
          </div>

          {/* ── Time series charts ─────────────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <Card title="New Users — Last 30 Days">
              {usersTimeSeries.every((d) => d.count === 0) ? (
                <EmptyState msg="No new users in the last 30 days" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={usersTimeSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#aaa" }} interval={6} />
                    <YAxis tick={{ fontSize: 10, fill: "#aaa" }} allowDecimals={false} width={28} />
                    <Tooltip content={<CustomTooltip suffix=" users" />} />
                    <Line type="monotone" dataKey="count" stroke="#4F46E5" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card title="New Listings — Last 30 Days">
              {listingsTimeSeries.every((d) => d.count === 0) ? (
                <EmptyState msg="No new listings in the last 30 days" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={listingsTimeSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#aaa" }} interval={6} />
                    <YAxis tick={{ fontSize: 10, fill: "#aaa" }} allowDecimals={false} width={28} />
                    <Tooltip content={<CustomTooltip suffix=" listings" />} />
                    <Line type="monotone" dataKey="count" stroke="#059669" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          {/* ── Breakdown charts ───────────────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <Card title="Active Listings by Type">
              {listingsByTypeArr.length === 0 ? <EmptyState /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={listingsByTypeArr} barSize={36}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#aaa" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#aaa" }} allowDecimals={false} width={28} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {listingsByTypeArr.map((e) => (
                        <Cell key={e.key} fill={TYPE_COLOR[e.key] || "#4F46E5"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card title="Active Listings by State">
              {listingsByStateArr.length === 0 ? <EmptyState /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={listingsByStateArr} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#aaa" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#aaa" }} allowDecimals={false} width={28} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {listingsByStateArr.map((e) => (
                        <Cell key={e.name} fill={STATE_COLORS[e.name] || "#4F46E5"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          {/* ── Revenue + Feedback ─────────────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <Card title="Revenue by Month (AUD)">
              {!data?.revenue_by_month?.length ? (
                <EmptyState msg="No completed payments yet" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.revenue_by_month} barSize={36}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#aaa" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#aaa" }} width={40}
                      tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      content={({ active, payload, label }) =>
                        active && payload?.length ? (
                          <div style={{
                            background: "#26215C", color: "#fff", borderRadius: 8,
                            padding: "8px 14px", fontSize: 12,
                          }}>
                            <div style={{ color: "#AFA9EC", marginBottom: 4 }}>{label}</div>
                            <div style={{ fontWeight: 700 }}>{fmtAUD(payload[0].value)}</div>
                            <div style={{ color: "#AFA9EC" }}>{payload[0]?.payload?.count} payments</div>
                          </div>
                        ) : null
                      }
                    />
                    <Bar dataKey="total_aud" fill="#7C3AED" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card title="User Feedback Scores">
              {feedbackArr.every((f) => f.value === 0) ? (
                <EmptyState msg="No feedback submitted yet" />
              ) : (
                <>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "#F59E0B" }}>
                      {data?.feedback?.avg_score || "—"}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#26215C" }}>Avg score</div>
                      <div style={{ fontSize: 12, color: "#aaa" }}>{data?.feedback?.total_responses} responses</div>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={feedbackArr} barSize={32}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#aaa" }} />
                      <YAxis tick={{ fontSize: 10, fill: "#aaa" }} allowDecimals={false} width={24} />
                      <Tooltip content={<CustomTooltip suffix=" responses" />} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {feedbackArr.map((_, i) => (
                          <Cell key={i} fill={["#EF4444", "#F97316", "#FBBF24", "#84CC16", "#22C55E"][i]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </>
              )}
            </Card>
          </div>

          {/* ── Status + Business category ─────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <Card title="All Listings by Status">
              {listingsByStatusArr.length === 0 ? <EmptyState /> : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={listingsByStatusArr} barSize={40}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#aaa" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#aaa" }} allowDecimals={false} width={28} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {listingsByStatusArr.map((e) => (
                        <Cell key={e.name} fill={STATUS_COLOR[e.name] || "#aaa"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card title="Businesses by Category">
              {bizByCatArr.length === 0 ? <EmptyState /> : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={bizByCatArr} barSize={20} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#aaa" }} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "#aaa" }} width={80} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {bizByCatArr.map((_, i) => (
                        <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          {/* ── Pending Reports ────────────────────────────────────────────── */}
          <Card
            title={`Pending Reports (${allPendingReports.length})`}
            style={{ marginBottom: 14 }}
          >
            {allPendingReports.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "24px 0",
                color: "#059669", fontSize: 13, fontWeight: 600,
              }}>
                ✓ No pending reports — all clear
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "1.5px solid #f0f0f0" }}>
                      {["Type", "Subject", "Reason", "Reporter", "Date", "Action"].map((h) => (
                        <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#aaa", fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allPendingReports.map((r, i) => (
                      <tr key={`${r.kind}-${r.id}`}
                        style={{ borderBottom: i < allPendingReports.length - 1 ? "0.5px solid #f5f5f5" : "none" }}>
                        <td style={{ padding: "10px 12px" }}>
                          <span style={{
                            background: r.kind === "business" ? "#FFF1E0" : TYPE_BG[r.listingType] || "#F5F4F0",
                            color: r.kind === "business" ? "#7A3B00" : TYPE_COLOR[r.listingType] || "#26215C",
                            fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                          }}>
                            {r.kind === "business" ? "Business" : TYPE_LABEL[r.listingType] || r.listingType}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px", fontWeight: 600, color: "#26215C", maxWidth: 200 }}>
                          <Link
                            to={r.kind === "business" ? `/businesses/${r.slug}` : `/${r.listingType}s/${r.slug}`}
                            target="_blank"
                            style={{ color: "#26215C", textDecoration: "none" }}
                          >
                            {r.subject || "—"}
                          </Link>
                        </td>
                        <td style={{ padding: "10px 12px", color: "#EF4444", fontWeight: 600, fontSize: 12 }}>
                          {r.reason}
                        </td>
                        <td style={{ padding: "10px 12px", color: "#888", fontSize: 12 }}>{r.reporter}</td>
                        <td style={{ padding: "10px 12px", color: "#aaa", fontSize: 12, whiteSpace: "nowrap" }}>
                          {fmtDate(r.created_at)}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <a
                            href={`/nepsaathi-admin/listings/listingreport/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: 11, fontWeight: 700, color: "#4F46E5",
                              textDecoration: "none",
                            }}
                          >
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

          {/* ── Recent Payments + Top Listings ─────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>

            <Card title="Recent Payments">
              {recentPayments.length === 0 ? (
                <EmptyState msg="No payments yet" />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {recentPayments.map((p) => (
                    <div key={p.id} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "10px 14px", background: "#F9F9FB", borderRadius: 10,
                    }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#26215C", marginBottom: 2 }}>
                          {p.subject}
                        </div>
                        <div style={{ fontSize: 11, color: "#aaa" }}>
                          {p.user} · {p.duration}d · {fmtDate(p.created_at)}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#7C3AED" }}>
                          {fmtAUD(p.amount)}
                        </div>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                          background: p.status === "completed" ? "#D1FAE5" : p.status === "pending" ? "#FEF3C7" : "#FEE2E2",
                          color: p.status === "completed" ? "#059669" : p.status === "pending" ? "#D97706" : "#DC2626",
                        }}>
                          {p.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card title="Top Listings by Views">
              {topListings.length === 0 ? (
                <EmptyState msg="No listing views recorded yet" />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {topListings.map((l, i) => (
                    <div key={l.id} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "8px 12px", background: "#F9F9FB", borderRadius: 10,
                    }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: "50%",
                        background: i < 3 ? ["#FDE68A", "#E2E8F0", "#FDBA74"][i] : "#F0F0F0",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 800, color: "#444", flexShrink: 0,
                      }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#26215C", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          <Link
                            to={`/${l.listing_type}s/${l.slug}`}
                            target="_blank"
                            style={{ color: "#26215C", textDecoration: "none" }}
                          >
                            {l.title}
                          </Link>
                        </div>
                        <div style={{ fontSize: 11, color: "#aaa" }}>
                          {TYPE_LABEL[l.listing_type] || l.listing_type} · {l.state}
                          {l.is_featured && " · ⭐ Featured"}
                        </div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#4F46E5", flexShrink: 0 }}>
                        {l.view_count.toLocaleString()} views
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* ── Recent Signups ──────────────────────────────────────────────── */}
          <Card title="Recent Signups">
            {recentUsers.length === 0 ? (
              <EmptyState />
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "1.5px solid #f0f0f0" }}>
                      {["Name", "Email", "Joined", "Status"].map((h) => (
                        <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#aaa", fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers.map((u, i) => (
                      <tr key={u.id} style={{ borderBottom: i < recentUsers.length - 1 ? "0.5px solid #f5f5f5" : "none" }}>
                        <td style={{ padding: "10px 12px", fontWeight: 600, color: "#26215C" }}>
                          {`${u.first_name} ${u.last_name}`.trim() || "—"}
                        </td>
                        <td style={{ padding: "10px 12px", color: "#888" }}>{u.email}</td>
                        <td style={{ padding: "10px 12px", color: "#aaa", whiteSpace: "nowrap" }}>
                          {fmtDateTime(u.created_at)}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {u.is_verified && (
                              <span style={{ background: "#D1FAE5", color: "#059669", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
                                Verified
                              </span>
                            )}
                            {u.is_banned && (
                              <span style={{ background: "#FEE2E2", color: "#DC2626", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
                                Banned
                              </span>
                            )}
                            {!u.is_verified && !u.is_banned && (
                              <span style={{ background: "#F3F4F6", color: "#6B7280", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
                                New
                              </span>
                            )}
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
  );
}

function LoadingSkeleton() {
  const pulse = {
    background: "linear-gradient(90deg, #ede9fe 25%, #ddd6fe 50%, #ede9fe 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.4s infinite",
    borderRadius: 10,
  };
  return (
    <>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ ...pulse, height: 90 }} />
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ ...pulse, height: 240 }} />
        ))}
      </div>
    </>
  );
}
