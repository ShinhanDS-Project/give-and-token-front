import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getCampaignDetail } from "../data/campaignApi";

function formatAmount(value) {
  return `${Number(value || 0).toLocaleString()} KRW`;
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("en-CA");
}

function CampaignDetailPage() {
  const { campaignNo } = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const response = await getCampaignDetail(campaignNo);

        if (!ignore) {
          setData(response);
        }
      } catch {
        if (!ignore) {
          setError("Failed to load campaign detail.");
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
  }, [campaignNo]);

  if (loading) {
    return <div className="panel empty-state">Loading campaign detail...</div>;
  }

  if (error || !data) {
    return <div className="panel empty-state">{error || "Campaign not found."}</div>;
  }

  return (
    <section className="campaign-detail-page">
      <div className="campaign-detail-hero">
        <div className="campaign-detail-hero__content">
          <div className="campaign-detail-hero__tags">
            <span className="campaign-chip campaign-chip--strong">{data.category}</span>
            <span className="campaign-chip">{data.campaignStatusLabel}</span>
          </div>
          <h2>{data.title}</h2>
          <p>{data.description}</p>
        </div>
        <Link to="/campaigns" className="ghost-button">
          Back to list
        </Link>
      </div>

      <div className="campaign-detail-layout">
        <main>
          <div className="campaign-tabs">
            <button
              type="button"
              className={activeTab === "overview" ? "is-active" : ""}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            <button
              type="button"
              className={activeTab === "history" ? "is-active" : ""}
              onClick={() => setActiveTab("history")}
            >
              History
            </button>
          </div>

          {activeTab === "overview" && (
            <>
              <div className="campaign-section panel">
                <h3>Schedule and budget</h3>
                <div className="campaign-section__grid">
                  <div className="campaign-facts">
                    <div className="campaign-facts__row">
                      <span>Fundraising start</span>
                      <strong>{formatDate(data.startAt)}</strong>
                    </div>
                    <div className="campaign-facts__row">
                      <span>Fundraising end</span>
                      <strong>{formatDate(data.endAt)}</strong>
                    </div>
                    <div className="campaign-facts__row">
                      <span>Usage start</span>
                      <strong>{formatDate(data.usageStartAt)}</strong>
                    </div>
                    <div className="campaign-facts__row">
                      <span>Usage end</span>
                      <strong>{formatDate(data.usageEndAt)}</strong>
                    </div>
                    <div className="campaign-facts__row">
                      <span>Wallet address</span>
                      <strong>{data.walletAddress || "-"}</strong>
                    </div>
                    <div className="campaign-facts__row">
                      <span>Approval status</span>
                      <strong>{data.approvalStatus}</strong>
                    </div>
                  </div>

                  <div className="campaign-goal-card">
                    <span>Target amount</span>
                    <strong>{formatAmount(data.targetAmount)}</strong>
                    <p>Execution follows the campaign schedule and use plan registered in the backend.</p>
                  </div>
                </div>
              </div>

              <div className="campaign-section panel">
                <h3>Use plan</h3>
                <div className="campaign-plan-list">
                  {(data.usePlans || []).map((plan, index) => (
                    <div key={plan.usePlanNo || index} className="campaign-plan-item">
                      <div className="campaign-plan-item__title">
                        <span>{index + 1}</span>
                        <strong>{plan.planContent}</strong>
                      </div>
                      <em>{formatAmount(plan.planAmount)}</em>
                    </div>
                  ))}
                </div>
              </div>

              <div className="campaign-section panel">
                <h3>Foundation</h3>
                <div className="campaign-foundation">
                  {data.foundation?.profilePath ? (
                    <img
                      src={data.foundation.profilePath}
                      alt={data.foundation.foundationName}
                      className="campaign-foundation__image"
                    />
                  ) : (
                    <div className="campaign-foundation__fallback">
                      {data.foundation?.foundationName?.slice(0, 1) || "F"}
                    </div>
                  )}

                  <div>
                    <h4>{data.foundation?.foundationName || "No foundation"}</h4>
                    <p>{data.foundation?.description || "No foundation description is available."}</p>
                    <div className="campaign-detail-hero__tags">
                      <span className="campaign-chip">{data.category}</span>
                      <span className="campaign-chip">{data.campaignStatusLabel}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="campaign-section panel">
                <h3>Images</h3>
                <div className="campaign-gallery">
                  {data.representativeImagePath ? (
                    <img
                      src={data.representativeImagePath}
                      alt={`${data.title} main`}
                      className="campaign-gallery__main"
                    />
                  ) : (
                    <div className="campaign-gallery__empty">No representative image</div>
                  )}

                  {(data.detailImagePaths || []).map((imagePath, index) => (
                    <img
                      key={`${imagePath}-${index}`}
                      src={imagePath}
                      alt={`${data.title} detail ${index + 1}`}
                      className="campaign-gallery__sub"
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === "history" && (
            <div className="campaign-section panel">
              <h3>Status history</h3>
              <div className="campaign-history">
                <div className="campaign-history__box">
                  <span>{data.historyTitle}</span>
                  <strong>{data.campaignStatusLabel}</strong>
                  <p>{data.historyDescription}</p>
                </div>
              </div>
            </div>
          )}
        </main>

        <aside className="campaign-detail-sidebar">
          <div className="panel campaign-summary-card">
            <div className="campaign-summary-card__top">
              <strong>{formatAmount(data.currentAmount)}</strong>
              <span>{data.progressPercent}%</span>
            </div>

            <div className="campaign-progress campaign-progress--large">
              <span style={{ width: `${data.progressPercent}%` }} />
            </div>

            <div className="campaign-summary-card__meta">
              <span>Goal {formatAmount(data.targetAmount)}</span>
              <span>D-{data.daysLeft}</span>
            </div>

            <div className="campaign-summary-card__stats">
              <div>
                <span>Remaining</span>
                <strong>{formatAmount(data.remainingAmount)}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{data.campaignStatusLabel}</strong>
              </div>
            </div>

            <button type="button" className="campaign-primary-button">
              Donate CTA
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default CampaignDetailPage;
