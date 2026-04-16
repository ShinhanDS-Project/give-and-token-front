import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Clock, Heart, Share2 } from "lucide-react";
import FoundationProfileCard from "../components/FoundationProfileCard";

const CAMPAIGN_NO = 472;

const formatWon = (amount) =>
  amount != null ? `${Number(amount).toLocaleString()}원` : "-";

function formatDate(dt) {
  if (!dt) return "-";
  const date = new Date(dt);
  if (Number.isNaN(date.getTime())) return dt;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export default function TestCampaignPage() {
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("about");
  const [shareMessage, setShareMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/foundation/campaigns/${CAMPAIGN_NO}/detail`);
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const data = await res.json();
        if (!cancelled) setCampaign(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareMessage("링크를 복사했어요.");
    } catch {
      setShareMessage("링크 복사에 실패했어요.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface pb-24 pt-36">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-medium text-stone-400">불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-white pb-32 pt-52">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="mb-6 text-4xl font-display font-bold text-ink">
            캠페인을 찾을 수 없습니다.
          </h1>
          {error && <p className="mb-6 text-sm text-stone-400">{error}</p>}
          <Link to="/campaigns" className="btn-fairytale inline-flex">
            캠페인 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  // 대표 이미지 + 상세 이미지 배열 조합
  const images = [
    campaign.representativeImagePath,
    ...(campaign.detailImagePaths ?? []),
  ].filter(Boolean);

  const tabs = [
    { key: "about", label: "소개" },
    { key: "usePlan", label: "사용 계획" },
    { key: "foundation", label: "단체 정보" },
  ];

  return (
    <div className="mb-20 min-h-screen bg-surface pb-24 pt-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link
          to="/campaigns"
          className="mb-8 inline-flex items-center gap-2 font-medium text-stone-400 transition-colors hover:text-primary"
        >
          <ChevronLeft size={20} />
          캠페인 목록으로 돌아가기
        </Link>

        <div className="grid gap-12 lg:grid-cols-12">
          {/* ── 좌측 메인 콘텐츠 ── */}
          <div className="lg:col-span-8">
            <div className="mb-10">
              <div className="mb-4 inline-block rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
                {campaign.category}
              </div>
              <h1 className="mb-6 text-4xl font-display font-bold leading-tight text-ink md:text-5xl">
                {campaign.title}
              </h1>
              <div className="flex flex-wrap gap-6 text-sm font-medium text-stone-400">
                <div className="flex items-center gap-2">
                  <Clock size={18} />
                  {campaign.daysLeft != null ? `${campaign.daysLeft}일 남음` : "-"}
                </div>
              </div>
            </div>

            {/* 이미지 그리드 */}
            {images.length > 0 && (
              <div className="mb-12 grid grid-cols-4 gap-4">
                <div className="col-span-4 aspect-[16/10] overflow-hidden rounded-[32px] shadow-xl md:col-span-3">
                  <img
                    src={images[0]}
                    alt={campaign.title}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="hidden flex-col gap-4 md:flex">
                  {images.slice(1, 4).map((img, idx) => (
                    <div key={idx} className="flex-1 overflow-hidden rounded-2xl shadow-md">
                      <img
                        src={img}
                        alt={`${campaign.title} 이미지 ${idx + 2}`}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 탭 */}
            <div className="mb-10 flex gap-10 border-b border-line">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative pb-4 text-sm font-bold uppercase tracking-widest transition-all ${
                    activeTab === tab.key ? "text-primary" : "text-stone-400 hover:text-ink"
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.key && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="prose prose-stone max-w-none">
              {/* ── 소개 탭 ── */}
              {activeTab === "about" && (
                <div className="space-y-8">
                  {(campaign.historyTitle || campaign.historyDescription) && (
                    <div className="pt-1">
                      {campaign.historyTitle && (
                        <h3 className="mb-4 text-2xl font-display font-bold text-ink">
                          {campaign.historyTitle}
                        </h3>
                      )}
                      {campaign.historyDescription && (
                        <p className="text-lg leading-relaxed text-stone-600 whitespace-pre-wrap">
                          {campaign.historyDescription}
                        </p>
                      )}
                    </div>
                  )}

                  {campaign.description && (
                    <div className="pt-1">
                      <h3 className="mb-4 text-2xl font-display font-bold text-ink">상세 설명</h3>
                      <p className="text-lg leading-relaxed text-stone-600 whitespace-pre-wrap">
                        {campaign.description}
                      </p>
                    </div>
                  )}

                  <div>
                    <h3 className="mb-4 text-2xl font-display font-bold text-ink">
                      캠페인 일정 및 예산
                    </h3>
                    <div className="grid gap-5 lg:grid-cols-2">
                      <div className="overflow-hidden rounded-[2rem] border border-line bg-white">
                        <div className="border-b border-line bg-stone-50/80 px-6 py-4 text-xs font-bold uppercase tracking-widest text-stone-400">
                          모집 및 사업 기간
                        </div>
                        <div className="px-6">
                          {[
                            ["모집 시작일", formatDate(campaign.startAt)],
                            ["모집 종료일", formatDate(campaign.endAt)],
                            ["사업 시작일", formatDate(campaign.usageStartAt)],
                            ["사업 종료일", formatDate(campaign.usageEndAt)],
                          ].map(([label, value], index) => (
                            <div
                              key={label}
                              className={`flex items-center justify-between py-5 ${
                                index === 1 ? "border-b border-line" : ""
                              }`}
                            >
                              <span className="text-sm font-medium text-stone-500">{label}</span>
                              <span className="text-sm font-bold text-ink">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-[2rem] border border-line bg-white p-6">
                        <div className="mb-3 text-xs font-bold uppercase tracking-widest text-stone-400">
                          목표 금액
                        </div>
                        <div className="mb-2 text-3xl font-display font-bold text-[#4A7CFF]">
                          {formatWon(campaign.targetAmount)}
                        </div>
                        <p className="text-sm leading-relaxed text-stone-400">
                          현재 캠페인에 설정된 목표 예산 기준 금액입니다.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── 사용 계획 탭 ── */}
              {activeTab === "usePlan" && (
                <div className="space-y-4">
                  {campaign.usePlans && campaign.usePlans.length > 0 ? (
                    campaign.usePlans.map((plan, i) => (
                      <div
                        key={plan.usePlanNo ?? i}
                        className="flex items-center justify-between rounded-3xl border border-line bg-white p-6"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/5 text-xs font-bold text-primary">
                            {i + 1}
                          </div>
                          <span className="font-medium text-ink">{plan.planContent}</span>
                        </div>
                        <span className="text-base font-display font-bold text-primary">
                          {formatWon(plan.planAmount)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-stone-400">등록된 사용 계획이 없습니다.</p>
                  )}
                </div>
              )}

              {/* ── 단체 정보 탭 ── */}
              {activeTab === "foundation" && (
                <div className="rounded-[40px] border border-line bg-white p-10">
                  <FoundationProfileCard foundation={campaign.foundation} />
                </div>
              )}
            </div>
          </div>

          {/* ── 우측 사이드바 ── */}
          <div className="lg:col-span-4">
            <div className="sticky top-32 space-y-8">
              {/* 모금 현황 */}
              <div className="rounded-[40px] border border-line bg-white p-10 shadow-2xl shadow-stone-200/50">
                <div className="mb-8">
                  <div className="mb-2 text-4xl font-display font-bold text-ink">
                    {formatWon(campaign.currentAmount)}
                  </div>
                  <div className="text-sm font-medium text-stone-400">
                    목표 {formatWon(campaign.targetAmount)} 중 모금액
                  </div>
                </div>

                <div className="mb-8">
                  <div className="mb-4 h-3 overflow-hidden rounded-full bg-stone-100">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${campaign.progressPercent ?? 0}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-primary"
                    />
                  </div>
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-primary">{campaign.progressPercent ?? 0}% 달성</span>
                    <span className="text-ink">
                      {campaign.daysLeft != null ? `${campaign.daysLeft}일 남음` : "-"}
                    </span>
                  </div>
                </div>

                <div className="mb-10 space-y-4">
                  <div className="flex items-center gap-3 text-sm text-stone-600">
                    <Heart size={18} className="text-primary" fill="currentColor" />
                    모든 후원금은 투명하게 공개됩니다.
                  </div>
                </div>

                <Link
                  to={`/campaign/${CAMPAIGN_NO}/donate`}
                  className="mb-4 flex w-full items-center justify-center rounded-full bg-primary py-4 text-base font-bold text-white shadow-xl shadow-primary/20 transition-all hover:bg-primary/90"
                >
                  지금 기부하기
                </Link>
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-line py-4 text-base font-bold text-stone-500 transition-all hover:bg-stone-50"
                >
                  <Share2 size={20} />
                  공유하기
                </button>
                {shareMessage && (
                  <p className="mt-3 text-center text-sm font-bold text-primary">{shareMessage}</p>
                )}
              </div>

              {/* 기부단체 카드 */}
              {campaign.foundation && (
                <div className="rounded-[40px] border border-line bg-white p-10">
                  <h4 className="mb-8 text-2xl font-display font-bold text-ink">기부단체</h4>
                  <FoundationProfileCard foundation={campaign.foundation} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
