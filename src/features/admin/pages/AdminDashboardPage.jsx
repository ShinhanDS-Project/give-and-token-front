import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../css/AdminDashboardPage.css";
import { fetchAdminJson, patchAdminAction } from "../util";

// ── 상수 ─────────────────────────────────────────────────────────────────────
const PAGE_TITLES = {
  dashboard: "대시보드",
  foundations: "단체 승인·반려",
  "foundations-approval": "단체 승인·반려",
  "foundations-list": "단체 조회",
  campaigns: "캠페인 승인·반려",
  "campaigns-approval": "캠페인 승인·반려",
  "campaigns-list": "캠페인 조회",
  reports: "보고서 승인·반려",
  "reports-approval": "보고서 승인·반려",
  "reports-list": "보고서 조회",
  inactive: "비활성화 단체",
  members: "회원 관리",
  requests: "새 요청",
  logs: "관리자 로그",
  "send-history": "발송 내역",
};

const CATEGORY_COLORS = ["#FF8A65", "#ff9f80", "#f06f47", "#ffbfa6", "#d95a38", "#ff7043"];

const DC = { W: 760, H: 280, pL: 46, pR: 16, pT: 16, pB: 36 };
DC.cW = DC.W - DC.pL - DC.pR;
DC.cH = DC.H - DC.pT - DC.pB;

const UC = { W: 760, H: 260, pL: 40, pR: 16, pT: 12, pB: 36 };
UC.cW = UC.W - UC.pL - UC.pR;
UC.cH = UC.H - UC.pT - UC.pB;

// ── 유틸리티 ─────────────────────────────────────────────────────────────────
function formatCurrency(value) {
  const num = Number(value ?? 0);
  return new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 }).format(Number.isFinite(num) ? num : 0);
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("ko-KR");
}

