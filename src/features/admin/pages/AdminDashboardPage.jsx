import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getAdminApiUrl, getAdminAuthHeaders } from "../util";
import "../css/AdminDashboardPage.css";

const PAGE_TITLES = {
  dashboard: "Dashboard",
  foundations: "Foundation",
  campaigns: "Campaign",
  reports: "Report",
  inactive: "비활성화 단체",
  members: "Users",
  requests: "새 요청",
  logs: "Admin Logs",
};

const PAGE_DESCRIPTIONS = {
  inactive: "활동 보고서 미이행 등으로 비활성화된 기부단체 목록입니다.",
  campaigns: "승인 대기 중인 캠페인 목록입니다.",
  reports: "승인 대기 중인 활동 보고서 목록입니다.",
  members: "플랫폼 가입 회원 목록입니다.",
  requests: "기부단체 가입 신청 목록입니다.",
  logs: "관리자 활동 로그 목록입니다.",
};

const SECTION_CONFIG = {
  campaigns: { endpoint: "/campaigns/pending", defaultQuery: { page: 0, size: 10, keyword: "", sort: "createdAt,desc" } },
  reports: { endpoint: "/reports/pending", defaultQuery: { page: 0, size: 10, sort: "createdAt,desc" } },
  inactive: { endpoint: "/foundation/approved", defaultQuery: { page: 0, size: 10, keyword: "", accountStatus: "INACTIVE", sort: "createdAt,desc" } },
  members: { endpoint: "/users", defaultQuery: { page: 0, size: 10, keyword: "", status: "", sort: "createdAt,desc" } },
  requests: { endpoint: "/foundation/applications", defaultQuery: { page: 0, size: 20, keyword: "", reviewStatus: "", sort: "createdAt,desc" } },
  logs: {
    endpoint: "/logs",
    defaultQuery: {
      page: 0,
      size: 10,
      keyword: "",
      actionType: "",
      targetType: "",
      startDate: "",
      endDate: "",
      sort: "created_at,desc",
    },
  },
};

const SORT_OPTIONS = [
  { value: "createdAt,desc", label: "Newest" },
  { value: "createdAt,asc", label: "Oldest" },
];

const LOGS_SORT_OPTIONS = [
  { value: "created_at,desc", label: "Newest" },
  { value: "created_at,asc", label: "Oldest" },
];

const REVIEW_STATUS_OPTIONS = [
  { value: "", label: "All Review Status" },
  { value: "ILLEGAL", label: "ILLEGAL" },
  { value: "SIMILAR", label: "SIMILAR" },
  { value: "CLEAN", label: "CLEAN" },
  { value: "APPROVED", label: "APPROVED" },
  { value: "REJECTED", label: "REJECTED" },
];

const ACCOUNT_STATUS_OPTIONS = [
  { value: "", label: "All Account Status" },
  { value: "ACTIVE", label: "ACTIVE" },
  { value: "INACTIVE", label: "INACTIVE" },
  { value: "PRE_REGISTERED", label: "PRE_REGISTERED" },
];

const USER_STATUS_OPTIONS = [
  { value: "", label: "All User Status" },
  { value: "ACTIVE", label: "ACTIVE" },
  { value: "INACTIVE", label: "INACTIVE" },
  { value: "PENDING", label: "PENDING" },
];

const ACTION_TYPE_OPTIONS = [
  { value: "", label: "All Action Types" },
  { value: "APPROVE", label: "APPROVE" },
  { value: "REJECT", label: "REJECT" },
  { value: "ENABLE", label: "ENABLE" },
  { value: "DISABLE", label: "DISABLE" },
];

const TARGET_TYPE_OPTIONS = [
  { value: "", label: "All Target Types" },
  { value: "CAMPAIGN", label: "CAMPAIGN" },
  { value: "USERS", label: "USERS" },
  { value: "INQUIRY", label: "INQUIRY" },
  { value: "FINAL_REPORT", label: "FINAL_REPORT" },
  { value: "BENEFICIARY", label: "BENEFICIARY" },
  { value: "FOUNDATION", label: "FOUNDATION" },
];

const EMAIL_TEMPLATE_OPTIONS = [
  { value: "", label: "All Templates" },
  { value: "DONATION_COMPLETE", label: "DONATION_COMPLETE" },
  { value: "CAMPAIGN_APPROVED", label: "CAMPAIGN_APPROVED" },
  { value: "CAMPAIGN_REJECTED", label: "CAMPAIGN_REJECTED" },
  { value: "CAMPAIGN_ACHIEVED", label: "CAMPAIGN_ACHIEVED" },
  { value: "PASSWORD_RESET", label: "PASSWORD_RESET" },
  { value: "ACCOUNT_APPROVED", label: "ACCOUNT_APPROVED" },
  { value: "ACCOUNT_REJECTED", label: "ACCOUNT_REJECTED" },
  { value: "FOUNDATION_TEMP_PASSWORD", label: "FOUNDATION_TEMP_PASSWORD" },
  { value: "FOUNDATION_INACTIVE_BATCH", label: "FOUNDATION_INACTIVE_BATCH" },
  { value: "FOUNDATION_DEACTIVATED_BY_ADMIN", label: "FOUNDATION_DEACTIVATED_BY_ADMIN" },
];

function toApiDateTime(value) {
  if (!value) return "";
  if (value.length === 16) return `${value}:00`;
  return value;
}

function buildQueryPath(basePath, query = {}) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === "string" && value.trim() === "") return;
    params.set(key, String(value));
  });

  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

function createInitialSectionQuery() {
  return Object.entries(SECTION_CONFIG).reduce((acc, [key, config]) => {
    acc[key] = { ...config.defaultQuery };
    return acc;
  }, {});
}

function getVisiblePageNumbers(currentPage, totalPages, maxButtons = 5) {
  if (totalPages <= 0) return [];
  const safeCurrent = Math.min(Math.max(currentPage, 0), totalPages - 1);
  const half = Math.floor(maxButtons / 2);
  let start = Math.max(0, safeCurrent - half);
  let end = Math.min(totalPages - 1, start + maxButtons - 1);
  start = Math.max(0, end - maxButtons + 1);

  const pages = [];
  for (let i = start; i <= end; i += 1) pages.push(i);
  return pages;
}

function formatCurrency(value) {
  const num = Number(value ?? 0);
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(num) ? num : 0);
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("ko-KR");
}

function normalizePageContent(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.content)) return payload.content;
  return [];
}

async function fetchAdminJson(path) {
  const response = await fetch(getAdminApiUrl(path), {
    method: "GET",
    headers: getAdminAuthHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(errorText || `Request failed (${response.status})`);
  }

  return response.json();
}

function parseSseChunk(chunk) {
  const lines = chunk.split("\n");
  let eventName = "message";
  const dataLines = [];

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    if (trimmed.startsWith("event:")) {
      eventName = trimmed.slice(6).trim();
      return;
    }
    if (trimmed.startsWith("data:")) {
      dataLines.push(trimmed.slice(5).trim());
    }
  });

  const rawData = dataLines.join("\n");
  let data = rawData;
  if (rawData) {
    try {
      data = JSON.parse(rawData);
    } catch {
      data = rawData;
    }
  }

  return { eventName, data };
}

