import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, Clock, Download, Heart, MapPin, Share2, Users } from "lucide-react";
import { campaigns, formatWon } from "../data/campaigns";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

function formatDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

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

function toDetailCampaignModel(data, id) {
  const representativeImage = normalizeImagePath(data?.representativeImagePath || "");
  const detailImages = Array.isArray(data?.detailImagePaths)
    ? data.detailImagePaths.map((path) => normalizeImagePath(path)).filter(Boolean)
    : [];
  const images = [representativeImage, ...detailImages].filter(Boolean);
  const raised = Number(data?.currentAmount ?? 0);
  const goal = Number(data?.targetAmount ?? 0);
  const progress = Number.isFinite(Number(data?.progressPercent))
    ? Number(data.progressPercent)
    : goal > 0
      ? Math.min(100, Math.floor((raised / goal) * 100))
      : 0;

  return {
    id: Number(id),
    title: data?.title || "",
    shortTitle: data?.title || "",
    category: data?.category || "기타",
    daysLeft: Number.isFinite(Number(data?.daysLeft)) ? Number(data.daysLeft) : 0,
    donors: Number.isFinite(Number(data?.donors)) ? Number(data.donors) : 0,
    raised,
    goal,
    progress,
    images: images.length > 0 ? images : [""],
    description: data?.description || "",
    recruitStartDate: data?.startAt || null,
    recruitEndDate: data?.endAt || null,
    projectStartDate: data?.usageStartAt || null,
    projectEndDate: data?.usageEndAt || null,
    documents: Array.isArray(data?.documents)
      ? data.documents.map((doc) => ({
          name: doc?.name || "사용 계획서",
          size: doc?.size || "-",
          href: doc?.href || "#",
        }))
      : [],
    recentDonors: Array.isArray(data?.recentDonors)
      ? data.recentDonors.map((donor) => ({
          name: donor?.name || "익명",
          amount: Number.isFinite(Number(donor?.amount)) ? Number(donor.amount) : 0,
          time: donor?.time || "-",
        }))
      : [],
    beneficiary: {
      title: data?.beneficiary?.title || "수혜자 정보 준비 중",
      target: data?.beneficiary?.target || "-",
    },
    organization: {
      name: data?.foundation?.foundationName || "기부단체",
      description: data?.foundation?.description || "",
      image: normalizeImagePath(data?.foundation?.profilePath || representativeImage),
    },
  };
}

