import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  ArrowRight,
  ChevronDown,
  Sparkles,
  CircleHelp,
  BookOpen,
  Droplets,
  HeartPulse,
  Leaf,
  PawPrint
} from "lucide-react";
import childIcon from "../../../img/category/child.svg";
import seniorIcon from "../../../img/category/senior.svg";
import disabledIcon from "../../../img/category/disabled.svg";
import animalIcon from "../../../img/category/animal.svg";
import environmentIcon from "../../../img/category/environment.svg";
import etcIcon from "../../../img/category/etc.svg";
import { getCampaignList } from "../api/campaignApi";
import { formatWon } from "../data/campaigns";

const ALL_CATEGORY = "전체";
const FILTER_CATEGORIES = ["아동/청소년", "어르신", "장애인", "동물", "환경", "기타"];
const QUICK_CATEGORIES = [
  { label: "아동/청소년", icon: childIcon },
  { label: "어르신", icon: seniorIcon },
  { label: "장애인", icon: disabledIcon },
  { label: "동물", icon: animalIcon },
  { label: "환경", icon: environmentIcon },
  { label: "기타", icon: etcIcon }
];
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const FALLBACK_CAMPAIGN_IMAGE =
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070&auto=format&fit=crop";
const CATEGORY_META = {
  "아동/청소년": { icon: BookOpen, color: "text-primary", apiCategory: "CHILD_YOUTH" },
  "어르신": { icon: Droplets, color: "text-blue-400", apiCategory: "SENIOR" },
  장애인: { icon: HeartPulse, color: "text-secondary", apiCategory: "DISABLED" },
  동물: { icon: PawPrint, color: "text-amber-500", apiCategory: "ANIMAL" },
  환경: { icon: Leaf, color: "text-emerald-500", apiCategory: "ENVIRONMENT" },
  기타: { icon: Sparkles, color: "text-primary", apiCategory: "ETC" }
};

function normalizeCategory(value) {
  const text = String(value || "").trim().toLowerCase();

  if (!text) return "기타";

  if (text.includes("child") || text.includes("youth") || text.includes("아동") || text.includes("청소년")) {
    return "아동/청소년";
  }

  if (text.includes("senior") || text.includes("elder") || text.includes("old") || text.includes("어르신") || text.includes("노인")) {
    return "어르신";
  }

  if (text.includes("disabled") || text.includes("장애")) {
    return "장애인";
  }

  if (text.includes("animal") || text.includes("동물")) {
    return "동물";
  }

  if (text.includes("environment") || text.includes("env") || text.includes("지구") || text.includes("환경")) {
    return "환경";
  }

  return "기타";
}

function normalizeQueryCategory(value) {
  if (!value) return ALL_CATEGORY;

  const normalized = normalizeCategory(value);
  return FILTER_CATEGORIES.includes(normalized) ? normalized : ALL_CATEGORY;
}

function toApiCategory(categoryLabel) {
  if (!categoryLabel || categoryLabel === ALL_CATEGORY) {
    return "";
  }

  return CATEGORY_META[categoryLabel]?.apiCategory || "";
}

function normalizeImagePath(imagePath) {
  if (!imagePath) {
    return FALLBACK_CAMPAIGN_IMAGE;
  }

  const rawPath = String(imagePath).trim();
  if (!rawPath) {
    return FALLBACK_CAMPAIGN_IMAGE;
  }

  if (/^(https?:\/\/|data:image\/|blob:)/i.test(rawPath)) {
    return rawPath;
  }

  const noFileScheme = rawPath.replace(/^file:(\/\/\/|\/\/)?/i, "");
  const normalized = noFileScheme.replace(/\\/g, "/");
  const uploadMatch = normalized.match(/(?:^|\/)uploads\/(.+)$/i);

  if (uploadMatch) {
    const uploadPath = `/uploads/${uploadMatch[1].replace(/^\/+/, "")}`;
    return API_BASE_URL ? `${API_BASE_URL}${uploadPath}` : uploadPath;
  }

  if (/^[a-zA-Z]:\//.test(normalized)) {
    return FALLBACK_CAMPAIGN_IMAGE;
  }

  if (!API_BASE_URL) {
    return rawPath;
  }

  return rawPath.startsWith("/") ? `${API_BASE_URL}${rawPath}` : `${API_BASE_URL}/${rawPath}`;
}

