import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getAdminApiUrl, getAdminAuthHeaders } from "../util";
import "../css/AdminDashboardPage.css";

function formatCurrency(value) {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return "₩0";
  return new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 }).format(num);
}

function formatNumber(value) {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? new Intl.NumberFormat("ko-KR").format(num) : "0";
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("ko-KR");
}

function formatPhone(value) {
  if (!value) return "-";
  const d = String(value).replace(/\D/g, "");
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) {
    if (d.startsWith("02")) return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  }
  if (d.length === 9 && d.startsWith("02")) return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`;
  return value;
}

function normalizePageContent(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.content)) return payload.content;
  return [];
}

const REVIEW_LABEL = { ILLEGAL: "불법단체", SIMILAR: "유사단체", CLEAN: "이상없음", APPROVED: "승인됨", REJECTED: "반려됨" };
const REVIEW_COLOR = { ILLEGAL: "#dc2626", SIMILAR: "#d97706", CLEAN: "#16a34a", APPROVED: "#2563eb", REJECTED: "#64748b" };
const ACCOUNT_LABEL = { ACTIVE: "활성", INACTIVE: "비활성", PRE_REGISTERED: "신규 신청" };
const ACCOUNT_COLOR = { ACTIVE: "#16a34a", INACTIVE: "#64748b", PRE_REGISTERED: "#d97706" };

export default function AdminFoundationDetailPage() {
  const navigate = useNavigate();
  const { foundationNo } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [processingAction, setProcessingAction] = useState("");
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReasonInput, setRejectReasonInput] = useState("");

  const [detail, setDetail] = useState(null);
  const [wallet, setWallet] = useState({});
  const [campaigns, setCampaigns] = useState([]);
  const [illegalCheck, setIllegalCheck] = useState(null);
  const [activeTab, setActiveTab] = useState("campaigns");

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      try {
        setLoading(true);
        setError("");

        const [detailRes, walletRes, campaignRes, illegalRes] = await Promise.all([
          fetch(getAdminApiUrl(`/foundation/${foundationNo}`), { method: "GET", headers: getAdminAuthHeaders() }),
          fetch(`/api/foundation/${foundationNo}/wallet`, { method: "GET", headers: { Accept: "application/json" } }),
          fetch(`/api/foundation/${foundationNo}/campaigns?page=0&size=100`, { method: "GET", headers: { Accept: "application/json" } }),
          fetch(getAdminApiUrl(`/foundation/${foundationNo}/illegal-check`), { method: "GET", headers: getAdminAuthHeaders() }),
        ]);

        if (!detailRes.ok) {
          const text = await detailRes.text().catch(() => "");
          throw new Error(text || `상세 조회 실패 (${detailRes.status})`);
        }

        const detailPayload = await detailRes.json();
        const walletPayload = walletRes.ok ? await walletRes.json().catch(() => ({})) : {};
        const campaignPayload = campaignRes.ok ? await campaignRes.json().catch(() => ({})) : {};
        const illegalPayload = illegalRes.ok ? await illegalRes.json().catch(() => null) : null;

        if (cancelled) return;

        setDetail(detailPayload);
        setWallet(walletPayload ?? {});
        setCampaigns(normalizePageContent(campaignPayload));
        setIllegalCheck(illegalPayload);
      } catch (err) {
        if (!cancelled) setError(err.message || "단체 상세 정보를 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAll();
    return () => { cancelled = true; };
  }, [foundationNo]);

  const activitySummary = useMemo(() => {
    const now = Date.now();
    const ongoingCount = campaigns.filter((item) => {
      if (!item?.endAt) return true;
      const endAt = new Date(item.endAt).getTime();
      return Number.isFinite(endAt) ? endAt >= now : true;
    }).length;
    const totalCurrent = campaigns.reduce((s, i) => s + Number(i?.currentAmount ?? 0), 0);
    const totalTarget = campaigns.reduce((s, i) => s + Number(i?.targetAmount ?? 0), 0);
    return {
      campaignCount: campaigns.length,
      ongoingCount,
      totalCurrent,
      totalTarget,
      achievementRate: totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0,
    };
  }, [campaigns]);

  const isActive = detail?.accountStatus === "ACTIVE";
  const isInactiveApproved = detail?.accountStatus === "INACTIVE" && detail?.reviewStatus === "APPROVED";
  const canReview =
    detail?.accountStatus === "PRE_REGISTERED" &&
    detail?.reviewStatus !== "APPROVED" &&
    detail?.reviewStatus !== "REJECTED";

  const hasIllegalData =
    illegalCheck && (illegalCheck.exactMatch || (illegalCheck.similarFoundations?.length > 0));

  const handleApprove = async () => {
    try {
      setProcessing(true); setProcessingAction("approve");
      const res = await fetch(getAdminApiUrl(`/foundation/${foundationNo}/approve`), { method: "PATCH", headers: getAdminAuthHeaders() });
      if (!res.ok) throw new Error((await res.text().catch(() => "")) || "승인 요청에 실패했습니다.");
      setDetail((p) => ({ ...p, reviewStatus: "APPROVED", accountStatus: "ACTIVE" }));
      window.alert("단체가 승인되었습니다.");
    } catch (err) {
      window.alert(err.message || "단체 승인에 실패했습니다.");
    } finally { setProcessing(false); setProcessingAction(""); }
  };

  const handleReject = async () => {
    const reason = rejectReasonInput.trim();
    if (!reason) { window.alert("반려 사유를 입력해주세요."); return; }
    try {
      setProcessing(true); setProcessingAction("reject");
      const res = await fetch(
        getAdminApiUrl(`/foundation/${foundationNo}/reject?reason=${encodeURIComponent(reason)}`),
        { method: "PATCH", headers: getAdminAuthHeaders({ "Content-Type": "application/json" }), body: JSON.stringify({ reason }) },
      );
      if (!res.ok) throw new Error((await res.text().catch(() => "")) || "반려 요청에 실패했습니다.");
      setDetail((p) => ({ ...p, reviewStatus: "REJECTED", accountStatus: "INACTIVE" }));
      setShowRejectModal(false); setRejectReasonInput("");
      window.alert("단체가 반려되었습니다.");
    } catch (err) {
      window.alert(err.message || "단체 반려에 실패했습니다.");
    } finally { setProcessing(false); setProcessingAction(""); }
  };

  const handleActivate = async () => {
    try {
      setProcessing(true); setProcessingAction("activate");
      const res = await fetch(getAdminApiUrl(`/foundation/${foundationNo}/activate`), { method: "PATCH", headers: getAdminAuthHeaders() });
      if (!res.ok) throw new Error((await res.text().catch(() => "")) || "활성화 요청에 실패했습니다.");
      setDetail((p) => ({ ...p, accountStatus: "ACTIVE" }));
      window.alert("단체가 활성화되었습니다.");
    } catch (err) {
      window.alert(err.message || "단체 활성화에 실패했습니다.");
    } finally { setProcessing(false); setProcessingAction(""); }
  };

  const handleDeactivate = async () => {
    try {
      setProcessing(true); setProcessingAction("deactivate");
      const res = await fetch(getAdminApiUrl(`/foundation/${foundationNo}/deactivate`), { method: "PATCH", headers: getAdminAuthHeaders() });
      if (!res.ok) throw new Error((await res.text().catch(() => "")) || "비활성화 요청에 실패했습니다.");
      setDetail((p) => ({ ...p, accountStatus: "INACTIVE" }));
      setShowDeactivateModal(false);
    } catch (err) {
      window.alert(err.message || "단체 비활성화에 실패했습니다.");
    } finally { setProcessing(false); setProcessingAction(""); }
  };

  return (
    <>
      <header className="admin-dashboard-topbar">
        <div className="admin-dashboard-topbar__title">
          <button type="button" className="admin-dashboard-topbar__menu" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} color="#718096" />
          </button>
          <h1>단체 상세</h1>
        </div>
      </header>

      <main className="admin-dashboard-content">
        {loading && <p className="admin-dashboard-empty-text">상세 정보를 불러오는 중...</p>}
        {error && <p className="admin-dashboard-empty-text">{error}</p>}

        {!loading && !error && detail && (
          <div className="afd-layout">

            {/* 프로필 */}
            <section className="admin-dashboard-panel afd-profile">
              <div className="afd-profile__body">
                {detail.profilePath ? (
                  <img src={detail.profilePath} alt="" className="afd-avatar" />
                ) : (
                  <div className="afd-avatar afd-avatar--fallback">
                    {(detail.foundationName || "G").slice(0, 1)}
                  </div>
                )}
                <div className="afd-profile__info">
                  <h2 className="afd-profile__name">{detail.foundationName || "-"}</h2>
                  <p className="afd-profile__email">{detail.foundationEmail || "-"}</p>
                  <div className="afd-profile__rows">
                    {[
                      { label: "대표자",    value: detail.representativeName || "-" },
                      { label: "사업자 번호", value: detail.businessRegistrationNumber || "-" },
                      { label: "연락처",    value: formatPhone(detail.contactPhone) },
                      { label: "단체 유형",  value: detail.foundationType || "-" },
                      { label: "단체 소개",  value: detail.description || "-", desc: true },
                    ].map(({ label, value, desc }) => (
                      <div key={label} className={`afd-profile__row${desc ? " afd-profile__row--desc" : ""}`}>
                        <span>{label}</span>
                        <p>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* 탭 */}
            <section className="admin-dashboard-panel afd-tabs-section" style={{ padding: 0 }}>
                <div className="afd-tabs">
                  <button
                    type="button"
                    className={`afd-tab ${activeTab === "campaigns" ? "is-active" : ""}`}
                    onClick={() => setActiveTab("campaigns")}
                  >
                    캠페인 현황
                  </button>
                  <button
                    type="button"
                    className={`afd-tab ${activeTab === "activity" ? "is-active" : ""}`}
                    onClick={() => setActiveTab("activity")}
                  >
                    플랫폼 활동
                  </button>
                </div>

                <div className="afd-tab-content">
                  {activeTab === "campaigns" && (
                    <div className="afd-campaign-list">
                      {campaigns.length ? campaigns.slice(0, 8).map((c) => (
                        <div key={c.campaignNo} className="afd-campaign-item">
                          <strong>{c.title || "-"}</strong>
                          <p>{formatCurrency(c.currentAmount)} / {formatCurrency(c.targetAmount)}</p>
                          <span>마감: {formatDate(c.endAt)}</span>
                        </div>
                      )) : (
                        <p className="admin-dashboard-empty-text">캠페인 데이터가 없습니다.</p>
                      )}
                    </div>
                  )}

                  {activeTab === "activity" && (
                    <div className="afd-activity-rows">
                      {[
                        { label: "지갑 주소",    value: wallet?.walletAddress || "-" },
                        { label: "지갑 잔액",    value: formatCurrency(wallet?.balance) },
                        { label: "전체 캠페인",  value: formatNumber(activitySummary.campaignCount) },
                        { label: "진행 중",      value: formatNumber(activitySummary.ongoingCount) },
                        { label: "모금액",       value: formatCurrency(activitySummary.totalCurrent) },
                        { label: "목표금액",     value: formatCurrency(activitySummary.totalTarget) },
                        { label: "달성률",       value: `${activitySummary.achievementRate.toFixed(1)}%` },
                      ].map(({ label, value }) => (
                        <div key={label} className="afd-activity-row">
                          <span>{label}</span>
                          <strong>{value}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
            </section>

            {/* ── 오른쪽: 상태 + 불법 검사 + 액션 ── */}
            <div className="afd-sidebar">
              <section className="admin-dashboard-panel afd-status-card">

                {/* 상태 표시 */}
                <div className="afd-status-section">
                  <div className="afd-status-row">
                    <span>검토 상태</span>
                    <strong style={{ color: REVIEW_COLOR[detail.reviewStatus] ?? "#374151" }}>
                      {REVIEW_LABEL[detail.reviewStatus] ?? detail.reviewStatus ?? "-"}
                    </strong>
                  </div>
                  <div className="afd-status-row">
                    <span>계정 상태</span>
                    <strong style={{ color: ACCOUNT_COLOR[detail.accountStatus] ?? "#374151" }}>
                      {ACCOUNT_LABEL[detail.accountStatus] ?? detail.accountStatus ?? "-"}
                    </strong>
                  </div>
                </div>

                {/* 불법/유사 단체 검사 결과 */}
                {hasIllegalData && (
                  <div className="afd-illegal-box">
                    <p className="afd-illegal-box__title">
                      {illegalCheck.exactMatch ? "⚠ 불법단체 일치" : "유사단체 감지됨"}
                    </p>

                    {[
                      ...(illegalCheck.exactMatch && illegalCheck.matchedFoundation ? [illegalCheck.matchedFoundation] : []),
                      ...(illegalCheck.similarFoundations ?? []),
                    ].map((f, i) => (
                      <div key={i} className="afd-illegal-rows">
                        <div className="afd-illegal-row"><span>단체명</span><span>{f.name}</span></div>
                        <div className="afd-illegal-row"><span>대표자</span><span>{f.representative}</span></div>
                        <div className="afd-illegal-row"><span>사유</span><span>{f.reason}</span></div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 승인 / 반려 — 아래 배치 */}
                {canReview && (
                  <div className="afd-action-group" style={{ marginTop: "auto" }}>
                    <button
                      type="button"
                      className="afd-btn afd-btn--approve"
                      onClick={handleApprove}
                      disabled={processing}
                    >
                      {processing && processingAction === "approve" ? "처리 중..." : "단체 승인"}
                    </button>
                    <button
                      type="button"
                      className="afd-btn afd-btn--reject"
                      onClick={() => setShowRejectModal(true)}
                      disabled={processing}
                    >
                      단체 반려
                    </button>
                  </div>
                )}


                {/* 활성화 — 승인된 단체가 비활성 상태일 때 */}
                {isInactiveApproved && (
                  <div className="afd-deactivate-wrap">
                    <button
                      type="button"
                      className="afd-btn afd-btn--approve"
                      onClick={handleActivate}
                      disabled={processing}
                    >
                      {processing && processingAction === "activate" ? "처리 중..." : "단체 활성화"}
                    </button>
                  </div>
                )}

                {/* 비활성화 — 활성 단체일 때만 표시 */}
                {isActive && (
                  <div className="afd-deactivate-wrap">
                    <button
                      type="button"
                      className="afd-btn afd-btn--danger"
                      onClick={() => setShowDeactivateModal(true)}
                    >
                      단체 비활성화
                    </button>
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </main>

      {showRejectModal && (
        <div className="admin-modal-overlay" role="dialog" aria-modal="true">
          <div className="admin-modal">
            <h4>단체 반려</h4>
            <p>반려 사유를 입력한 후 요청하세요.</p>
            <textarea
              className="admin-modal-textarea"
              value={rejectReasonInput}
              onChange={(e) => setRejectReasonInput(e.target.value)}
              placeholder="반려 사유를 입력하세요"
              disabled={processing}
            />
            <div className="admin-modal-actions">
              <button type="button" onClick={() => setShowRejectModal(false)} disabled={processing}>취소</button>
              <button type="button" className="danger" onClick={handleReject} disabled={processing || !rejectReasonInput.trim()}>
                {processing && processingAction === "reject" ? "처리 중..." : "반려"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeactivateModal && (
        <div className="admin-modal-overlay" role="dialog" aria-modal="true">
          <div className="admin-modal">
            <h4>단체 비활성화</h4>
            <p>승인된 단체를 비활성화하시겠습니까?</p>
            <div className="admin-modal-actions">
              <button type="button" onClick={() => setShowDeactivateModal(false)} disabled={processing}>취소</button>
              <button type="button" className="danger" onClick={handleDeactivate} disabled={processing}>
                {processing ? "처리 중..." : "비활성화"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
