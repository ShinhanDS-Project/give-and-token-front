import { Link } from "react-router-dom";

export default function FoundationProfileCard({ foundation }) {
  if (!foundation) return <p>단체 정보 없음</p>;

  return (
    <div style={{ color: "#1e293b" }}>
      {/* 상단 영역: 이미지 + 단체명 + 자세히 보기 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* 프로필 이미지 */}
          {foundation.profilePath ? (
            <img
              src={foundation.profilePath}
              alt={foundation.foundationName}
              style={{ width: 64, height: 64, objectFit: "cover" }}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div style={{ width: 64, height: 64, background: "#e2e8f0" }} />
          )}

          {/* 단체명 */}
          <span style={{ color: "#1e293b" }}>{foundation.foundationName}</span>
        </div>

        {/* 자세히 보기 */}
        <Link to={`/foundation/${foundation.foundationNo}`} style={{ color: "#1e293b" }}>
          자세히 보기
        </Link>
      </div>

      {/* 하단 영역: 기부단체 정보 */}
      <div>
        <p style={{ color: "#1e293b" }}>{foundation.description}</p>
      </div>
    </div>
  );
}
