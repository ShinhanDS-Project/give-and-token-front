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

function formatDateTime(v) {
  if (!v) return "-";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString("ko-KR");
}

const STATUS_LABEL = { ACTIVE: "활성", INACTIVE: "비활성" };
const STATUS_COLOR = { ACTIVE: "#16a34a", INACTIVE: "#dc2626" };
const LOGIN_TYPE_LABEL = { LOCAL: "일반", GOOGLE: "구글", KAKAO: "카카오" };

function DetailRow({ label, children }) {
  return (
    <div className="acd-detail__row">
      <span className="acd-detail__label">{label}</span>
      <span className="acd-detail__value">{children ?? "-"}</span>
    </div>
  );
}

export default function AdminMemberDetailPage() {
  const navigate   = useNavigate();
  const { userNo } = useParams();

  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [detail, setDetail]           = useState(null);
  const [localStatus, setLocalStatus] = useState(null);
  const [processing, setProcessing]   = useState(false);
  const [actionResult, setActionResult] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchAdminJson(`/users/${userNo}/detail`)
      .then((data) => { if (!cancelled) setDetail(data); })
      .catch((err) => { if (!cancelled) setError(err.message || "로드 실패"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userNo]);

  const currentStatus = localStatus ?? detail?.status;
  const isActive = currentStatus === "ACTIVE";

  const handleToggleStatus = async () => {
    const endpoint = isActive ? `/users/${userNo}/deactivate` : `/users/${userNo}/activate`;
    try {
      setProcessing(true);
      setActionResult("");
      const res = await fetch(getAdminApiUrl(endpoint), {
        method: "PATCH", headers: getAdminAuthHeaders(),
      });
      if (!res.ok) { setActionResult(`오류 (${res.status})`); return; }
      const next = isActive ? "INACTIVE" : "ACTIVE";
      setLocalStatus(next);
      setActionResult(next === "ACTIVE" ? "활성화되었습니다." : "비활성화되었습니다.");
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
          <h1>회원 상세</h1>
        </div>
      </header>

      <main className="admin-dashboard-content">
        {loading && <p className="admin-dashboard-empty-text">불러오는 중...</p>}
        {error   && <p className="admin-dashboard-empty-text">{error}</p>}

        {!loading && !error && detail && (
          <div className="acd-layout">

            {/* ── 좌: 프로필 카드 ── */}
            <section className="admin-dashboard-panel acd-profile">
              {detail.profilePath ? (
                <img src={detail.profilePath} alt="프로필"
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} />
              ) : (
                <div className="acd-profile__fallback">
                  {(detail.name || "U").slice(0, 1)}
                </div>
              )}
              <div className="acd-profile__overlay">
                <span className="acd-profile__category">
                  {LOGIN_TYPE_LABEL[detail.loginType] ?? detail.loginType ?? "-"} 로그인
                </span>
                <h2 className="acd-profile__title">{detail.name || "-"}</h2>
                <p className="acd-profile__period">{detail.email || "-"}</p>
              </div>
            </section>

            {/* ── 우: 상세 정보 ── */}
            <section className="admin-dashboard-panel acd-detail">
              <DetailRow label="계정 상태">
                <strong style={{ color: STATUS_COLOR[currentStatus] }}>
                  {STATUS_LABEL[currentStatus] ?? currentStatus ?? "-"}
                </strong>
              </DetailRow>
              <DetailRow label="연락처">{detail.phone}</DetailRow>
              <DetailRow label="생년월일">{formatDate(detail.birth)}</DetailRow>
              <DetailRow label="로그인 유형">
                {LOGIN_TYPE_LABEL[detail.loginType] ?? detail.loginType ?? "-"}
              </DetailRow>
              <DetailRow label="로그인 횟수">{detail.loginCount != null ? `${detail.loginCount}회` : "-"}</DetailRow>
              <DetailRow label="가입일">{formatDateTime(detail.createdAt)}</DetailRow>
              <DetailRow label="최근 수정일">{formatDateTime(detail.updatedAt)}</DetailRow>

              <div style={{ display: "flex", gap: "8px", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #f0f2f7" }}>
                <button
                  type="button"
                  className={`afd-action-btn ${isActive ? "afd-action-btn--reject" : "afd-action-btn--approve"}`}
                  style={{ flex: 1 }}
                  disabled={processing}
                  onClick={handleToggleStatus}
                >
                  {processing ? "처리 중..." : isActive ? "비활성화" : "활성화"}
                </button>
              </div>

              {actionResult && (
                <p style={{ marginTop: "10px", fontSize: "13px", fontWeight: 700,
                  color: currentStatus === "ACTIVE" ? "#16a34a" : "#dc2626" }}>
                  {actionResult}
                </p>
              )}
            </section>

          </div>
        )}
      </main>
    </>
  );
}
