import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";

//기부단체의 캠페인 목록 조회 페이지
export default function FoundationListPage() {
  const { foundationNo } = useParams();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/foundation/${foundationNo}/campaigns`)
      .then((res) => {
        if (!res.ok) throw new Error(`캠페인 목록 조회 실패: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setCampaigns(Array.isArray(data) ? data : data.content ?? []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [foundationNo]);

  if (loading) return <p>불러오는 중...</p>;
  if (error) return <p>오류: {error}</p>;

  return (
    <div style={{ color: "#1e293b", padding: 32, paddingTop: 144 }}>
      <h1>캠페인 전체 목록</h1>

      {campaigns.length === 0 ? (
        <p>진행 중인 캠페인이 없습니다.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginTop: 24 }}>
          {campaigns.map((campaign) => {
            const imageUrl =
              campaign.representativeImagePath ||
              campaign.imagePath ||
              campaign.thumbnailPath;

            const period =
              campaign.startAt && campaign.endAt
                ? `${new Date(campaign.startAt).toLocaleDateString("ko-KR")} - ${new Date(campaign.endAt).toLocaleDateString("ko-KR")}`
                : "모금 기간 미정";

            const currentAmount = campaign.currentAmount ?? campaign.raisedAmount ?? 0;

            return (
              <Link
                key={campaign.campaignNo}
                to={`/campaign/${campaign.campaignNo}`}
                style={{ color: "#1e293b", textDecoration: "none" }}
              >
                <article>
                  {imageUrl ? (
                    <img src={imageUrl} alt={campaign.title} referrerPolicy="no-referrer" style={{ width: "100%" }} />
                  ) : (
                    <div style={{ background: "#e2e8f0", height: 120 }}>이미지 없음</div>
                  )}
                  <h3>{campaign.title || "캠페인 제목 없음"}</h3>
                  <p>{period}</p>
                  <strong>{currentAmount.toLocaleString()}원 모금</strong>
                </article>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