function FileText({ size, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}

export default function CampaignDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("about");
  const [shareMessage, setShareMessage] = useState("");
  const localCampaign = useMemo(() => campaigns.find((item) => item.id === Number(id)), [id]);
  const [campaign, setCampaign] = useState(localCampaign ?? null);
  const [isLoading, setIsLoading] = useState(!localCampaign);

  useEffect(() => {
    let ignore = false;

    if (localCampaign) {
      setCampaign(localCampaign);
      setIsLoading(false);
      return () => {
        ignore = true;
      };
    }

    async function loadCampaignDetail() {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/foundation/campaigns/${id}/detail`);
        if (!response.ok) throw new Error(`detail request failed: ${response.status}`);
        const data = await response.json();
        if (!ignore) setCampaign(toDetailCampaignModel(data, id));
      } catch {
        if (!ignore) setCampaign(null);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadCampaignDetail();
    return () => {
      ignore = true;
    };
  }, [id, localCampaign]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white pb-32 pt-52">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-lg font-bold text-stone-500">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-white pb-32 pt-52">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="mb-6 text-4xl font-display font-bold text-ink">캠페인을 찾을 수 없습니다.</h1>
          <Link to="/campaigns" className="btn-fairytale inline-flex">
            캠페인 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/campaign/${campaign.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareMessage("링크를 복사했어요.");
    } catch {
      setShareMessage("링크 복사에 실패했어요.");
    }
  };

  const safeImages = Array.isArray(campaign.images) && campaign.images.length > 0 ? campaign.images : [""];
  const safeDonors = Number(campaign.donors ?? 0);
  const safeRecentDonors = Array.isArray(campaign.recentDonors) ? campaign.recentDonors : [];
  const safeDocs = Array.isArray(campaign.documents) ? campaign.documents : [];

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
          <div className="lg:col-span-8">
            <div className="mb-10">
              <div className="mb-4 inline-block rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
                {campaign.category}
              </div>
              <h1 className="mb-6 text-4xl font-display font-bold leading-tight text-ink md:text-5xl">{campaign.title}</h1>
              <div className="flex flex-wrap gap-6 text-sm font-medium text-stone-400">
                <div className="flex items-center gap-2">
                  <Clock size={18} />
                  {campaign.daysLeft}일 남음
                </div>
                <div className="flex items-center gap-2">
                  <Users size={18} />
                  {safeDonors.toLocaleString()}명의 기부자
                </div>
              </div>
            </div>

            <div className="mb-12 grid grid-cols-4 gap-4">
              <div className="col-span-4 aspect-[16/10] overflow-hidden rounded-[32px] shadow-xl md:col-span-3">
                <img src={safeImages[0]} alt={campaign.title} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="hidden flex-col gap-4 md:flex">
                {safeImages.slice(1, 4).map((img, idx) => (
                  <div key={idx} className="flex-1 overflow-hidden rounded-2xl shadow-md">
                    <img src={img} alt={`${campaign.shortTitle} 이미지 ${idx + 2}`} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-10 flex gap-10 border-b border-line">
              {["about", "contributors", "beneficiary", "proof"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`relative pb-4 text-sm font-bold uppercase tracking-widest transition-all ${
                    activeTab === tab ? "text-primary" : "text-stone-400 hover:text-ink"
                  }`}
                >
                  {tab === "about" && "소개"}
                  {tab === "contributors" && "기부자 명단"}
                  {tab === "beneficiary" && "수혜자 정보"}
                  {tab === "proof" && "활동 증빙"}
                  {activeTab === tab && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                </button>
              ))}
            </div>

            <div className="prose prose-stone max-w-none">
              {activeTab === "about" && (
                <div className="space-y-8">
                  <div className="pt-1">
                    <h3 className="mb-4 text-2xl font-display font-bold text-ink">상세 설명</h3>
                    <p className="text-lg leading-relaxed text-stone-600">{campaign.description}</p>
                  </div>

                  <div>
                    <h3 className="mb-4 text-2xl font-display font-bold text-ink">캠페인 일정 및 예산</h3>
                    <div className="grid gap-5 lg:grid-cols-2">
                      <div className="overflow-hidden rounded-[2rem] border border-line bg-white">
                        <div className="border-b border-line bg-stone-50/80 px-6 py-4 text-xs font-bold uppercase tracking-widest text-stone-400">모집 및 사업 기간</div>
                        <div className="px-6">
                          {[
                            ["모집 시작일", formatDate(campaign.recruitStartDate)],
                            ["모집 종료일", formatDate(campaign.recruitEndDate)],
                            ["사업 시작일", formatDate(campaign.projectStartDate)],
                            ["사업 종료일", formatDate(campaign.projectEndDate)],
                          ].map(([label, value], index) => (
                            <div key={label} className={`flex items-center justify-between py-5 ${index === 1 ? "border-b border-line" : ""}`}>
                              <span className="text-sm font-medium text-stone-500">{label}</span>
                              <span className="text-sm font-bold text-ink">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-[2rem] border border-line bg-white p-6">
                        <div className="mb-3 text-xs font-bold uppercase tracking-widest text-stone-400">목표 금액</div>
                        <div className="mb-2 text-3xl font-display font-bold text-primary">{formatWon(campaign.goal)}</div>
                        <p className="text-sm leading-relaxed text-stone-400">현재 캠페인에 설정된 목표 예산 기준 금액입니다.</p>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {activeTab === "contributors" && (
                <div className="space-y-4">
                  {safeRecentDonors.length > 0 ? (
                    safeRecentDonors.map((donor, index) => (
                      <div key={index} className="flex items-center justify-between rounded-3xl border border-line bg-white p-6">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-400">
                            <Users size={24} />
                          </div>
                          <div>
                            <div className="font-bold text-ink">{donor.name}</div>
                            <div className="text-xs text-stone-400">{donor.time}</div>
                          </div>
                        </div>
                        <div className="text-lg font-display font-bold text-primary">{formatWon(Number(donor.amount ?? 0))}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-stone-500">공개된 기부자 정보가 없습니다.</p>
                  )}
                </div>
              )}

              {activeTab === "beneficiary" && (
                <div className="grid gap-8 md:grid-cols-2">
                  <div className="space-y-6 rounded-[40px] border border-line bg-white p-8">
                    <h4 className="mb-4 text-2xl font-display font-bold text-ink">수혜자 정보</h4>
                    <div>
                      <div className="mb-2 text-xs font-bold uppercase tracking-widest text-stone-400">지원 대상</div>
                      <div className="text-lg font-bold text-ink">{campaign.beneficiary?.title || "-"}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5 text-primary">
                        <Users size={20} />
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-widest text-stone-400">수혜 규모</div>
                        <div className="font-bold text-ink">{campaign.category || "-"}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5 text-primary">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-widest text-stone-400">목적</div>
                        <div className="font-bold text-ink">{campaign.beneficiary?.target || "-"}</div>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-[40px] border border-line shadow-lg">
                    <img src={safeImages[1] ?? safeImages[0]} alt={campaign.beneficiary?.title || campaign.title} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                </div>
              )}

              {activeTab === "proof" && (
                <div className="space-y-8">
                  <div>
                    <h3 className="mb-4 text-2xl font-display font-bold text-ink">활동 사진</h3>
                    {safeImages.length > 0 ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {safeImages.filter(Boolean).map((img, index) => (
                          <div key={`${img}-${index}`} className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
                            <img
                              src={img}
                              alt={`${campaign.shortTitle || campaign.title} 활동 증빙 ${index + 1}`}
                              className="h-52 w-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-stone-500">등록된 활동 사진이 없습니다.</p>
                    )}
                  </div>

                  <div>
                    <h3 className="mb-4 text-2xl font-display font-bold text-ink">활동 증빙 서류</h3>
                    {safeDocs.length > 0 ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {safeDocs.map((doc, index) => (
                          <div key={`${doc.name}-${index}`} className="group flex items-center justify-between rounded-3xl border border-line bg-white p-6 transition-colors hover:border-primary/30">
                            <div className="flex items-center gap-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-50 text-stone-400 transition-colors group-hover:text-primary">
                                <FileText size={24} />
                              </div>
                              <div>
                                <div className="font-bold text-ink">{doc.name}</div>
                                <div className="text-xs text-stone-400">{doc.size}</div>
                              </div>
                            </div>
                            <a href={doc.href} download={doc.name} className="p-2 text-stone-400 transition-colors hover:text-primary">
                              <Download size={20} />
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-stone-500">등록된 활동 증빙 서류가 없습니다.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="sticky top-32 space-y-8">
              <div className="rounded-[40px] border border-line bg-white p-10 shadow-2xl shadow-stone-200/50">
                <div className="mb-8">
                  <div className="mb-2 text-4xl font-display font-bold text-ink">{formatWon(campaign.raised)}</div>
                  <div className="text-sm font-medium text-stone-400">목표 {formatWon(campaign.goal)} 중 모금액</div>
                </div>

                <div className="mb-8">
                  <div className="mb-4 h-3 overflow-hidden rounded-full bg-stone-100">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${campaign.progress}%` }} transition={{ duration: 1.5, ease: "easeOut" }} className="h-full bg-primary" />
                  </div>
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-primary">{campaign.progress}% 달성</span>
                    <span className="text-ink">{campaign.daysLeft}일 남음</span>
                  </div>
                </div>

                <div className="mb-10 space-y-4">
                  <div className="flex items-center gap-3 text-sm text-stone-600">
                    <Users size={18} className="text-stone-300" />
                    <span className="font-bold text-ink">{safeDonors.toLocaleString()}명</span>
                    의 기부자가 참여했습니다.
                  </div>
                  <div className="flex items-center gap-3 text-sm text-stone-600">
                    <Heart size={18} className="text-primary" fill="currentColor" />
                    모든 후원금은 투명하게 공개됩니다.
                  </div>
                </div>

                <Link to={`/campaign/${campaign.id}/donate`} className="mb-4 flex w-full items-center justify-center rounded-full bg-primary py-4 text-base font-bold text-white shadow-xl shadow-primary/20 transition-all hover:bg-primary/90">
                  지금 기부하기
                </Link>
                <button type="button" onClick={handleShare} className="flex w-full items-center justify-center gap-2 rounded-full border border-line py-4 text-base font-bold text-stone-500 transition-all hover:bg-stone-50">
                  <Share2 size={20} />
                  공유하기
                </button>
                {shareMessage && <p className="mt-3 text-center text-sm font-bold text-primary">{shareMessage}</p>}
              </div>

              <div className="rounded-[40px] border border-line bg-white p-10">
                <h4 className="mb-8 text-2xl font-display font-bold text-ink">최근 기부자</h4>
                <div className="space-y-6">
                  {safeRecentDonors.length > 0 ? (
                    safeRecentDonors.map((donor, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-50 text-stone-300">
                            <Heart size={16} fill="currentColor" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-ink">{donor.name}</div>
                            <div className="text-[10px] text-stone-400">{donor.time}</div>
                          </div>
                        </div>
                        <div className="text-sm font-bold text-primary">{formatWon(Number(donor.amount ?? 0))}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-stone-500">최근 기부자 정보가 없습니다.</p>
                  )}
                </div>
                <button type="button" onClick={() => setActiveTab("contributors")} className="mt-8 w-full text-sm font-bold text-stone-400 transition-colors hover:text-primary">
                  전체 보기
                </button>
              </div>

              <div className="relative overflow-hidden rounded-[40px] bg-white p-10">
                <h4 className="relative mb-6 text-2xl font-display font-bold text-ink">기부단체 정보</h4>
                <div className="relative space-y-4">
                  <div>
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-stone-500">기부단체명</div>
                    <div className="mb-2 text-sm font-bold text-ink">{campaign.organization?.name}</div>
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-stone-500">기부단체 소개</div>
                    <div className="mb-2 text-sm text-stone-700">{campaign.organization?.description}</div>
                  </div>
                  <div>
                    <img src={campaign.organization?.image || safeImages[0]} alt={campaign.organization?.name || "기부단체"} className="h-20 w-full rounded-xl object-cover" referrerPolicy="no-referrer" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
