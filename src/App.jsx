import { useEffect, useState } from "react";
import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import CampaignDetailPage from "./pages/CampaignDetailPage";
import CampaignListPage from "./pages/CampaignListPage";
import CampaignRegisterPage from "./pages/CampaignRegisterPage";
import DonationReturnPage from "./pages/DonationReturnPage";
import TransactionDashboardPage from "./pages/TransactionDashboardPage";
import TransactionDetailPage from "./pages/TransactionDetailPage";
import WalletDetailPage from "./pages/WalletDetailPage";

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
          <NavLink to="/" end className="sidebar__icon-link" aria-label="홈">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 11.5 12 4l9 7.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6.5 10.5V20h11v-9.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </NavLink>
          <NavLink to="/campaigns" className="sidebar__icon-link" aria-label="캠페인">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 7.5A2.5 2.5 0 0 1 7.5 5h9A2.5 2.5 0 0 1 19 7.5v9A2.5 2.5 0 0 1 16.5 19h-9A2.5 2.5 0 0 1 5 16.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="M8.5 9.5h7M8.5 12h7M8.5 14.5h4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </NavLink>
          <NavLink to="/donation-return" className="sidebar__icon-link" aria-label="기부페이지로 돌아가기">
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
          <Route path="/" element={<TransactionDashboardPage />} />
          <Route path="/campaigns" element={<CampaignListPage />} />
          <Route path="/campaigns/register" element={<CampaignRegisterPage />} />
          <Route path="/campaigns/:campaignNo" element={<CampaignDetailPage />} />
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

  if (location.pathname === "/donation-return") {
    return <DonationReturnPage />;
  }

  return <DashboardLayout theme={theme} onToggleTheme={handleToggleTheme} />;
}

export default App;
