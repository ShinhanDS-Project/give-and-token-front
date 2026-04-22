import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { fetchAdminJson, getAdminApiUrl, getAdminAuthHeaders } from "../util";
import "../css/AdminDashboardPage.css";

function formatCurrency(v) {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return "-";
  return new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 }).format(n);
}

function formatDate(v) {
  if (!v) return "-";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString("ko-KR");
}

function formatPhone(v) {
  if (!v) return "-";
  const d = String(v).replace(/\D/g, "");
  if (d.length === 11) return `${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7)}`;
  if (d.length === 10) return d.startsWith("02") ? `${d.slice(0,2)}-${d.slice(2,6)}-${d.slice(6)}` : `${d.slice(0,3)}-${d.slice(3,6)}-${d.slice(6)}`;
  return v;
}

const APPROVAL_LABEL = { APPROVED: "승인됨", PENDING: "대기", REJECTED: "반려됨" };
const APPROVAL_COLOR = { APPROVED: "#FF8A65", PENDING: "#d97706", REJECTED: "#dc2626" };
const CAMPAIGN_STATUS_LABEL = {
  PENDING: "대기", RECRUITING: "모집중", ACTIVE: "진행중",
  ENDED: "마감", SETTLED: "정산중", COMPLETED: "완료", CANCELLED: "취소",
};
const CAMPAIGN_STATUS_COLOR = {
  PENDING: "#94a3b8", RECRUITING: "#FF8A65", ACTIVE: "#16a34a",
  ENDED: "#64748b", SETTLED: "#d97706", COMPLETED: "#7c3aed", CANCELLED: "#dc2626",
};

function DetailRow({ label, children }) {
  return (
    <div className="acd-detail__row">
      <span className="acd-detail__label">{label}</span>
      <span className="acd-detail__value">{children ?? "-"}</span>
    </div>
  );
}

