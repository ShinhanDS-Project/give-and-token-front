import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getCampaigns, getCategoryOptions } from "../data/campaignApi";

function formatAmount(value) {
  return `${Number(value || 0).toLocaleString()} KRW`;
}

function getProgress(currentAmount, targetAmount) {
  if (!targetAmount || targetAmount <= 0) {
    return 0;
  }

  return Math.min(100, Math.floor(((currentAmount || 0) * 100) / targetAmount));
}

function getDday(endAt) {
  if (!endAt) {
    return "D-0";
  }

  const diffMs = new Date(endAt).getTime() - Date.now();
  const days = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  return `D-${days}`;
}

function CampaignCard({ campaign }) {
  const progress = getProgress(campaign.currentAmount, campaign.targetAmount);

  return (
    <Link to={`/campaigns/${campaign.campaignNo}`} className="campaign-card">
      <div className="campaign-card__image-wrap">
        {campaign.imagePath ? (
          <img src={campaign.imagePath} alt={campaign.title} className="campaign-card__image" />
        ) : (
          <div className="campaign-card__image-empty">No image</div>
        )}
        <div className="campaign-card__badges">
          <span className="campaign-chip campaign-chip--strong">{campaign.category}</span>
          <span className="campaign-chip">{getDday(campaign.endAt)}</span>
        </div>
      </div>

      <div className="campaign-card__body">
        <h3>{campaign.title}</h3>
        <p className="campaign-card__foundation">{campaign.foundationName || "No foundation name"}</p>

        <div className="campaign-card__stats">
          <div>
            <strong>{progress}%</strong>
            <span>Progress</span>
          </div>
          <div>
            <strong>{formatAmount(campaign.currentAmount)}</strong>
            <span>Raised</span>
          </div>
        </div>

        <div className="campaign-progress">
          <span style={{ width: `${progress}%` }} />
        </div>
        <p className="campaign-card__goal">Goal {formatAmount(campaign.targetAmount)}</p>
      </div>
    </Link>
  );
}

function CampaignListPage() {
  const categories = useMemo(() => getCategoryOptions(), []);
  const [sort, setSort] = useState("deadline");
  const [searchType, setSearchType] = useState("title");
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const response = await getCampaigns({ sort, searchType, keyword, category });

        if (!ignore) {
          setItems(response);
        }
      } catch {
        if (!ignore) {
          setError("Failed to load campaign list.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [sort, searchType, keyword, category]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setKeyword(keywordInput.trim());
  };

  const handleReset = () => {
    setSort("deadline");
    setSearchType("title");
    setKeywordInput("");
    setKeyword("");
    setCategory("");
  };

  return (
    <section className="campaign-page">
      <div className="campaign-hero panel">
        <div>
          <p className="hero__eyebrow">Campaign</p>
          <h2>Campaign discovery based on the backend package</h2>
          <p className="hero__text">
            This screen mirrors the campaign list flow from the backend package: filter,
            keyword search, sort, and public campaign cards.
          </p>
        </div>

        <div className="campaign-hero__actions">
          <Link to="/campaigns/register" className="campaign-primary-button">
            Register Campaign
          </Link>
        </div>
      </div>

      <form className="campaign-filter panel" onSubmit={handleSubmit}>
        <div className="campaign-filter__grid">
          <label className="campaign-field">
            <span>Search Type</span>
            <select value={searchType} onChange={(event) => setSearchType(event.target.value)}>
              <option value="title">Campaign title</option>
              <option value="foundation">Foundation name</option>
            </select>
          </label>

          <label className="campaign-field">
            <span>Keyword</span>
            <input
              type="text"
              value={keywordInput}
              onChange={(event) => setKeywordInput(event.target.value)}
              placeholder="Search campaigns"
            />
          </label>

          <label className="campaign-field">
            <span>Category</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">All</option>
              {categories.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <div className="campaign-filter__buttons">
            <button type="submit" className="campaign-primary-button">
              Search
            </button>
            <button type="button" className="ghost-button" onClick={handleReset}>
              Reset
            </button>
          </div>
        </div>
      </form>

      <div className="campaign-toolbar">
        <div className="campaign-sort">
          <button
            type="button"
            className={sort === "deadline" ? "is-active" : ""}
            onClick={() => setSort("deadline")}
          >
            Deadline first
          </button>
          <button
            type="button"
            className={sort === "participation" ? "is-active" : ""}
            onClick={() => setSort("participation")}
          >
            Most funded
          </button>
        </div>

        <p className="campaign-toolbar__summary">
          {loading ? "Loading campaigns..." : `${items.length} campaigns`}
        </p>
      </div>

      {loading && <div className="panel empty-state">Loading campaign list...</div>}
      {error && <div className="panel empty-state">{error}</div>}

      {!loading && !error && !items.length && (
        <div className="panel empty-state">
          <strong>No results</strong>
          <p className="empty-state__text">No campaign matched the current filters.</p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="campaign-grid">
          {items.map((campaign) => (
            <CampaignCard key={campaign.campaignNo} campaign={campaign} />
          ))}
        </div>
      )}
    </section>
  );
}

export default CampaignListPage;
