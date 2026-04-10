function StatCard({ label, value, accent, helper, icon }) {
  return (
    <article className={`stat-card ${accent || ""}`}>
      <div className="stat-card__top">
        <p>{label}</p>
        {icon ? <span className="stat-card__icon">{icon}</span> : null}
      </div>
      <strong>{value}</strong>
      {helper ? <span className="stat-card__helper">{helper}</span> : null}
    </article>
  );
}

export default StatCard;