async function streamAdminSse(onEvent, signal) {
  const response = await fetch(getAdminApiUrl("/subscribe"), {
    method: "GET",
    headers: getAdminAuthHeaders({
      Accept: "text/event-stream",
      "Cache-Control": "no-cache",
    }),
    signal,
  });

  if (!response.ok || !response.body) {
    const errorText = await response.text().catch(() => "");
    throw new Error(errorText || `SSE failed (${response.status})`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (!signal.aborted) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";
    chunks.forEach((chunk) => onEvent(parseSseChunk(chunk)));
  }
}

function mapApprovalEventToRecentLog(data) {
  if (!data || typeof data !== "object") return null;
  return {
    logNo: `sse-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    actionType: data.actionType ?? "REQUEST",
    targetType: data.targetType ?? "REQUEST",
    description: data.message ?? "New approval request arrived.",
    createdAt: new Date().toISOString(),
    targetId: data.targetId ?? null,
  };
}

function normalizeApplicationsToRequests(rows) {
  return rows.map((row) => ({
    logNo: row.foundationNo ?? `app-${Math.random()}`,
    actionType: row.actionType ?? "REQUEST",
    targetType: row.foundationType || "FOUNDATION",
    description: row.foundationName || "-",
    createdAt: row.createdAt,
    targetId: row.foundationNo ?? null,
  }));
}

function getRequestDetailPath(targetType, targetId) {
  if (!targetId) return null;
  const type = String(targetType ?? "").toUpperCase();
  if (type === "FOUNDATION" || type === "COMPANY" || type === "ORG" || type === "ORGANIZATION") {
    return `/admin/foundation/${targetId}`;
  }
  if (type === "CAMPAIGN") return `/admin/campaign/${targetId}`;
  if (type === "FINAL_REPORT" || type === "REPORT") return `/admin/report/${targetId}`;
  if (type === "LOG" || type === "ADMIN_LOG") return `/admin/log/${targetId}`;
  if (type === "REQUEST" || type === "APPLICATION") return `/admin/request/${targetId}`;
  return null;
}

function buildLinePath(points) {
  if (!points.length) return "";
  const w = 760;
  const h = 320;
  const padX = 40;
  const padY = 24;
  const amounts = points.map((item) => Number(item?.amount ?? 0));
  const maxAmount = Math.max(...amounts, 1);
  const stepX = points.length > 1 ? (w - padX * 2) / (points.length - 1) : 0;

  return points
    .map((point, index) => {
      const x = padX + stepX * index;
      const y = h - padY - (Number(point?.amount ?? 0) / maxAmount) * (h - padY * 2);
      return `${index === 0 ? "M" : "L"}${x} ${y}`;
    })
    .join(" ");
}

function buildCountPath(points) {
  if (!points.length) return "";
  const w = 760;
  const h = 160;
  const padX = 40;
  const padY = 16;
  const values = points.map((item) => Number(item?.count ?? 0));
  const maxValue = Math.max(...values, 1);
  const stepX = points.length > 1 ? (w - padX * 2) / (points.length - 1) : 0;

  return points
    .map((point, index) => {
      const x = padX + stepX * index;
      const y = h - padY - (Number(point?.count ?? 0) / maxValue) * (h - padY * 2);
      return `${index === 0 ? "M" : "L"}${x} ${y}`;
    })
    .join(" ");
}

function abbreviateCurrency(value) {
  if (value === 0) return "0";
  if (value >= 100_000_000) return `${(value / 100_000_000).toFixed(1).replace(/\.0$/, "")}억`;
  if (value >= 10_000) return `${(value / 10_000).toFixed(0)}만`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}천`;
  return String(Math.round(value));
}

function PeriodSelector({ days, onChangeDays }) {
  const [showCustom, setShowCustom] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const presets = [7, 14, 30];

  return (
    <div className="admin-dashboard-period-selector">
      {presets.map((d) => (
        <button
          key={d}
          type="button"
          className={`admin-dashboard-period-btn ${days === d && !showCustom ? "is-active" : ""}`}
          onClick={() => { setShowCustom(false); onChangeDays(d); }}
        >
          {d}일
        </button>
      ))}
      <button
        type="button"
        className={`admin-dashboard-period-btn ${showCustom ? "is-active" : ""}`}
        onClick={() => setShowCustom((v) => !v)}
      >
        직접 선택
      </button>
      {showCustom && (
        <div className="admin-dashboard-custom-period">
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          <span>~</span>
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          <button
            type="button"
            disabled={!start || !end || start > end}
            onClick={() => {
              const d = Math.max(1, Math.ceil((new Date(end) - new Date(start)) / 86_400_000));
              onChangeDays(d);
              setShowCustom(false);
            }}
          >
            적용
          </button>
        </div>
      )}
    </div>
  );
}

function buildDonutGradient(ratios, field = "donationAmount") {
  const total = ratios.reduce((acc, item) => acc + Number(item?.[field] ?? 0), 0);
  const safeTotal = total > 0 ? total : 1;
  const colors = ["#3b82f6", "#60a5fa", "#2563eb", "#93c5fd", "#1d4ed8", "#0ea5e9"];
  let offset = 0;

  const segments = ratios.map((item, index) => {
    const ratio = (Number(item?.[field] ?? 0) / safeTotal) * 100;
    const start = offset;
    const end = offset + ratio;
    offset = end;
    return `${colors[index % colors.length]} ${start}% ${end}%`;
  });

  if (!segments.length) return "conic-gradient(#dbeafe 0% 100%)";
  return `conic-gradient(${segments.join(", ")})`;
}

const CATEGORY_COLORS = ["#3b82f6", "#60a5fa", "#2563eb", "#93c5fd", "#1d4ed8", "#0ea5e9"];

// 기부금액 추이 차트 설정 (viewBox 760×320)
const DC = { W: 760, H: 320, pL: 72, pR: 16, pT: 16, pB: 40 };
DC.cW = DC.W - DC.pL - DC.pR; // 672
DC.cH = DC.H - DC.pT - DC.pB; // 264

// 사용자 가입 추이 차트 설정 (viewBox 760×210)
const UC = { W: 760, H: 210, pL: 56, pR: 16, pT: 12, pB: 36 };
UC.cW = UC.W - UC.pL - UC.pR; // 688
UC.cH = UC.H - UC.pT - UC.pB; // 162

function DashboardHome({ dashboardData, loading, error, onNavigate, navigate, donationDays, userDays, onDonationDaysChange, onUserDaysChange }) {
  const summary = dashboardData.summary ?? {};
  const trend = dashboardData.trend ?? [];
  const categories = dashboardData.categoryRatio ?? [];
  const recentLogs = dashboardData.recentLogs ?? [];
  const activityLogs = dashboardData.activityLogs ?? [];
  const userTrend = dashboardData.userTrend ?? [];
  const requestsTotalCount = dashboardData.requestsTotalCount ?? 0;
  const [tooltip, setTooltip] = useState(null);
  const [userTooltip, setUserTooltip] = useState(null);

  if (loading) {
    return (
      <section className="admin-dashboard-panel admin-dashboard-placeholder">
        <h2>Loading dashboard data...</h2>
        <p>Please wait a moment.</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="admin-dashboard-panel admin-dashboard-placeholder">
        <h2>Dashboard load failed</h2>
        <p>{error}</p>
      </section>
    );
  }

  return (
    <div className="admin-dashboard-content__stack">
      <section className="admin-dashboard-summary-grid">
        <article className="admin-dashboard-summary-card">
          <p>오늘 기부액</p>
          <strong style={{ color: "#2563eb" }}>{formatCurrency(summary.todayDonationAmount)}</strong>
        </article>
        <article className="admin-dashboard-summary-card">
          <p>진행 중 캠페인</p>
          <strong style={{ color: "#38bdf8" }}>{Number(summary.activeCampaignCount ?? 0).toLocaleString("ko-KR")}</strong>
        </article>
        <article className="admin-dashboard-summary-card">
          <p>신규 단체 신청</p>
          <strong style={{ color: "#1d4ed8" }}>{Number(summary.pendingFoundationCount ?? 0).toLocaleString("ko-KR")}</strong>
        </article>
        <article className="admin-dashboard-summary-card">
          <p>달성 비율</p>
          <strong style={{ color: "#0891b2" }}>{Number(summary.achievedCampaignRatio ?? 0).toFixed(1)}%</strong>
        </article>
        <article className="admin-dashboard-summary-card">
          <p>전체 누적 기부액</p>
          <strong style={{ color: "#7c3aed" }}>{formatCurrency(summary.totalDonationAmount)}</strong>
          <span className="admin-dashboard-summary-card__sub">{Number(summary.totalUserCount ?? 0).toLocaleString("ko-KR")}명</span>
        </article>
      </section>

      <section className="admin-dashboard-main-grid">
        <div className="admin-dashboard-left-panels">
          {/* 기부금액 추이 */}
          <article className="admin-dashboard-panel admin-dashboard-panel--chart">
            <div className="admin-dashboard-panel__header">
              <h2>Donation Trend</h2>
              <PeriodSelector days={donationDays} onChangeDays={onDonationDaysChange} />
            </div>
            <div className="admin-dashboard-line-chart">
              {trend.length ? (() => {
                const amounts = trend.map((t) => Number(t?.amount ?? 0));
                const maxAmt = Math.max(...amounts, 1);
                const stepX = trend.length > 1 ? DC.cW / (trend.length - 1) : 0;
                const ptX = (i) => DC.pL + stepX * i;
                const ptY = (v) => DC.pT + DC.cH - (v / maxAmt) * DC.cH;
                const linePath = trend.map((p, i) => `${i === 0 ? "M" : "L"}${ptX(i)} ${ptY(Number(p?.amount ?? 0))}`).join(" ");
                const yLevels = [0, 0.25, 0.5, 0.75, 1];
                const xStep = Math.max(1, Math.floor(trend.length / 6));
                return (
                  <>
                    <svg
                      viewBox={`0 0 ${DC.W} ${DC.H}`}
                      aria-hidden="true"
                      style={{ cursor: "crosshair" }}
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const svgX = ((e.clientX - rect.left) / rect.width) * DC.W;
                        const idx = Math.min(Math.max(Math.round((svgX - DC.pL) / (stepX || 1)), 0), trend.length - 1);
                        const p = trend[idx];
                        const x = ptX(idx);
                        const y = ptY(Number(p?.amount ?? 0));
                        setTooltip({ x, y, xPct: (x / DC.W) * 100, yPct: (y / DC.H) * 100, label: p?.date ?? "-", amount: Number(p?.amount ?? 0) });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      {/* Y축 그리드 + 레이블 */}
                      {yLevels.map((r) => {
                        const yp = DC.pT + DC.cH - r * DC.cH;
                        return (
                          <g key={r}>
                            <line x1={DC.pL} y1={yp} x2={DC.W - DC.pR} y2={yp} stroke="#e2e8f0" strokeWidth={r === 0 ? 1.5 : 1} strokeDasharray={r === 0 ? "none" : "4 3"} />
                            <text x={DC.pL - 6} y={yp + 4} textAnchor="end" fontSize="10" fill="#94a3b8">{abbreviateCurrency(maxAmt * r)}</text>
                          </g>
                        );
                      })}
                      {/* X축 날짜 레이블 */}
                      {trend.map((p, i) => i % xStep !== 0 ? null : (
                        <text key={i} x={ptX(i)} y={DC.H - DC.pB + 14} textAnchor="middle" fontSize="10" fill="#94a3b8">
                          {(p?.date ?? "").slice(5)}
                        </text>
                      ))}
                      {/* 데이터 라인 */}
                      <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                      {/* 툴팁 마커 */}
                      {tooltip && (
                        <>
                          <line x1={tooltip.x} y1={DC.pT} x2={tooltip.x} y2={DC.pT + DC.cH} stroke="#dbeafe" strokeWidth={1.5} strokeDasharray="4 3" />
                          <circle cx={tooltip.x} cy={tooltip.y} r={5} fill="#2563eb" stroke="#fff" strokeWidth={2} />
                        </>
                      )}
                    </svg>
                    {tooltip && (
                      <div className="admin-dashboard-chart-bubble" style={{ left: `${tooltip.xPct}%`, top: `${tooltip.yPct}%` }}>
                        <span>{tooltip.label}</span>
                        <strong>{formatCurrency(tooltip.amount)}</strong>
                      </div>
                    )}
                  </>
                );
              })() : (
                <p className="admin-dashboard-empty-text">No trend data.</p>
              )}
            </div>
          </article>

          {/* 사용자 가입 추이 */}
          <article className="admin-dashboard-panel">
            <div className="admin-dashboard-panel__header">
              <h2>User Registration Trend</h2>
              <PeriodSelector days={userDays} onChangeDays={onUserDaysChange} />
            </div>
            <div className="admin-dashboard-user-trend-chart">
              {userTrend.length ? (() => {
                const counts = userTrend.map((t) => Number(t?.count ?? 0));
                const maxCnt = Math.max(...counts, 1);
                const stepX = userTrend.length > 1 ? UC.cW / (userTrend.length - 1) : 0;
                const ptX = (i) => UC.pL + stepX * i;
                const ptY = (v) => UC.pT + UC.cH - (v / maxCnt) * UC.cH;
                const linePath = userTrend.map((p, i) => `${i === 0 ? "M" : "L"}${ptX(i)} ${ptY(Number(p?.count ?? 0))}`).join(" ");
                const yLevels = [0, 0.25, 0.5, 0.75, 1];
                const xStep = Math.max(1, Math.floor(userTrend.length / 6));
                const countLabel = (v) => v >= 10_000 ? `${Math.round(v / 10_000)}만명` : v >= 1_000 ? `${Math.round(v / 1_000)}천명` : `${Math.round(v)}명`;
                return (
                  <>
                    <svg
                      viewBox={`0 0 ${UC.W} ${UC.H}`}
                      aria-hidden="true"
                      style={{ cursor: "crosshair" }}
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const svgX = ((e.clientX - rect.left) / rect.width) * UC.W;
                        const idx = Math.min(Math.max(Math.round((svgX - UC.pL) / (stepX || 1)), 0), userTrend.length - 1);
                        const p = userTrend[idx];
                        const x = ptX(idx);
                        const y = ptY(Number(p?.count ?? 0));
                        setUserTooltip({ x, y, xPct: (x / UC.W) * 100, yPct: (y / UC.H) * 100, label: p?.date ?? "-", count: Number(p?.count ?? 0) });
                      }}
                      onMouseLeave={() => setUserTooltip(null)}
                    >
                      {yLevels.map((r) => {
                        const yp = UC.pT + UC.cH - r * UC.cH;
                        return (
                          <g key={r}>
                            <line x1={UC.pL} y1={yp} x2={UC.W - UC.pR} y2={yp} stroke="#e2e8f0" strokeWidth={r === 0 ? 1.5 : 1} strokeDasharray={r === 0 ? "none" : "4 3"} />
                            <text x={UC.pL - 6} y={yp + 4} textAnchor="end" fontSize="10" fill="#94a3b8">{countLabel(maxCnt * r)}</text>
                          </g>
                        );
                      })}
                      {userTrend.map((p, i) => i % xStep !== 0 ? null : (
                        <text key={i} x={ptX(i)} y={UC.H - UC.pB + 14} textAnchor="middle" fontSize="10" fill="#94a3b8">
                          {(p?.date ?? "").slice(5)}
                        </text>
                      ))}
                      <path d={linePath} fill="none" stroke="#7c3aed" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                      {userTooltip && (
                        <>
                          <line x1={userTooltip.x} y1={UC.pT} x2={userTooltip.x} y2={UC.pT + UC.cH} stroke="#ede9fe" strokeWidth={1.5} strokeDasharray="4 3" />
                          <circle cx={userTooltip.x} cy={userTooltip.y} r={5} fill="#7c3aed" stroke="#fff" strokeWidth={2} />
                        </>
                      )}
                    </svg>
                    {userTooltip && (
                      <div className="admin-dashboard-chart-bubble admin-dashboard-chart-bubble--purple" style={{ left: `${userTooltip.xPct}%`, top: `${userTooltip.yPct}%` }}>
                        <span>{userTooltip.label}</span>
                        <strong>{userTooltip.count.toLocaleString("ko-KR")}명</strong>
                      </div>
                    )}
                  </>
                );
              })() : (
                <p className="admin-dashboard-empty-text">No registration data.</p>
              )}
            </div>
          </article>
        </div>

        <div className="admin-dashboard-side-panels">
          {/* 카테고리 비율 */}
          <article className="admin-dashboard-panel">
            <div className="admin-dashboard-panel__header">
              <h2>Category Ratio</h2>
            </div>
            <div className="admin-dashboard-donut-pair">
              <div className="admin-dashboard-donut-pair__item">
                <p className="admin-dashboard-donut-pair__label">기부금액</p>
                <div className="admin-dashboard-donut__ring admin-dashboard-donut__ring--sm" style={{ background: buildDonutGradient(categories, "donationAmount") }} />
              </div>
              <div className="admin-dashboard-donut-pair__item">
                <p className="admin-dashboard-donut-pair__label">캠페인 수</p>
                <div className="admin-dashboard-donut__ring admin-dashboard-donut__ring--sm" style={{ background: buildDonutGradient(categories, "campaignCount") }} />
              </div>
            </div>
            <div className="admin-dashboard-donut__legend">
              {categories.length ? (
                <>
                  <div className="admin-dashboard-donut__legend-header">
                    <span>카테고리</span>
                    <span>기부금액</span>
                    <span>기부건수</span>
                  </div>
                  {categories.slice(0, 6).map((item, index) => (
                    <div key={item.category} className="admin-dashboard-category-row">
                      <span className="admin-dashboard-category-row__label">
                        <i style={{ background: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }} />
                        {item.categoryLabel || item.category || "Other"}
                      </span>
                      <span className="admin-dashboard-category-row__amount">{formatCurrency(item.donationAmount)}</span>
                      <span className="admin-dashboard-category-row__count">{item.campaignCount ?? "-"}건</span>
                    </div>
                  ))}
                </>
              ) : (
                <span>No category data.</span>
              )}
            </div>
          </article>

          {/* 최근 요청 */}
          <article className="admin-dashboard-panel">
            <div className="admin-dashboard-panel__header">
              <h2>
                최근 요청
                {requestsTotalCount > 0 && (
                  <span className="admin-dashboard-request-count">{requestsTotalCount}건</span>
                )}
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="admin-dashboard-badge">LIVE</span>
                <button type="button" className="admin-dashboard-detail-btn" onClick={() => onNavigate?.("requests")}>
                  자세히 보기
                </button>
              </div>
            </div>
            <div className="admin-dashboard-request-list">
                {recentLogs.length ? (
                  recentLogs.slice(0, 5).map((log) => {
                    const detailPath = getRequestDetailPath(log.targetType, log.targetId);
                    const fallbackPath = log.logNo ? `/admin/request/${log.logNo}` : "/admin/dashboard?tab=requests";
                    return (
                      <button
                        key={log.logNo ?? `${log.targetType}-${log.createdAt}`}
                        type="button"
                        className="admin-dashboard-request-row is-clickable"
                        onClick={() => {
                          navigate?.(detailPath ?? fallbackPath, {
                            state: {
                              record: log,
                              source: "recent-request",
                            },
                          });
                        }}
                      >
                        <span className="admin-dashboard-request-row__type">{log.actionType ?? "INFO"}</span>
                      <span className="admin-dashboard-request-row__desc">{log.description ?? "New request arrived."}</span>
                      <span className="admin-dashboard-request-row__date">{formatDate(log.createdAt)}</span>
                    </button>
                  );
                })
              ) : (
                <p className="admin-dashboard-empty-text">No recent logs.</p>
              )}
            </div>
          </article>

          {/* 활동 로그 */}
          <article className="admin-dashboard-panel">
            <div className="admin-dashboard-panel__header">
              <h2>활동 로그</h2>
              <button type="button" className="admin-dashboard-detail-btn" onClick={() => onNavigate?.("logs")}>
                자세히 보기
              </button>
            </div>
              <div className="admin-dashboard-activity-list">
                {activityLogs.length ? (
                  activityLogs.slice(0, 3).map((log) => {
                  const logDetailPath = getRequestDetailPath(log.targetType, log.targetId ?? log.logNo);
                  const fallbackPath = log.logNo ? `/admin/log/${log.logNo}` : "/admin/dashboard?tab=logs";
                  return (
                    <button
                      key={log.logNo ?? `${log.actionType}-${log.createdAt}`}
                      type="button"
                      className="admin-dashboard-activity-item is-clickable"
                      onClick={() => {
                        navigate?.(logDetailPath ?? fallbackPath, {
                          state: {
                            record: log,
                            source: "activity-log",
                          },
                        });
                      }}
                    >
                      <span className="admin-dashboard-activity-item__type">{log.actionType || log.targetType || "LOG"}</span>
                      <p className="admin-dashboard-activity-item__desc">{log.description ?? "-"}</p>
                      <span className="admin-dashboard-activity-item__date">{formatDate(log.createdAt)}</span>
                    </button>
                  );
                })
              ) : (
                <p className="admin-dashboard-empty-text">No activity logs.</p>
              )}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}

function foundationStatusText(item) {
  if (item.accountStatus === "ACTIVE") return "ACTIVE";
  if (item.accountStatus === "INACTIVE") return "INACTIVE";
  return "PENDING";
}

function campaignApprovalStatusText(item) {
  if (item.approvalStatus === "APPROVED") return "APPROVED";
  if (item.approvalStatus === "REJECTED") return "REJECTED";
  return "PENDING";
}

function CampaignsPanel({
  mode,
  onChangeMode,
  pendingRows,
  approvedRows,
  loading,
  error,
  onOpenDetail,
  pendingPage,
  approvedPage,
  pendingTotalPages,
  approvedTotalPages,
  onPendingPageChange,
  onApprovedPageChange,
  pendingFilter,
  approvedFilter,
  onPendingFilterChange,
  onApprovedFilterChange,
}) {
  const rows = mode === "pending" ? pendingRows : approvedRows;
  const page = mode === "pending" ? pendingPage : approvedPage;
  const totalPages = mode === "pending" ? pendingTotalPages : approvedTotalPages;
  const onPageChange = mode === "pending" ? onPendingPageChange : onApprovedPageChange;
  const [pendingKeywordDraft, setPendingKeywordDraft] = useState(pendingFilter.keyword ?? "");
  const [approvedKeywordDraft, setApprovedKeywordDraft] = useState(approvedFilter.keyword ?? "");

  useEffect(() => {
    setPendingKeywordDraft(pendingFilter.keyword ?? "");
  }, [pendingFilter.keyword]);

  useEffect(() => {
    setApprovedKeywordDraft(approvedFilter.keyword ?? "");
  }, [approvedFilter.keyword]);

  const currentKeywordDraft = mode === "pending" ? pendingKeywordDraft : approvedKeywordDraft;

  return (
    <section className="admin-dashboard-panel admin-dashboard-campaigns">
      <div className="admin-dashboard-foundations__tabs">
        <button
          type="button"
          className={`admin-dashboard-foundations__tab ${mode === "pending" ? "is-active" : ""}`}
          onClick={() => onChangeMode("pending")}
        >
          Approval Requests
        </button>
        <button
          type="button"
          className={`admin-dashboard-foundations__tab ${mode === "approved" ? "is-active" : ""}`}
          onClick={() => onChangeMode("approved")}
        >
          Approved Campaigns
        </button>
      </div>

      <div className="admin-dashboard-list-controls">
        <div className="admin-dashboard-list-controls__left">
          <select
            value={mode === "pending" ? pendingFilter.sort : approvedFilter.sort}
            onChange={(e) => {
              if (mode === "pending") onPendingFilterChange({ sort: e.target.value });
              else onApprovedFilterChange({ sort: e.target.value });
            }}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <form
          className="admin-dashboard-list-controls__search"
          onSubmit={(e) => {
            e.preventDefault();
            if (mode === "pending") onPendingFilterChange({ keyword: pendingKeywordDraft });
            else onApprovedFilterChange({ keyword: approvedKeywordDraft });
          }}
        >
          <input
            type="text"
            placeholder="Keyword"
            value={currentKeywordDraft}
            onChange={(e) => {
              if (mode === "pending") setPendingKeywordDraft(e.target.value);
              else setApprovedKeywordDraft(e.target.value);
            }}
          />
          <button type="submit">Search</button>
        </form>
      </div>

      {loading ? <p className="admin-dashboard-empty-text">Loading campaign data...</p> : null}
      {error ? <p className="admin-dashboard-empty-text">{error}</p> : null}

      {!loading && !error ? (
        <div className="admin-foundation-table admin-foundation-table--campaigns">
          <div className="admin-foundation-table__head">
            <span>Title</span>
            <span>Organization / Category</span>
            <span>Status</span>
            <span>Created</span>
            <span>Action</span>
          </div>
          {rows.length ? (
            rows.map((item) => (
              <div key={item.campaignNo} className="admin-foundation-table__row">
                <div className="admin-foundation-table__name">
                  <strong>{item.title ?? "-"}</strong>
                  {item.campaignNo ? <em>#{item.campaignNo}</em> : null}
                </div>
                <span>{item.foundationName || item.category || "-"}</span>
                <div className="admin-foundation-table__badges">
                  <span className="admin-foundation-table__badge blue">{campaignApprovalStatusText(item)}</span>
                </div>
                <span>{formatDate(item.createdAt)}</span>
                <button type="button" onClick={() => onOpenDetail(item)}>
                  Detail
                </button>
              </div>
            ))
          ) : (
            <p className="admin-dashboard-empty-text">No campaigns found.</p>
          )}
        </div>
      ) : null}

      {!loading && !error && totalPages > 1 ? (
        <div className="admin-dashboard-pagination">
          <button type="button" disabled={page === 0} onClick={() => onPageChange(page - 1)}>
            Prev
          </button>
          {getVisiblePageNumbers(page, totalPages).map((pageNo) => (
            <button
              key={`campaign-page-${pageNo}`}
              type="button"
              className={pageNo === page ? "is-active" : ""}
              onClick={() => onPageChange(pageNo)}
            >
              {pageNo + 1}
            </button>
          ))}
          <button type="button" disabled={page >= totalPages - 1} onClick={() => onPageChange(page + 1)}>
            Next
          </button>
        </div>
      ) : null}
    </section>
  );
}

function FoundationsPanel({
  mode,
  onChangeMode,
  manageRows,
  approvalRows,
  loading,
  error,
  onOpenDetail,
  managePage,
  approvalPage,
  manageTotalPages,
  approvalTotalPages,
  onManagePageChange,
  onApprovalPageChange,
  manageFilter,
  approvalFilter,
  onManageFilterChange,
  onApprovalFilterChange,
}) {
  const rows = mode === "manage" ? manageRows : approvalRows;
  const page = mode === "manage" ? managePage : approvalPage;
  const totalPages = mode === "manage" ? manageTotalPages : approvalTotalPages;
  const onPageChange = mode === "manage" ? onManagePageChange : onApprovalPageChange;
  const [manageKeywordDraft, setManageKeywordDraft] = useState(manageFilter.keyword ?? "");
  const [approvalKeywordDraft, setApprovalKeywordDraft] = useState(approvalFilter.keyword ?? "");

  useEffect(() => {
    setManageKeywordDraft(manageFilter.keyword ?? "");
  }, [manageFilter.keyword]);

  useEffect(() => {
    setApprovalKeywordDraft(approvalFilter.keyword ?? "");
  }, [approvalFilter.keyword]);

  const currentKeywordDraft = mode === "manage" ? manageKeywordDraft : approvalKeywordDraft;

  return (
    <section className="admin-dashboard-panel admin-dashboard-foundations">
      <div className="admin-dashboard-foundations__tabs">
        <button
          type="button"
          className={`admin-dashboard-foundations__tab ${mode === "manage" ? "is-active" : ""}`}
          onClick={() => onChangeMode("manage")}
        >
          Foundation Cards
        </button>
        <button
          type="button"
          className={`admin-dashboard-foundations__tab ${mode === "approvals" ? "is-active" : ""}`}
          onClick={() => onChangeMode("approvals")}
        >
          New Registrations
        </button>
      </div>

      <div className="admin-dashboard-list-controls">
        <div className="admin-dashboard-list-controls__left">
          {mode === "manage" ? (
            <>
              <select
                value={manageFilter.accountStatus}
                onChange={(e) => onManageFilterChange({ accountStatus: e.target.value })}
              >
                {ACCOUNT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value || "all"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={manageFilter.sort}
                onChange={(e) => onManageFilterChange({ sort: e.target.value })}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <>
              <select
                value={approvalFilter.reviewStatus}
                onChange={(e) => onApprovalFilterChange({ reviewStatus: e.target.value })}
              >
                {REVIEW_STATUS_OPTIONS.map((option) => (
                  <option key={option.value || "all"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={approvalFilter.sort}
                onChange={(e) => onApprovalFilterChange({ sort: e.target.value })}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
        <form
          className="admin-dashboard-list-controls__search"
          onSubmit={(e) => {
            e.preventDefault();
            if (mode === "manage") onManageFilterChange({ keyword: manageKeywordDraft });
            else onApprovalFilterChange({ keyword: approvalKeywordDraft });
          }}
        >
          <input
            type="text"
            placeholder="Keyword"
            value={currentKeywordDraft}
            onChange={(e) => {
              if (mode === "manage") setManageKeywordDraft(e.target.value);
              else setApprovalKeywordDraft(e.target.value);
            }}
          />
          <button type="submit">Search</button>
        </form>
      </div>

      {loading ? <p className="admin-dashboard-empty-text">Loading foundation data...</p> : null}
      {error ? <p className="admin-dashboard-empty-text">{error}</p> : null}

      {!loading && !error && mode === "manage" ? (
        <div className="admin-foundation-table">
          <div className="admin-foundation-table__head">
            <span>Name</span>
            <span>Representative</span>
            <span>Account Status</span>
            <span>Created</span>
            <span>Action</span>
          </div>
          {rows.length ? (
            rows.map((item) => (
              <div key={item.foundationNo} className="admin-foundation-table__row">
                <div className="admin-foundation-table__name">
                  <strong>{item.foundationName}</strong>
                  {item.foundationType ? <em>{item.foundationType}</em> : null}
                </div>
                <span>{item.representativeName || "-"}</span>
                <div className="admin-foundation-table__badges">
                  <span className="admin-foundation-table__badge blue">{foundationStatusText(item)}</span>
                </div>
                <span>{formatDate(item.createdAt)}</span>
                <button type="button" onClick={() => onOpenDetail(item.foundationNo)}>
                  Detail
                </button>
              </div>
            ))
          ) : (
            <p className="admin-dashboard-empty-text">No foundations found.</p>
          )}
        </div>
      ) : null}

      {!loading && !error && mode === "approvals" ? (
        <div className="admin-foundation-table">
          <div className="admin-foundation-table__head">
            <span>Name</span>
            <span>Representative</span>
            <span>Created</span>
            <span>Review Status</span>
            <span>Action</span>
          </div>
          {rows.length ? (
            rows.map((item) => (
              <div key={item.foundationNo} className="admin-foundation-table__row">
                <div className="admin-foundation-table__name">
                  <strong>{item.foundationName}</strong>
                  {item.foundationType ? <em>{item.foundationType}</em> : null}
                </div>
                <span>{item.representativeName || "-"}</span>
                <span>{formatDate(item.createdAt)}</span>
                <div className="admin-foundation-table__badges">
                  <span className="admin-foundation-table__badge blue">{item.reviewStatus || "-"}</span>
                </div>
                <button type="button" onClick={() => onOpenDetail(item.foundationNo)}>
                  Detail
                </button>
              </div>
            ))
          ) : (
            <p className="admin-dashboard-empty-text">No approval targets.</p>
          )}
        </div>
      ) : null}

      {!loading && !error && totalPages > 1 ? (
        <div className="admin-dashboard-pagination">
          <button type="button" disabled={page === 0} onClick={() => onPageChange(page - 1)}>
            ‹ 이전
          </button>
          {getVisiblePageNumbers(page, totalPages).map((pageNo) => (
            <button
              key={`foundation-page-${pageNo}`}
              type="button"
              className={pageNo === page ? "is-active" : ""}
              onClick={() => onPageChange(pageNo)}
            >
              {pageNo + 1}
            </button>
          ))}
          <button type="button" disabled={page >= totalPages - 1} onClick={() => onPageChange(page + 1)}>
            다음 ›
          </button>
        </div>
      ) : null}
    </section>
  );
}

function normalizeTabRows(key, rows) {
  return rows.map((row) => {
    if (key === "campaigns") {
      return {
        id: row.campaignNo,
        title: row.title,
        sub: row.category || row.foundationName || "-",
        status: row.approvalStatus,
        date: row.createdAt,
        path: row.campaignNo ? `/admin/campaign/${row.campaignNo}` : null,
        raw: row,
      };
    }

    if (key === "reports") {
      return {
        id: row.reportNo,
        title: row.title,
        sub: row.usagePurpose || `Campaign #${row.campaignNo ?? "-"}`,
        status: row.approvalStatus,
        date: row.createdAt,
        path: row.reportNo ? `/admin/report/${row.reportNo}` : null,
        raw: row,
      };
    }

    if (key === "inactive") {
      return {
        id: row.foundationNo,
        title: row.foundationName,
        sub: row.representativeName || row.foundationEmail,
        status: row.accountStatus || "INACTIVE",
        date: row.createdAt,
        path: row.foundationNo ? `/admin/foundation/${row.foundationNo}` : null,
        raw: row,
      };
    }

    if (key === "requests") {
      return {
        id: row.foundationNo,
        title: row.foundationName,
        sub: row.representativeName || row.foundationEmail || "-",
        status: row.reviewStatus || "PENDING",
        date: row.createdAt,
        path: row.foundationNo ? `/admin/foundation/${row.foundationNo}` : null,
        raw: row,
      };
    }

    if (key === "members") {
      return {
        id: row.userNo,
        title: row.name || row.email,
        sub: row.email || row.loginType || "-",
        status: row.status,
        date: row.createdAt,
        path: null,
        raw: row,
      };
    }

    if (key === "logs") {
      return {
        id: row.logNo,
        title: row.description || `${row.actionType ?? ""} ${row.targetType ?? ""}`.trim(),
        sub: row.adminName || row.adminId || "-",
        status: row.actionType,
        date: row.createdAt,
        path: row.logNo ? `/admin/log/${row.logNo}` : null,
        raw: row,
      };
    }

    return {
      id: row.id ?? row.no ?? Math.random(),
      title: row.title || "-",
      sub: row.description || "-",
      status: row.status || "-",
      date: row.createdAt || row.date,
      path: null,
      raw: row,
    };
  });
}

function getSectionFilterFields(activeKey) {
  if (activeKey === "inactive") {
    return [{ key: "accountStatus", options: ACCOUNT_STATUS_OPTIONS }];
  }
  if (activeKey === "members") {
    return [{ key: "status", options: USER_STATUS_OPTIONS }];
  }
  if (activeKey === "requests") {
    return [{ key: "reviewStatus", options: REVIEW_STATUS_OPTIONS }];
  }
  if (activeKey === "logs") {
    return [
      { key: "actionType", options: ACTION_TYPE_OPTIONS },
      { key: "targetType", options: TARGET_TYPE_OPTIONS },
    ];
  }
  return [];
}

function ListPanel({
  title,
  description,
  rows,
  loading,
  error,
  activeKey,
  query,
  pageInfo,
  onQueryPatch,
  onSearchSubmit,
  onNavigateRow,
  sortOptions,
}) {
  const [keywordDraft, setKeywordDraft] = useState(query.keyword ?? "");
  const filterFields = getSectionFilterFields(activeKey);
  const resolvedSortOptions = sortOptions ?? SORT_OPTIONS;

  useEffect(() => {
    setKeywordDraft(query.keyword ?? "");
  }, [query.keyword, activeKey]);

  return (
    <section className="admin-dashboard-panel admin-dashboard-list-panel">
      <div className="admin-dashboard-panel__header">
        <h2>{title}</h2>
      </div>
      <p className="admin-dashboard-list-panel__desc">{description}</p>

      <div className="admin-dashboard-list-controls">
        <div className="admin-dashboard-list-controls__left">
          <select
            value={query.sort ?? resolvedSortOptions[0]?.value ?? "createdAt,desc"}
            onChange={(e) => onQueryPatch({ sort: e.target.value })}
          >
            {resolvedSortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {filterFields.map((field) => (
            <select
              key={field.key}
              value={query[field.key] ?? ""}
              onChange={(e) => onQueryPatch({ [field.key]: e.target.value })}
            >
              {field.options.map((option) => (
                <option key={`${field.key}-${option.value || "all"}`} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ))}
          {activeKey === "logs" ? (
            <>
              <input
                type="datetime-local"
                value={query.startDate ?? ""}
                onChange={(e) => onQueryPatch({ startDate: e.target.value })}
              />
              <input
                type="datetime-local"
                value={query.endDate ?? ""}
                onChange={(e) => onQueryPatch({ endDate: e.target.value })}
              />
            </>
          ) : null}
        </div>
        {activeKey !== "reports" ? (
          <form
            className="admin-dashboard-list-controls__search"
            onSubmit={(e) => {
              e.preventDefault();
              onSearchSubmit(keywordDraft);
            }}
          >
            <input
              type="text"
              placeholder="Keyword"
              value={keywordDraft}
              onChange={(e) => setKeywordDraft(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>
        ) : null}
      </div>

      {loading ? <p className="admin-dashboard-empty-text">Loading list...</p> : null}
      {error ? <p className="admin-dashboard-empty-text">{error}</p> : null}

      {!loading && !error ? (
        <div className="admin-foundation-table admin-foundation-table--generic">
          <div className="admin-foundation-table__head">
            <span>Title</span>
            <span>Sub Info</span>
            <span>Status</span>
            <span>Created</span>
            <span>Action</span>
          </div>
          {rows.length ? (
            rows.map((item) => (
              <div key={`${item.id}-${item.date ?? ""}`} className="admin-foundation-table__row">
                <div className="admin-foundation-table__name">
                  <strong>{item.title}</strong>
                </div>
                <span>{item.sub}</span>
                <div className="admin-foundation-table__badges">
                  <span className="admin-foundation-table__badge blue">{item.status ?? "-"}</span>
                </div>
                <span>{formatDate(item.date)}</span>
                {item.path ? (
                  <button type="button" onClick={() => onNavigateRow(item)}>
                    Detail
                  </button>
                ) : (
                  <span>-</span>
                )}
              </div>
            ))
          ) : (
            <p className="admin-dashboard-empty-text">No data found.</p>
          )}
        </div>
      ) : null}

      {!loading && !error && (pageInfo.totalPages ?? 0) > 1 ? (
        <div className="admin-dashboard-pagination">
          <button
            type="button"
            disabled={(pageInfo.page ?? 0) <= 0}
            onClick={() => onQueryPatch({ page: (pageInfo.page ?? 0) - 1 }, false)}
          >
            Prev
          </button>
          {getVisiblePageNumbers(pageInfo.page ?? 0, pageInfo.totalPages ?? 0).map((pageNo) => (
            <button
              key={`section-page-${pageNo}`}
              type="button"
              className={pageNo === (pageInfo.page ?? 0) ? "is-active" : ""}
              onClick={() => onQueryPatch({ page: pageNo }, false)}
            >
              {pageNo + 1}
            </button>
          ))}
          <button
            type="button"
            disabled={(pageInfo.page ?? 0) >= (pageInfo.totalPages ?? 1) - 1}
            onClick={() => onQueryPatch({ page: (pageInfo.page ?? 0) + 1 }, false)}
          >
            Next
          </button>
        </div>
      ) : null}
    </section>
  );
}

function LogsHubPanel({
  activeTab,
  onTabChange,
  activityProps,
  emailRows,
  emailLoading,
  emailError,
  emailQuery,
  emailPageInfo,
  onEmailQueryPatch,
  notificationRows,
  notificationLoading,
  notificationError,
  notificationPageInfo,
  onNotificationPageChange,
}) {
  return (
    <section className="admin-dashboard-panel admin-dashboard-list-panel">
      <div className="admin-dashboard-foundations__tabs">
        <button
          type="button"
          className={`admin-dashboard-foundations__tab ${activeTab === "activity" ? "is-active" : ""}`}
          onClick={() => onTabChange("activity")}
        >
          Activity Logs
        </button>
        <button
          type="button"
          className={`admin-dashboard-foundations__tab ${activeTab === "emails" ? "is-active" : ""}`}
          onClick={() => onTabChange("emails")}
        >
          Email History
        </button>
        <button
          type="button"
          className={`admin-dashboard-foundations__tab ${activeTab === "notifications" ? "is-active" : ""}`}
          onClick={() => onTabChange("notifications")}
        >
          Notification History
        </button>
      </div>

      {activeTab === "activity" ? (
        <ListPanel
          title="Admin Logs"
          description="Admin action history"
          rows={activityProps.rows}
          loading={activityProps.loading}
          error={activityProps.error}
          activeKey="logs"
          query={activityProps.query}
          pageInfo={activityProps.pageInfo}
          onQueryPatch={activityProps.onQueryPatch}
          onSearchSubmit={activityProps.onSearchSubmit}
          onNavigateRow={activityProps.onNavigateRow}
          sortOptions={LOGS_SORT_OPTIONS}
        />
      ) : null}

      {activeTab === "emails" ? (
        <>
          <div className="admin-dashboard-list-controls">
            <div className="admin-dashboard-list-controls__left">
              <select
                value={emailQuery.templateType ?? ""}
                onChange={(e) => onEmailQueryPatch({ templateType: e.target.value }, true)}
              >
                {EMAIL_TEMPLATE_OPTIONS.map((option) => (
                  <option key={`email-template-${option.value || "all"}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={emailQuery.sort ?? "createdAt,desc"}
                onChange={(e) => onEmailQueryPatch({ sort: e.target.value }, true)}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={`email-sort-${option.value}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {emailLoading ? <p className="admin-dashboard-empty-text">Loading email history...</p> : null}
          {emailError ? <p className="admin-dashboard-empty-text">{emailError}</p> : null}

          {!emailLoading && !emailError ? (
            <div className="admin-foundation-table admin-foundation-table--generic">
              <div className="admin-foundation-table__head">
                <span>Title</span>
                <span>Recipient</span>
                <span>Status</span>
                <span>Sent At</span>
                <span>Template</span>
              </div>
              {emailRows.length ? (
                emailRows.map((item) => (
                  <div key={item.emailQueueNo ?? `${item.recipientEmail}-${item.createdAt}`} className="admin-foundation-table__row">
                    <div className="admin-foundation-table__name">
                      <strong>{item.title || "-"}</strong>
                    </div>
                    <span>{item.recipientEmail || "-"}</span>
                    <div className="admin-foundation-table__badges">
                      <span className="admin-foundation-table__badge blue">{item.emailStatus || "-"}</span>
                    </div>
                    <span>{formatDate(item.sentAt || item.createdAt)}</span>
                    <span>{item.templateType || "-"}</span>
                  </div>
                ))
              ) : (
                <p className="admin-dashboard-empty-text">No email history.</p>
              )}
            </div>
          ) : null}

          {!emailLoading && !emailError && (emailPageInfo.totalPages ?? 0) > 1 ? (
            <div className="admin-dashboard-pagination">
              <button
                type="button"
                disabled={(emailPageInfo.page ?? 0) <= 0}
                onClick={() => onEmailQueryPatch({ page: (emailPageInfo.page ?? 0) - 1 }, false)}
              >
                Prev
              </button>
              {getVisiblePageNumbers(emailPageInfo.page ?? 0, emailPageInfo.totalPages ?? 0).map((pageNo) => (
                <button
                  key={`email-page-${pageNo}`}
                  type="button"
                  className={pageNo === (emailPageInfo.page ?? 0) ? "is-active" : ""}
                  onClick={() => onEmailQueryPatch({ page: pageNo }, false)}
                >
                  {pageNo + 1}
                </button>
              ))}
              <button
                type="button"
                disabled={(emailPageInfo.page ?? 0) >= (emailPageInfo.totalPages ?? 1) - 1}
                onClick={() => onEmailQueryPatch({ page: (emailPageInfo.page ?? 0) + 1 }, false)}
              >
                Next
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {activeTab === "notifications" ? (
        <>
          {notificationLoading ? <p className="admin-dashboard-empty-text">Loading notification history...</p> : null}
          {notificationError ? <p className="admin-dashboard-empty-text">{notificationError}</p> : null}

          {!notificationLoading && !notificationError ? (
            <div className="admin-foundation-table admin-foundation-table--generic">
              <div className="admin-foundation-table__head">
                <span>Content</span>
                <span>Type</span>
                <span>Read</span>
                <span>Created</span>
                <span>Read At</span>
              </div>
              {notificationRows.length ? (
                notificationRows.map((item) => (
                  <div key={item.notificationNo ?? `${item.content}-${item.createdAt}`} className="admin-foundation-table__row">
                    <div className="admin-foundation-table__name">
                      <strong>{item.content || "-"}</strong>
                    </div>
                    <span>{item.notificationType || "-"}</span>
                    <div className="admin-foundation-table__badges">
                      <span className="admin-foundation-table__badge blue">{item.isRead ? "READ" : "UNREAD"}</span>
                    </div>
                    <span>{formatDate(item.createdAt)}</span>
                    <span>{formatDate(item.readAt)}</span>
                  </div>
                ))
              ) : (
                <p className="admin-dashboard-empty-text">No notification history.</p>
              )}
            </div>
          ) : null}

          {!notificationLoading && !notificationError && (notificationPageInfo.totalPages ?? 0) > 1 ? (
            <div className="admin-dashboard-pagination">
              <button
                type="button"
                disabled={(notificationPageInfo.page ?? 0) <= 0}
                onClick={() => onNotificationPageChange((notificationPageInfo.page ?? 0) - 1)}
              >
                Prev
              </button>
              {getVisiblePageNumbers(notificationPageInfo.page ?? 0, notificationPageInfo.totalPages ?? 0).map((pageNo) => (
                <button
                  key={`notification-page-${pageNo}`}
                  type="button"
                  className={pageNo === (notificationPageInfo.page ?? 0) ? "is-active" : ""}
                  onClick={() => onNotificationPageChange(pageNo)}
                >
                  {pageNo + 1}
                </button>
              ))}
              <button
                type="button"
                disabled={(notificationPageInfo.page ?? 0) >= (notificationPageInfo.totalPages ?? 1) - 1}
                onClick={() => onNotificationPageChange((notificationPageInfo.page ?? 0) + 1)}
              >
                Next
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeKey = searchParams.get("tab") ?? "dashboard";
  const setActiveKey = useCallback((key) => {
    navigate(key === "dashboard" ? "/admin/dashboard" : `/admin/dashboard?tab=${key}`);
  }, [navigate]);
  const [foundationMode, setFoundationMode] = useState("manage");

  const [dashboardData, setDashboardData] = useState({
    summary: null,
    trend: [],
    categoryRatio: [],
    recentLogs: [],
    activityLogs: [],
    userTrend: [],
    requestsTotalCount: 0,
  });
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");

  const [foundationData, setFoundationData] = useState({ manage: [], approvals: [] });
  const [foundationLoading, setFoundationLoading] = useState(false);
  const [foundationError, setFoundationError] = useState("");
  const [foundationManagePage, setFoundationManagePage] = useState(0);
  const [foundationApprovalPage, setFoundationApprovalPage] = useState(0);
  const [foundationTotalPages, setFoundationTotalPages] = useState({ manage: 0, approvals: 0 });
  const [foundationManageFilter, setFoundationManageFilter] = useState({
    keyword: "",
    accountStatus: "ACTIVE",
    sort: "createdAt,desc",
  });
  const [foundationApprovalFilter, setFoundationApprovalFilter] = useState({
    keyword: "",
    reviewStatus: "",
    sort: "createdAt,desc",
  });

  const [campaignMode, setCampaignMode] = useState("pending");
  const [campaignData, setCampaignData] = useState({ pending: [], approved: [] });
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [campaignError, setCampaignError] = useState("");
  const [campaignPendingPage, setCampaignPendingPage] = useState(0);
  const [campaignApprovedPage, setCampaignApprovedPage] = useState(0);
  const [campaignTotalPages, setCampaignTotalPages] = useState({ pending: 0, approved: 0 });
  const [campaignPendingFilter, setCampaignPendingFilter] = useState({
    keyword: "",
    sort: "createdAt,desc",
  });
  const [campaignApprovedFilter, setCampaignApprovedFilter] = useState({
    keyword: "",
    sort: "createdAt,desc",
  });

  const [logsSubTab, setLogsSubTab] = useState("activity");
  const [emailQuery, setEmailQuery] = useState({
    page: 0,
    size: 20,
    templateType: "",
    sort: "createdAt,desc",
  });
  const [emailRows, setEmailRows] = useState([]);
  const [emailPageInfo, setEmailPageInfo] = useState({ page: 0, totalPages: 0, totalElements: 0, size: 20 });
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  const [notificationPage, setNotificationPage] = useState(0);
  const [notificationRows, setNotificationRows] = useState([]);
  const [notificationPageInfo, setNotificationPageInfo] = useState({ page: 0, totalPages: 0, totalElements: 0, size: 20 });
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState("");

  const [sectionData, setSectionData] = useState({});
  const [sectionQuery, setSectionQuery] = useState(() => createInitialSectionQuery());
  const [sectionPageInfo, setSectionPageInfo] = useState({});
  const [sectionLoading, setSectionLoading] = useState(false);
  const [sectionError, setSectionError] = useState("");

  const [donationDays, setDonationDays] = useState(14);
  const [userDays, setUserDays] = useState(14);
  const donationDaysRef = useRef(14);
  const userDaysRef = useRef(14);
  const donationDaysInitRef = useRef(false);
  const userDaysInitRef = useRef(false);

  const handleDonationDaysChange = useCallback((d) => {
    setDonationDays(d);
    donationDaysRef.current = d;
  }, []);

  const handleUserDaysChange = useCallback((d) => {
    setUserDays(d);
    userDaysRef.current = d;
  }, []);

  const patchSectionQuery = useCallback((key, patch, resetPage = true) => {
    setSectionQuery((prev) => {
      const current = prev[key] ?? SECTION_CONFIG[key]?.defaultQuery ?? {};
      return {
        ...prev,
        [key]: {
          ...current,
          ...patch,
          ...(resetPage ? { page: 0 } : {}),
        },
      };
    });
  }, []);

  const handleManageFilterChange = useCallback((patch) => {
    setFoundationManageFilter((prev) => ({ ...prev, ...patch }));
    setFoundationManagePage(0);
  }, []);

  const handleApprovalFilterChange = useCallback((patch) => {
    setFoundationApprovalFilter((prev) => ({ ...prev, ...patch }));
    setFoundationApprovalPage(0);
  }, []);

  const handleCampaignPendingFilterChange = useCallback((patch) => {
    setCampaignPendingFilter((prev) => ({ ...prev, ...patch }));
    setCampaignPendingPage(0);
  }, []);

  const handleCampaignApprovedFilterChange = useCallback((patch) => {
    setCampaignApprovedFilter((prev) => ({ ...prev, ...patch }));
    setCampaignApprovedPage(0);
  }, []);

  const patchEmailQuery = useCallback((patch, resetPage = true) => {
    setEmailQuery((prev) => ({
      ...prev,
      ...patch,
      ...(resetPage ? { page: 0 } : {}),
    }));
  }, []);

  const adminProfile = useMemo(() => {
    try {
      return JSON.parse(window.localStorage.getItem("adminProfile") ?? "{}");
    } catch {
      return {};
    }
  }, []);

  // 최초 로드: 전체 데이터 (recentLogs 포함) 한 번 fetch
  useEffect(() => {
    let cancelled = false;

    async function initialLoad() {
      try {
        setDashboardLoading(true);
        setDashboardError("");

        const [summary, trend, categoryRatio, applicationsPage, activityLogsPage, userTrend] = await Promise.all([
          fetchAdminJson("/dashboard/summary"),
          fetchAdminJson(`/dashboard/donation-trend?days=${donationDaysRef.current}`),
          fetchAdminJson("/dashboard/category-ratio"),
          fetchAdminJson("/foundation/applications?page=0&size=5"),
          fetchAdminJson("/logs?page=0&size=3"),
          fetchAdminJson(`/dashboard/user-registration-trend?days=${userDaysRef.current}`),
        ]);

        if (cancelled) return;

        setDashboardData({
          summary,
          trend: Array.isArray(trend) ? trend : [],
          categoryRatio: Array.isArray(categoryRatio) ? categoryRatio : [],
          recentLogs: normalizeApplicationsToRequests(normalizePageContent(applicationsPage)),
          activityLogs: normalizePageContent(activityLogsPage),
          userTrend: Array.isArray(userTrend) ? userTrend : [],
          requestsTotalCount: applicationsPage?.totalElements ?? normalizePageContent(applicationsPage).length,
        });
      } catch (error) {
        if (!cancelled) setDashboardError(error.message || "Dashboard load error.");
      } finally {
        if (!cancelled) setDashboardLoading(false);
      }
    }

    initialLoad();
    return () => { cancelled = true; };
  }, []);

  // 폴링(60s): 통계·활동로그 갱신 — recentLogs는 SSE가 관리하므로 보존
  useEffect(() => {
    let cancelled = false;

    async function pollDashboard() {
      try {
        const [summary, trend, categoryRatio, activityLogsPage, userTrend] = await Promise.all([
          fetchAdminJson("/dashboard/summary"),
          fetchAdminJson(`/dashboard/donation-trend?days=${donationDaysRef.current}`),
          fetchAdminJson("/dashboard/category-ratio"),
          fetchAdminJson("/logs?page=0&size=3"),
          fetchAdminJson(`/dashboard/user-registration-trend?days=${userDaysRef.current}`),
        ]);

        if (cancelled) return;

        setDashboardData((prev) => ({
          ...prev,
          summary,
          trend: Array.isArray(trend) ? trend : [],
          categoryRatio: Array.isArray(categoryRatio) ? categoryRatio : [],
          activityLogs: normalizePageContent(activityLogsPage),
          userTrend: Array.isArray(userTrend) ? userTrend : [],
        }));
      } catch {
        // 폴링 실패는 무시 (로딩 인디케이터 없음)
      }
    }

    const intervalId = setInterval(pollDashboard, 180_000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  // SSE: 최근 요청 실시간 수신 — approval-request 이벤트 → recentLogs prepend
  useEffect(() => {
    const token = window.localStorage.getItem("adminAccessToken");
    if (!token) return undefined;

    const controller = new AbortController();
    streamAdminSse(({ eventName, data }) => {
      if (eventName === "connect" || eventName === "ping") return;
      if (eventName !== "approval-request") return;

      const nextLog = mapApprovalEventToRecentLog(data);
      if (!nextLog) return;

      setDashboardData((prev) => ({
        ...prev,
        recentLogs: [nextLog, ...(prev.recentLogs ?? [])].slice(0, 10),
      }));
    }, controller.signal).catch((error) => {
      if (!controller.signal.aborted) console.error("SSE error:", error);
    });

    return () => controller.abort();
  }, []);

  // 기부금액 추이 기간 변경 시 재조회 (최초 마운트 건너뜀)
  useEffect(() => {
    if (!donationDaysInitRef.current) { donationDaysInitRef.current = true; return; }
    let cancelled = false;
    fetchAdminJson(`/dashboard/donation-trend?days=${donationDays}`)
      .then((data) => { if (!cancelled) setDashboardData((prev) => ({ ...prev, trend: Array.isArray(data) ? data : [] })); })
      .catch(() => { });
    return () => { cancelled = true; };
  }, [donationDays]);

  // 사용자 가입 추이 기간 변경 시 재조회
  useEffect(() => {
    if (!userDaysInitRef.current) { userDaysInitRef.current = true; return; }
    let cancelled = false;
    fetchAdminJson(`/dashboard/user-registration-trend?days=${userDays}`)
      .then((data) => { if (!cancelled) setDashboardData((prev) => ({ ...prev, userTrend: Array.isArray(data) ? data : [] })); })
      .catch(() => { });
    return () => { cancelled = true; };
  }, [userDays]);

  useEffect(() => {
    if (activeKey !== "foundations") return;

    let cancelled = false;

    async function loadFoundations() {
      try {
        setFoundationLoading(true);
        setFoundationError("");

        const approvedPath = buildQueryPath("/foundation/approved", {
          page: foundationManagePage,
          size: 12,
          accountStatus: foundationManageFilter.accountStatus,
          keyword: foundationManageFilter.keyword,
          sort: foundationManageFilter.sort,
        });
        const applicationsPath = buildQueryPath("/foundation/applications", {
          page: foundationApprovalPage,
          size: 20,
          reviewStatus: foundationApprovalFilter.reviewStatus,
          keyword: foundationApprovalFilter.keyword,
          sort: foundationApprovalFilter.sort,
        });

        const [approvedPage, applicationsPage] = await Promise.all([
          fetchAdminJson(approvedPath),
          fetchAdminJson(applicationsPath),
        ]);

        if (cancelled) return;

        setFoundationData({
          manage: normalizePageContent(approvedPage),
          approvals: normalizePageContent(applicationsPage),
        });
        setFoundationTotalPages({
          manage: approvedPage?.totalPages ?? 0,
          approvals: applicationsPage?.totalPages ?? 0,
        });
      } catch (error) {
        if (!cancelled) setFoundationError(error.message || "Foundation load error.");
      } finally {
        if (!cancelled) setFoundationLoading(false);
      }
    }

    loadFoundations();
    return () => {
      cancelled = true;
    };
  }, [
    activeKey,
    foundationManagePage,
    foundationApprovalPage,
    foundationManageFilter.accountStatus,
    foundationManageFilter.keyword,
    foundationManageFilter.sort,
    foundationApprovalFilter.reviewStatus,
    foundationApprovalFilter.keyword,
    foundationApprovalFilter.sort,
  ]);

  useEffect(() => {
    if (activeKey !== "campaigns") return;

    let cancelled = false;

    async function loadCampaigns() {
      try {
        setCampaignLoading(true);
        setCampaignError("");

        const pendingPath = buildQueryPath("/campaigns/pending", {
          page: campaignPendingPage,
          size: 12,
          keyword: campaignPendingFilter.keyword,
          sort: campaignPendingFilter.sort,
        });
        const approvedPath = buildQueryPath("/campaigns/approved", {
          page: campaignApprovedPage,
          size: 12,
          keyword: campaignApprovedFilter.keyword,
          sort: campaignApprovedFilter.sort,
        });

        const [pendingPageData, approvedPageData] = await Promise.all([
          fetchAdminJson(pendingPath),
          fetchAdminJson(approvedPath),
        ]);

        if (cancelled) return;

        setCampaignData({
          pending: normalizePageContent(pendingPageData),
          approved: normalizePageContent(approvedPageData),
        });
        setCampaignTotalPages({
          pending: pendingPageData?.totalPages ?? 0,
          approved: approvedPageData?.totalPages ?? 0,
        });
      } catch (error) {
        if (!cancelled) setCampaignError(error.message || "Campaign load error.");
      } finally {
        if (!cancelled) setCampaignLoading(false);
      }
    }

    loadCampaigns();
    return () => {
      cancelled = true;
    };
  }, [
    activeKey,
    campaignPendingPage,
    campaignApprovedPage,
    campaignPendingFilter.keyword,
    campaignPendingFilter.sort,
    campaignApprovedFilter.keyword,
    campaignApprovedFilter.sort,
  ]);

  useEffect(() => {
    if (activeKey !== "logs" || logsSubTab !== "emails") return;

    let cancelled = false;

    async function loadEmailHistory() {
      try {
        setEmailLoading(true);
        setEmailError("");

        const path = buildQueryPath("/email-send-list", emailQuery);
        const payload = await fetchAdminJson(path);
        const rows = normalizePageContent(payload);

        if (cancelled) return;
        setEmailRows(rows);
        setEmailPageInfo({
          page: payload?.number ?? emailQuery.page ?? 0,
          totalPages: payload?.totalPages ?? 0,
          totalElements: payload?.totalElements ?? rows.length,
          size: payload?.size ?? emailQuery.size ?? 20,
        });
      } catch (error) {
        if (!cancelled) setEmailError(error.message || "Email history load error.");
      } finally {
        if (!cancelled) setEmailLoading(false);
      }
    }

    loadEmailHistory();
    return () => {
      cancelled = true;
    };
  }, [activeKey, logsSubTab, emailQuery]);

  useEffect(() => {
    if (activeKey !== "logs" || logsSubTab !== "notifications") return;

    let cancelled = false;

    async function loadNotificationHistory() {
      try {
        setNotificationLoading(true);
        setNotificationError("");

        const path = buildQueryPath("/api/notifications", {
          page: notificationPage,
          size: 20,
        });
        const response = await fetch(path, {
          method: "GET",
          headers: getAdminAuthHeaders({ Accept: "application/json" }),
        });
        if (!response.ok) {
          const errorText = await response.text().catch(() => "");
          throw new Error(errorText || `Notification history load failed (${response.status})`);
        }
        const payload = await response.json();
        const rows = normalizePageContent(payload);

        if (cancelled) return;
        setNotificationRows(rows);
        setNotificationPageInfo({
          page: payload?.number ?? notificationPage,
          totalPages: payload?.totalPages ?? 0,
          totalElements: payload?.totalElements ?? rows.length,
          size: payload?.size ?? 20,
        });
      } catch (error) {
        if (!cancelled) setNotificationError(error.message || "Notification history load error.");
      } finally {
        if (!cancelled) setNotificationLoading(false);
      }
    }

    loadNotificationHistory();
    return () => {
      cancelled = true;
    };
  }, [activeKey, logsSubTab, notificationPage]);

  useEffect(() => {
    if (activeKey === "dashboard" || activeKey === "foundations" || activeKey === "campaigns") return;
    if (!SECTION_CONFIG[activeKey]) return;

    let cancelled = false;

    async function loadSection() {
      try {
        setSectionLoading(true);
        setSectionError("");

        const config = SECTION_CONFIG[activeKey];
        const query = sectionQuery[activeKey] ?? config.defaultQuery;
        const payload = await fetchAdminJson(buildQueryPath(config.endpoint, {
          ...query,
          startDate: query.startDate ? toApiDateTime(query.startDate) : "",
          endDate: query.endDate ? toApiDateTime(query.endDate) : "",
        }));
        const rows = normalizePageContent(payload);

        if (cancelled) return;

        setSectionData((prev) => ({
          ...prev,
          [activeKey]: normalizeTabRows(activeKey, rows),
        }));
        setSectionPageInfo((prev) => ({
          ...prev,
          [activeKey]: {
            page: payload?.number ?? query.page ?? 0,
            totalPages: payload?.totalPages ?? 0,
            totalElements: payload?.totalElements ?? rows.length,
            size: payload?.size ?? query.size ?? 10,
          },
        }));
      } catch (error) {
        if (!cancelled) setSectionError(error.message || "Section load error.");
      } finally {
        if (!cancelled) setSectionLoading(false);
      }
    }

    loadSection();
    const intervalId = setInterval(loadSection, 30_000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [activeKey, sectionQuery]);

  const pageTitle = PAGE_TITLES[activeKey] ?? "Dashboard";

  const renderContent = () => {
    if (activeKey === "dashboard") {
      return (
        <DashboardHome
          dashboardData={dashboardData}
          loading={dashboardLoading}
          error={dashboardError}
          onNavigate={setActiveKey}
          navigate={navigate}
          donationDays={donationDays}
          userDays={userDays}
          onDonationDaysChange={handleDonationDaysChange}
          onUserDaysChange={handleUserDaysChange}
        />
      );
    }

    if (activeKey === "foundations") {
      return (
        <FoundationsPanel
          mode={foundationMode}
          onChangeMode={setFoundationMode}
          manageRows={foundationData.manage}
          approvalRows={foundationData.approvals}
          loading={foundationLoading}
          error={foundationError}
          onOpenDetail={(foundationNo) => navigate(`/admin/foundation/${foundationNo}`)}
          managePage={foundationManagePage}
          approvalPage={foundationApprovalPage}
          manageTotalPages={foundationTotalPages.manage}
          approvalTotalPages={foundationTotalPages.approvals}
          onManagePageChange={setFoundationManagePage}
          onApprovalPageChange={setFoundationApprovalPage}
          manageFilter={foundationManageFilter}
          approvalFilter={foundationApprovalFilter}
          onManageFilterChange={handleManageFilterChange}
          onApprovalFilterChange={handleApprovalFilterChange}
        />
      );
    }

    if (activeKey === "campaigns") {
      return (
        <CampaignsPanel
          mode={campaignMode}
          onChangeMode={setCampaignMode}
          pendingRows={campaignData.pending}
          approvedRows={campaignData.approved}
          loading={campaignLoading}
          error={campaignError}
          onOpenDetail={(item) => {
            navigate(`/admin/campaign/${item.campaignNo}`, {
              state: {
                record: item,
                source: campaignMode === "pending" ? "campaign-pending" : "campaign-approved",
              },
            });
          }}
          pendingPage={campaignPendingPage}
          approvedPage={campaignApprovedPage}
          pendingTotalPages={campaignTotalPages.pending}
          approvedTotalPages={campaignTotalPages.approved}
          onPendingPageChange={setCampaignPendingPage}
          onApprovedPageChange={setCampaignApprovedPage}
          pendingFilter={campaignPendingFilter}
          approvedFilter={campaignApprovedFilter}
          onPendingFilterChange={handleCampaignPendingFilterChange}
          onApprovedFilterChange={handleCampaignApprovedFilterChange}
        />
      );
    }

    if (activeKey === "logs") {
      const rows = sectionData.logs ?? [];
      const query = sectionQuery.logs ?? SECTION_CONFIG.logs.defaultQuery;
      const pageInfo = sectionPageInfo.logs ?? {
        page: query.page ?? 0,
        totalPages: 0,
        totalElements: rows.length,
        size: query.size ?? 10,
      };
      return (
        <LogsHubPanel
          activeTab={logsSubTab}
          onTabChange={setLogsSubTab}
          activityProps={{
            rows,
            loading: sectionLoading,
            error: sectionError,
            query,
            pageInfo,
            onQueryPatch: (patch, resetPage = true) => patchSectionQuery("logs", patch, resetPage),
            onSearchSubmit: (keyword) => patchSectionQuery("logs", { keyword }),
            onNavigateRow: (item) => {
              if (!item.path) return;
              navigate(item.path, {
                state: {
                  record: item.raw ?? item,
                  source: "log-list",
                },
              });
            },
          }}
          emailRows={emailRows}
          emailLoading={emailLoading}
          emailError={emailError}
          emailQuery={emailQuery}
          emailPageInfo={emailPageInfo}
          onEmailQueryPatch={patchEmailQuery}
          notificationRows={notificationRows}
          notificationLoading={notificationLoading}
          notificationError={notificationError}
          notificationPageInfo={notificationPageInfo}
          onNotificationPageChange={setNotificationPage}
        />
      );
    }

    const rows = sectionData[activeKey] ?? [];
    const query = sectionQuery[activeKey] ?? SECTION_CONFIG[activeKey]?.defaultQuery ?? {};
    const pageInfo = sectionPageInfo[activeKey] ?? {
      page: query.page ?? 0,
      totalPages: 0,
      totalElements: rows.length,
      size: query.size ?? 10,
    };
    return (
      <ListPanel
        title={pageTitle}
        description={PAGE_DESCRIPTIONS[activeKey] ?? "관리자 데이터 목록입니다."}
        rows={rows}
        loading={sectionLoading}
        error={sectionError}
        activeKey={activeKey}
        query={query}
        pageInfo={pageInfo}
        onQueryPatch={(patch, resetPage = true) => patchSectionQuery(activeKey, patch, resetPage)}
        onSearchSubmit={(keyword) => patchSectionQuery(activeKey, { keyword })}
        onNavigateRow={(item) => {
          if (!item.path) return;
          navigate(item.path, {
            state: {
              record: item.raw ?? item,
              source: "tab-list",
            },
          });
        }}
      />
    );
  };

  return (
    <>
      <header className="admin-dashboard-topbar">
        <div className="admin-dashboard-topbar__title">
          <h1>{pageTitle}</h1>
        </div>
        <div className="admin-dashboard-topbar__profile">
          <div>
            <strong>{adminProfile?.name ?? "Admin"}</strong>
            <span>{adminProfile?.adminRole ?? "Admin"}</span>
          </div>
          <div className="admin-dashboard-topbar__avatar">{(adminProfile?.name ?? "A").slice(0, 1)}</div>
        </div>
      </header>
      <main className="admin-dashboard-content">{renderContent()}</main>
    </>
  );
}
