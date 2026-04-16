function formatAmount(amount) {
  if (amount == null) return "0원";
  return `${Number(amount).toLocaleString()}원`;
}

function formatDate(dateValue) {
  if (!dateValue) return "-";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleString("ko-KR");
}

export default function DonationHistorySection({
  donationHistory = [],
  onViewAll,
}) {
  return (
    <section>
      <div>
        <h3>기부내역</h3>
        <button type="button" onClick={onViewAll}>
          전체보기
        </button>
      </div>

      {donationHistory.length === 0 ? (
        <div>기부내역이 없어.</div>
      ) : (
        <div>
          {donationHistory.map((item, index) => (
            <div
              key={item.transaction?.transactionNo ?? `${item.campaignNo}-${index}`}
            >
              <div>
                <p>캠페인명: {item.title}</p>
                <p>캠페인 번호: {item.campaignNo}</p>
                <p>승인 상태: {item.approvalStatus}</p>
                <p>트랜잭션 상태: {item.transaction?.status ?? "-"}</p>
              </div>

              <div>
                <p>기부 금액: {formatAmount(item.transaction?.amount)}</p>
                <p>
                  전송일시:{" "}
                  {formatDate(item.transaction?.sentAt || item.transaction?.createdAt)}
                </p>
                <p>트랜잭션 해시: {item.transaction?.txHash ?? "-"}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}