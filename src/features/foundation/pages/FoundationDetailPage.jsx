import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import FoundationChrome from "../components/FoundationChrome";

function FoundationCampaignCard({ campaign }) {
    const imageUrl =
        campaign.representativeImagePath ||
        campaign.imagePath ||
        campaign.thumbnailPath;

    const title = campaign.title || "캠페인 제목 없음";

    const period =
        campaign.startAt && campaign.endAt
            ? `${new Date(campaign.startAt).toLocaleDateString("ko-KR")} - ${new Date(campaign.endAt).toLocaleDateString("ko-KR")}`
            : "모금 기간 미정";

    const currentAmount = campaign.currentAmount ?? campaign.raisedAmount ?? 0;

    return (
        <article>
            {imageUrl ? (
                <img src={imageUrl} alt={title} referrerPolicy="no-referrer" style={{ width: "100%" }} />
            ) : (
                <div>이미지 없음</div>
            )}
            <h3>{title}</h3>
            <p>{period}</p>
            <strong>{currentAmount.toLocaleString()}원 모금</strong>
        </article>
    );
}

export default function FoundationDetailPage() {
    const { foundationNo } = useParams();

    const [foundation, setFoundation] = useState(null);
    const [wallet, setWallet] = useState(null);
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function loadFoundationDetail() {
            try {
                setLoading(true);
                setError(null);

                const [foundationRes, walletRes, campaignsRes] = await Promise.all([
                    fetch(`/api/foundation/${foundationNo}`),
                    fetch(`/api/foundation/${foundationNo}/wallet`),
                    fetch(`/api/foundation/${foundationNo}/campaigns`),
                ]);

                if (!foundationRes.ok) throw new Error(`기부단체 정보 조회 실패: ${foundationRes.status}`);
                if (!walletRes.ok) throw new Error(`지갑 정보 조회 실패: ${walletRes.status}`);
                if (!campaignsRes.ok) throw new Error(`캠페인 목록 조회 실패: ${campaignsRes.status}`);

                const [foundationData, walletData, campaignsData] = await Promise.all([
                    foundationRes.json(),
                    walletRes.json(),
                    campaignsRes.json(),
                ]);

                if (cancelled) return;

                setFoundation(foundationData);
                setWallet(walletData);
                setCampaigns(Array.isArray(campaignsData) ? campaignsData : campaignsData.content ?? []);
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadFoundationDetail();

        return () => { cancelled = true; };
    }, [foundationNo]);

    if (loading) return <><FoundationChrome /><p>불러오는 중...</p></>;
    if (error) return <><FoundationChrome /><p>오류: {error}</p></>;
    if (!foundation) return <><FoundationChrome /><p>데이터 없음</p></>;

    return (
      <>
        <FoundationChrome />
        <div style={{ color: "#1e293b", padding: 32, paddingTop: 144 }}>

            {/* 1. 상단 프로필 Hero: 왼쪽 이미지 / 오른쪽 단체명+유형+지갑정보 */}
            <section style={{ display: "flex", gap: 32, marginBottom: 48 }}>

                {/* 왼쪽: 프로필 이미지 */}
                <div style={{ flexShrink: 0 }}>
                    {foundation.profilePath ? (
                        <img
                            src={foundation.profilePath}
                            alt={foundation.foundationName}
                            referrerPolicy="no-referrer"
                            style={{ width: 160, height: 160, objectFit: "cover" }}
                        />
                    ) : (
                        <div style={{ width: 160, height: 160, background: "#e2e8f0" }}>이미지 없음</div>
                    )}
                </div>

                {/* 오른쪽: 단체명 + 유형 + 지갑 정보 */}
                <div style={{ flex: 1 }}>
                    <h1>{foundation.foundationName}</h1>
                    <p>{foundation.foundationType}</p>

                    {wallet ? (
                        <div style={{ marginTop: 16 }}>
                            <p>지갑 주소: {wallet.walletAddress}</p>
                            <p>잔액: {wallet.balance}</p>
                            {wallet.network && <p>네트워크: {wallet.network}</p>}
                            {wallet.status && <p>지갑 상태: {wallet.status}</p>}
                        </div>
                    ) : (
                        <p>지갑 정보 없음</p>
                    )}
                </div>

            </section>

            {/* 2. 설명 + 연락처 정보 */}
            <section style={{ marginBottom: 48 }}>
                <p>{foundation.description}</p>
                <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginTop: 16 }}>
                    <div>
                        <p>대표자</p>
                        <p>{foundation.representativeName}</p>
                    </div>
                    <div>
                        <p>이메일</p>
                        <p>{foundation.foundationEmail}</p>
                    </div>
                    <div>
                        <p>연락처</p>
                        <p>{foundation.contactPhone}</p>
                    </div>
                    <div>
                        <p>사업자등록번호</p>
                        <p>{foundation.businessRegistrationNumber}</p>
                    </div>
                    <div>
                        <p>등록일: {foundation.createdAt}</p>
                    </div>
                </div>
            </section>

            {/* 3. 캠페인 목록 */}
            <section>
                <h2>{foundation.foundationName}의 캠페인</h2>
                {campaigns.length > 0 ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
                        {campaigns.slice(0, 6).map((campaign) => (
                            <FoundationCampaignCard key={campaign.campaignNo} campaign={campaign} />
                        ))}
                        {campaigns.length > 6 && (
                            <Link
                                to={`/foundation/${foundationNo}/campaigns`}
                                style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#1e293b" }}
                            >
                                더보기
                            </Link>
                        )}
                    </div>
                ) : (
                    <p>진행 중인 캠페인이 없습니다.</p>
                )}
            </section>

        </div>
      </>
    );
}
