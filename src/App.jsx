import { useEffect, useState } from "react";
import { NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import DonationApp from "./features/donation/DonationApp";
import TransactionDashboardPage from "./features/blockchain/pages/TransactionDashboardPage";
import WalletDetailPage from "./features/blockchain/pages/WalletDetailPage";
import TransactionDetailPage from "./features/blockchain/pages/TransactionDetailPage";
import AdminApp from "./features/admin/AdminApp";
import { resolveSearchTarget } from "./features/blockchain/api/blockchainApi";

function ThemeToggleIcon({ theme }) {
  if (theme === "dark") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 3v2.2M12 18.8V21M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M3 12h2.2M18.8 12H21M4.9 19.1l1.5-1.5M17.6 6.4l1.5-1.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="12" cy="12" r="4.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M18.5 14.6A7.6 7.6 0 0 1 9.4 5.5a8.3 8.3 0 1 0 9.1 9.1Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DashboardLayout({ theme, onToggleTheme }) {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");

  const handleSearchSubmit = async (event) => {
    event.preventDefault();
    const trimmedKeyword = searchInput.trim();

    if (!trimmedKeyword) {
      navigate("/blockchain");
      return;
    }

    try {
      const target = await resolveSearchTarget(trimmedKeyword);

      if (target.type === "wallet") {
        navigate(`/blockchain/wallets/${target.value}`);
        return;
      }

      if (target.type === "transaction") {
        navigate(`/blockchain/transactions/${target.value}`);
        return;
      }

      navigate("/blockchain");
    } catch {
      navigate("/blockchain");
    }
  };

  return (

    <div className="app-shell blockchain-default-font">
      <aside className="sidebar sidebar--thin">
        <div className="sidebar__brand-block">
          <NavLink to="/" className="sidebar__brand-logo" aria-label="메인으로 이동">
            <Sparkles size={24} fill="currentColor" />
          </NavLink>
          <div className="sidebar__brand-text">
            <strong>DeFi Analytics</strong>
            <span>Pro Dashboard</span>
          </div>
        </div>

        <nav className="sidebar__icon-nav" aria-label="주요 이동">
          <NavLink
            to="/blockchain"
            end
            className="sidebar__icon-link"
            aria-label="대시보드 홈"
            title="대시보드 홈"
            data-tooltip="대시보드 홈"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 11.5 12 4l9 7.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6.5 10.5V20h11v-9.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </NavLink>
          <NavLink
            to="/"
            className="sidebar__icon-link"
            aria-label="메인페이지"
            title="메인페이지"
            data-tooltip="메인페이지"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </NavLink>
          <button
            type="button"
            className="sidebar__icon-button"
            onClick={onToggleTheme}
            aria-label="화면 모드"
            title="화면 모드"
            data-tooltip="화면 모드"
          >
            <ThemeToggleIcon theme={theme} />
          </button>
        </nav>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div className="app-topbar__title">
            <h1>
              <span className="app-topbar__token">Give N Token</span>
              <span>Dashboard</span>
              <span className="app-topbar__status">RUNNING</span>
            </h1>
            <p>성공한 블록체인 트랜잭션을 조회하고, 해시와 지갑 기준으로 빠르게 흐름을 확인할 수 있습니다.</p>
          </div>
          <div className="app-topbar__actions">
            <form className="search-form app-topbar__search" onSubmit={handleSearchSubmit}>
              <span className="search-form__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  <path d="m16 16 4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </span>
              <input
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="해시, 지갑 주소, 단체나 캠페인 명으로 검색 (ex: 0x1234..., 0xabcde..., SaveTheEarth)"
              />
            </form>
          </div>
        </header>

        <main className="content">
          <Routes>
            <Route path="/blockchain" element={<TransactionDashboardPage />} />
            <Route path="/blockchain/wallets/:walletAddress" element={<WalletDetailPage />} />
            <Route path="/blockchain/transactions/:txHash" element={<TransactionDetailPage />} />
            <Route path="/wallets/:walletAddress" element={<WalletDetailPage />} />
            <Route path="/transactions/:txHash" element={<TransactionDetailPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  const location = useLocation();
  const [theme, setTheme] = useState(() => {
    const savedTheme = window.localStorage.getItem("dashboard-theme");
    return savedTheme === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("dashboard-theme", theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  };

  const isBlockchainRoute =
    location.pathname === "/blockchain" ||
    location.pathname.startsWith("/blockchain/") ||
    location.pathname.startsWith("/wallets/") ||
    location.pathname.startsWith("/transactions/");

  if (isBlockchainRoute) {
    return <DashboardLayout theme={theme} onToggleTheme={handleToggleTheme} />;
  }

  if (location.pathname.startsWith("/admin")) {
    return <AdminApp />;
  }

  return <DonationApp />;
}

export default App;

