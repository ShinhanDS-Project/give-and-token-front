import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { fetchAdminJson, getAdminApiUrl, getAdminAuthHeaders } from "../util";
import "../css/AdminDashboardPage.css";

function formatDate(v) {
  if (!v) return "-";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString("ko-KR");
}

const APPROVAL_LABEL = { APPROVED: "승인됨", PENDING: "검토중", REJECTED: "반려됨" };
const APPROVAL_COLOR = { APPROVED: "#FF8A65", PENDING: "#d97706", REJECTED: "#dc2626" };

const REPORT_ERROR_MSG = {
  REPORT_001: "존재하지 않는 활동 보고서입니다.",
  REPORT_002: "이미 처리된 보고서입니다.",
};

async function parseErrorMessage(res) {
  try {
    const body = await res.json();
    return REPORT_ERROR_MSG[body.code] ?? body.message ?? `오류 (${res.status})`;
  } catch {
    return `오류 (${res.status})`;
  }
}

function DetailRow({ label, children }) {
  return (
    <div className="acd-detail__row">
      <span className="acd-detail__label">{label}</span>
      <span className="acd-detail__value">{children ?? "-"}</span>
    </div>
  );
}

export default function AdminReportDetailPage() {
  const navigate      = useNavigate();
  const { reportNo }  = useParams();

  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [detail, setDetail]             = useState(null);
  const [localStatus, setLocalStatus]   = useState(null);
  const [processing, setProcessing]     = useState(false);
  const [actionResult, setActionResult] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchAdminJson(`/reports/${reportNo}`)
      .then((data) => { if (!cancelled) setDetail(data); })
      .catch((err) => { if (!cancelled) setError(err.message || "로드 실패"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reportNo]);

  const approvalStatus = localStatus ?? detail?.approvalStatus;
  const isPending = approvalStatus === "PENDING";

  const handleApprove = async () => {
    try {
      setProcessing(true); setActionResult("");
      const res = await fetch(getAdminApiUrl(`/reports/${reportNo}/approve`), {
        method: "PATCH", headers: getAdminAuthHeaders(),
      });
      if (!res.ok) { setActionResult(await parseErrorMessage(res)); return; }
      setLocalStatus("APPROVED");
      setActionResult("승인되었습니다.");
    } catch { setActionResult("네트워크 오류가 발생했습니다."); }
    finally { setProcessing(false); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { alert("반려 사유를 입력해주세요."); return; }
    try {
      setProcessing(true); setActionResult("");
      const res = await fetch(
        `${getAdminApiUrl(`/reports/${reportNo}/reject`)}?reason=${encodeURIComponent(rejectReason.trim())}`,
        { method: "PATCH", headers: getAdminAuthHeaders() }
      );
      if (!res.ok) { setActionResult(await parseErrorMessage(res)); return; }
      setLocalStatus("REJECTED");
      setActionResult("반려되었습니다.");
      setShowRejectModal(false); setRejectReason("");
    } catch { setActionResult("네트워크 오류가 발생했습니다."); }
    finally { setProcessing(false); }
  };

  return (
    <>
      <header className="admin-dashboard-topbar">
        <div className="admin-dashboard-topbar__title">
          <button type="button" className="admin-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
          </button>
          <h1>보고서 상세</h1>
        </div>
      </header>

      <main className="admin-dashboard-content">
        {loading && <p className="admin-dashboard-empty-text">불러오는 중...</p>}
        {error   && <p className="admin-dashboard-empty-text">{error}</p>}

        {!loading && !error && detail && (
          <div className="ard-layout">

            {/* ── 좌(4): 다크 헤더 카드 ── */}
            <section className="admin-dashboard-panel acd-profile">
              <div className="acd-profile__fallback">
                {(detail.title || "R").slice(0, 1)}
              </div>
              <div className="acd-profile__overlay">
                <span className="acd-profile__category">
                  {APPROVAL_LABEL[approvalStatus] ?? approvalStatus ?? "-"}
                </span>
                <h2 className="acd-profile__title">{detail.title || "-"}</h2>
                <p className="acd-profile__period">캠페인 #{detail.campaignNo ?? "-"}</p>
              </div>
            </section>

            {/* ── 우(6): 상세정보 + 승인 관리 ── */}
            <section className="admin-dashboard-panel acd-detail">
              <DetailRow label="승인 상태">
                <strong style={{ color: APPROVAL_COLOR[approvalStatus] }}>
                  {APPROVAL_LABEL[approvalStatus] ?? approvalStatus ?? "-"}
                </strong>
              </DetailRow>
              <DetailRow label="캠페인 번호">
                {detail.campaignNo ? `#${detail.campaignNo}` : "-"}
              </DetailRow>
              <DetailRow label="사용 목적">{detail.usagePurpose}</DetailRow>
              <DetailRow label="제출일">{formatDate(detail.createdAt)}</DetailRow>
              {detail.rejectReason && (
                <DetailRow label="반려 사유">
                  <span style={{ color: "#dc2626" }}>{detail.rejectReason}</span>
                </DetailRow>
              )}

              {/* 승인·반려 버튼 */}
              {isPending && (
                <div style={{ display: "flex", gap: "8px", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #f0f2f7" }}>
                  <button type="button" className="afd-action-btn afd-action-btn--approve"
                    style={{ flex: 1 }} disabled={processing} onClick={handleApprove}>
                    {processing ? "처리 중..." : "승인"}
                  </button>
                  <button type="button" className="afd-action-btn afd-action-btn--reject"
                    style={{ flex: 1 }} disabled={processing} onClick={() => setShowRejectModal(true)}>
                    반려
                  </button>
                </div>
              )}
              {actionResult && (
                <p style={{ marginTop: "10px", fontSize: "13px", fontWeight: 700,
                  color: approvalStatus === "APPROVED" ? "#FF8A65" : "#dc2626" }}>
                  {actionResult}
                </p>
              )}
            </section>

            {/* ── 하단 전체: 보고서 내용 + 첨부 이미지 ── */}
            <section className="admin-dashboard-panel acd-full" style={{ gridArea: "full" }}>
              <h3 className="acd-full__heading">보고서 내용</h3>
              <p className="acd-full__desc">{detail.content || "내용이 없습니다."}</p>
              {detail.images?.length > 0 && (
                <>
                  <h3 className="acd-full__heading" style={{ marginTop: "20px" }}>첨부 이미지</h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {detail.images.map((img, idx) => (
                      <a key={img.imgStoredName ?? idx} href={img.imgPath} target="_blank" rel="noopener noreferrer">
                        <img src={img.imgPath} alt={img.imgOrgName ?? `첨부 ${idx + 1}`}
                          style={{ width: "180px", height: "180px", objectFit: "cover", borderRadius: "8px", display: "block" }} />
                      </a>
                    ))}
                  </div>
                </>
              )}
            </section>

          </div>
        )}
      </main>

      {showRejectModal && (
        <div className="admin-modal-overlay" role="dialog" aria-modal="true">
          <div className="admin-modal">
            <h4>반려 사유 입력</h4>
            <textarea className="admin-modal__textarea" rows={4} value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)} placeholder="반려 사유를 입력해주세요..." />
            <div className="admin-modal-actions">
              <button type="button" onClick={() => setShowRejectModal(false)} disabled={processing}>취소</button>
              <button type="button" className="danger" disabled={processing} onClick={handleReject}>
                {processing ? "처리 중..." : "반려"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