function toProgress(currentAmount, targetAmount) {
  if (targetAmount <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.floor((currentAmount / targetAmount) * 100)));
}

function toCampaignCard(item) {
  const goal = Number(item?.targetAmount || 0);
  const raised = Number(item?.currentAmount || 0);
  const normalizedCategory = normalizeCategory(item?.category);
  const visual = CATEGORY_META[normalizedCategory] || CATEGORY_META.기타;

  return {
    id: Number(item?.campaignNo || 0),
    shortTitle: item?.title || "캠페인",
    summary: item?.foundationName ? `${item.foundationName} 캠페인` : "따뜻한 나눔에 함께해주세요.",
    category: normalizedCategory,
    image: normalizeImagePath(item?.imagePath),
    status: item?.status || "",
    startAt: item?.startAt || null,
    endAt: item?.endAt || null,
    progress: toProgress(raised, goal),
    goal,
    raised,
    donors: 0,
    icon: visual.icon,
    color: visual.color
  };
}

export default function CampaignList() {
  const LOAD_MORE_STEP = 6;
  const [searchParams, setSearchParams] = useSearchParams();
  const [campaigns, setCampaigns] = useState([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(() =>
    normalizeQueryCategory(searchParams.get("category"))
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [excludeClosed, setExcludeClosed] = useState(false);
  const [showCategoryTip, setShowCategoryTip] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    setSelectedCategory(normalizeQueryCategory(searchParams.get("category")));
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await getCampaignList({
          page: 1,
          size: LOAD_MORE_STEP,
          sort: "deadline",
          keyword: debouncedQuery,
          searchType: "",
          category: toApiCategory(selectedCategory),
          includeClosed: !excludeClosed
        });

        if (isMounted) {
          setCampaigns((response.items || []).map(toCampaignCard));
          setCurrentPage(response.pageInfo?.page || 1);
          setHasNextPage(Boolean(response.pageInfo?.hasNext));
        }
      } catch {
        if (isMounted) {
          setError("캠페인 목록을 불러오지 못했습니다.");
          setCampaigns([]);
          setCurrentPage(1);
          setHasNextPage(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, selectedCategory, excludeClosed]);

  const handleSelectCategory = (category) => {
    const nextCategory = selectedCategory === category ? ALL_CATEGORY : category;
    setSelectedCategory(nextCategory);

    const next = new URLSearchParams(searchParams);
    if (nextCategory === ALL_CATEGORY) {
      next.delete("category");
    } else {
      next.set("category", nextCategory);
    }

    setSearchParams(next);
  };

  const isClosedCampaign = (campaign) => {
    const status = String(campaign?.status || "").trim().toUpperCase();

    if (status === "ACTIVE" || status === "ONGOING" || status === "IN_PROGRESS") {
      return false;
    }

    if (
      status === "ENDED" ||
      status === "CLOSED" ||
      status === "COMPLETED" ||
      status === "SETTLED" ||
      status === "CANCELLED"
    ) {
      return true;
    }

    const endTime = new Date(campaign?.endAt || "").getTime();
    if (Number.isFinite(endTime) && endTime < Date.now()) {
      return true;
    }

    return false;
  };

  const getDeadlineLabel = (campaign) => {
    if (!campaign?.endAt) {
      return "마감미정";
    }

    const endTime = new Date(campaign.endAt).getTime();
    if (Number.isNaN(endTime)) {
      return "마감미정";
    }

    const diff = endTime - Date.now();
    if (diff < 0) {
      return "마감";
    }

    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days === 0 ? "D-Day" : `D-${days}`;
  };

  const visibleCampaigns = campaigns;
  const hasMoreCampaigns = hasNextPage;

  const handleLoadMore = async () => {
    if (isLoadingMore || isLoading || !hasNextPage) {
      return;
    }

    const nextPage = currentPage + 1;

    try {
      setIsLoadingMore(true);
      setError("");

      const response = await getCampaignList({
        page: nextPage,
        size: LOAD_MORE_STEP,
        sort: "deadline",
        keyword: debouncedQuery,
        searchType: "",
        category: toApiCategory(selectedCategory),
        includeClosed: !excludeClosed
      });

      const nextItems = (response.items || []).map(toCampaignCard);
      setCampaigns((previous) => [...previous, ...nextItems]);
      setCurrentPage(response.pageInfo?.page || nextPage);
      setHasNextPage(Boolean(response.pageInfo?.hasNext));
    } catch {
      setError("캠페인 목록을 더 불러오지 못했습니다.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="pt-52 pb-32 watercolor-bg min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-20 text-center">
          <div className="inline-flex items-center gap-2 text-primary font-bold text-sm mb-6 bg-white px-6 py-2 rounded-full border-2 border-line shadow-sm">
            <Sparkles size={16} fill="currentColor" />
            지금 진행 중인 캠페인
          </div>
          <h1 className="text-5xl md:text-6xl font-display font-bold text-ink mb-12">
            진행 중인 <span className="text-primary italic">나눔</span> 이야기
          </h1>

          <div className="flex flex-col md:flex-row gap-6 max-w-4xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" size={20} />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="어떤 캠페인을 찾고 있나요?"
                className="w-full bg-white border-4 border-line rounded-3xl pl-16 pr-8 py-6 text-sm font-bold text-ink placeholder:text-stone-400 caret-primary focus:outline-none focus:border-primary/30 transition-all shadow-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => setExcludeClosed((previous) => !previous)}
              className={`shrink-0 rounded-2xl border-2 px-5 py-3 text-sm font-bold transition-all ${
                excludeClosed
                  ? "border-primary bg-primary text-white"
                  : "border-line bg-white text-stone-500 hover:border-primary/30 hover:text-primary"
              }`}
            >
              마감 제외
            </button>
          </div>

          <div className="mt-6 max-w-3xl mx-auto rounded-[2rem] border-2 border-line bg-white p-4 shadow-sm">
            <div className="relative mb-3 flex items-center justify-between">
              <h4 className="flex items-center gap-2 text-lg font-display font-bold text-ink">
                <Sparkles size={16} className="text-primary" />
                카테고리별 찾기
              </h4>
              <button
                type="button"
                onClick={() => setShowCategoryTip((prev) => !prev)}
                className="rounded-full p-1 text-stone-400 transition hover:bg-surface hover:text-primary"
                aria-label="카테고리 안내 보기"
              >
                <CircleHelp size={16} />
              </button>
              {showCategoryTip && (
                <div className="absolute right-0 top-8 z-10 max-w-[240px] rounded-xl border border-line bg-white px-3 py-2 text-left text-xs font-medium text-stone-500 shadow-lg">
                  같은 카테고리를 다시 누르면 전체 보기로 돌아갑니다.
                </div>
              )}
            </div>

            <div className="flex flex-nowrap items-start justify-center gap-2 overflow-x-auto pb-1">
              {QUICK_CATEGORIES.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleSelectCategory(item.label)}
                  className={`h-[90px] w-[90px] shrink-0 rounded-2xl border p-2 text-center transition-all ${
                    selectedCategory === item.label
                      ? "border-primary/60 bg-primary/5"
                      : "border-line bg-[#FFFDFB] hover:border-primary/40"
                  }`}
                  aria-pressed={selectedCategory === item.label}
                >
                  <img
                    src={item.icon}
                    alt={item.label}
                    className="mx-auto h-6 w-6 object-contain"
                    loading="lazy"
                  />
                  <p
                    className={`mt-1 text-[11px] font-bold leading-tight ${
                      selectedCategory === item.label ? "text-primary" : "text-ink"
                    }`}
                  >
                    {item.label}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="rounded-[2rem] border-2 border-line bg-white p-10 text-center text-stone-500">
            캠페인 목록을 불러오는 중입니다.
          </div>
        )}

        {error && !isLoading && (
          <div className="rounded-[2rem] border-2 border-line bg-white p-10 text-center text-stone-500">
            {error}
          </div>
        )}

        {!isLoading && !error && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
            {visibleCampaigns.map((camp) => (
              <Link
                key={camp.id}
                to={`/campaign/${camp.id}`}
                className="storybook-card group block p-0"
              >
                <div className="aspect-video overflow-hidden relative">
                  <img
                    src={camp.image}
                    alt={camp.shortTitle}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[0.1] sepia-[0.05]"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-6 left-6 right-6 flex items-start justify-between gap-2">
                    <div className="bg-white/90 backdrop-blur-md px-5 py-2 rounded-full text-xs font-bold text-ink shadow-lg border border-line">
                      {normalizeCategory(camp.category)}
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-[11px] font-bold shadow border ${
                        isClosedCampaign(camp)
                          ? "bg-stone-800/90 text-white border-stone-700"
                          : "bg-white/90 text-primary border-line"
                      }`}
                    >
                      {getDeadlineLabel(camp)}
                    </div>
                  </div>
                </div>

                <div className="p-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-12 h-12 rounded-2xl bg-stone-50 flex items-center justify-center ${camp.color}`}>
                      <camp.icon size={24} />
                    </div>
                    <h3 className="text-2xl font-display font-bold text-ink leading-tight group-hover:text-primary transition-colors">
                      {camp.shortTitle}
                    </h3>
                  </div>

                  <div className="space-y-5 mb-10">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-primary">{camp.progress}% 달성</span>
                      <span className={isClosedCampaign(camp) ? "text-stone-500" : "text-emerald-600"}>
                        {isClosedCampaign(camp) ? "마감" : "모집중"}
                      </span>
                    </div>
                    <div className="h-4 bg-stone-100 rounded-full overflow-hidden p-1 border border-line">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${camp.progress}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-primary rounded-full"
                      />
                    </div>
                    <div className="text-xs text-stone-400 text-right font-bold">목표액 {formatWon(camp.goal)}</div>
                  </div>

                  <button className="w-full py-5 bg-stone-50 text-stone-500 font-bold rounded-2xl group-hover:bg-primary group-hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm">
                    자세히 보기 <ArrowRight size={18} />
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!isLoading && !error && visibleCampaigns.length === 0 && (
          <div className="mt-16 bg-white border-4 border-line rounded-[3rem] p-12 text-center">
            <h2 className="text-3xl font-display font-bold text-ink mb-4">조건에 맞는 캠페인이 아직 없어요</h2>
            <p className="text-stone-500 font-medium mb-8">검색어를 줄이거나 다른 카테고리를 선택해 보세요</p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSelectedCategory(ALL_CATEGORY);
                setExcludeClosed(false);
                const next = new URLSearchParams(searchParams);
                next.delete("category");
                setSearchParams(next);
              }}
              className="btn-fairytale inline-flex"
            >
              필터 초기화
            </button>
          </div>
        )}

        {!isLoading && !error && visibleCampaigns.length > 0 && hasMoreCampaigns && (
          <div className="mt-10 flex items-center justify-center">
            <button
              type="button"
              onClick={handleLoadMore}
              className="rounded-full border-2 border-line bg-white p-3 text-stone-500 transition hover:border-primary/40 hover:text-primary"
              aria-label="캠페인 더보기"
              disabled={isLoadingMore}
            >
              <ChevronDown size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
