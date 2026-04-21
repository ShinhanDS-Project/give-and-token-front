import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BadgeCheck, ChevronLeft, Copy, Mail, Phone, User, Wallet } from "lucide-react";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

function normalizeImagePath(imagePath) {
    if (!imagePath) return "";
    const rawPath = String(imagePath).trim();
    if (!rawPath) return "";
    if (/^(https?:\/\/|data:image\/|blob:)/i.test(rawPath)) return rawPath;

    const noFileScheme = rawPath.replace(/^file:(\/\/\/|\/\/)?/i, "");
    const normalized = noFileScheme.replace(/\\/g, "/");
    const uploadMatch = normalized.match(/(?:^|\/)uploads\/(.+)$/i);
    if (uploadMatch) {
        const uploadPath = `/uploads/${uploadMatch[1].replace(/^\/+/, "")}`;
        return API_BASE_URL ? `${API_BASE_URL}${uploadPath}` : uploadPath;
    }
    if (/^[a-zA-Z]:\//.test(normalized)) return "";
    if (!API_BASE_URL) return rawPath;
    return rawPath.startsWith("/") ? `${API_BASE_URL}${rawPath}` : `${API_BASE_URL}/${rawPath}`;
}

function formatWon(value) {
    const num = Number(value || 0);
    return `${num.toLocaleString("ko-KR")}원`;
}

function shortenAddress(address) {
    if (!address) return "";
    const addr = String(address);
    if (addr.length <= 18) return addr;
    return `${addr.slice(0, 10)}...${addr.slice(-6)}`;
}

function formatPeriod(startAt, endAt) {
    if (!startAt && !endAt) return "모금 기간 미정";
    const fmt = (d) => (d ? new Date(d).toLocaleDateString("ko-KR") : "-");
    return `${fmt(startAt)} ~ ${fmt(endAt)}`;
}

const CAMPAIGN_STATUS_LABEL = {
    IN_PROGRESS: "진행중",
    COMPLETED: "종료",
    PENDING: "대기",
    REJECTED: "반려",
};

export default function FoundationDetailPage() {
    const { foundationNo } = useParams();
    const navigate = useNavigate();

    const [foundation, setFoundation] = useState(null);
    const [wallet, setWallet] = useState(null);
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

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
                if (!campaignsRes.ok) throw new Error(`캠페인 목록 조회 실패: ${campaignsRes.status}`);

                const [foundationData, walletData, campaignsData] = await Promise.all([
                    foundationRes.json(),
                    walletRes.ok ? walletRes.json() : Promise.resolve(null),
                    campaignsRes.json(),
                ]);

                if (cancelled) return;

                // 공개 상세 API가 이메일을 내려주지 않아, 공개 리스트 API에서 이메일만 조인
                if (!foundationData.foundationEmail && foundationData.foundationName) {
                    try {
                        const listRes = await fetch(
                            `/api/foundation/all?keyword=${encodeURIComponent(foundationData.foundationName)}&size=20`
                        );
                        if (listRes.ok) {
                            const listData = await listRes.json();
                            const items = Array.isArray(listData) ? listData : listData.content ?? [];
                            const match = items.find((f) => Number(f.foundationNo) === Number(foundationNo));
                            if (match?.foundationEmail) {
                                foundationData.foundationEmail = match.foundationEmail;
                            }
                        }
                    } catch {
                        /* 이메일 조인 실패해도 나머지 렌더링은 진행 */
                    }
                }

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

    const copyWallet = async () => {
        if (!wallet?.walletAddress) return;
        try {
            await navigator.clipboard.writeText(wallet.walletAddress);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            setCopied(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-surface pb-32 pt-40">
                <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                    <p className="text-lg font-bold text-stone-500">불러오는 중...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-surface pb-32 pt-40">
                <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                    <h1 className="mb-6 text-2xl font-display font-bold text-ink">오류: {error}</h1>
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="inline-flex rounded-full bg-primary px-6 py-3 text-sm font-bold text-white"
                    >
                        이전 페이지로
                    </button>
                </div>
            </div>
        );
    }

    if (!foundation) return null;

    const profileImage = normalizeImagePath(foundation.profilePath);
    const totalCampaignCount = campaigns.length;

    return (
        <div className="min-h-screen bg-surface pb-24 pt-36">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-stone-400 transition-colors hover:text-primary"
                >
                    <ChevronLeft size={18} />
                    이전 페이지로
                </button>

                {/* 1. 상단 Hero 카드 */}
                <section className="overflow-hidden rounded-[32px] border border-line bg-white shadow-xl shadow-stone-200/60">
                    <div className="grid grid-cols-1 md:grid-cols-2">
                        {/* 왼쪽: 프로필 이미지 */}
                        <div className="relative h-64 overflow-hidden bg-gradient-to-br from-primary/10 via-surface to-amber-50 md:h-[320px]">
                            {profileImage ? (
                                <img
                                    src={profileImage}
                                    alt={foundation.foundationName}
                                    referrerPolicy="no-referrer"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-sm font-medium text-stone-400">
                                    프로필 이미지 없음
                                </div>
                            )}
                        </div>

                        {/* 오른쪽: 정보 패널 */}
                        <div className="flex flex-col justify-between bg-white p-6 md:p-8">
                            <div>
                                {foundation.foundationType && (
                                    <div className="mb-3 text-[11px] font-bold uppercase tracking-widest text-primary">
                                        {foundation.foundationType}
                                    </div>
                                )}
                                <h1 className="mb-6 text-2xl font-display font-bold leading-tight text-ink md:text-3xl">
                                    {foundation.foundationName}
                                </h1>

                                <div className="mb-6 grid grid-cols-2 gap-6">
                                    <div>
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                                            이번 달 모금액
                                        </div>
                                        <div className="mt-1 truncate text-lg font-display font-bold text-primary">
                                            {formatWon(foundation.monthlyRaisedAmount ?? foundation.totalRaisedAmount)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                                            진행 캠페인
                                        </div>
                                        <div className="mt-1 text-lg font-display font-bold text-ink">
                                            {totalCampaignCount.toLocaleString()}건
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto">
                                {wallet?.walletAddress ? (
                                    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3">
                                        <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary">
                                            <Wallet size={12} />
                                            지갑 주소
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <code className="flex-1 truncate font-mono text-xs text-ink">
                                                {wallet.walletAddress}
                                            </code>
                                            <button
                                                type="button"
                                                onClick={copyWallet}
                                                className="flex shrink-0 items-center gap-1 rounded-full border border-line bg-white px-2.5 py-1 text-[10px] font-bold text-stone-500 transition-colors hover:border-primary/30 hover:text-primary"
                                            >
                                                <Copy size={10} />
                                                {copied ? "복사됨" : "복사"}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-sm font-medium text-stone-400">
                                        지갑 정보 없음
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* 2. 기부단체 상세 정보 */}
            <div className="mx-auto max-w-5xl px-4 pt-12 sm:px-6 lg:px-8">
                <h2 className="mb-4 text-lg font-display font-bold text-ink">
                    기부단체 상세 정보
                </h2>
                <p className="mb-6 whitespace-pre-wrap text-sm leading-relaxed text-stone-600">
                    {foundation.description || "등록된 소개가 없습니다."}
                </p>

                <dl className="flex flex-wrap items-start gap-x-10 gap-y-4 rounded-2xl border border-line bg-white px-6 py-5">
                    {foundation.representativeName && (
                        <div className="flex items-center gap-2">
                            <User size={14} className="shrink-0 text-stone-400" />
                            <dt className="text-[11px] font-bold uppercase tracking-widest text-stone-400">대표자</dt>
                            <dd className="text-sm font-bold text-ink">{foundation.representativeName}</dd>
                        </div>
                    )}
                    {foundation.foundationEmail && (
                        <div className="flex items-center gap-2">
                            <Mail size={14} className="shrink-0 text-stone-400" />
                            <dt className="text-[11px] font-bold uppercase tracking-widest text-stone-400">이메일</dt>
                            <dd className="break-all text-sm font-medium text-ink">{foundation.foundationEmail}</dd>
                        </div>
                    )}
                    {foundation.contactPhone && (
                        <div className="flex items-center gap-2">
                            <Phone size={14} className="shrink-0 text-stone-400" />
                            <dt className="text-[11px] font-bold uppercase tracking-widest text-stone-400">연락처</dt>
                            <dd className="text-sm font-medium text-ink">{foundation.contactPhone}</dd>
                        </div>
                    )}
                    {foundation.businessRegistrationNumber && (
                        <div className="flex items-center gap-2">
                            <BadgeCheck size={14} className="shrink-0 text-stone-400" />
                            <dt className="text-[11px] font-bold uppercase tracking-widest text-stone-400">사업자번호</dt>
                            <dd className="font-mono text-sm font-medium text-ink">{foundation.businessRegistrationNumber}</dd>
                        </div>
                    )}
                    {wallet?.walletAddress && (
                        <div className="flex items-center gap-2">
                            <Wallet size={14} className="shrink-0 text-stone-400" />
                            <dt className="text-[11px] font-bold uppercase tracking-widest text-stone-400">지갑</dt>
                            <dd className="font-mono text-xs font-medium text-ink">
                                {shortenAddress(wallet.walletAddress)}
                            </dd>
                        </div>
                    )}
                </dl>
            </div>

            {/* 3. 캠페인 목록 테이블 */}
            <section className="mx-auto mt-8 max-w-5xl px-4 sm:px-6 lg:px-8">
                <div className="mb-4 flex items-end justify-between">
                    <h2 className="text-xl font-display font-bold text-ink md:text-2xl">
                        {foundation.foundationName}의 캠페인
                    </h2>
                    <span className="text-xs font-medium text-stone-400">총 {totalCampaignCount}건</span>
                </div>

                {campaigns.length === 0 ? (
                    <p className="rounded-3xl border border-line bg-white p-10 text-center text-sm text-stone-500">
                        진행 중인 캠페인이 없습니다.
                    </p>
                ) : (
                    <div className="overflow-hidden rounded-2xl border border-line bg-white">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-line bg-surface text-left text-[11px] font-bold uppercase tracking-widest text-stone-400">
                                    <th className="w-20 px-4 py-3">이미지</th>
                                    <th className="px-4 py-3">캠페인</th>
                                    <th className="px-4 py-3">기간</th>
                                    <th className="px-4 py-3 text-right">모금액 / 목표</th>
                                    <th className="w-20 px-4 py-3 text-center">상태</th>
                                </tr>
                            </thead>
                            <tbody>
                                {campaigns.map((campaign) => {
                                    const imageUrl = normalizeImagePath(campaign.imagePath);
                                    const raised = Number(campaign.currentAmount ?? 0);
                                    const goal = Number(campaign.targetAmount ?? 0);
                                    const progress = goal > 0 ? Math.floor((raised / goal) * 100) : 0;
                                    const statusLabel =
                                        CAMPAIGN_STATUS_LABEL[campaign.campaignStatus] ||
                                        campaign.campaignStatus ||
                                        "-";

                                    return (
                                        <tr
                                            key={campaign.campaignNo}
                                            onClick={() => navigate(`/campaign/${campaign.campaignNo}`)}
                                            className="cursor-pointer border-b border-line/60 transition-colors last:border-b-0 hover:bg-surface"
                                        >
                                            <td className="px-4 py-3">
                                                <div className="h-12 w-12 overflow-hidden rounded-lg bg-stone-100">
                                                    {imageUrl ? (
                                                        <img
                                                            src={imageUrl}
                                                            alt={campaign.title}
                                                            referrerPolicy="no-referrer"
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : null}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-bold text-ink">{campaign.title || "캠페인 제목 없음"}</div>
                                                {campaign.category && (
                                                    <div className="mt-0.5 text-[11px] font-medium text-stone-400">
                                                        {campaign.category}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-stone-500">
                                                {formatPeriod(campaign.startAt, campaign.endAt)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="text-sm font-bold text-primary">
                                                    {formatWon(raised)}
                                                </div>
                                                <div className="text-[11px] text-stone-400">
                                                    / {formatWon(goal)} ({progress}%)
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-block rounded-full border border-line px-2.5 py-0.5 text-[11px] font-bold text-stone-500">
                                                    {statusLabel}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}
