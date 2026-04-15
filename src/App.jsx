import { useEffect, useState } from "react";
import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import DonationApp from "./features/donation/DonationApp";
import TransactionDashboardPage from "./features/blockchain/pages/TransactionDashboardPage";
import WalletDetailPage from "./features/blockchain/pages/WalletDetailPage";
import TransactionDetailPage from "./features/blockchain/pages/TransactionDetailPage";
import CampaignSearchPage from "./pages/CampaignSearchPage";

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
  return (
    <div className="app-shell">
      <aside className="sidebar sidebar--thin">
        <nav className="sidebar__icon-nav" aria-label="주요 이동">
          <NavLink to="/blockchain" end className="sidebar__icon-link" aria-label="블록체인 대시보드">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 11.5 12 4l9 7.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6.5 10.5V20h11v-9.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </NavLink>
          <NavLink to="/" className="sidebar__icon-link" aria-label="기부 메인으로 이동">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </NavLink>
          <button
            type="button"
            className="sidebar__icon-button"
            onClick={onToggleTheme}
            aria-label={theme === "dark" ? "화이트 모드로 전환" : "다크 모드로 전환"}
            title={theme === "dark" ? "화이트 모드" : "다크 모드"}
          >
            <ThemeToggleIcon theme={theme} />
          </button>
        </nav>
      </aside>

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
  );
}

function App() {
  const location = useLocation();
  const [theme, setTheme] = useState(() => {
    const savedTheme = window.localStorage.getItem("dashboard-theme");
    return savedTheme === "light" ? "light" : "dark";
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

  if (location.pathname === "/campaign-search") {
    return <CampaignSearchPage />;
  }

  return <DonationApp />;
}

export default App;
