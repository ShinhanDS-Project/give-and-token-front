import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getAdminApiUrl, getAdminAuthHeaders } from "../util";
import "../css/AdminDashboardPage.css";

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("ko-KR");
}

function getPageMeta(kind) {
  if (kind === "campaign") return { title: "Campaign Detail", tab: "campaigns" };
  if (kind === "report") return { title: "Report Detail", tab: "reports" };
  if (kind === "log") return { title: "Activity Log Detail", tab: "logs" };
  if (kind === "request") return { title: "Request Detail", tab: "requests" };
  return { title: "Detail", tab: "dashboard" };
}

export default function AdminEventDetailPage({ kind = "detail" }) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const meta = getPageMeta(kind);
  const [campaignDetail, setCampaignDetail] = useState(null);
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [campaignError, setCampaignError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [actionResult, setActionResult] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [localStatus, setLocalStatus] = useState(null);

  const id = useMemo(() => {
    if (kind === "campaign") return params.campaignNo;
    if (kind === "report") return params.reportNo;
    if (kind === "log") return params.logNo;
    if (kind === "request") return params.requestNo;
    return params.id;
  }, [kind, params]);

  const record = location.state?.record ?? null;

  const approvalStatus = localStatus ?? record?.approvalStatus ?? "-";
  const isPending = approvalStatus === "PENDING";

  useEffect(() => {
    if (kind !== "campaign" || !id) return;

    let cancelled = false;

    async function loadCampaignDetail() {
      try {
        setCampaignLoading(true);
        setCampaignError("");

        const response = await fetch(`/api/foundation/campaigns/${id}/detail`, {
          method: "GET",
        });
        if (!response.ok) {
          const errorText = await response.text().catch(() => "");
          throw new Error(errorText || `Request failed (${response.status})`);
        }

        const data = await response.json();
        if (!cancelled) setCampaignDetail(data);
      } catch (error) {
        if (!cancelled) setCampaignError(error.message || "Campaign detail load failed.");
      } finally {
        if (!cancelled) setCampaignLoading(false);
      }
    }

    loadCampaignDetail();
    return () => {
      cancelled = true;
    };
  }, [kind, id]);

  const handleApprove = async (endpoint) => {
    try {
      setProcessing(true);
      setActionResult("");
      const response = await fetch(getAdminApiUrl(endpoint), {
        method: "PATCH",
        headers: getAdminAuthHeaders(),
      });
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || `Approve failed (${response.status})`);
      }
      setLocalStatus("APPROVED");
      setActionResult("승인되었습니다.");
    } catch (err) {
      setActionResult(err.message || "승인 처리 중 오류가 발생했습니다.");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (endpoint) => {
    if (!rejectReason.trim()) {
      window.alert("반려 사유를 입력해주세요.");
      return;
    }
    try {
      setProcessing(true);
      setActionResult("");
      const url = `${getAdminApiUrl(endpoint)}?reason=${encodeURIComponent(rejectReason.trim())}`;
      const response = await fetch(url, {
        method: "PATCH",
        headers: getAdminAuthHeaders(),
      });
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || `Reject failed (${response.status})`);
      }
      setLocalStatus("REJECTED");
      setActionResult("반려되었습니다.");
      setShowRejectModal(false);
      setRejectReason("");
    } catch (err) {
      setActionResult(err.message || "반려 처리 중 오류가 발생했습니다.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <header className="admin-dashboard-topbar">
        <div className="admin-dashboard-topbar__title">
          <button
            type="button"
            className="admin-dashboard-topbar__menu"
            onClick={() => navigate(`/admin/dashboard?tab=${meta.tab}`)}
          >
            <span />
            <span />
            <span />
          </button>
          <h1>{meta.title}</h1>
        </div>
      </header>

      <main className="admin-dashboard-content">
        <section className="admin-event-detail-page">
          <div className="admin-event-detail-grid">
            <article className="admin-event-detail-card">
              <h3>기본 정보</h3>
              <dl>
                <div>
                  <dt>ID</dt>
                  <dd>{id ?? "-"}</dd>
                </div>
                <div>
                  <dt>유형</dt>
                  <dd>{record?.targetType ?? kind.toUpperCase()}</dd>
                </div>
                <div>
                  <dt>승인 상태</dt>
                  <dd>
                    <span className={`admin-foundation-table__badge ${approvalStatus === "APPROVED" ? "green" : approvalStatus === "REJECTED" ? "red" : "blue"}`}>
                      {approvalStatus}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>생성일</dt>
                  <dd>{formatDate(record?.createdAt)}</dd>
                </div>
              </dl>
            </article>

            <article className="admin-event-detail-card">
              <h3>설명</h3>
              <p>{record?.description ?? record?.content ?? "상세 정보가 없습니다."}</p>
            </article>
          </div>

          {kind === "report" && record ? (
            <article className="admin-event-detail-card admin-event-detail-card--full">
              <h3>활동 보고서 상세</h3>
              <dl className="admin-event-detail-kv">
                <div>
                  <dt>제목</dt>
                  <dd>{record.title ?? "-"}</dd>
                </div>
                <div>
                  <dt>캠페인 번호</dt>
                  <dd>{record.campaignNo ?? "-"}</dd>
                </div>
                <div>
                  <dt>사용 목적</dt>
                  <dd>{record.usagePurpose ?? "-"}</dd>
                </div>
                <div>
                  <dt>승인 상태</dt>
                  <dd>{approvalStatus}</dd>
                </div>
                <div>
                  <dt>생성일</dt>
                  <dd>{formatDate(record.createdAt)}</dd>
                </div>
                {record.rejectReason ? (
                  <div>
                    <dt>반려 사유</dt>
                    <dd>{record.rejectReason}</dd>
                  </div>
                ) : null}
              </dl>

              {record.content ? (
                <div className="admin-event-detail-content">
                  <h4>보고서 내용</h4>
                  <div className="admin-event-detail-content__body">{record.content}</div>
                </div>
              ) : null}

              {record.images?.length ? (
                <div className="admin-event-detail-images">
                  <h4>첨부 이미지</h4>
                  <div className="admin-event-detail-images__grid">
                    {record.images.map((img, idx) => (
                      <a
                        key={img.imageNo ?? idx}
                        href={img.imagePath ?? img.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-event-detail-images__item"
                      >
                        <img
                          src={img.imagePath ?? img.path}
                          alt={`첨부 ${idx + 1}`}
                          referrerPolicy="no-referrer"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}

              {isPending ? (
                <div className="admin-event-detail-actions">
                  <button
                    type="button"
                    className="admin-event-detail-actions__approve"
                    disabled={processing}
                    onClick={() => handleApprove(`/reports/${id}/approve`)}
                  >
                    {processing ? "처리 중..." : "승인"}
                  </button>
                  <button
                    type="button"
                    className="admin-event-detail-actions__reject"
                    disabled={processing}
                    onClick={() => setShowRejectModal(true)}
                  >
                    반려
                  </button>
                </div>
              ) : null}

              {actionResult ? (
                <p className="admin-event-detail-action-result">{actionResult}</p>
              ) : null}
            </article>
          ) : null}

          {kind === "campaign" ? (
            <article className="admin-event-detail-card admin-event-detail-card--full">
              <h3>Campaign Detail</h3>
              {campaignLoading ? <p>Loading campaign detail...</p> : null}
              {campaignError ? <p>{campaignError}</p> : null}
              {!campaignLoading && !campaignError && campaignDetail ? (
                <dl className="admin-event-detail-kv">
                  <div>
                    <dt>Title</dt>
                    <dd>{campaignDetail.title ?? "-"}</dd>
                  </div>
                  <div>
                    <dt>Category</dt>
                    <dd>{campaignDetail.category ?? "-"}</dd>
                  </div>
                  <div>
                    <dt>Goal Amount</dt>
                    <dd>{campaignDetail.targetAmount ?? "-"}</dd>
                  </div>
                  <div>
                    <dt>Raised Amount</dt>
                    <dd>{campaignDetail.currentAmount ?? "-"}</dd>
                  </div>
                  <div>
                    <dt>Approval Status</dt>
                    <dd>{campaignDetail.approvalStatus ?? "-"}</dd>
                  </div>
                  <div>
                    <dt>Campaign Status</dt>
                    <dd>{campaignDetail.campaignStatus ?? "-"}</dd>
                  </div>
                  <div>
                    <dt>Start At</dt>
                    <dd>{formatDate(campaignDetail.startAt)}</dd>
                  </div>
                  <div>
                    <dt>End At</dt>
                    <dd>{formatDate(campaignDetail.endAt)}</dd>
                  </div>
                  <div>
                    <dt>Foundation</dt>
                    <dd>{campaignDetail.foundation?.foundationName ?? record?.foundationName ?? "-"}</dd>
                  </div>
                </dl>
              ) : null}

              {isPending ? (
                <div className="admin-event-detail-actions">
                  <button
                    type="button"
                    className="admin-event-detail-actions__approve"
                    disabled={processing}
                    onClick={() => handleApprove(`/campaigns/${id}/approve`)}
                  >
                    {processing ? "처리 중..." : "승인"}
                  </button>
                  <button
                    type="button"
                    className="admin-event-detail-actions__reject"
                    disabled={processing}
                    onClick={() => setShowRejectModal(true)}
                  >
                    반려
                  </button>
                </div>
              ) : null}

              {actionResult ? (
                <p className="admin-event-detail-action-result">{actionResult}</p>
              ) : null}
            </article>
          ) : null}

          {kind === "log" && record ? (
            <article className="admin-event-detail-card admin-event-detail-card--full">
              <h3>활동 로그 상세</h3>
              <dl className="admin-event-detail-kv">
                <div>
                  <dt>로그 번호</dt>
                  <dd>{record.logNo ?? id ?? "-"}</dd>
                </div>
                <div>
                  <dt>액션 유형</dt>
                  <dd>
                    <span className={`admin-foundation-table__badge ${record.actionType === "APPROVE" ? "green" : record.actionType === "REJECT" ? "red" : "blue"}`}>
                      {record.actionType ?? "-"}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>대상 유형</dt>
                  <dd>{record.targetType ?? "-"}</dd>
                </div>
                <div>
                  <dt>대상 번호</dt>
                  <dd>{record.targetNo ?? "-"}</dd>
                </div>
                <div>
                  <dt>관리자</dt>
                  <dd>{record.adminName || record.adminId || "-"}</dd>
                </div>
                <div>
                  <dt>일시</dt>
                  <dd>{formatDate(record.createdAt)}</dd>
                </div>
              </dl>

              {record.description ? (
                <div className="admin-event-detail-content">
                  <h4>설명</h4>
                  <div className="admin-event-detail-content__body">{record.description}</div>
                </div>
              ) : null}

              {record.targetType && record.targetNo ? (
                <div className="admin-event-detail-actions">
                  <button
                    type="button"
                    className="admin-event-detail-actions__approve"
                    onClick={() => {
                      const type = String(record.targetType).toUpperCase();
                      if (type === "FOUNDATION") navigate(`/admin/foundation/${record.targetNo}`);
                      else if (type === "CAMPAIGN") navigate(`/admin/campaign/${record.targetNo}`);
                      else if (type === "FINAL_REPORT" || type === "REPORT") navigate(`/admin/report/${record.targetNo}`);
                      else navigate(`/admin/dashboard?tab=logs`);
                    }}
                  >
                    대상 상세보기
                  </button>
                </div>
              ) : null}
            </article>
          ) : null}

          {record && kind !== "report" && kind !== "campaign" && kind !== "log" ? (
            <article className="admin-event-detail-card admin-event-detail-card--full">
              <h3>Raw Payload</h3>
              <pre>{JSON.stringify(record, null, 2)}</pre>
            </article>
          ) : null}
        </section>
      </main>

      {showRejectModal ? (
        <div className="admin-modal-overlay" role="dialog" aria-modal="true">
          <div className="admin-modal">
            <h4>반려 사유 입력</h4>
            <textarea
              className="admin-modal__textarea"
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="반려 사유를 입력해주세요..."
            />
            <div className="admin-modal-actions">
              <button type="button" onClick={() => setShowRejectModal(false)} disabled={processing}>
                취소
              </button>
              <button
                type="button"
                className="danger"
                disabled={processing}
                onClick={() => {
                  if (kind === "report") handleReject(`/reports/${id}/reject`);
                  else if (kind === "campaign") handleReject(`/campaigns/${id}/reject`);
                }}
              >
                {processing ? "처리 중..." : "반려"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