export default function AdminCampaignDetailPage() {
  const navigate = useNavigate();
  const { campaignNo } = useParams();

  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [detail, setDetail]           = useState(null);
  const [foundation, setFoundation]   = useState(null);
  const [beneficiary, setBeneficiary] = useState(null);
  const [activeTab, setActiveTab]     = useState("foundation");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    fetch(getAdminApiUrl(`/campaigns/${campaignNo}/detail`), {
      headers: getAdminAuthHeaders({ Accept: "application/json" }),
    })
      .then((res) => { if (!res.ok) throw new Error(`로드 실패 (${res.status})`); return res.json(); })
      .then((data) => {
        if (cancelled) return;
        setDetail(data);
        if (data.foundationNo) {
          fetchAdminJson(`/foundation/${data.foundationNo}`)
            .then((f) => { if (!cancelled) setFoundation(f); })
            .catch(() => {});
        }
        if (data.beneficiaryNo) {
          fetchAdminJson(`/beneficiary/${data.beneficiaryNo}`)
            .then((b) => { if (!cancelled) setBeneficiary(b); })
            .catch(() => {});
        }

        // usePlans는 admin DTO에 포함되어 있지 않으므로 공개 엔드포인트에서 별도 조회
        fetch(`/api/foundation/campaigns/${campaignNo}/detail`, {
          headers: { Accept: "application/json" },
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((pub) => {
            if (cancelled || !pub?.usePlans) return;
            setDetail((prev) => (prev ? { ...prev, usePlans: pub.usePlans } : prev));
          })
          .catch(() => {});
      })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [campaignNo]);

  const categoryLabel = detail?.category?.label ?? detail?.category ?? null;

  return (
    <>
      <header className="admin-dashboard-topbar">
        <div className="admin-dashboard-topbar__title">
          <button type="button" className="admin-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
          </button>
          <h1>캠페인 상세</h1>
        </div>
      </header>

      <main className="admin-dashboard-content">
        {loading && <p className="admin-dashboard-empty-text">불러오는 중...</p>}
        {error   && <p className="admin-dashboard-empty-text">{error}</p>}

        {!loading && !error && detail && (
          <div className="acd-layout">

            {/* ── 좌(3): 이미지 + 오버레이 ── */}
            <section className="admin-dashboard-panel acd-profile">
              {detail.imagePath ? (
                <img src={detail.imagePath} alt="" className="acd-profile__img" />
              ) : (
                <div className="acd-profile__fallback">
                  {(detail.title || "C").slice(0, 1)}
                </div>
              )}
              <div className="acd-profile__overlay">
                <h2 className="acd-profile__title">{detail.title || "-"}</h2>
                {categoryLabel && (
                  <span className="acd-profile__category">{categoryLabel}</span>
                )}
                <p className="acd-profile__period">
                  {formatDate(detail.startAt)} ~ {formatDate(detail.endAt)}
                </p>
              </div>
            </section>

            {/* ── 중앙(4): 상세정보 카드 ── */}
            <section className="admin-dashboard-panel acd-detail">
              <DetailRow label="승인 상태">
                <strong style={{ color: APPROVAL_COLOR[detail.approvalStatus] }}>
                  {APPROVAL_LABEL[detail.approvalStatus] ?? detail.approvalStatus ?? "-"}
                </strong>
              </DetailRow>
              <DetailRow label="캠페인 상태">
                <strong style={{ color: CAMPAIGN_STATUS_COLOR[detail.campaignStatus] }}>
                  {CAMPAIGN_STATUS_LABEL[detail.campaignStatus] ?? detail.campaignStatus ?? "-"}
                </strong>
              </DetailRow>
              <DetailRow label="목표 금액">{formatCurrency(detail.targetAmount)}</DetailRow>
              <DetailRow label="현재 기부금">{formatCurrency(detail.currentAmount)}</DetailRow>
              <DetailRow label="모금 기간">{formatDate(detail.startAt)} ~ {formatDate(detail.endAt)}</DetailRow>
              <DetailRow label="집행 기간">
                {(detail.usageStartAt || detail.usageEndAt)
                  ? `${formatDate(detail.usageStartAt)} ~ ${formatDate(detail.usageEndAt)}`
                  : "-"}
              </DetailRow>
              <DetailRow label="작성일">{formatDate(detail.createdAt)}</DetailRow>
              <DetailRow label="수정일">{formatDate(detail.updatedAt)}</DetailRow>
              <DetailRow label="승인일">{formatDate(detail.approvedAt)}</DetailRow>
              <DetailRow label="캠페인 지갑">{detail.walletNo ? `No.${detail.walletNo}` : "-"}</DetailRow>
              <DetailRow label="기부단체">
                {foundation?.foundationName ?? (detail.foundationNo ? `No.${detail.foundationNo}` : "-")}
              </DetailRow>
              <DetailRow label="수혜자">
                {beneficiary?.name ?? (detail.beneficiaryNo ? `No.${detail.beneficiaryNo}` : "-")}
              </DetailRow>
            </section>

            {/* ── 우(3): 기부단체·수혜자 탭 카드 ── */}
            <section className="admin-dashboard-panel acd-side">
              <div className="afd-tabs">
                <button type="button" className={`afd-tab ${activeTab === "foundation" ? "is-active" : ""}`} onClick={() => setActiveTab("foundation")}>기부단체</button>
                <button type="button" className={`afd-tab ${activeTab === "beneficiary" ? "is-active" : ""}`} onClick={() => setActiveTab("beneficiary")}>수혜자</button>
              </div>
              <div className="afd-tab-content">
                {activeTab === "foundation" && (
                  foundation ? (
                    <div className="afd-activity-rows">
                      {[
                        { label: "단체명",     value: foundation.foundationName },
                        { label: "이메일",     value: foundation.foundationEmail },
                        { label: "대표자",     value: foundation.representativeName },
                        { label: "사업자번호", value: foundation.businessRegistrationNumber },
                        { label: "단체 유형",  value: foundation.foundationType },
                        { label: "계정 상태",  value: foundation.accountStatus },
                      ].map(({ label, value }) => (
                        <div key={label} className="afd-activity-row">
                          <span>{label}</span>
                          <strong>{value || "-"}</strong>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="admin-empty-text">불러오는 중...</p>
                  )
                )}
                {activeTab === "beneficiary" && (
                  beneficiary ? (
                    <div className="afd-activity-rows">
                      {[
                        { label: "이름",       value: beneficiary.name },
                        { label: "연락처",     value: formatPhone(beneficiary.phone) },
                        { label: "계좌번호",   value: beneficiary.account },
                        { label: "수혜자 유형", value: beneficiary.beneficiaryType },
                        { label: "지갑 주소",  value: beneficiary.walletAddress },
                        { label: "잔액",       value: beneficiary.balance != null ? formatCurrency(beneficiary.balance) : null },
                        { label: "입장 코드",  value: beneficiary.entryCode },
                      ].map(({ label, value }) => (
                        <div key={label} className="afd-activity-row">
                          <span>{label}</span>
                          <strong>{value || "-"}</strong>
                        </div>
                      ))}
                    </div>
                  ) : detail.beneficiaryNo ? (
                    <p className="admin-empty-text">불러오는 중...</p>
                  ) : (
                    <p className="admin-empty-text">연결된 수혜자가 없습니다.</p>
                  )
                )}
              </div>
            </section>

            {/* ── 하단 7fr (좌+중 너비): 소개 + 상세 이미지 ── */}
            <section className="admin-dashboard-panel acd-full">
              <h3 className="acd-full__heading">소개</h3>
              <p className="acd-full__desc">{detail.description || "소개 내용이 없습니다."}</p>
              {detail.detailImagePaths?.length > 0 && (
                <div className="acd-full__images">
                  {detail.detailImagePaths.map((src, idx) => (
                    <img key={idx} src={src} alt={`상세 이미지 ${idx + 1}`} className="acd-full__img" />
                  ))}
                </div>
              )}

              <h3 className="acd-full__heading" style={{ marginTop: 24 }}>지출 계획</h3>
              {detail.usePlans?.length > 0 ? (
                <div className="acd-use-plans">
                  {detail.usePlans.map((plan) => (
                    <div key={plan.usePlanNo ?? plan.planContent} className="acd-use-plan-item">
                      <p className="acd-use-plan-item__content">{plan.planContent}</p>
                      <p className="acd-use-plan-item__amount">{formatCurrency(plan.planAmount)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="admin-dashboard-empty-text">등록된 지출 계획이 없습니다.</p>
              )}
            </section>

          </div>
        )}
      </main>
    </>
  );
}