function abbreviateCurrency(value) {
  if (value === 0) return "0";
  if (value >= 100_000_000) return `${(value / 100_000_000).toFixed(1).replace(/\.0$/, "")}억`;
  if (value >= 10_000) return `${(value / 10_000).toFixed(0)}만`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}천`;
  return String(Math.round(value));
}


function DonutChart({ categories, field, label, formatValue }) {
  const [hovered, setHovered] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);

  const R = 42, r = 24, CX = 56, CY = 56, SIZE = 112;
  const total = categories.reduce((s, c) => s + Number(c[field] ?? 0), 0) || 1;

  const segments = [];
  let angle = -Math.PI / 2;
  categories.forEach((item, idx) => {
    const val = Number(item[field] ?? 0);
    const sweep = (val / total) * 2 * Math.PI;
    if (sweep === 0) return;
    const x1 = CX + R * Math.cos(angle);
    const y1 = CY + R * Math.sin(angle);
    const x2 = CX + R * Math.cos(angle + sweep);
    const y2 = CY + R * Math.sin(angle + sweep);
    const ix1 = CX + r * Math.cos(angle);
    const iy1 = CY + r * Math.sin(angle);
    const ix2 = CX + r * Math.cos(angle + sweep);
    const iy2 = CY + r * Math.sin(angle + sweep);
    const large = sweep > Math.PI ? 1 : 0;
    const d = `M${x1},${y1} A${R},${R},0,${large},1,${x2},${y2} L${ix2},${iy2} A${r},${r},0,${large},0,${ix1},${iy1} Z`;
    segments.push({ d, color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length], item, pct: (val / total * 100).toFixed(1) });
    angle += sweep;
  });

  const handleMouseMove = (e) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltipPos({ x: e.clientX - rect.left + 12, y: e.clientY - rect.top - 10 });
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }} onMouseMove={handleMouseMove} onMouseLeave={() => setHovered(null)}>
      <svg ref={svgRef} viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE}>
        {segments.length ? segments.map((seg, i) => (
          <path key={i} d={seg.d} fill={seg.color}
            opacity={hovered === null || hovered === i ? 1 : 0.35}
            style={{ cursor: "pointer", transition: "opacity .15s" }}
            onMouseEnter={() => setHovered(i)}
          />
        )) : <circle cx={CX} cy={CY} r={R} fill="#ffe4d6" />}
        <circle cx={CX} cy={CY} r={r} fill="white" />
        <text x={CX} y={CY - 4} textAnchor="middle" fontSize="9" fontWeight="700" fill="#374151">{label}</text>
        {hovered !== null && segments[hovered] && (
          <text x={CX} y={CY + 8} textAnchor="middle" fontSize="8" fill="#64748b">{segments[hovered].pct}%</text>
        )}
      </svg>
      {hovered !== null && segments[hovered] && (
        <div style={{
          position: "absolute", left: tooltipPos.x, top: tooltipPos.y,
          background: "#1e293b", color: "#f8fafc", borderRadius: "8px",
          padding: "8px 12px", fontSize: "12px", pointerEvents: "none",
          whiteSpace: "nowrap", zIndex: 100, lineHeight: 1.7, boxShadow: "0 4px 12px rgba(0,0,0,.25)"
        }}>
          <div style={{ fontWeight: 800, marginBottom: "2px" }}>{segments[hovered].item.categoryLabel}</div>
          <div>{formatValue(segments[hovered].item)} <span style={{ color: "#94a3b8" }}>({segments[hovered].pct}%)</span></div>
          <div style={{ color: "#94a3b8" }}>{segments[hovered].item.campaignCount}건</div>
        </div>
      )}
    </div>
  );
}

// ── 배지 ─────────────────────────────────────────────────────────────────────
function StatusBadge({ text }) {
  const colorMap = {
    ACTIVE: "badge--green", 활성: "badge--green",
    INACTIVE: "badge--gray", 비활성: "badge--gray",
    PRE_REGISTERED: "badge--yellow", 대기중: "badge--yellow", PENDING: "badge--yellow",
    APPROVED: "badge--blue", 승인됨: "badge--blue",
    REJECTED: "badge--red", 반려됨: "badge--red",
    CLEAN: "badge--green", SIMILAR: "badge--yellow", ILLEGAL: "badge--red",
    APPROVE: "badge--blue", REJECT: "badge--red",
    DISABLE: "badge--gray", ENABLE: "badge--green",
    REQUEST: "badge--yellow",
    SENT: "badge--blue", FAILED: "badge--red",
    FOUNDATION: "badge--blue", CAMPAIGN: "badge--green", FINAL_REPORT: "badge--yellow",
    읽음: "badge--gray", 안읽음: "badge--yellow",
  };
  const cls = colorMap[text] ?? "badge--gray";
  return <span className={`admin-badge ${cls}`}>{text}</span>;
}

// ── 반려 모달 ─────────────────────────────────────────────────────────────────
function RejectModal({ title, onConfirm, onClose }) {
  const [reason, setReason] = useState("");
  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <h4>{title}</h4>
        <p>반려 사유를 입력하세요.</p>
        <textarea
          className="admin-modal-textarea"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="반려 사유..."
        />
        <div className="admin-modal-actions">
          <button type="button" onClick={onClose}>취소</button>
          <button
            type="button"
            className="danger"
            disabled={!reason.trim()}
            onClick={() => onConfirm(reason.trim())}
          >
            반려 처리
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 공통 테이블 ───────────────────────────────────────────────────────────────
function AdminTable({ columns, rows, onRowClick, emptyText = "데이터가 없습니다.", className = "" }) {
  if (!rows.length) {
    return <p className="admin-empty-text">{emptyText}</p>;
  }
  return (
    <div className="admin-table-wrap">
      <table className={`admin-table ${className}`}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={col.width ? { width: col.width } : {}}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row._key ?? i}
              onClick={() => onRowClick?.(row)}
              className={onRowClick ? "is-clickable" : ""}
            >
              {columns.map((col) => (
                <td key={col.key}>{col.render ? col.render(row, i) : (row[col.key] ?? "-")}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── 페이지네이션 ──────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = [];
  const start = Math.max(0, page - 2);
  const end = Math.min(totalPages - 1, start + 4);
  for (let i = start; i <= end; i++) pages.push(i);
  return (
    <div className="admin-pagination">
      <button type="button" disabled={page === 0} onClick={() => onChange(page - 1)}>이전</button>
      {pages.map((p) => (
        <button key={p} type="button" className={p === page ? "is-active" : ""} onClick={() => onChange(p)}>{p + 1}</button>
      ))}
      <button type="button" disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)}>다음</button>
    </div>
  );
}

// ── 탭 ───────────────────────────────────────────────────────────────────────
function PanelTabs({ tabs, active, onChange }) {
  return (
    <div className="admin-panel-tabs">
      {tabs.map(({ key, label }) => (
        <button key={key} type="button" className={`admin-panel-tab ${active === key ? "is-active" : ""}`} onClick={() => onChange(key)}>
          {label}
        </button>
      ))}
    </div>
  );
}

// ── 검색/필터 바 ──────────────────────────────────────────────────────────────
function FilterBar({ keyword, onKeywordChange, onSearch, selects = [] }) {
  return (
    <div className="admin-filter-bar">
      <div className="admin-filter-bar__left">
        {selects.map(({ value, onChange, options, key }) => (
          <div key={key} className="admin-select-wrap">
            <select value={value} onChange={(e) => onChange(e.target.value)} className="admin-select">
              {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <span className="admin-select-chevron">▾</span>
          </div>
        ))}
      </div>
      {onSearch && (
        <form className="admin-filter-bar__search" onSubmit={(e) => { e.preventDefault(); onSearch(); }}>
          <input type="text" placeholder="검색어" value={keyword} onChange={(e) => onKeywordChange(e.target.value)} />
          <button type="submit">검색</button>
        </form>
      )}
    </div>
  );
}

// ── 기간 선택기 ───────────────────────────────────────────────────────────────
function PeriodSelector({ days, onChangeDays, range, onChangeRange }) {
  const [showRange, setShowRange] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handlePreset = (d) => {
    setShowRange(false);
    onChangeDays(d);
    onChangeRange(null);
  };

  const handleApply = () => {
    if (startDate && endDate) onChangeRange({ start: startDate, end: endDate });
  };

  return (
    <div className="admin-period-selector">
      {[7, 14, 30].map((d) => (
        <button key={d} type="button" className={`admin-period-btn ${!range && days === d ? "is-active" : ""}`} onClick={() => handlePreset(d)}>
          {d}일
        </button>
      ))}
      <button type="button" className={`admin-period-btn ${showRange ? "is-active" : ""}`} onClick={() => setShowRange((p) => !p)}>
        직접 입력
      </button>
      {showRange && (
        <div className="admin-period-range">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} max={endDate || undefined} />
          <span>~</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate || undefined} />
          <button type="button" className="admin-period-range__apply" onClick={handleApply} disabled={!startDate || !endDate}>조회</button>
        </div>
      )}
    </div>
  );
}

// ── 대시보드 홈 ───────────────────────────────────────────────────────────────
function DashboardHome({ onNavigate, navigate, donationDays, userDays, onDonationDaysChange, onUserDaysChange }) {
  const [tooltip, setTooltip] = useState(null);
  const [userTooltip, setUserTooltip] = useState(null);
  const [summary, setSummary] = useState({ todayDonationAmount: 0, activeCampaignCount: 0, pendingFoundationCount: 0, achievedCampaignRatio: 0, totalUserCount: 0, totalDonationAmount: 0 });
  const [trend, setTrend] = useState([]);
  const [userTrend, setUserTrend] = useState([]);
  const [categories, setCategories] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [donationRange, setDonationRange] = useState(null);
  const [userRange, setUserRange] = useState(null);

  useEffect(() => {
    fetchAdminJson("/dashboard/summary").then(setSummary).catch((e) => console.error("[Summary]", e));
    fetchAdminJson("/dashboard/category-ratio").then(setCategories).catch((e) => console.error("[Category]", e));
    Promise.all([
      fetchAdminJson("/foundation/applications", { size: 5 }),
      fetchAdminJson("/campaigns/pending", { size: 5 }),
      fetchAdminJson("/reports/pending", { size: 5 }),
    ]).then(([foundations, campaigns, reports]) => {
      const normalized = [
        ...(foundations.content ?? []).map((r) => ({ logNo: `f-${r.foundationNo}`, targetType: "FOUNDATION", description: `${r.foundationName} 가입 승인 요청`, createdAt: r.createdAt, targetNo: r.foundationNo })),
        ...(campaigns.content ?? []).map((r) => ({ logNo: `c-${r.campaignNo}`, targetType: "CAMPAIGN", description: `${r.title} 캠페인 승인 요청`, createdAt: r.createdAt, targetNo: r.campaignNo })),
        ...(reports.content ?? []).map((r) => ({ logNo: `rp-${r.reportNo}`, targetType: "FINAL_REPORT", description: `${r.title} 활동보고서 승인 요청`, createdAt: r.createdAt, targetNo: r.reportNo })),
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);
      setRecentLogs(normalized);
    }).catch((e) => console.error("[RecentLogs]", e));
    fetchAdminJson("/logs", { size: 10 })
      .then((d) => setActivityLogs(d.content ?? [])).catch((e) => console.error("[Logs]", e));
  }, []);

  // SSE — 신규 승인 요청을 실시간으로 최근 요청 목록 상단에 prepend
  useEffect(() => {
    const controller = new AbortController();
    const token = window.localStorage.getItem("adminAccessToken");
    if (!token) return;

    async function connectSse() {
      try {
        const res = await fetch("/admin-api/subscribe", {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!res.ok) return;
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const blocks = buf.split("\n\n");
          buf = blocks.pop();
          for (const block of blocks) {
            const lines = block.split("\n");
            let eventType = ""; let dataStr = "";
            for (const line of lines) {
              if (line.startsWith("event:")) eventType = line.slice(6).trim();
              if (line.startsWith("data:")) dataStr = line.slice(5).trim();
            }
            if (eventType === "approval-request" && dataStr) {
              try {
                const payload = JSON.parse(dataStr);
                const newLog = {
                  logNo: Date.now(),
                  targetType: payload.targetType,
                  description: payload.message,
                  createdAt: new Date().toISOString(),
                  targetNo: payload.targetId,
                };
                setRecentLogs((prev) => [newLog, ...prev].slice(0, 10));
              } catch { /* ignore */ }
            }
          }
        }
      } catch (err) {
        if (err.name !== "AbortError") console.error("[DashboardSSE]", err);
      }
    }
    connectSse();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const params = donationRange
      ? { startDate: donationRange.start, endDate: donationRange.end }
      : { days: donationDays };
    fetchAdminJson("/dashboard/donation-trend", params).then(setTrend).catch((e) => console.error("[DonationTrend]", e));
  }, [donationDays, donationRange]);

  useEffect(() => {
    const params = userRange
      ? { startDate: userRange.start, endDate: userRange.end }
      : { days: userDays };
    fetchAdminJson("/dashboard/user-registration-trend", params).then(setUserTrend).catch((e) => console.error("[UserTrend]", e));
  }, [userDays, userRange]);

  // 기부금액 추이 차트
  const amounts = trend.map((t) => Number(t.amount));
  const maxAmt = Math.max(...amounts, 1);
  const stepXD = trend.length > 1 ? DC.cW / (trend.length - 1) : 0;
  const ptXD = (i) => DC.pL + stepXD * i;
  const ptYD = (v) => DC.pT + DC.cH - (v / maxAmt) * DC.cH;
  const linePathD = trend.map((p, i) => `${i === 0 ? "M" : "L"}${ptXD(i)} ${ptYD(p.amount)}`).join(" ");
  const xStepD = Math.max(1, Math.floor(trend.length / 6));

  // 회원 가입 추이 차트
  const counts = userTrend.map((t) => Number(t.count));
  const maxCnt = Math.max(...counts, 1);
  const stepXU = userTrend.length > 1 ? UC.cW / (userTrend.length - 1) : 0;
  const ptXU = (i) => UC.pL + stepXU * i;
  const ptYU = (v) => UC.pT + UC.cH - (v / maxCnt) * UC.cH;
  const linePathU = userTrend.map((p, i) => `${i === 0 ? "M" : "L"}${ptXU(i)} ${ptYU(p.count)}`).join(" ");
  const xStepU = Math.max(1, Math.floor(userTrend.length / 6));

  const yLevels = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="admin-dashboard-content__stack">
      {/* 요약 카드 */}
      <section className="admin-summary-grid">
        <article className="admin-summary-card">
          <p className="admin-summary-card__label">전체 누적 기부액</p>
          <strong className="admin-summary-card__value" style={{ color: "#FF8A65" }}>{formatCurrency(summary.totalDonationAmount)}</strong>
          <span className="admin-summary-card__sub"  style={{ color: "#FF8A65" }}>{summary.totalUserCount.toLocaleString("ko-KR")}명</span>
        </article>
        <article className="admin-summary-card">
          <p className="admin-summary-card__label">목표 달성 캠페인 비율</p>
          <strong className="admin-summary-card__value" style={{ color: "#FF8A65" }} >{summary.achievedCampaignRatio.toFixed(1)}%</strong>
        </article>
        <article className="admin-summary-card">
          <p className="admin-summary-card__label">일 별 기부액</p>
          <strong className="admin-summary-card__value">{formatCurrency(summary.todayDonationAmount)}</strong>
        </article>
        <article className="admin-summary-card">
          <p className="admin-summary-card__label">진행 중 캠페인</p>
          <strong className="admin-summary-card__value">{summary.activeCampaignCount.toLocaleString("ko-KR")}</strong>
        </article>
        <article className="admin-summary-card">
          <p className="admin-summary-card__label">신규 단체 신청</p>
          <strong className="admin-summary-card__value" >{summary.pendingFoundationCount.toLocaleString("ko-KR")}</strong>
        </article>
      </section>

      <section className="admin-dashboard-2x2-grid">
          {/* 기부금액 추이 */}
          <article className="admin-panel admin-panel--chart">
            <div className="admin-panel__header">
              <h2>기부금액 추이</h2>
              <PeriodSelector days={donationDays} onChangeDays={onDonationDaysChange} range={donationRange} onChangeRange={setDonationRange} />
            </div>
            <div className="admin-line-chart">
              <svg viewBox={`0 0 ${DC.W} ${DC.H}`} aria-hidden="true" style={{ cursor: "crosshair" }}
                onMouseMove={(e) => {
                  if (!trend.length) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const svgX = ((e.clientX - rect.left) / rect.width) * DC.W;
                  const idx = Math.min(Math.max(Math.round((svgX - DC.pL) / (stepXD || 1)), 0), trend.length - 1);
                  const p = trend[idx];
                  if (!p) return;
                  const x = ptXD(idx); const y = ptYD(p.amount);
                  setTooltip({ x, y, xPct: (x / DC.W) * 100, yPct: (y / DC.H) * 100, label: p.date, amount: p.amount });
                }}
                onMouseLeave={() => setTooltip(null)}
              >
                {yLevels.map((r) => {
                  const yp = DC.pT + DC.cH - r * DC.cH;
                  return (
                    <g key={r}>
                      <line x1={DC.pL} y1={yp} x2={DC.W - DC.pR} y2={yp} stroke="#f1f5f9" strokeWidth={r === 0 ? 1.5 : 1} strokeDasharray={r === 0 ? "none" : "4 3"} />
                      <text x={DC.pL - 6} y={yp + 4} textAnchor="end" fontSize="10" fill="#94a3b8">{abbreviateCurrency(maxAmt * r)}</text>
                    </g>
                  );
                })}
                {trend.map((p, i) => i % xStepD !== 0 ? null : (
                  <text key={i} x={ptXD(i)} y={DC.H - DC.pB + 14} textAnchor="middle" fontSize="10" fill="#94a3b8">{p.date.slice(5)}</text>
                ))}
                <path d={linePathD} fill="none" stroke="#FF8A65" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {tooltip && (
                  <>
                    <line x1={tooltip.x} y1={DC.pT} x2={tooltip.x} y2={DC.pT + DC.cH} stroke="#ffe4d6" strokeWidth={1} strokeDasharray="4 3" />
                    <circle cx={tooltip.x} cy={tooltip.y} r={4} fill="#FF8A65" stroke="#fff" strokeWidth={2} />
                  </>
                )}
              </svg>
              {tooltip && (
                <div className="admin-chart-bubble" style={{ left: `${tooltip.xPct}%`, top: `${tooltip.yPct}%` }}>
                  <span>{tooltip.label}</span>
                  <strong>{formatCurrency(tooltip.amount)}</strong>
                </div>
              )}
            </div>
          </article>

          {/* 카테고리 비율 */}
          <article className="admin-panel">
            <div className="admin-panel__header" style={{ paddingLeft: "14px" }}><h2>카테고리 비율</h2></div>
            <div className="admin-donut-pair">
              <div className="admin-donut-pair__item">
                <p className="admin-donut-pair__label">기부금액</p>
                <DonutChart categories={categories} field="donationAmount" label="기부금액" formatValue={(item) => formatCurrency(item.donationAmount)} />
              </div>
              <div className="admin-donut-pair__item">
                <p className="admin-donut-pair__label">캠페인 수</p>
                <DonutChart categories={categories} field="campaignCount" label="캠페인 수" formatValue={(item) => `${item.campaignCount}건`} />
              </div>
            </div>
            <div className="admin-donut__legend">
              <div className="admin-donut__legend-header">
                <span>카테고리</span><span>기부금액</span><span>건수</span>
              </div>
              {categories.slice(0, 6).map((item, index) => (
                <div key={item.category} className="admin-category-row">
                  <span className="admin-category-row__label">
                    <i style={{ background: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }} />
                    {item.categoryLabel}
                  </span>
                  <span>{formatCurrency(item.donationAmount)}</span>
                  <span>{item.campaignCount}건</span>
                </div>
              ))}
            </div>
          </article>

          {/* 회원 가입 추이 */}
          <article className="admin-panel">
            <div className="admin-panel__header">
              <h2>회원 가입 추이</h2>
              <PeriodSelector days={userDays} onChangeDays={onUserDaysChange} range={userRange} onChangeRange={setUserRange} />
            </div>
            <div className="admin-user-trend-chart">
              <svg viewBox={`0 0 ${UC.W} ${UC.H}`} aria-hidden="true" style={{ cursor: "crosshair" }}
                onMouseMove={(e) => {
                  if (!userTrend.length) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const svgX = ((e.clientX - rect.left) / rect.width) * UC.W;
                  const idx = Math.min(Math.max(Math.round((svgX - UC.pL) / (stepXU || 1)), 0), userTrend.length - 1);
                  const p = userTrend[idx];
                  if (!p) return;
                  const x = ptXU(idx); const y = ptYU(p.count);
                  setUserTooltip({ x, y, xPct: (x / UC.W) * 100, yPct: (y / UC.H) * 100, label: p.date, count: p.count });
                }}
                onMouseLeave={() => setUserTooltip(null)}
              >
                {yLevels.map((r) => {
                  const yp = UC.pT + UC.cH - r * UC.cH;
                  const v = maxCnt * r;
                  const label = v >= 10_000 ? `${Math.round(v / 10_000)}만명` : `${Math.round(v)}명`;
                  return (
                    <g key={r}>
                      <line x1={UC.pL} y1={yp} x2={UC.W - UC.pR} y2={yp} stroke="#f1f5f9" strokeWidth={r === 0 ? 1.5 : 1} strokeDasharray={r === 0 ? "none" : "4 3"} />
                      <text x={UC.pL - 6} y={yp + 4} textAnchor="end" fontSize="10" fill="#94a3b8">{label}</text>
                    </g>
                  );
                })}
                {userTrend.map((p, i) => i % xStepU !== 0 ? null : (
                  <text key={i} x={ptXU(i)} y={UC.H - UC.pB + 14} textAnchor="middle" fontSize="10" fill="#94a3b8">{p.date.slice(5)}</text>
                ))}
                <path d={linePathU} fill="none" stroke="#FFB499" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {userTooltip && (
                  <>
                    <line x1={userTooltip.x} y1={UC.pT} x2={userTooltip.x} y2={UC.pT + UC.cH} stroke="#ffe4d6" strokeWidth={1} strokeDasharray="4 3" />
                    <circle cx={userTooltip.x} cy={userTooltip.y} r={4} fill="#FFB499" stroke="#fff" strokeWidth={2} />
                  </>
                )}
              </svg>
              {userTooltip && (
                <div className="admin-chart-bubble admin-chart-bubble--purple" style={{ left: `${userTooltip.xPct}%`, top: `${userTooltip.yPct}%` }}>
                  <span>{userTooltip.label}</span>
                  <strong>{userTooltip.count.toLocaleString("ko-KR")}명</strong>
                </div>
              )}
            </div>
          </article>

          {/* 최근 요청 — 테이블 */}
          <article className="admin-panel" style={{ padding: 0 }}>
            <div className="admin-panel__header" style={{ padding: "14px 16px" }}>
              <h2>최근 요청 <span className="admin-badge badge--yellow">{recentLogs.length}건</span></h2>
              <button type="button" className="admin-detail-btn" onClick={() => onNavigate?.("requests")}>자세히 보기</button>
            </div>
            <AdminTable
              columns={[
                { key: "targetType", label: "유형", width: "60px", render: (r) => {
                  const colorMap = { FOUNDATION: "#FF8A65", CAMPAIGN: "#16a34a", FINAL_REPORT: "#ca8a04" };
                  return <span style={{ fontSize: "11px", fontWeight: 800, color: colorMap[r.targetType] ?? "#64748b" }}>{r.targetType}</span>;
                }},
                { key: "description", label: "내용", render: (r) => <strong>{r.description}</strong> },
                { key: "createdAt", label: "일시", width: "120px", render: (r) => formatDate(r.createdAt) },
              ]}
              rows={recentLogs.slice(0, 5).map((r) => ({ ...r, _key: r.logNo }))}
              onRowClick={(r) => {
                const pathMap = {
                  FOUNDATION: `/admin/foundation/${r.targetNo}`,
                  CAMPAIGN: `/admin/campaign/${r.targetNo}`,
                  FINAL_REPORT: `/admin/report/${r.targetNo}`,
                };
                const path = pathMap[r.targetType];
                if (path) navigate?.(path, { state: { record: r } });
              }}
            />
          </article>
      </section>

      {/* 활동 로그 — 전체 너비 테이블 */}
      <article className="admin-panel" style={{ padding: 0 }}>
        <div className="admin-panel__header" style={{ padding: "14px 20px" }}>
          <h2>활동 로그</h2>
          <button type="button" className="admin-detail-btn" onClick={() => onNavigate?.("logs")}>자세히 보기</button>
        </div>
        <AdminTable
          columns={[
            { key: "actionType", label: "액션", width: "110px", render: (r) => {
              const colorMap = { APPROVE: "#FF8A65", REJECT: "#dc2626", DISABLE: "#64748b", ENABLE: "#16a34a" };
              return <span style={{ fontSize: "11px", fontWeight: 800, color: colorMap[r.actionType] ?? "#374151" }}>{r.actionType}</span>;
            }},
            { key: "targetType", label: "대상 유형", width: "130px", render: (r) => (
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8" }}>{r.targetType}</span>
            )},
            { key: "description", label: "내용", render: (r) => <strong>{r.description}</strong> },
            { key: "adminName", label: "처리자", width: "90px" },
            { key: "createdAt", label: "처리일시", width: "120px", render: (r) => formatDate(r.createdAt) },
          ]}
          rows={activityLogs.map((r) => ({ ...r, _key: r.logNo }))}
          onRowClick={(r) => {
            const pathMap = {
              FOUNDATION: `/admin/foundation/${r.targetNo}`,
              CAMPAIGN: `/admin/campaign/${r.targetNo}`,
              FINAL_REPORT: `/admin/report/${r.targetNo}`,
            };
            const path = pathMap[r.targetType];
            if (path) navigate?.(path);
          }}
          className="admin-table--spacious"
        />
      </article>
    </div>
  );
}

// ── 단체 관리 패널 ────────────────────────────────────────────────────────────
function FoundationsPanel({ onOpenDetail }) {
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [reviewFilter, setReviewFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("createdAt,DESC");
  const [rows, setRows] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refetch, setRefetch] = useState(0);
  const [rejectTarget, setRejectTarget] = useState(null);
  const PAGE_SIZE = 10;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAdminJson("/foundation/applications", { page, size: PAGE_SIZE, sort: sortOrder, keyword: appliedKeyword, reviewStatus: reviewFilter })
      .then((json) => { if (!cancelled) { setRows(json.content ?? []); setTotalPages(json.totalPages ?? 0); } })
      .catch(() => { if (!cancelled) setRows([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, reviewFilter, appliedKeyword, sortOrder, refetch]);

  const handleApprove = async (no) => {
    try { await patchAdminAction(`/foundation/${no}/approve`); setRefetch((r) => r + 1); }
    catch { alert("처리 중 오류가 발생했습니다."); }
  };

  const handleReject = async (no) => {
    if (!window.confirm("반려 처리하시겠습니까?")) return;
    try { await patchAdminAction(`/foundation/${no}/reject`); setRefetch((r) => r + 1); }
    catch { alert("처리 중 오류가 발생했습니다."); }
  };

  const approvalColumns = [
    { key: "_no", label: "번호", width: "52px", render: (r, i) => <span style={{ color: "#94a3b8", fontSize: "12px" }}>{page * PAGE_SIZE + i + 1}</span> },
    { key: "foundationName", label: "단체명", render: (r) => (<><strong>{r.foundationName}</strong><em>{r.foundationType}</em></>) },
    { key: "representativeName", label: "대표자" },
    { key: "foundationEmail", label: "이메일" },
    { key: "reviewStatus", label: "검토 상태", width: "90px", render: (r) => <StatusBadge text={r.reviewStatus} /> },
    { key: "createdAt", label: "신청일", width: "130px", render: (r) => formatDate(r.createdAt) },
    { key: "_action", label: "관리", width: "160px", render: (r) => (
      <div style={{ display: "flex", gap: "4px", flexWrap: "nowrap" }}>
        <button type="button" className="admin-row-btn" style={{ color: "#FF8A65", borderColor: "#FF8A65" }}
          onClick={(e) => { e.stopPropagation(); handleApprove(r.foundationNo); }}>승인</button>
        <button type="button" className="admin-row-btn" style={{ color: "#dc2626", borderColor: "#fca5a5" }}
          onClick={(e) => { e.stopPropagation(); handleReject(r.foundationNo); }}>반려</button>
        <button type="button" className="admin-row-btn"
          onClick={(e) => { e.stopPropagation(); onOpenDetail(r.foundationNo); }}>상세</button>
      </div>
    )},
  ];

  const reviewOptions = [
    { value: "", label: "전체 상태" },
    { value: "PENDING", label: "대기" },
    { value: "CLEAN", label: "정상" },
    { value: "SIMILAR", label: "유사" },
    { value: "ILLEGAL", label: "위법" },
    { value: "APPROVED", label: "승인됨" },
    { value: "REJECTED", label: "반려됨" },
  ];
  return (
    <>
      <section className="admin-panel admin-panel--list">
        <div className="admin-panel__header" style={{ padding: "16px 20px 0" }}>
          <h2 style={{ fontSize: "15px", fontWeight: 800 }}>신규 신청</h2>
        </div>
        <FilterBar
          keyword={keyword}
          onKeywordChange={setKeyword}
          onSearch={() => { setPage(0); setAppliedKeyword(keyword); }}
          selects={[
            { key: "sort", value: sortOrder, onChange: (v) => { setSortOrder(v); setPage(0); }, options: [
              { value: "createdAt,DESC", label: "최신순" },
              { value: "createdAt,ASC", label: "오래된순" },
            ]},
            { key: "review", value: reviewFilter, onChange: (v) => { setReviewFilter(v); setPage(0); }, options: reviewOptions },
          ]}
        />
        {loading
          ? <p className="admin-empty-text">불러오는 중...</p>
          : <AdminTable
              columns={approvalColumns}
              rows={rows.map((r) => ({ ...r, _key: r.foundationNo }))}
              emptyText="데이터가 없습니다."
            />
        }
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </section>
    </>
  );
}

// ── 캠페인 조회 패널 ──────────────────────────────────────────────────────────
const CAMPAIGN_STATUS_COLOR = {
  PENDING: "#94a3b8", RECRUITING: "#FF8A65", ACTIVE: "#16a34a",
  ENDED: "#64748b", SETTLED: "#d97706", COMPLETED: "#7c3aed", CANCELLED: "#dc2626",
};
const CAMPAIGN_STATUS_LABEL = {
  PENDING: "대기", RECRUITING: "모집중", ACTIVE: "진행중",
  ENDED: "마감", SETTLED: "정산중", COMPLETED: "완료", CANCELLED: "취소",
};

const CAMPAIGN_STATUS_FILTER_OPTIONS = ["ENDED", "SETTLED", "COMPLETED"];
const APPROVAL_ENDPOINT = { PENDING: "/campaigns/pending", REJECTED: "/campaigns/rejected" };

function CampaignListPanel({ onOpenDetail }) {
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("createdAt,DESC");
  const [rows, setRows] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ active: 0, ended: 0, pending: 0, settled: 0, ratio: 0 });
  const PAGE_SIZE = 10;

  useEffect(() => {
    Promise.all([
      fetchAdminJson("/dashboard/summary"),
      fetchAdminJson("/campaigns/pending", { size: 1 }),
    ]).then(([summary, pending]) => {
      setStats({
        active:  summary.activeCampaignCount  ?? 0,
        ended:   summary.endedCampaignCount   ?? 0,
        settled: summary.settledCampaignCount ?? 0,
        pending: pending.totalElements        ?? 0,
        ratio:   summary.achievedCampaignRatio ?? 0,
      });
    }).catch(console.error);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const isCampaignStatus = CAMPAIGN_STATUS_FILTER_OPTIONS.includes(statusFilter);
    const endpoint = isCampaignStatus ? "/campaigns/approved" : (APPROVAL_ENDPOINT[statusFilter] ?? "/campaigns/approved");
    const params = { page, size: PAGE_SIZE, sort: sortOrder, keyword: appliedKeyword };
    fetchAdminJson(endpoint, params)
      .then((json) => { if (!cancelled) { setRows(json.content ?? []); setTotalPages(json.totalPages ?? 0); } })
      .catch(() => { if (!cancelled) setRows([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, appliedKeyword, statusFilter, sortOrder]);

  const statusOptions = [
    { value: "",          label: "전체" },
    { value: "APPROVED",  label: "승인" },
    { value: "PENDING",   label: "대기" },
    { value: "REJECTED",  label: "반려" },
    { value: "ENDED",     label: "모금종료" },
    { value: "SETTLED",   label: "정산완료" },
    { value: "COMPLETED", label: "최종 종료" },
  ];

  const approvalMap = { APPROVED: "승인", PENDING: "대기", REJECTED: "반려" };
  const columns = [
    { key: "_no",           label: "번호",       width: "52px",  render: (r, i) => <span style={{ color: "#94a3b8", fontSize: "12px" }}>{page * PAGE_SIZE + i + 1}</span> },
    { key: "title",         label: "캠페인명",                   render: (r) => (<><strong>{r.title}</strong>{r.foundationName && <em>{r.foundationName}</em>}</>) },
    { key: "category",      label: "카테고리",   width: "120px" },
    { key: "targetAmount",  label: "목표금액",   width: "110px", render: (r) => formatCurrency(r.targetAmount) },
    { key: "currentAmount", label: "현재 기부금", width: "110px", render: (r) => formatCurrency(r.currentAmount) },
    { key: "createdAt",     label: "등록일",     width: "130px", render: (r) => formatDate(r.createdAt) },
    { key: "campaignStatus", label: "진행 상태", width: "90px",  render: (r) => r.campaignStatus
        ? <span style={{ fontSize: "12px", fontWeight: 700, color: CAMPAIGN_STATUS_COLOR[r.campaignStatus] ?? "#374151" }}>{CAMPAIGN_STATUS_LABEL[r.campaignStatus] ?? r.campaignStatus}</span>
        : "-"
    },
    { key: "_action",       label: "관리",       width: "60px",  render: (r) => (
      <button type="button" className="admin-row-btn"
        onClick={(e) => { e.stopPropagation(); onOpenDetail(r); }}>상세</button>
    )},
  ];

  const isCampaignStatusFilter = CAMPAIGN_STATUS_FILTER_OPTIONS.includes(statusFilter);
  const displayedRows = (isCampaignStatusFilter ? rows.filter((r) => r.campaignStatus === statusFilter) : rows)
    .map((r) => ({ ...r, _key: r.campaignNo }));

  return (
    <>
      {/* 스탯 카드 */}
      <section className="admin-panel" style={{ marginBottom: "16px", padding: "16px 20px" }}>
        <div className="admin-foundation-stats" style={{ padding: 0, borderBottom: "none" }}>
          <div className="admin-foundation-stat">
            <p className="admin-foundation-stat__label">진행중 캠페인</p>
            <p className="admin-foundation-stat__value">{stats.active.toLocaleString()}<span className="admin-foundation-stat__unit">개</span></p>
          </div>
          <div className="admin-foundation-stat">
            <p className="admin-foundation-stat__label">모금 종료</p>
            <p className="admin-foundation-stat__value">
              {stats.ended.toLocaleString()}<span className="admin-foundation-stat__unit">개</span>
            </p>
            <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>달성률 {stats.ratio}%</p>
          </div>
          <div className="admin-foundation-stat">
            <p className="admin-foundation-stat__label">승인 대기</p>
            <p className="admin-foundation-stat__value">{stats.pending.toLocaleString()}<span className="admin-foundation-stat__unit">개</span></p>
          </div>
          <div className="admin-foundation-stat">
            <p className="admin-foundation-stat__label">정산완료</p>
            <p className="admin-foundation-stat__value">{stats.settled.toLocaleString()}<span className="admin-foundation-stat__unit">개</span></p>
          </div>
        </div>
      </section>

      <section className="admin-panel admin-panel--list admin-panel--spacious">
        <div className="admin-panel__header"><h2>캠페인 목록</h2></div>
        <FilterBar
          keyword={keyword}
          onKeywordChange={setKeyword}
          onSearch={() => { setPage(0); setAppliedKeyword(keyword); }}
          selects={[
            { key: "sort",   value: sortOrder,    onChange: (v) => { setSortOrder(v);    setPage(0); }, options: [{ value: "createdAt,DESC", label: "최신순" }, { value: "createdAt,ASC", label: "오래된순" }] },
            { key: "status", value: statusFilter, onChange: (v) => { setStatusFilter(v); setPage(0); }, options: statusOptions },
          ]}
        />
        <div style={{ opacity: loading ? 0.45 : 1, transition: "opacity 0.15s", pointerEvents: loading ? "none" : "auto" }}>
          <AdminTable columns={columns} rows={displayedRows} emptyText="캠페인이 없습니다." />
        </div>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </section>
    </>
  );
}

// ── 캠페인 승인·반려 패널 ─────────────────────────────────────────────────────
function CampaignsPanel({ onOpenDetail }) {
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [sortOrder, setSortOrder] = useState("createdAt,DESC");
  const [rows, setRows] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refetch, setRefetch] = useState(0);
  const [rejectTarget, setRejectTarget] = useState(null);
  const PAGE_SIZE = 10;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAdminJson("/campaigns/pending", { page, size: PAGE_SIZE, sort: sortOrder, keyword: appliedKeyword })
      .then((json) => { if (!cancelled) { setRows(json.content ?? []); setTotalPages(json.totalPages ?? 0); } })
      .catch(() => { if (!cancelled) setRows([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, appliedKeyword, sortOrder, refetch]);

  const handleApprove = async (no) => {
    try { await patchAdminAction(`/campaigns/${no}/approve`); setRefetch((r) => r + 1); }
    catch { alert("처리 중 오류가 발생했습니다."); }
  };

  const handleReject = async (no, reason) => {
    try {
      await patchAdminAction(`/campaigns/${no}/reject`, { reason });
      setRejectTarget(null);
      setRefetch((r) => r + 1);
    } catch { alert("처리 중 오류가 발생했습니다."); }
  };

  const columns = [
    { key: "_no", label: "번호", width: "52px", render: (r, i) => <span style={{ color: "#94a3b8", fontSize: "12px" }}>{page * PAGE_SIZE + i + 1}</span> },
    { key: "title", label: "캠페인명", render: (r) => (<><strong>{r.title}</strong>{r.foundationName && <em>{r.foundationName}</em>}</>) },
    { key: "category", label: "카테고리" },
    { key: "targetAmount", label: "목표 금액", render: (r) => formatCurrency(r.targetAmount) },
    { key: "createdAt", label: "신청일", width: "130px", render: (r) => formatDate(r.createdAt) },
    { key: "_action", label: "관리", width: "160px", render: (r) => (
      <div style={{ display: "flex", gap: "4px", flexWrap: "nowrap" }}>
        <button type="button" className="admin-row-btn" style={{ color: "#FF8A65", borderColor: "#FF8A65" }}
          onClick={(e) => { e.stopPropagation(); handleApprove(r.campaignNo); }}>승인</button>
        <button type="button" className="admin-row-btn" style={{ color: "#dc2626", borderColor: "#fca5a5" }}
          onClick={(e) => { e.stopPropagation(); setRejectTarget(r); }}>반려</button>
        <button type="button" className="admin-row-btn"
          onClick={(e) => { e.stopPropagation(); onOpenDetail(r); }}>상세</button>
      </div>
    )},
  ];

  return (
    <>
      <section className="admin-panel admin-panel--list">
        <div className="admin-panel__header" style={{ padding: "16px 20px 0" }}>
          <h2 style={{ fontSize: "15px", fontWeight: 800 }}>신규 신청</h2>
        </div>
        <FilterBar
          keyword={keyword}
          onKeywordChange={setKeyword}
          onSearch={() => { setPage(0); setAppliedKeyword(keyword); }}
          selects={[
            { key: "sort", value: sortOrder, onChange: (v) => { setSortOrder(v); setPage(0); }, options: [
              { value: "createdAt,DESC", label: "최신순" },
              { value: "createdAt,ASC",  label: "오래된순" },
            ]},
          ]}
        />
        {loading
          ? <p className="admin-empty-text">불러오는 중...</p>
          : <AdminTable columns={columns} rows={rows.map((r) => ({ ...r, _key: r.campaignNo }))} emptyText="승인 대기 캠페인이 없습니다." />
        }
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </section>
      {rejectTarget && (
        <RejectModal
          title={`"${rejectTarget.title}" 반려`}
          onConfirm={(reason) => handleReject(rejectTarget.campaignNo, reason)}
          onClose={() => setRejectTarget(null)}
        />
      )}
    </>
  );
}

// ── 보고서 조회 패널 ──────────────────────────────────────────────────────────
function ReportListPanel({ onOpenDetail }) {
  const [page, setPage] = useState(0);
  const [sortOrder, setSortOrder] = useState("createdAt,DESC");
  const [rows, setRows] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refetch, setRefetch] = useState(0);
  const [rejectTarget, setRejectTarget] = useState(null);
  const PAGE_SIZE = 10;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAdminJson("/reports/approved", { page, size: PAGE_SIZE, sort: sortOrder })
      .then((json) => { if (!cancelled) { setRows(json.content ?? []); setTotalPages(json.totalPages ?? 0); } })
      .catch(() => { if (!cancelled) setRows([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, sortOrder, refetch]);

  const handleApprove = async (no) => {
    try { await patchAdminAction(`/reports/${no}/approve`); setRefetch((r) => r + 1); }
    catch { alert("처리 중 오류가 발생했습니다."); }
  };

  const handleReject = async (no, reason) => {
    try { await patchAdminAction(`/reports/${no}/reject`, { reason }); setRejectTarget(null); setRefetch((r) => r + 1); }
    catch { alert("처리 중 오류가 발생했습니다."); }
  };

  const REPORT_STATUS_LABEL = { PENDING: "검토중", APPROVED: "승인됨", REJECTED: "반려됨" };
  const REPORT_STATUS_COLOR = { PENDING: "#d97706", APPROVED: "#FF8A65", REJECTED: "#dc2626" };

  const columns = [
    { key: "_no",          label: "번호",      width: "52px",  render: (r, i) => <span style={{ color: "#94a3b8", fontSize: "12px" }}>{page * PAGE_SIZE + i + 1}</span> },
    { key: "title",        label: "보고서 제목",              render: (r) => (<><strong>{r.title}</strong><em>캠페인 #{r.campaignNo}</em></>) },
    { key: "usagePurpose", label: "사용 목적", width: "160px" },
    { key: "approvalStatus", label: "상태",   width: "80px",  render: (r) => (
      <span style={{ fontSize: "12px", fontWeight: 700, color: REPORT_STATUS_COLOR[r.approvalStatus] ?? "#374151" }}>
        {REPORT_STATUS_LABEL[r.approvalStatus] ?? r.approvalStatus}
      </span>
    )},
    { key: "createdAt",    label: "제출일",    width: "130px", render: (r) => formatDate(r.createdAt) },
    { key: "_action",      label: "관리",      width: "160px", render: (r) => (
      <div style={{ display: "flex", gap: "4px", flexWrap: "nowrap" }}>
        <button type="button" className="admin-row-btn" style={{ color: "#FF8A65", borderColor: "#FF8A65" }}
          onClick={(e) => { e.stopPropagation(); handleApprove(r.reportNo); }}>승인</button>
        <button type="button" className="admin-row-btn" style={{ color: "#dc2626", borderColor: "#fca5a5" }}
          onClick={(e) => { e.stopPropagation(); setRejectTarget(r); }}>반려</button>
        {onOpenDetail && (
          <button type="button" className="admin-row-btn"
            onClick={(e) => { e.stopPropagation(); onOpenDetail(r); }}>상세</button>
        )}
      </div>
    )},
  ];

  return (
    <>
      <section className="admin-panel admin-panel--list admin-panel--spacious">
        <div className="admin-panel__header"><h2>승인된 보고서</h2></div>
        <FilterBar
          selects={[
            { key: "sort", value: sortOrder, onChange: (v) => { setSortOrder(v); setPage(0); }, options: [
              { value: "createdAt,DESC", label: "최신순" },
              { value: "createdAt,ASC",  label: "오래된순" },
            ]},
          ]}
        />
        <div style={{ opacity: loading ? 0.45 : 1, transition: "opacity 0.15s", pointerEvents: loading ? "none" : "auto" }}>
          <AdminTable columns={columns} rows={rows.map((r) => ({ ...r, _key: r.reportNo }))} emptyText="승인 대기 보고서가 없습니다." />
        </div>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </section>

      {rejectTarget && (
        <RejectModal
          title={`"${rejectTarget.title}" 반려`}
          onConfirm={(reason) => handleReject(rejectTarget.reportNo, reason)}
          onClose={() => setRejectTarget(null)}
        />
      )}
    </>
  );
}

// ── 보고서 승인·반려 패널 ─────────────────────────────────────────────────────
function ReportsPanel({ onOpenDetail }) {
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refetch, setRefetch] = useState(0);
  const [rejectTarget, setRejectTarget] = useState(null);
  const PAGE_SIZE = 10;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAdminJson("/reports/pending", { page, size: PAGE_SIZE, sort: "createdAt,DESC" })
      .then((json) => { if (!cancelled) { setRows(json.content ?? []); setTotalPages(json.totalPages ?? 0); } })
      .catch(() => { if (!cancelled) setRows([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, refetch]);

  const handleApprove = async (no) => {
    try { await patchAdminAction(`/reports/${no}/approve`); setRefetch((r) => r + 1); }
    catch { alert("처리 중 오류가 발생했습니다."); }
  };

  const handleReject = async (no, reason) => {
    try {
      await patchAdminAction(`/reports/${no}/reject`, { reason });
      setRejectTarget(null);
      setRefetch((r) => r + 1);
    } catch { alert("처리 중 오류가 발생했습니다."); }
  };

  const columns = [
    { key: "title", label: "보고서 제목", render: (r) => (<><strong>{r.title}</strong><em>캠페인 #{r.campaignNo}</em></>) },
    { key: "usagePurpose", label: "사용 목적" },
    { key: "approvalStatus", label: "상태", width: "80px", render: (r) => <StatusBadge text={r.approvalStatus === "PENDING" ? "검토중" : r.approvalStatus} /> },
    { key: "createdAt", label: "제출일", width: "130px", render: (r) => formatDate(r.createdAt) },
    { key: "_action", label: "관리", width: "160px", render: (r) => (
      <div style={{ display: "flex", gap: "4px", flexWrap: "nowrap" }}>
        <button type="button" className="admin-row-btn" style={{ color: "#FF8A65", borderColor: "#FF8A65" }}
          onClick={(e) => { e.stopPropagation(); handleApprove(r.reportNo); }}>승인</button>
        <button type="button" className="admin-row-btn" style={{ color: "#dc2626", borderColor: "#fca5a5" }}
          onClick={(e) => { e.stopPropagation(); setRejectTarget(r); }}>반려</button>
        {onOpenDetail && (
          <button type="button" className="admin-row-btn"
            onClick={(e) => { e.stopPropagation(); onOpenDetail(r); }}>상세</button>
        )}
      </div>
    )},
  ];

  return (
    <>
      <section className="admin-panel admin-panel--list">
        <div className="admin-panel__header" style={{ padding: "16px 20px 0" }}>
          <h2 style={{ fontSize: "15px", fontWeight: 800 }}>신규 신청</h2>
        </div>
        {loading ? <p className="admin-empty-text">불러오는 중...</p>
          : <div style={{ margin: "12px 16px 0" }}><AdminTable columns={columns} rows={rows.map((r) => ({ ...r, _key: r.reportNo }))} emptyText="승인 대기 보고서가 없습니다." /></div>}
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </section>
      {rejectTarget && (
        <RejectModal
          title={`"${rejectTarget.title}" 반려`}
          onConfirm={(reason) => handleReject(rejectTarget.reportNo, reason)}
          onClose={() => setRejectTarget(null)}
        />
      )}
    </>
  );
}

// ── 회원 관리 패널 ────────────────────────────────────────────────────────────
function MembersPanel({ onOpenDetail }) {
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [rows, setRows] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const PAGE_SIZE = 10;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAdminJson("/users", { page, size: PAGE_SIZE, sort: "createdAt,DESC", status: statusFilter, keyword: appliedKeyword })
      .then((json) => { if (!cancelled) { setRows(json.content ?? []); setTotalPages(json.totalPages ?? 0); } })
      .catch(() => { if (!cancelled) setRows([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, statusFilter, appliedKeyword]);

  const USER_STATUS_COLOR = { ACTIVE: "#16a34a", INACTIVE: "#dc2626" };
  const USER_STATUS_LABEL = { ACTIVE: "활성", INACTIVE: "비활성" };

  const columns = [
    { key: "name", label: "이름", render: (r) => (<><strong>{r.name}</strong><em>{r.email}</em></>) },
    { key: "loginType", label: "로그인 유형" },
    { key: "status", label: "상태", width: "70px", render: (r) => (
      <span style={{ fontSize: "12px", fontWeight: 700, color: USER_STATUS_COLOR[r.status] ?? "#374151" }}>
        {USER_STATUS_LABEL[r.status] ?? r.status}
      </span>
    )},
    { key: "createdAt", label: "가입일", width: "120px", render: (r) => formatDate(r.createdAt) },
    { key: "_action", label: "관리", width: "80px", render: (r) => (
      <button type="button" className="admin-row-btn"
        onClick={(e) => { e.stopPropagation(); onOpenDetail && onOpenDetail(r); }}>상세</button>
    )},
  ];

  const statusOptions = [
    { value: "", label: "전체 상태" },
    { value: "ACTIVE", label: "활성" },
    { value: "INACTIVE", label: "비활성" },
  ];

  return (
    <section className="admin-panel admin-panel--list">
      <div className="admin-panel__header"><h2>회원 목록</h2></div>
      <FilterBar
        keyword={keyword}
        onKeywordChange={setKeyword}
        onSearch={() => { setPage(0); setAppliedKeyword(keyword); }}
        selects={[{ key: "status", value: statusFilter, onChange: (v) => { setStatusFilter(v); setPage(0); }, options: statusOptions }]}
      />
      {loading
        ? <p className="admin-empty-text">불러오는 중...</p>
        : <AdminTable columns={columns} rows={rows.map((r) => ({ ...r, _key: r.userNo }))} emptyText="회원이 없습니다." />
      }
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </section>
  );
}

// ── 새 요청 패널 (REST 초기 로드 + SSE 실시간) ────────────────────────────────
function RequestsPanel({ onNavigate }) {
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [typeFilter, setTypeFilter] = useState("");
  const PAGE_SIZE = 10;
  const abortRef = useRef(null);

  const DETAIL_PATH = {
    FOUNDATION: (id) => `/admin/foundation/${id}`,
    CAMPAIGN: (id) => `/admin/campaign/${id}`,
    FINAL_REPORT: (id) => `/admin/report/${id}`,
  };

  // REST 초기 로드 — 대기 중인 승인 요청 3종 병렬 조회
  useEffect(() => {
    Promise.all([
      fetchAdminJson("/foundation/applications", { size: 30 }),
      fetchAdminJson("/campaigns/pending", { size: 30 }),
      fetchAdminJson("/reports/pending", { size: 30 }),
    ]).then(([foundations, campaigns, reports]) => {
      const combined = [
        ...(foundations.content ?? []).map((r) => ({ _id: `f-${r.foundationNo}`, targetType: "FOUNDATION", message: `${r.foundationName} 가입 승인 요청`, receivedAt: new Date(r.createdAt), targetId: r.foundationNo, isHistory: true })),
        ...(campaigns.content ?? []).map((r) => ({ _id: `c-${r.campaignNo}`, targetType: "CAMPAIGN", message: `${r.title} 캠페인 승인 요청`, receivedAt: new Date(r.createdAt), targetId: r.campaignNo, isHistory: true })),
        ...(reports.content ?? []).map((r) => ({ _id: `rp-${r.reportNo}`, targetType: "FINAL_REPORT", message: `${r.title} 활동보고서 승인 요청`, receivedAt: new Date(r.createdAt), targetId: r.reportNo, isHistory: true })),
      ].sort((a, b) => b.receivedAt - a.receivedAt);
      setEvents(combined);
    }).catch((e) => console.error("[RequestsPanel REST]", e));
  }, []);

  // SSE 실시간 연결
  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;

    async function connect() {
      const token = window.localStorage.getItem("adminAccessToken");
      if (!token) { setError("로그인이 필요합니다."); return; }

      try {
        const res = await fetch("/admin-api/subscribe", {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (res.status === 401) { window.location.href = "/admin/login"; return; }
        if (!res.ok) { setError(`연결 오류: HTTP ${res.status}`); return; }

        setConnected(true);
        setError(null);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });

          const blocks = buf.split("\n\n");
          buf = blocks.pop();

          for (const block of blocks) {
            const lines = block.split("\n");
            let eventType = "";
            let dataStr = "";
            for (const line of lines) {
              if (line.startsWith("event:")) eventType = line.slice(6).trim();
              if (line.startsWith("data:")) dataStr = line.slice(5).trim();
            }
            if (eventType === "approval-request" && dataStr) {
              try {
                const payload = JSON.parse(dataStr);
                setEvents((prev) => [
                  { ...payload, _id: Date.now() + Math.random(), receivedAt: new Date(), isHistory: false },
                  ...prev,
                ].slice(0, 100));
                setPage(0);
              } catch { /* ignore malformed */ }
            }
          }
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setConnected(false);
          setError("SSE 연결이 끊어졌습니다. 페이지를 새로고침 하세요.");
        }
      } finally {
        setConnected(false);
      }
    }

    connect();
    return () => { abortRef.current?.abort(); };
  }, []);

  const TYPE_OPTIONS = [
    { value: "", label: "전체 유형" },
    { value: "FOUNDATION", label: "기부단체" },
    { value: "CAMPAIGN", label: "캠페인" },
    { value: "FINAL_REPORT", label: "활동보고서" },
  ];
  const filtered = typeFilter ? events.filter((ev) => ev.targetType === typeFilter) : events;

  return (
    <section className="admin-panel admin-panel--list">
      <div className="admin-panel__header">
        <h2>
          새 요청
          {events.length > 0 && (
            <span style={{ marginLeft: "8px", fontSize: "13px", fontWeight: 600, color: "#f97316" }}>
              처리해야할 요청 {events.length}건
            </span>
          )}
        </h2>
      </div>
      <FilterBar
        selects={[
          { key: "type", value: typeFilter, onChange: (v) => { setTypeFilter(v); setPage(0); }, options: TYPE_OPTIONS },
        ]}
      />
      {error && <p className="admin-empty-text" style={{ color: "#dc2626", padding: "12px 20px" }}>{error}</p>}
      {!error && filtered.length === 0 && (
        <p className="admin-empty-text" style={{ padding: "40px 20px" }}>
          {events.length === 0 ? "불러오는 중..." : "해당 유형의 요청이 없습니다."}
        </p>
      )}
      {filtered.length > 0 && (() => {
        const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
        const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
        return (
          <>
            <AdminTable
              columns={[
                { key: "_no", label: "번호", width: "52px", render: (ev, i) => <span style={{ color: "#94a3b8", fontSize: "12px" }}>{page * PAGE_SIZE + i + 1}</span> },
                { key: "targetType", label: "유형", width: "100px", render: (ev) => {
                  const colorMap = { FOUNDATION: "#FF8A65", CAMPAIGN: "#16a34a", FINAL_REPORT: "#ca8a04" };
                  const labelMap = { FOUNDATION: "기부단체", CAMPAIGN: "캠페인", FINAL_REPORT: "활동보고서" };
                  return (
                    <span style={{ fontSize: "11px", fontWeight: 800, color: colorMap[ev.targetType] ?? "#64748b" }}>
                      {labelMap[ev.targetType] ?? ev.targetType}
                      {!ev.isHistory && <span style={{ marginLeft: 4, fontSize: "9px", color: "#f97316", fontWeight: 900 }}>NEW</span>}
                    </span>
                  );
                }},
                { key: "message", label: "내용", render: (ev) => <strong>{ev.message}</strong> },
                { key: "receivedAt", label: "수신 시각", width: "140px", render: (ev) => (
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    {ev.receivedAt instanceof Date
                      ? ev.receivedAt.toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
                      : formatDate(ev.receivedAt)}
                  </span>
                )},
                { key: "_action", label: "이동", width: "60px", render: (ev) => (
                  DETAIL_PATH[ev.targetType]
                    ? <button type="button" className="admin-row-btn" onClick={() => onNavigate?.(DETAIL_PATH[ev.targetType](ev.targetId))}>상세</button>
                    : null
                )},
              ]}
              rows={pageRows.map((ev) => ({ ...ev, _key: ev._id }))}
            />
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        );
      })()}
    </section>
  );
}

// ── 비활성화 단체 패널 ────────────────────────────────────────────────────────
function InactivePanel({ onOpenDetail }) {
  const [page, setPage] = useState(0);
  const [sortOrder, setSortOrder] = useState("createdAt,DESC");
  const [rows, setRows] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const PAGE_SIZE = 10;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAdminJson("/foundation/approved", { accountStatus: "INACTIVE", page, size: PAGE_SIZE, sort: sortOrder })
      .then((json) => { if (!cancelled) { setRows(json.content ?? []); setTotalPages(json.totalPages ?? 0); } })
      .catch(() => { if (!cancelled) setRows([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, sortOrder]);

  const columns = [
    { key: "_no", label: "번호", width: "52px", render: (r, i) => <span style={{ color: "#94a3b8", fontSize: "12px" }}>{page * PAGE_SIZE + i + 1}</span> },
    { key: "foundationName", label: "단체명", render: (r) => (<><strong>{r.foundationName}</strong><em>{r.foundationType}</em></>) },
    { key: "representativeName", label: "대표자" },
    { key: "foundationEmail", label: "이메일" },
    { key: "createdAt", label: "등록일", width: "130px", render: (r) => formatDate(r.createdAt) },
    { key: "_action", label: "관리", width: "60px", render: (r) => (
      <button type="button" className="admin-row-btn" onClick={(e) => { e.stopPropagation(); onOpenDetail?.(r.foundationNo); }}>상세</button>
    )},
  ];

  return (
    <section className="admin-panel admin-panel--list">
      <div className="admin-panel__header"><h2>비활성화 단체</h2></div>
      <p className="admin-panel__desc">현재 비활성화 상태인 기부단체 목록입니다. 상세보기에서 활성화할 수 있습니다.</p>
      <FilterBar
        selects={[
          { key: "sort", value: sortOrder, onChange: (v) => { setSortOrder(v); setPage(0); }, options: [
            { value: "createdAt,DESC", label: "최신순" },
            { value: "createdAt,ASC", label: "오래된순" },
          ]},
        ]}
      />
      {loading
        ? <p className="admin-empty-text">불러오는 중...</p>
        : <AdminTable columns={columns} rows={rows.map((r) => ({ ...r, _key: r.foundationNo }))} emptyText="비활성화 단체가 없습니다." />
      }
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </section>
  );
}

// ── 단체 조회 패널 (승인된 기부단체 목록) ──────────────────────────────────────
function FoundationListPanel({ onOpenDetail }) {
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [accountFilter, setAccountFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("createdAt,DESC");
  const [rows, setRows] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refetch, setRefetch] = useState(0);
  const [stats, setStats] = useState({ active: 0, inactive: 0, newApplications: 0 });
  const PAGE_SIZE = 10;

  useEffect(() => {
    Promise.all([
      fetchAdminJson("/foundation/approved", { accountStatus: "ACTIVE", size: 1 }),
      fetchAdminJson("/foundation/approved", { accountStatus: "INACTIVE", size: 1 }),
      fetchAdminJson("/foundation/applications", { size: 1 }),
    ]).then(([active, inactive, apps]) => {
      setStats({
        active: active.totalElements ?? 0,
        inactive: inactive.totalElements ?? 0,
        newApplications: apps.totalElements ?? 0,
      });
    }).catch(console.error);
  }, [refetch]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = { page, size: PAGE_SIZE, keyword: appliedKeyword, sort: sortOrder };
    if (accountFilter) params.accountStatus = accountFilter;
    fetchAdminJson("/foundation/approved", params)
      .then((json) => { if (!cancelled) { setRows(json.content ?? []); setTotalPages(json.totalPages ?? 0); } })
      .catch(() => { if (!cancelled) setRows([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, accountFilter, appliedKeyword, sortOrder, refetch]);

  const handleActivate = async (no) => {
    try { await patchAdminAction(`/foundation/${no}/activate`); setRefetch((r) => r + 1); }
    catch { alert("처리 중 오류가 발생했습니다."); }
  };

  const handleDeactivate = async (no) => {
    if (!window.confirm("비활성화 처리하시겠습니까?")) return;
    try { await patchAdminAction(`/foundation/${no}/deactivate`); setRefetch((r) => r + 1); }
    catch { alert("처리 중 오류가 발생했습니다."); }
  };

  const statusTextStyle = { ACTIVE: { color: "#16a34a", fontWeight: 700 }, INACTIVE: { color: "#64748b", fontWeight: 700 }, PRE_REGISTERED: { color: "#ca8a04", fontWeight: 700 } };
  const statusLabel = { ACTIVE: "활성", INACTIVE: "비활성", PRE_REGISTERED: "대기중" };

  const columns = [
    { key: "_no", label: "번호", width: "52px", render: (r, i) => <span style={{ color: "#94a3b8", fontSize: "12px" }}>{page * PAGE_SIZE + i + 1}</span> },
    { key: "accountStatus", label: "상태", width: "90px", render: (r) => (
      <span style={statusTextStyle[r.accountStatus] ?? { fontWeight: 700 }}>{statusLabel[r.accountStatus] ?? r.accountStatus}</span>
    )},
    { key: "foundationName", label: "단체명", render: (r) => (<><strong>{r.foundationName}</strong><em>{r.foundationType}</em></>) },
    { key: "representativeName", label: "대표자" },
    { key: "foundationEmail", label: "이메일" },
    { key: "createdAt", label: "등록일", width: "120px", render: (r) => formatDate(r.createdAt) },
    { key: "_action", label: "관리", width: "140px", render: (r) => (
      <div style={{ display: "flex", gap: "4px", flexWrap: "nowrap" }}>
        {r.accountStatus === "ACTIVE"
          ? <button type="button" className="admin-row-btn" style={{ color: "#dc2626", borderColor: "#fca5a5" }}
              onClick={(e) => { e.stopPropagation(); handleDeactivate(r.foundationNo); }}>비활성화</button>
          : <button type="button" className="admin-row-btn" style={{ color: "#16a34a", borderColor: "#86efac" }}
              onClick={(e) => { e.stopPropagation(); handleActivate(r.foundationNo); }}>활성화</button>
        }
        <button type="button" className="admin-row-btn"
          onClick={(e) => { e.stopPropagation(); onOpenDetail(r.foundationNo); }}>상세</button>
      </div>
    )},
  ];

  const accountOptions = [
    { value: "", label: "전체 상태" },
    { value: "ACTIVE", label: "활성화" },
    { value: "INACTIVE", label: "비활성화" },
  ];

  return (
    <>
      {/* 스탯 카드 — 페이지 이동과 무관하게 고정 */}
      <section className="admin-panel" style={{ marginBottom: "16px", padding: "16px 20px" }}>
        <div className="admin-foundation-stats" style={{ padding: 0, borderBottom: "none" }}>
          <div className="admin-foundation-stat">
            <p className="admin-foundation-stat__label">활성 단체</p>
            <p className="admin-foundation-stat__value">{stats.active}<span className="admin-foundation-stat__unit">개</span></p>
          </div>
          <div className="admin-foundation-stat">
            <p className="admin-foundation-stat__label">비활성 단체</p>
            <p className="admin-foundation-stat__value">{stats.inactive}<span className="admin-foundation-stat__unit">개</span></p>
          </div>
          <div className="admin-foundation-stat">
            <p className="admin-foundation-stat__label">신규 신청</p>
            <p className="admin-foundation-stat__value">{stats.newApplications}<span className="admin-foundation-stat__unit">개</span></p>
          </div>
        </div>
      </section>

      {/* 테이블 — 페이지 이동 시 이 영역만 갱신, DOM 구조 유지로 스크롤 위치 보존 */}
      <section className="admin-panel admin-panel--list admin-panel--spacious">
        <div className="admin-panel__header"><h2>단체 목록</h2></div>
        <FilterBar
          keyword={keyword}
          onKeywordChange={setKeyword}
          onSearch={() => { setPage(0); setAppliedKeyword(keyword); }}
          selects={[
            { key: "sort", value: sortOrder, onChange: (v) => { setSortOrder(v); setPage(0); }, options: [
              { value: "createdAt,DESC", label: "최신순" },
              { value: "createdAt,ASC", label: "오래된순" },
            ]},
            { key: "account", value: accountFilter, onChange: (v) => { setAccountFilter(v); setPage(0); }, options: accountOptions },
          ]}
        />
        <div style={{ opacity: loading ? 0.45 : 1, transition: "opacity 0.15s", pointerEvents: loading ? "none" : "auto" }}>
          <AdminTable
            columns={columns}
            rows={rows.map((r) => ({ ...r, _key: r.foundationNo }))}
            emptyText="단체가 없습니다."
          />
        </div>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </section>
    </>
  );
}

// ── 관리자 로그 패널 (활동 로그 전용) ─────────────────────────────────────────
function LogsHubPanel() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState("");
  const [logTargetType, setLogTargetType] = useState("");
  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const PAGE_SIZE = 10;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAdminJson("/logs", { page, size: PAGE_SIZE, actionType, targetType: logTargetType, keyword: appliedKeyword })
      .then((json) => { if (!cancelled) { setRows(json.content ?? []); setTotalPages(json.totalPages ?? 0); } })
      .catch((e) => { console.error("[AdminLog]", e); if (!cancelled) setRows([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, actionType, logTargetType, appliedKeyword]);

  const columns = [
    { key: "_no", label: "번호", width: "52px", render: (r, i) => <span style={{ color: "#94a3b8", fontSize: "12px" }}>{page * PAGE_SIZE + i + 1}</span> },
    { key: "actionType", label: "액션", width: "90px", render: (r) => <StatusBadge text={r.actionType} /> },
    { key: "targetType", label: "대상", width: "110px", render: (r) => <StatusBadge text={r.targetType} /> },
    { key: "description", label: "내용", render: (r) => <strong>{r.description}</strong> },
    { key: "adminName", label: "처리자", width: "80px" },
    { key: "createdAt", label: "처리일", width: "130px", render: (r) => formatDate(r.createdAt) },
    { key: "_action", label: "상세", width: "60px", render: (r) => {
      const pathMap = {
        FOUNDATION: `/admin/foundation/${r.targetNo}`,
        CAMPAIGN: `/admin/campaign/${r.targetNo}`,
        FINAL_REPORT: `/admin/report/${r.targetNo}`,
        USERS: `/admin/member/${r.targetNo}`,
      };
      const path = pathMap[r.targetType];
      return path
        ? <button type="button" className="admin-row-btn" onClick={(e) => { e.stopPropagation(); navigate(path); }}>상세</button>
        : null;
    }},
  ];

  const actionOptions = [
    { value: "", label: "전체 액션" }, { value: "APPROVE", label: "승인" },
    { value: "REJECT", label: "반려" }, { value: "DISABLE", label: "비활성화" }, { value: "ENABLE", label: "활성화" },
  ];
  const targetOptions = [
    { value: "", label: "전체 대상" }, { value: "FOUNDATION", label: "단체" },
    { value: "CAMPAIGN", label: "캠페인" }, { value: "FINAL_REPORT", label: "활동 보고서" },
  ];

  return (
    <section className="admin-panel admin-panel--list">
      <div className="admin-panel__header"><h2>관리자 활동 로그</h2></div>
      <FilterBar
        keyword={keyword}
        onKeywordChange={setKeyword}
        onSearch={() => { setPage(0); setAppliedKeyword(keyword); }}
        selects={[
          { key: "action", value: actionType, onChange: (v) => { setActionType(v); setPage(0); }, options: actionOptions },
          { key: "target", value: logTargetType, onChange: (v) => { setLogTargetType(v); setPage(0); }, options: targetOptions },
        ]}
      />
      {loading
        ? <p className="admin-empty-text">불러오는 중...</p>
        : <AdminTable columns={columns} rows={rows.map((r, i) => ({ ...r, _key: r.logNo ?? i }))} emptyText="로그가 없습니다." />
      }
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </section>
  );
}

// ── 지갑 정보 패널 (서버 지갑 + 트랜잭션) ─────────────────────────────────────
function WalletPanel() {
  const navigate = useNavigate();
  const [walletInfo, setWalletInfo]     = useState(null);
  const [txPage, setTxPage]             = useState(0);
  const [txRows, setTxRows]             = useState([]);
  const [txTotalPages, setTxTotalPages] = useState(0);
  const [txLoading, setTxLoading]       = useState(false);
  const PAGE_SIZE = 10;

  useEffect(() => {
    fetchAdminJson("/wallet").then(setWalletInfo).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setTxLoading(true);
    fetchAdminJson("/wallet/transactions", { page: txPage, size: PAGE_SIZE, sort: "createdAt,DESC" })
      .then((json) => { if (!cancelled) { setTxRows(json.content ?? []); setTxTotalPages(json.totalPages ?? 0); } })
      .catch(() => { if (!cancelled) setTxRows([]); })
      .finally(() => { if (!cancelled) setTxLoading(false); });
    return () => { cancelled = true; };
  }, [txPage]);

  const txColumns = [
    { key: "_no", label: "번호", width: "52px", render: (r, i) => <span style={{ color: "#94a3b8", fontSize: "12px" }}>{txPage * PAGE_SIZE + i + 1}</span> },
    { key: "eventType", label: "유형", width: "110px", render: (r) => <StatusBadge text={r.eventType ?? "-"} /> },
    { key: "status",    label: "상태", width: "90px",  render: (r) => <StatusBadge text={r.status ?? "-"} /> },
    { key: "amount",    label: "금액", width: "110px", render: (r) => r.amount != null ? `${Number(r.amount).toLocaleString()} GNT` : "-" },
    { key: "fromWalletAddress", label: "보내는 주소", render: (r) => <span style={{ fontSize: "11px", fontFamily: "monospace" }}>{r.fromWalletAddress ?? "-"}</span> },
    { key: "toWalletAddress",   label: "받는 주소",  render: (r) => <span style={{ fontSize: "11px", fontFamily: "monospace" }}>{r.toWalletAddress ?? "-"}</span> },
    { key: "sentAt", label: "전송일", width: "130px", render: (r) => formatDate(r.sentAt) },
  ];

  return (
    <>
      {walletInfo && (
        <section className="admin-panel" style={{ marginBottom: "16px", padding: "20px 24px" }}>
          <p style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 900, color: "#1a202c" }}>서버 지갑</p>
          <div style={{ display: "flex", gap: "40px", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8", fontWeight: 700 }}>지갑 주소</p>
              <p style={{ margin: "4px 0 0", fontSize: "12px", fontFamily: "monospace", fontWeight: 700, color: "#1a202c" }}>{walletInfo.walletAddress ?? "-"}</p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8", fontWeight: 700 }}>잔액</p>
              <p style={{ margin: "4px 0 0", fontSize: "22px", fontWeight: 900, color: "#FF8A65" }}>
                {walletInfo.balance != null ? `${Number(walletInfo.balance).toLocaleString()} GNT` : "-"}
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="admin-panel admin-panel--list">
        <div className="admin-panel__header">
          <h2>트랜잭션</h2>
          <button type="button" className="admin-detail-btn" onClick={() => navigate("/blockchain")}>대시보드로 바로가기</button>
        </div>
        {txLoading
          ? <p className="admin-empty-text">불러오는 중...</p>
          : <AdminTable columns={txColumns} rows={txRows.map((r) => ({ ...r, _key: r.transactionNo }))} emptyText="트랜잭션이 없습니다." />}
        <Pagination page={txPage} totalPages={txTotalPages} onChange={setTxPage} />
      </section>
    </>
  );
}

// ── 발송 내역 패널 (이메일 + 알림) ────────────────────────────────────────────
function SendHistoryPanel() {
  const [activeTab, setActiveTab] = useState("emails");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  // 이메일 필터
  const [templateType, setTemplateType] = useState("");

  // 알림 필터
  const [recipientType, setRecipientType] = useState("");
  const [isRead, setIsRead] = useState("");
  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");

  // 전체 공지 모달
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastContent, setBroadcastContent] = useState("");
  const [broadcastLoading, setBroadcastLoading] = useState(false);

  const PAGE_SIZE = 10;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const fetchPromise = activeTab === "emails"
      ? fetchAdminJson("/email-send-list", { page, size: PAGE_SIZE, sort: "createdAt,DESC", templateType })
      : fetchAdminJson("/notifications", {
          page, size: PAGE_SIZE, sort: "created_at,DESC",
          recipientType,
          ...(isRead !== "" ? { isRead } : {}),
          keyword: appliedKeyword,
        });

    fetchPromise
      .then((json) => { if (!cancelled) { setRows(json.content ?? []); setTotalPages(json.totalPages ?? 0); } })
      .catch((e) => { console.error("[SendHistory]", e); if (!cancelled) setRows([]); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [activeTab, page, templateType, recipientType, isRead, appliedKeyword]);

  const resetFilters = () => {
    setPage(0);
    setTemplateType("");
    setRecipientType("");
    setIsRead("");
    setKeyword("");
    setAppliedKeyword("");
  };

  const handleBroadcast = async () => {
    if (!broadcastContent.trim()) return;
    setBroadcastLoading(true);
    try {
      const res = await fetch("/admin-api/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("adminAccessToken")}` },
        body: JSON.stringify({ content: broadcastContent }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      window.alert(`전체 공지 발송 완료 (${data.sent}건)`);
      setBroadcastContent("");
      setBroadcastOpen(false);
    } catch {
      window.alert("발송에 실패했습니다.");
    } finally {
      setBroadcastLoading(false);
    }
  };

  const emailColumns = [
    { key: "_idx", label: "번호", width: "50px", render: (_, i) => page * PAGE_SIZE + i + 1 },
    { key: "title", label: "제목", render: (r) => <strong>{r.title}</strong> },
    { key: "recipientEmail", label: "수신자" },
    { key: "emailStatus", label: "상태", width: "80px", render: (r) => <StatusBadge text={r.emailStatus} /> },
    { key: "templateType", label: "템플릿", render: (r) => <span style={{ fontSize: "12px", color: "#64748b" }}>{r.templateType}</span> },
    { key: "sentAt", label: "발송일", width: "130px", render: (r) => formatDate(r.sentAt || r.createdAt) },
  ];

  const notifColumns = [
    { key: "_idx", label: "번호", width: "50px", render: (_, i) => page * PAGE_SIZE + i + 1 },
    { key: "content", label: "내용", render: (r) => <strong>{r.content}</strong> },
    { key: "recipientType", label: "수신자 유형", width: "110px", render: (r) => <StatusBadge text={r.recipientType} /> },
    { key: "notificationType", label: "알림 유형", width: "110px", render: (r) => <span style={{ fontSize: "12px", color: "#64748b" }}>{r.notificationType}</span> },
    { key: "isRead", label: "읽음 여부", width: "100px", render: (r) => <StatusBadge text={r.read ? "읽음" : "안읽음"} /> },
    { key: "createdAt", label: "발송일", width: "130px", render: (r) => formatDate(r.createdAt) },
  ];

  const templateOptions = [
    { value: "", label: "전체 템플릿" },
    { value: "ACCOUNT_APPROVED", label: "계정 승인" },
    { value: "ACCOUNT_REJECTED", label: "계정 반려" },
    { value: "FOUNDATION_INACTIVE_BATCH", label: "자동 비활성화" },
    { value: "FOUNDATION_DEACTIVATED_BY_ADMIN", label: "관리자 비활성화" },
  ];
  const recipientOptions = [
    { value: "", label: "전체 수신자" },
    { value: "USERS", label: "일반 사용자" },
    { value: "FOUNDATION", label: "재단" },
    { value: "BENEFICIARY", label: "수혜자" },
  ];
  const isReadOptions = [
    { value: "", label: "읽음 여부" },
    { value: "true", label: "읽음" },
    { value: "false", label: "안읽음" },
  ];

  return (
    <section className="admin-panel admin-panel--list">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <PanelTabs
          tabs={[{ key: "emails", label: "이메일 발송 내역" }, { key: "notifications", label: "알림 내역" }]}
          active={activeTab}
          onChange={(k) => { setActiveTab(k); resetFilters(); }}
        />
        {activeTab === "notifications" && (
          <button
            type="button"
            onClick={() => setBroadcastOpen(true)}
            style={{ marginRight: "16px", padding: "6px 14px", background: "transparent", color: "#111", border: "1px solid #e2e8f0", borderRadius: "6px", fontWeight: 700, fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap" }}
          >
            전체 공지 전송하기
          </button>
        )}
      </div>

      {activeTab === "emails" && (
        <FilterBar
          selects={[{ key: "template", value: templateType, onChange: (v) => { setTemplateType(v); setPage(0); }, options: templateOptions }]}
        />
      )}

      {activeTab === "notifications" && (
        <FilterBar
          keyword={keyword}
          onKeywordChange={setKeyword}
          onSearch={() => { setPage(0); setAppliedKeyword(keyword); }}
          selects={[
            { key: "recipient", value: recipientType, onChange: (v) => { setRecipientType(v); setPage(0); }, options: recipientOptions },
            { key: "isRead", value: isRead, onChange: (v) => { setIsRead(v); setPage(0); }, options: isReadOptions },
          ]}
        />
      )}

      {loading
        ? <p className="admin-empty-text">불러오는 중...</p>
        : <AdminTable
            columns={activeTab === "emails" ? emailColumns : notifColumns}
            rows={rows.map((r, i) => ({ ...r, _key: r.emailQueueNo ?? r.notificationNo ?? i }))}
            emptyText="내역이 없습니다."
          />
      }
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {broadcastOpen && (
        <div className="admin-modal-overlay" onClick={() => { setBroadcastOpen(false); setBroadcastContent(""); }}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h4>전체 공지 전송</h4>
            <p>활성 상태의 모든 회원에게 인앱 알림이 발송됩니다.</p>
            <textarea
              className="admin-modal-textarea"
              value={broadcastContent}
              onChange={(e) => setBroadcastContent(e.target.value)}
              placeholder="공지 내용을 입력하세요..."
              rows={4}
            />
            <div className="admin-modal-actions">
              <button type="button" onClick={() => { setBroadcastOpen(false); setBroadcastContent(""); }}>취소</button>
              <button
                type="button"
                onClick={handleBroadcast}
                disabled={broadcastLoading || !broadcastContent.trim()}
                style={{ background: "transparent", color: "#dc2626", fontWeight: 700, opacity: broadcastLoading || !broadcastContent.trim() ? 0.4 : 1 }}
              >
                {broadcastLoading ? "발송 중..." : "발송"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeKey = searchParams.get("tab") ?? "dashboard";
  const activeView = searchParams.get("view") ?? "";
  const [donationDays, setDonationDays] = useState(14);
  const [userDays, setUserDays] = useState(14);

  const adminProfile = useMemo(() => {
    try { return JSON.parse(window.localStorage.getItem("adminProfile") ?? "{}"); }
    catch { return {}; }
  }, []);

  const setActiveKey = (key) => {
    navigate(key === "dashboard" ? "/admin/dashboard" : `/admin/dashboard?tab=${key}`);
  };

  const renderContent = () => {
    if (activeKey === "dashboard") {
      return (
        <DashboardHome
          onNavigate={setActiveKey}
          navigate={navigate}
          donationDays={donationDays}
          userDays={userDays}
          onDonationDaysChange={setDonationDays}
          onUserDaysChange={setUserDays}
        />
      );
    }
    if (activeKey === "foundations" || activeKey === "foundations-approval") return <FoundationsPanel onOpenDetail={(no) => navigate(`/admin/foundation/${no}?from=approval`)} />;
    if (activeKey === "foundations-list") return <FoundationListPanel onOpenDetail={(no) => navigate(`/admin/foundation/${no}?from=list`)} />;
    if (activeKey === "campaigns" || activeKey === "campaigns-approval") return <CampaignsPanel onOpenDetail={(item) => navigate(`/admin/campaign/${item.campaignNo}?from=approval`, { state: { record: item } })} />;
    if (activeKey === "campaigns-list") return <CampaignListPanel onOpenDetail={(item) => navigate(`/admin/campaign/${item.campaignNo}?from=list`, { state: { record: item } })} />;
    if (activeKey === "reports" || activeKey === "reports-approval") return <ReportsPanel onOpenDetail={(item) => navigate(`/admin/report/${item.reportNo}?from=approval`, { state: { record: item } })} />;
    if (activeKey === "reports-list") return <ReportListPanel onOpenDetail={(item) => navigate(`/admin/report/${item.reportNo}?from=list`, { state: { record: item } })} />;
    if (activeKey === "inactive") return <InactivePanel onOpenDetail={(no) => navigate(`/admin/foundation/${no}?from=inactive`)} />;
    if (activeKey === "members") return <MembersPanel onOpenDetail={(r) => navigate(`/admin/member/${r.userNo}`)} />;
    if (activeKey === "requests") return <RequestsPanel onNavigate={(path) => navigate(path)} />;
    if (activeKey === "logs") return <LogsHubPanel />;
    if (activeKey === "send-history") return <SendHistoryPanel />;
    if (activeKey === "wallet") return <WalletPanel />;
    return null;
  };

  const pageTitle = PAGE_TITLES[activeKey] ?? "대시보드";

  return (
    <>
      <header className="admin-dashboard-topbar">
        <div className="admin-dashboard-topbar__title">
          <h1>{pageTitle}</h1>
        </div>
        <div className="admin-dashboard-topbar__profile">
          <div>
            <strong>{adminProfile?.name ?? "관리자"}</strong>
            <span>{adminProfile?.adminRole ?? "ADMIN"}</span>
          </div>
          <div className="admin-dashboard-topbar__avatar">{(adminProfile?.name ?? "A").slice(0, 1)}</div>
        </div>
      </header>
      <main className="admin-dashboard-content">{renderContent()}</main>
    </>
  );
}
