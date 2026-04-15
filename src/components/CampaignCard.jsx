function formatNumber(value) {
  return Number(value || 0).toLocaleString("ko-KR");
}

function getProgressPercent(currentAmount, targetAmount) {
  if (!targetAmount || targetAmount <= 0) {
    return 0;
  }

  return Math.min(100, Math.floor((currentAmount / targetAmount) * 100));
}

function getDaysLeft(endAt) {
  if (!endAt) {
    return "마감일 미정";
  }

  const targetTime = new Date(endAt).getTime();
  if (Number.isNaN(targetTime)) {
    return "마감일 미정";
  }

  const diff = targetTime - Date.now();
  if (diff <= 0) {
    return "마감";
  }

  return `D-${Math.ceil(diff / (1000 * 60 * 60 * 24))}`;
}

function getCampaignState(endAt) {
  if (!endAt) {
    return "모집중";
  }

  const targetTime = new Date(endAt).getTime();
  if (Number.isNaN(targetTime)) {
    return "모집중";
  }

  return targetTime > Date.now() ? "모집중" : "마감";
}

function resolveImageSource(imagePath) {
  if (!imagePath) {
    return "";
  }

  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  return imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
}

function CampaignCard({ campaign }) {
  const progress = getProgressPercent(campaign.currentAmount, campaign.targetAmount);
  const imageSource = resolveImageSource(campaign.imagePath);
  const campaignState = getCampaignState(campaign.endAt);

  return (
    <article className="campaign-card">
      {imageSource ? (
        <img
          className="campaign-card__image"
          src={imageSource}
          alt={campaign.title}
          loading="lazy"
        />
      ) : (
        <div className="campaign-card__image campaign-card__image--empty">
          이미지 없음
        </div>
      )}

      <div className="campaign-card__body">
        <div className="campaign-card__header">
          <div className="campaign-card__header-left">
            <span className="campaign-card__category">{campaign.category}</span>
            <span
              className={`campaign-card__state ${
                campaignState === "마감" ? "is-closed" : "is-open"
              }`}
            >
              {campaignState}
            </span>
          </div>
          <span className="campaign-card__deadline">{getDaysLeft(campaign.endAt)}</span>
        </div>

        <h3 className="campaign-card__title">{campaign.title}</h3>
        <p className="campaign-card__foundation">{campaign.foundationName}</p>

        <div className="campaign-card__amounts">
          <strong>{formatNumber(campaign.currentAmount)}원</strong>
          <span>목표 {formatNumber(campaign.targetAmount)}원</span>
        </div>

        <div className="campaign-card__progress" aria-label="모금 진행률">
          <div className="campaign-card__progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </article>
  );
}

export default CampaignCard;
