function formatAmount(amount) {
  if (amount == null) return "0원";
  return `${Number(amount).toLocaleString()}원`;
}

export default function DonationHistorySection({ donationHistory, onViewAll }) {
  return (
    <section>
      <div>
        <h3>기부내역</h3>
        <button onClick={onViewAll}>전체보기</button>
      </div>

      {donationHistory.length === 0 ? (
        <div>기부내역이 없어.</div>
      ) : (
        <div>
          {donationHistory.map((item, index) => (
            <div key={index}>
              <div>
                <p>{item.title}</p>
                <p>캠페인 번호: {item.campaignNo}</p>
                <p>상태: {item.approvalStatus}</p>
              </div>

              <div>
                <p>{formatAmount(item.transaction?.amount)}</p>
                <p>{item.transaction?.createdAt}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}