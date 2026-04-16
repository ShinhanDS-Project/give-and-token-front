function formatAmount(amount) {
  if (amount == null) return "0원";
  return `${Number(amount).toLocaleString()}원`;
}

export default function DonationSummaryCard({ summary }) {
  return (
     <section>
      <h3>기부 요약</h3>
      <p>현재까지 기부한 금액: {formatAmount(summary?.totalAmount)}</p>
      <p>기부 횟수: {summary?.transactionNum ?? 0}회</p>
    </section>
  );
}