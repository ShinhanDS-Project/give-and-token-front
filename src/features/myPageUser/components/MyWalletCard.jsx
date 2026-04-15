function shortenAddress(address) {
  if (!address) return "";
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}...${address.slice(-8)}`;
}

function formatAmount(amount) {
  if (amount == null) return "0원";
  return `${Number(amount).toLocaleString()}원`;
}

export default function WalletCard({ walletInfo }) {
  return (
    <section>
      <h3>연결된 지갑</h3>
      <div>
 <p>지갑 주소: {walletInfo?.walletAddress ?? "-"}</p>
      <p>잔액: {formatAmount(walletInfo?.balance)}</p>
      </div>
    </section>
  );
}