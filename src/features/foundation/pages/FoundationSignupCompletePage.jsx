import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import "../css/FoundationSignupCompletePage.css";

const REVIEW_STATUS_LABEL = {
  CLEAN: "검토 대기 중",
  SIMILAR: "유사 단체 검토 중",
  ILLEGAL: "불성실 기부금 단체 검토 중",
  APPROVED: "승인 완료",
  REJECTED: "반려",
};

const REVIEW_STATUS_CLASS = {
  CLEAN: "fsc-badge--pending",
  SIMILAR: "fsc-badge--similar",
  ILLEGAL: "fsc-badge--illegal",
  APPROVED: "fsc-badge--approved",
  REJECTED: "fsc-badge--rejected",
};

const REVIEW_STATUS_DESCRIPTION = {
  SIMILAR:
    "불성실 기부금 수령 단체와 단체명 또는 대표자명이 유사하여 관리자가 검토하고 있습니다.",
  ILLEGAL:
    "최근 3년간 국세청 불성실 기부금 수령 단체 명단에 일치하는 정보가 존재하여 관리자 검토 진행 중입니다.",
};

function InfoRow({ label, value }) {
  return (
    <div className="fsc-info-row">
      <span className="fsc-info-label">{label}</span>
      <span className="fsc-info-value">{value}</span>
    </div>
  );
}

export default function FoundationSignupCompletePage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const result = state?.result;

  if (!result) {
    return (
      <section className="bg-white">
        <div className="fsc-wrapper">
          <p className="fsc-no-data">잘못된 접근입니다.</p>
          <button className="fsc-home-button" onClick={() => navigate("/")}>
            메인으로 돌아가기
          </button>
        </div>
      </section>
    );
  }

  const statusLabel = REVIEW_STATUS_LABEL[result.reviewStatus] ?? result.reviewStatus;
  const statusClass = REVIEW_STATUS_CLASS[result.reviewStatus] ?? "fsc-badge--pending";
  const statusDescription = REVIEW_STATUS_DESCRIPTION[result.reviewStatus];

  return (
    <section className="bg-white">
      <div className="fsc-wrapper">
        {/* 완료 헤더 */}
        <div className="fsc-header">
          <div className="fsc-icon-wrap">
            <CheckCircle size={40} strokeWidth={1.8} />
          </div>
          <h1 className="fsc-title">신청서 제출이 완료되었습니다</h1>
          <p className="fsc-subtitle">
            검토 후 승인 여부를 등록하신 이메일로 안내해 드립니다.
          </p>
        </div>

        {/* 응답 정보 */}
        <div className="fsc-card">
          <h2 className="fsc-card-title">신청 정보 확인</h2>

          <div className="fsc-info-list">
            <InfoRow label="신청 번호" value={`#${result.foundationNo}`} />
            <InfoRow label="단체명" value={result.foundationName} />
            <InfoRow label="대표자명" value={result.representativeName} />
            <InfoRow label="이메일" value={result.foundationEmail} />
            <div className="fsc-info-row">
              <span className="fsc-info-label">검토 상태</span>
              <div className="fsc-status-wrap">
                <span className={`fsc-badge ${statusClass}`}>{statusLabel}</span>
                {statusDescription && (
                  <p className="fsc-status-description">{statusDescription}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 메인으로 버튼 */}
        <button className="fsc-home-button" onClick={() => navigate("/")}>
          메인으로 돌아가기
        </button>
      </div>
    </section>
  );
}
