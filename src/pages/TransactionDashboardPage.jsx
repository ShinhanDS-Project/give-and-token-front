import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Pagination from "../components/Pagination";
import StatCard from "../components/StatCard";
import TransactionTable from "../components/TransactionTable";
import {
  getDashboardOverview,
  getTransactions,
  resolveSearchTarget
} from "../data/blockchainApi";

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

function DonationIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 20s-6.5-3.9-8.7-8C1.8 9.4 3.2 6 6.6 6c2 0 3.1 1 4 2.2C11.4 7 12.5 6 14.5 6 17.8 6 20.2 9 20.2 12c0 4.1-8.2 8-8.2 8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

function TransactionDashboardPage() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], pageInfo: null });
  const [overview, setOverview] = useState({
    latestBlock: 0,
    totalTransactions: 0,
    issuedTokenAmount: 0,
    reclaimedTokenAmount: 0,
    tokenizationCount: 0,
    cashoutCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [noResultsKeyword, setNoResultsKeyword] = useState("");

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const [response, overviewResponse] = await Promise.all([
          getTransactions({ page }),
          getDashboardOverview()
        ]);

        if (!ignore) {
          setData(response);
          setOverview(overviewResponse);
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

    load();

    return () => {
      ignore = true;
    };
  }, [page]);

  const chainId = "2969312814550870192";

  const handleSearchSubmit = async (event) => {
    event.preventDefault();

    const trimmedKeyword = searchInput.trim();

    if (!trimmedKeyword) {
      setError("");
      setNoResultsKeyword("");
      navigate("/");
      return;
    }

    try {
      setError("");
      setNoResultsKeyword("");
      const target = await resolveSearchTarget(trimmedKeyword);

      if (target.type === "wallet") {
        navigate(`/wallets/${target.value}`);
        return;
      }

      if (target.type === "transaction") {
        navigate(`/transactions/${target.value}`);
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
            value={overview.latestBlock.toLocaleString()}
            helper="가장 최근 블록 번호"
            icon={<BlockIcon />}
          />
          <StatCard
            label="Total Tx"
            value={overview.totalTransactions.toLocaleString()}
            helper="전체 성공 트랜잭션 수"
            icon={<TransferIcon />}
          />
          <StatCard
            label="Issued Token"
            value={`${overview.issuedTokenAmount.toLocaleString()} GT`}
            helper={`토큰화 ${overview.tokenizationCount}건`}
            icon={<DonationIcon />}
          />
          <StatCard
            label="Reclaimed Token"
            value={`${overview.reclaimedTokenAmount.toLocaleString()} GT`}
            helper={`현금화 ${overview.cashoutCount}건`}
            icon={<TokenIcon />}
          />
        </div>
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
