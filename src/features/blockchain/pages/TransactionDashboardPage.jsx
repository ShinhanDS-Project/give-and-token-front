import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Pagination from "../components/Pagination";
import StatCard from "../components/StatCard";
import TransactionTable from "../components/TransactionTable";
import {
  getCachedTransactions,
  getDashboardOverview,
  getTransactions,
  resolveSearchTarget
} from "../api/blockchainApi";

function BlockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3 19 7v10l-7 4-7-4V7l7-4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M12 3v18M5 7l7 4 7-4" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="13" r="7" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 9v4l2.8 1.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 3h8M9 1v4M15 1v4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function TransferIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 8h14m0 0-3-3m3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 16H7m0 0 3-3m-3 3 3 3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TokenIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10" cy="12" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="14" cy="12" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" opacity="0.65" />
    </svg>
  );
}

function formatLocaleNumber(value, options) {
  const numericValue = Number(value || 0);

  if (!Number.isFinite(numericValue)) {
    return "0";
  }

  return numericValue.toLocaleString("ko-KR", options);
}

function toBigIntValue(value) {
  if (typeof value === "bigint") {
    return value;
  }

  if (typeof value === "string" && /^\d+$/.test(value)) {
    return BigInt(value);
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return BigInt(Math.trunc(value));
  }

  return null;
}

function formatTokenAmount(value) {
  const raw = toBigIntValue(value);

  if (raw === null) {
    return `${formatLocaleNumber(value)} GNT`;
  }
  return `${raw.toLocaleString("ko-KR")} GNT`;
}

function TransactionDashboardPage() {
  const DASHBOARD_PAGE_SIZE = 10;
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], pageInfo: null });
  const [overview, setOverview] = useState({
    latestBlock: 0,
    avgBlockTimeSec: 0,
    totalTransactions: 0,
    tokenAmount: 0,
    tokenDecimals: 18
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [overviewError, setOverviewError] = useState("");
  const [noResultsKeyword, setNoResultsKeyword] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadTransactions() {
      const cachedResponse = getCachedTransactions({ page, pageSize: DASHBOARD_PAGE_SIZE });

      if (!ignore && cachedResponse) {
        setData(cachedResponse);
        setLoading(false);
      }

      try {
        if (!cachedResponse) {
          setLoading(true);
        }
        setError("");
        const response = await getTransactions({ page, pageSize: DASHBOARD_PAGE_SIZE });

        if (!ignore) {
          setData(response);
        }
      } catch {
        if (!ignore) {
          setError("트랜잭션 목록을 불러오지 못했습니다.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadTransactions();

    return () => {
      ignore = true;
    };
  }, [page]);

  useEffect(() => {
    let ignore = false;

    async function loadOverview() {
      try {
        setOverviewError("");
        const overviewResponse = await getDashboardOverview();

        if (!ignore) {
          setOverview(overviewResponse);
        }
      } catch {
        if (!ignore) {
          setOverviewError("대시보드 요약 정보를 불러오지 못했습니다.");
        }
      }
    }

    loadOverview();

    return () => {
      ignore = true;
    };
  }, []);

  const chainId = "2969312814550870192";

  const handleSearchSubmit = async (event) => {
    event.preventDefault();

    const trimmedKeyword = searchInput.trim();

    if (!trimmedKeyword) {
      setError("");
      setNoResultsKeyword("");
      navigate("/blockchain");
      return;
    }

    try {
      setError("");
      setNoResultsKeyword("");
      const target = await resolveSearchTarget(trimmedKeyword);

      if (target.type === "wallet") {
        navigate(`/blockchain/wallets/${target.value}`);
        return;
      }

      if (target.type === "transaction") {
        navigate(`/blockchain/transactions/${target.value}`);
        return;
      }

      setNoResultsKeyword(trimmedKeyword);
    } catch {
      setError("검색 결과를 확인하지 못했습니다.");
    }
  };

  return (
    <section>
      <div className="dashboard-hero panel">
        <form className="search-form" onSubmit={handleSearchSubmit}>
          <span className="search-form__icon" aria-hidden="true">
            o
          </span>
          <input
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="지갑 주소, 트랜잭션 해시, 재단명, 캠페인명 검색"
          />
          <button type="submit">SEARCH</button>
        </form>

        <div className="dashboard-hero__header">
          <div>
            <div className="dashboard-hero__title-row">
              <h2>Give N Token</h2>
              <span className="chain-status">RUNNING</span>
            </div>
            <p className="hero__text">
              성공한 블록체인 트랜잭션을 조회하고, 해시와 지갑 기준으로 빠르게 흐름을 확인할 수 있습니다.
            </p>
          </div>
          <p className="chain-id">Chain ID : {chainId}</p>
        </div>

        <div className="stats-grid stats-grid--hero">
          <StatCard
            label="Latest Block"
            value={formatLocaleNumber(overview.latestBlock)}
            helper="가장 최근 블록 번호"
            icon={<BlockIcon />}
          />
          <StatCard
            label="Avg Block Time"
            value={`${formatLocaleNumber(overview.avgBlockTimeSec, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })} sec`}
            helper="최근 블록 간 평균 생성 시간"
            icon={<ClockIcon />}
          />
          <StatCard
            label="Total Tx"
            value={formatLocaleNumber(overview.totalTransactions)}
            helper="트랜잭션 수"
            icon={<TransferIcon />}
          />
          <StatCard
            label="Token Amount"
            value={formatTokenAmount(overview.tokenAmount)}
            helper="성공한 기부 이벤트 금액 합계"
            icon={<TokenIcon />}
          />
        </div>

        {overviewError && <p className="hero__text">{overviewError}</p>}
      </div>

      <div className="section-heading">
        <div>
          <p className="hero__eyebrow">Transactions</p>
          <h3>최근 트랜잭션</h3>
        </div>
      </div>

      {loading && <div className="panel empty-state">트랜잭션 데이터를 불러오는 중입니다.</div>}
      {error && <div className="panel empty-state">{error}</div>}

      {!loading && !error && !noResultsKeyword && (
        <>
          <TransactionTable transactions={data.items} />
          <Pagination pageInfo={data.pageInfo} onPageChange={setPage} />
        </>
      )}

      {!loading && !error && noResultsKeyword && (
        <div className="panel empty-state">
          <strong>검색 결과 없음</strong>
          <p className="empty-state__text">
            `{noResultsKeyword}` 와 일치하는 지갑 주소, 재단명, 캠페인명 또는 트랜잭션 해시를 찾지 못했습니다.
          </p>
        </div>
      )}
    </section>
  );
}

export default TransactionDashboardPage;
