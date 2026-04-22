import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  Check,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Loader2,
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
import noResultImage from "../../../img/noResult.png";
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
const CATEGORY_CHIPS = [{ label: ALL_CATEGORY, icon: null }, ...QUICK_CATEGORIES];
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const FALLBACK_CAMPAIGN_IMAGE =
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070&auto=format&fit=crop";
const EMPTY_RESULT_IMAGE = noResultImage;
const CATEGORY_META = {
  "아동/청소년": {
    icon: BookOpen,
    color: "text-primary",
    apiCategory: "CHILD_YOUTH",
    badgeClass: "border-rose-200 bg-rose-50/95 text-rose-600"
  },
  "어르신": {
    icon: Droplets,
    color: "text-blue-400",
    apiCategory: "SENIOR",
    badgeClass: "border-sky-200 bg-sky-50/95 text-sky-600"
  },
  장애인: {
    icon: HeartPulse,
    color: "text-secondary",
    apiCategory: "DISABLED",
    badgeClass: "border-violet-200 bg-violet-50/95 text-violet-600"
  },
  동물: {
    icon: PawPrint,
    color: "text-amber-500",
    apiCategory: "ANIMAL",
    badgeClass: "border-amber-200 bg-amber-50/95 text-amber-700"
  },
  환경: {
    icon: Leaf,
    color: "text-emerald-500",
    apiCategory: "ENVIRONMENT",
    badgeClass: "border-emerald-200 bg-emerald-50/95 text-emerald-700"
  },
  기타: {
    icon: Sparkles,
    color: "text-primary",
    apiCategory: "ETC",
    badgeClass: "border-stone-200 bg-white/95 text-stone-600"
  }
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
    foundationName: item?.foundationName || "",
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
  const searchInputRef = useRef(null);
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
    <div className="min-h-screen bg-[#FFFDFB] pt-52 pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 text-center">
          <h1 className="text-5xl md:text-6xl font-display font-bold text-ink mb-12">
            우리들의 <span className="text-primary italic">나눔</span> 이야기
          </h1>

          <div className="mt-4 mx-auto max-w-5xl p-0">
            <div className="flex items-center justify-center gap-3 overflow-x-auto overflow-y-visible py-1">
              <div className="flex flex-nowrap items-center justify-center gap-2">
                {CATEGORY_CHIPS.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleSelectCategory(item.label)}
                    className={`inline-flex h-14 shrink-0 items-center gap-2 rounded-full border-2 px-5 text-[15px] font-extrabold transition-all hover:-translate-y-1 ${
                      selectedCategory === item.label
                        ? "border-primary bg-primary text-white shadow-[0_8px_16px_-10px_rgba(255,138,101,0.55)] ring-2 ring-primary/30"
                        : "border-line bg-white text-ink hover:border-primary/40"
                    }`}
                    aria-pressed={selectedCategory === item.label}
                  >
                    {item.icon ? (
                      <img
                        src={item.icon}
                        alt={item.label}
                        className="h-6 w-6 object-contain"
                        loading="lazy"
                      />
                    ) : null}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <div className="flex overflow-hidden rounded-full border-2 border-primary/25 bg-white">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="어떤 캠페인을 찾고 있나요?"
                  className="w-full border-none bg-transparent pl-8 pr-5 py-3.5 text-base font-semibold text-ink placeholder:text-stone-400 caret-primary outline-none focus:outline-none focus:ring-0"
                />
                <button
                  type="button"
                  className="shrink-0 grid w-14 place-items-center border-none border-l border-primary/20 bg-[#FFF7F1] text-primary outline-none transition-colors hover:bg-primary/10 focus:outline-none focus:ring-0"
                  aria-label="검색"
                >
                  <Search size={22} strokeWidth={2.2} />
                </button>
              </div>
              <div className="mt-3 flex justify-end pr-2 md:pr-3">
                <button
                  type="button"
                  onClick={() => setExcludeClosed((previous) => !previous)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border-[1.5px] px-4 py-2 text-sm font-bold transition-colors ${
                    excludeClosed
                      ? "border-primary bg-primary text-white"
                      : "border-line bg-white text-stone-500 hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  <Check
                    size={15}
                    className={excludeClosed ? "opacity-100" : "opacity-25"}
                  />
                  마감 제외
                </button>
              </div>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="pt-8 pb-4 text-center text-primary/80 font-bold">
            <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-primary" />
            캠페인 목록을 불러오는 중입니다.
          </div>
        )}

        {error && !isLoading && (
          <div className="rounded-[2rem] border-2 border-line bg-white p-10 text-center text-stone-500">
            {error}
          </div>
        )}

        {!isLoading && !error && (
          <div className="mt-14">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
            {visibleCampaigns.map((camp) => {
              const normalizedCategory = normalizeCategory(camp.category);
              const categoryMeta = CATEGORY_META[normalizedCategory] || CATEGORY_META.기타;

              return (
                <Link
                  key={camp.id}
                  to={`/campaign/${camp.id}`}
                  className="group block overflow-hidden rounded-[2.2rem] border-2 border-[#F2DAD3] bg-white p-0 transition-all duration-300 hover:-translate-y-1 hover:border-[#F0B5A3] hover:shadow-[0_12px_24px_-14px_rgba(242,140,109,0.35)]"
                >
                <div className="relative aspect-[16/9] overflow-hidden bg-[#F7F7F5]">
                  <img
                    src={camp.image}
                    alt={camp.shortTitle}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[0.1] sepia-[0.05]"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-5 left-5 right-5 flex items-start justify-between gap-2">
                    <div
                      className={`backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold shadow-lg border ${categoryMeta.badgeClass}`}
                    >
                      {normalizedCategory}
                    </div>
                    <div
                      className={`px-2.5 py-1 rounded-full text-[12px] font-bold shadow border ${
                        isClosedCampaign(camp)
                          ? "bg-stone-800/90 text-white border-stone-700"
                          : "bg-white/90 text-primary border-line"
                      }`}
                    >
                      {getDeadlineLabel(camp)}
                    </div>
                  </div>
                </div>

                <div className="px-10 pb-10 pt-7">
                  <div className="flex items-start gap-4 mb-8">
                    <div className={`mt-1 w-12 h-12 rounded-2xl bg-stone-50 flex items-center justify-center ${camp.color}`}>
                      <camp.icon size={24} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-2xl font-display font-bold text-ink leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {camp.shortTitle}
                      </h3>
                      <p className="mt-1 text-sm font-medium text-stone-400 line-clamp-1">
                        {camp.foundationName || "기부단체"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5 mb-3">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-primary">{camp.progress}% 달성</span>
                      <span className={isClosedCampaign(camp) ? "text-stone-500" : "text-emerald-600"}>
                        {isClosedCampaign(camp) ? "마감" : "모집중"}
                      </span>
                    </div>
                    <div className="h-3 rounded-full overflow-hidden border border-line bg-stone-100">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${camp.progress}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-primary"
                      />
                    </div>
                    <div className="text-xs text-stone-400 text-right font-bold">목표액 {formatWon(camp.goal)}</div>
                  </div>
                </div>
                </Link>
              );
            })}
          </div>
          </div>
        )}

        {!isLoading && !error && visibleCampaigns.length === 0 && (
          <div className="mt-16 bg-white rounded-[3rem] p-12 text-center">
            <div className="mx-auto mb-6 h-40 w-40 overflow-hidden">
              <img
                src={EMPTY_RESULT_IMAGE}
                alt="검색 결과 없음"
                className="h-full w-full object-contain"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
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
                window.requestAnimationFrame(() => {
                  searchInputRef.current?.focus();
                });
              }}
              className="mx-auto flex items-center justify-center rounded-full bg-primary px-5 py-2 text-base font-bold text-white transition-colors hover:bg-primary/90"
            >
              다시 검색하기
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






