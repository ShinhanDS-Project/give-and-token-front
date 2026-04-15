import { useCallback, useEffect, useState } from "react";
import CampaignCard from "../components/CampaignCard";
import { getCampaignList } from "../data/campaignApi";
import "./CampaignSearchPage.css";

const SEARCH_OPTIONS = [
  { value: "", label: "캠페인명" },
  { value: "foundation", label: "재단명" }
];

const CATEGORY_OPTIONS = [
  { value: "", label: "전체" },
  { value: "CHILD_YOUTH", label: "아동/청소년" },
  { value: "SENIOR", label: "어르신" },
  { value: "DISABLED", label: "장애인" },
  { value: "ANIMAL", label: "동물" },
  { value: "ENVIRONMENT", label: "환경" },
  { value: "ETC", label: "기타" }
];

const SORT_OPTIONS = [
  { value: "deadline", label: "마감 임박순" },
  { value: "participation", label: "참여(모금액) 높은순" }
];

function CampaignSearchPage() {
  const [searchInput, setSearchInput] = useState("");
  const [searchType, setSearchType] = useState(SEARCH_OPTIONS[0].value);
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSort, setSelectedSort] = useState(SORT_OPTIONS[0].value);
  const [excludeClosed, setExcludeClosed] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCampaigns = useCallback(async ({
    keyword = "",
    type = "",
    category = "",
    sort = SORT_OPTIONS[0].value
  } = {}) => {
    try {
      setLoading(true);
      setError("");

      const response = await getCampaignList({
        sort,
        keyword,
        searchType: type,
        category
      });

      setCampaigns(response);
      setAppliedKeyword(keyword);
    } catch (requestError) {
      console.error(requestError);
      setError("캠페인 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCampaigns({
      category: selectedCategory,
      sort: selectedSort
    });
  }, [loadCampaigns]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    loadCampaigns({
      keyword: searchInput.trim(),
      type: searchType,
      category: selectedCategory,
      sort: selectedSort
    });
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    loadCampaigns({
      keyword: searchInput.trim(),
      type: searchType,
      category,
      sort: selectedSort
    });
  };

  const handleSortChange = (event) => {
    const nextSort = event.target.value;
    setSelectedSort(nextSort);
    loadCampaigns({
      keyword: searchInput.trim(),
      type: searchType,
      category: selectedCategory,
      sort: nextSort
    });
  };

  const handleReset = () => {
    setSearchInput("");
    setSearchType(SEARCH_OPTIONS[0].value);
    setSelectedCategory("");
    setSelectedSort(SORT_OPTIONS[0].value);
    setExcludeClosed(false);
    loadCampaigns({
      category: "",
      sort: SORT_OPTIONS[0].value
    });
  };

  const isClosedCampaign = (campaign) => {
    if (!campaign?.endAt) {
      return false;
    }

    const endAtTime = new Date(campaign.endAt).getTime();
    if (Number.isNaN(endAtTime)) {
      return false;
    }

    return endAtTime <= Date.now();
  };

  const visibleCampaigns = excludeClosed
    ? campaigns.filter((campaign) => !isClosedCampaign(campaign))
    : campaigns;

  const hasSearchKeyword = appliedKeyword.trim().length > 0;

  return (
    <main className="campaign-page">
      <section className="campaign-hero">
        <p className="campaign-hero__eyebrow">Give And Token</p>
        <h1>기부 캠페인 검색</h1>
        <p className="campaign-hero__description">
          검색하지 않으면 전체 캠페인 목록을 보여주고, 검색하면 하단에서 결과를 바로 확인합니다.
        </p>

        <form className="campaign-search" onSubmit={handleSearchSubmit}>
          <select
            value={searchType}
            onChange={(event) => setSearchType(event.target.value)}
            aria-label="검색 조건"
          >
            {SEARCH_OPTIONS.map((option) => (
              <option key={option.value || "title"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="캠페인명 또는 재단명을 입력하세요"
          />

          <button type="submit">검색</button>
          <button type="button" className="campaign-search__reset" onClick={handleReset}>
            초기화
          </button>
        </form>

        <div className="campaign-categories" aria-label="카테고리 필터">
          {CATEGORY_OPTIONS.map((category) => (
            <button
              key={category.value || "all"}
              type="button"
              className={`campaign-categories__button${
                selectedCategory === category.value ? " is-active" : ""
              }`}
              onClick={() => handleCategoryClick(category.value)}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="campaign-toolbar">
          <label htmlFor="campaign-sort">정렬</label>
          <select id="campaign-sort" value={selectedSort} onChange={handleSortChange}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={`campaign-toolbar__toggle${excludeClosed ? " is-active" : ""}`}
            onClick={() => setExcludeClosed((prev) => !prev)}
          >
            마감 제외
          </button>
        </div>
      </section>

      <section className="campaign-list-section">
        <div className="campaign-list-section__header">
          <h2>{hasSearchKeyword ? `"${appliedKeyword}" 검색 결과` : "기부 캠페인"}</h2>
          <span>{visibleCampaigns.length}건</span>
        </div>

        {loading && <div className="campaign-message">목록을 불러오는 중입니다.</div>}
        {!loading && error && <div className="campaign-message campaign-message--error">{error}</div>}

        {!loading && !error && visibleCampaigns.length === 0 && (
          <div className="campaign-message">
            {hasSearchKeyword
              ? "검색 결과가 없습니다. 다른 검색어로 다시 시도해보세요."
              : "표시할 캠페인이 없습니다."}
          </div>
        )}

        {!loading && !error && visibleCampaigns.length > 0 && (
          <div className="campaign-grid">
            {visibleCampaigns.map((campaign) => (
              <CampaignCard key={campaign.campaignNo} campaign={campaign} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default CampaignSearchPage;
