import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getTransactionDetail } from "../api/blockchainApi";

function formatDateTime(value) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

function getEventBadgeClass(eventType) {
  switch (eventType) {
    case "DONATION":
      return "detail-type-badge detail-type-badge--donation";
    case "SETTLEMENT":
      return "detail-type-badge detail-type-badge--settlement";
    case "TOKENIZATION":
      return "detail-type-badge detail-type-badge--tokenization";
    case "CASHOUT":
    case "WITHDRAWAL":
      return "detail-type-badge detail-type-badge--cashout";
    default:
      return "detail-type-badge";
  }
}

function DetailCell({ label, value, linkTo }) {
  return (
    <tr>
      <th>{label}</th>
      <td>
        {linkTo ? (
          <Link to={linkTo} className="text-link">
            {value}
          </Link>
        ) : (
          value
        )}
      </td>
    </tr>
  );
}

function isGasChargeEvent(eventType, eventTypeLabel) {
  const normalizedType = String(eventType || "").toUpperCase();
  const normalizedLabel = String(eventTypeLabel || "").trim();

  return (
    normalizedType === "GAS_CHARGE" ||
    normalizedType === "GAS_TOPUP" ||
    normalizedType === "GAS_RECHARGE" ||
    normalizedLabel === "가스 충전"
  );
}

function TransactionDetailPage() {
  const { txHash } = useParams();
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
        const response = await getTransactionDetail(txHash);

        if (!ignore) {
          setData(response);
        }
      } catch {
        if (!ignore) {
          setError("트랜잭션 상세 정보를 불러오지 못했습니다.");
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
  }, [txHash]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(txHash);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  if (loading) {
    return <div className="panel empty-state">트랜잭션을 불러오는 중입니다.</div>;
  }

  if (error || !data) {
    return <div className="panel empty-state">{error || "트랜잭션을 찾을 수 없습니다."}</div>;
  }

  const isGasCharge = isGasChargeEvent(data.eventType, data.eventTypeLabel);
  const amountUnit = isGasCharge ? "POL" : "GNT";

  return (
    <section className="detail-page">
      <div className="detail-header">
        <div>
          <p className="hero__eyebrow">Transaction Detail</p>
          <span className={getEventBadgeClass(data.eventType)}>{data.eventTypeLabel}</span>
          <div className="detail-title-row">
            <h2>{data.txHash}</h2>
            <button type="button" className="copy-button" onClick={handleCopy}>
              {copied ? "복사됨" : "복사"}
            </button>
          </div>
          <p className="hero__text">트랜잭션 해시와 전송 정보를 확인할 수 있습니다.</p>
        </div>

        <Link to="/blockchain" className="ghost-button">
          목록으로
        </Link>
      </div>

      <div className="detail-table-grid">
        <div className="panel detail-table-panel">
          <div className="detail-table-panel__header">
            <p className="hero__eyebrow">Transaction Info</p>
            <h3>거래 정보</h3>
          </div>
          <table className="detail-table">
            <tbody>
              <DetailCell label="트랜잭션 코드" value={data.transactionCode} />
              <DetailCell label="상태" value={data.status} />
              <DetailCell label="이벤트 타입" value={data.eventTypeLabel} />
              <DetailCell label={`금액 (${amountUnit})`} value={`${data.amount.toLocaleString()} ${amountUnit}`} />
              <DetailCell label="블록 번호" value={String(data.blockNum)} />
              <DetailCell label="전송 시각" value={formatDateTime(data.sentAt)} />
            </tbody>
          </table>
        </div>

        <div className="panel detail-table-panel">
          <div className="detail-table-panel__header">
            <p className="hero__eyebrow">Wallet Info</p>
            <h3>지갑 정보</h3>
          </div>
          <table className="detail-table">
            <tbody>
              <DetailCell label="재단명" value={data.foundationName} />
              <DetailCell label="캠페인명" value={data.campaignName} />
              <DetailCell label="보낸 주체" value={data.fromOwnerTypeLabel} />
              <DetailCell label="받는 주체" value={data.toOwnerTypeLabel} />
              <DetailCell
                label="보낸 지갑"
                value={data.fromWalletAddress}
                linkTo={`/blockchain/wallets/${data.fromWalletAddress}`}
              />
              <DetailCell
                label="받는 지갑"
                value={data.toWalletAddress}
                linkTo={`/blockchain/wallets/${data.toWalletAddress}`}
              />
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default TransactionDetailPage;
