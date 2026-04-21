import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Pagination from "../components/Pagination";
import TransactionTable from "../components/TransactionTable";
import { getWalletDetail } from "../api/blockchainApi";

function getOwnerBadgeClass(ownerType) {
  switch (ownerType) {
    case "FOUNDATION":
      return "detail-type-badge detail-type-badge--foundation";
    case "CAMPAIGN":
      return "detail-type-badge detail-type-badge--campaign";
    case "BENEFICIARY":
      return "detail-type-badge detail-type-badge--beneficiary";
    case "SERVER":
      return "detail-type-badge detail-type-badge--server";
    case "DONOR":
      return "detail-type-badge detail-type-badge--donor";
    default:
      return "detail-type-badge";
  }
}

function WalletDetailPage() {
  const { walletAddress } = useParams();
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const response = await getWalletDetail(walletAddress, { page });

        if (!ignore) {
          setData(response);
        }
      } catch {
        if (!ignore) {
          setError("지갑 상세 정보를 불러오지 못했습니다.");
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
  }, [walletAddress, page]);

  useEffect(() => {
    setPage(1);
  }, [walletAddress]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  if (loading) {
    return <div className="panel empty-state">지갑 정보를 불러오는 중입니다.</div>;
  }

  if (error || !data) {
    return <div className="panel empty-state">{error || "지갑이 존재하지 않습니다."}</div>;
  }

  const displayedBalance = data.wallet.ownerType === "DONOR" ? 0 : data.wallet.balance;

  return (
    <section className="detail-page">
      <div className="detail-header">
        <div>
          <p className="hero__eyebrow">Wallet Detail</p>
          <span className={getOwnerBadgeClass(data.wallet.ownerType)}>
            {data.wallet.ownerTypeLabel}
          </span>
          <div className="detail-title-row">
            <h2>{data.wallet.walletAddress}</h2>
            <button type="button" className="copy-button" onClick={handleCopy}>
              {copied ? "복사됨" : "복사"}
            </button>
          </div>
          <p className="hero__text">
            지갑 주소와 연결된 기본 정보를 확인할 수 있습니다.
          </p>
        </div>

        <Link to="/blockchain" className="ghost-button">
          목록으로
        </Link>
      </div>

      <div className="detail-grid">
        <div className="panel info-card">
          <span>{data.wallet.nameLabel}</span>
          <strong> {data.wallet.nameValue}</strong>
        </div>
        <div className="panel info-card">
          <span>잔액</span>
          <strong> {displayedBalance.toLocaleString()} GNT</strong>
        </div>
        <div className="panel info-card">
          <span>연결된 트랜잭션 수</span>
          <strong> {data.pageInfo.totalItems}건</strong>
        </div>
      </div>

      <TransactionTable transactions={data.items} />
      <Pagination pageInfo={data.pageInfo} onPageChange={setPage} />
    </section>
  );
}

export default WalletDetailPage;
