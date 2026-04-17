import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

function formatNumber(value) {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return "0";
  return new Intl.NumberFormat("ko-KR").format(num);
}

function formatCurrency(value) {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return "-";
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(num);
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("ko-KR");
}

export default function AdminCampaignDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { campaignNo } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDetail() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/foundation/campaigns/${campaignNo}/detail`, {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          const text = await response.text().catch(() => "");
          throw new Error(text || `Campaign detail load failed (${response.status})`);
        }

        const payload = await response.json();
        if (!cancelled) setDetail(payload);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load campaign detail.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDetail();
    return () => {
      cancelled = true;
    };
  }, [campaignNo]);

  const stateRecord = location.state?.record ?? {};
  const imageList = useMemo(() => {
    if (!detail) return [];
    const detailImages = Array.isArray(detail.detailImagePaths) ? detail.detailImagePaths : [];
    const topImages = Array.isArray(detail.images) ? detail.images.map((img) => img?.imgPath).filter(Boolean) : [];
    const representative = detail.representativeImagePath ? [detail.representativeImagePath] : [];
    return [...representative, ...detailImages, ...topImages].filter(Boolean);
  }, [detail]);

  return (
    <>
      <header className="admin-dashboard-topbar">
        <div className="admin-dashboard-topbar__title">
          <button type="button" className="admin-dashboard-topbar__menu" onClick={() => navigate(-1)}>
            <span />
            <span />
            <span />
          </button>
          <h1>Campaign Detail</h1>
        </div>
      </header>

      <main className="admin-dashboard-content">
        {loading ? <p className="admin-dashboard-empty-text">Loading campaign detail...</p> : null}
        {error ? <p className="admin-dashboard-empty-text">{error}</p> : null}

        {!loading && !error && detail ? (
          <section className="admin-campaign-detail-grid">
            <article className="admin-dashboard-panel admin-campaign-detail-main">
              <div className="admin-campaign-detail-header">
                {imageList[0] ? (
                  <img src={imageList[0]} alt="" className="admin-campaign-detail-thumbnail" />
                ) : (
                  <div className="admin-campaign-detail-thumbnail admin-campaign-detail-thumbnail--fallback">
                    {(detail.title || "C").slice(0, 1)}
                  </div>
                )}
                <div>
                  <h2>{detail.title || stateRecord.title || "-"}</h2>
                  <p>{detail.category || stateRecord.category || "-"}</p>
                </div>
              </div>

              <div className="admin-campaign-detail-fields">
                <div className="admin-campaign-detail-field">
                  <span>Approval Status</span>
                  <strong>{detail.approvalStatus || stateRecord.approvalStatus || "-"}</strong>
                </div>
                <div className="admin-campaign-detail-field">
                  <span>Campaign Status</span>
                  <strong>{detail.campaignStatusLabel || detail.campaignStatus || "-"}</strong>
                </div>
                <div className="admin-campaign-detail-field">
                  <span>Category Code</span>
                  <strong>{detail.categoryCode || "-"}</strong>
                </div>
                <div className="admin-campaign-detail-field">
                  <span>Entry Code</span>
                  <strong>{detail.entryCode || "-"}</strong>
                </div>
                <div className="admin-campaign-detail-field">
                  <span>Target Amount</span>
                  <strong>{formatCurrency(detail.targetAmount)}</strong>
                </div>
                <div className="admin-campaign-detail-field">
                  <span>Current Amount</span>
                  <strong>{formatCurrency(detail.currentAmount)}</strong>
                </div>
                <div className="admin-campaign-detail-field">
                  <span>Progress</span>
                  <strong>{formatNumber(detail.progressPercent)}%</strong>
                </div>
                <div className="admin-campaign-detail-field">
                  <span>Donors</span>
                  <strong>{formatNumber(detail.donors)}</strong>
                </div>
                <div className="admin-campaign-detail-field">
                  <span>Start At</span>
                  <strong>{formatDateTime(detail.startAt)}</strong>
                </div>
                <div className="admin-campaign-detail-field">
                  <span>End At</span>
                  <strong>{formatDateTime(detail.endAt)}</strong>
                </div>
                <div className="admin-campaign-detail-field">
                  <span>Usage Start</span>
                  <strong>{formatDateTime(detail.usageStartAt)}</strong>
                </div>
                <div className="admin-campaign-detail-field">
                  <span>Usage End</span>
                  <strong>{formatDateTime(detail.usageEndAt)}</strong>
                </div>
                <div className="admin-campaign-detail-field admin-campaign-detail-field--wide">
                  <span>Description</span>
                  <strong>{detail.description || "-"}</strong>
                </div>
                <div className="admin-campaign-detail-field admin-campaign-detail-field--wide">
                  <span>Foundation</span>
                  <strong>{detail.foundation?.foundationName || stateRecord.foundationName || "-"}</strong>
                </div>
                <div className="admin-campaign-detail-field admin-campaign-detail-field--wide">
                  <span>Wallet Address</span>
                  <strong>{detail.walletAddress || "-"}</strong>
                </div>
              </div>

              {imageList.length > 1 ? (
                <div className="admin-campaign-detail-image-strip">
                  {imageList.slice(1).map((path, index) => (
                    <img key={`${path}-${index}`} src={path} alt="" />
                  ))}
                </div>
              ) : null}
            </article>

            <aside className="admin-campaign-detail-side">
              <article className="admin-dashboard-panel admin-campaign-detail-card">
                <h3>Use Plans</h3>
                <div className="admin-campaign-detail-list">
                  {Array.isArray(detail.usePlans) && detail.usePlans.length ? (
                    detail.usePlans.map((plan) => (
                      <div key={plan.usePlanNo ?? `${plan.planContent}-${plan.planAmount}`}>
                        <strong>{plan.planContent || "-"}</strong>
                        <span>{formatCurrency(plan.planAmount)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="admin-dashboard-empty-text">No use plans.</p>
                  )}
                </div>
              </article>

              <article className="admin-dashboard-panel admin-campaign-detail-card">
                <h3>Recent Donors</h3>
                <div className="admin-campaign-detail-list">
                  {Array.isArray(detail.recentDonors) && detail.recentDonors.length ? (
                    detail.recentDonors.map((donor, index) => (
                      <div key={`${donor.name}-${index}`}>
                        <strong>{donor.name || "-"}</strong>
                        <span>{formatCurrency(donor.amount)} / {donor.time || "-"}</span>
                      </div>
                    ))
                  ) : (
                    <p className="admin-dashboard-empty-text">No recent donors.</p>
                  )}
                </div>
              </article>

              <article className="admin-dashboard-panel admin-campaign-detail-card">
                <h3>Documents</h3>
                <div className="admin-campaign-detail-list">
                  {Array.isArray(detail.documents) && detail.documents.length ? (
                    detail.documents.map((doc, index) => (
                      <div key={`${doc.name}-${index}`}>
                        <strong>{doc.name || "-"}</strong>
                        <span>{doc.size || "-"}</span>
                      </div>
                    ))
                  ) : (
                    <p className="admin-dashboard-empty-text">No documents.</p>
                  )}
                </div>
              </article>
            </aside>
          </section>
        ) : null}
      </main>
    </>
  );
}
