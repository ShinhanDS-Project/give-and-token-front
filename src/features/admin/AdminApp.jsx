import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  FileText,
  LayoutDashboard,
  LogOut,
  Megaphone,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useMemo } from "react";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminCampaignDetailPage from "./pages/AdminCampaignDetailPage";
import AdminEventDetailPage from "./pages/AdminEventDetailPage";
import AdminFoundationDetailPage from "./pages/AdminFoundationDetailPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import { logoutAdmin } from "./util";
import "./css/AdminDashboardPage.css";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, section: "Donation" },
  { key: "foundations", label: "Foundation", icon: BriefcaseBusiness, section: "Donation" },
  { key: "campaigns", label: "Campaign", icon: Megaphone, section: "Donation" },
  { key: "reports", label: "Report", icon: FileText, section: "Donation" },
  { key: "inactive", label: "비활성화 단체", icon: ShieldCheck, section: "Donation" },
  { key: "members", label: "Users", icon: Users, section: "Operations" },
  { key: "requests", label: "새 요청", icon: Bell, section: "Operations" },
  { key: "logs", label: "Admin Logs", icon: BarChart3, section: "Operations" },
];

function SidebarSection({ title, items, activeKey, onSelect }) {
  return (
    <div className="admin-dashboard-sidebar__section">
      <p className="admin-dashboard-sidebar__section-title">{title}</p>
      <div className="admin-dashboard-sidebar__list">
        {items.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={`admin-dashboard-sidebar__item ${activeKey === key ? "is-active" : ""}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function AdminShell() {
  const navigate = useNavigate();
  const location = useLocation();

  const activeKey = useMemo(() => {
    if (location.pathname.startsWith("/admin/foundation/")) return "foundations";
    if (location.pathname.startsWith("/admin/campaign/")) return "campaigns";
    if (location.pathname.startsWith("/admin/report/")) return "reports";
    if (location.pathname.startsWith("/admin/request/")) return "requests";
    if (location.pathname.startsWith("/admin/log/")) return "logs";
    const tab = new URLSearchParams(location.search).get("tab");
    return tab ?? "dashboard";
  }, [location]);

  const groupedItems = useMemo(
    () =>
      NAV_ITEMS.reduce((acc, item) => {
        acc[item.section] = [...(acc[item.section] ?? []), item];
        return acc;
      }, {}),
    [],
  );

  const handleSelect = (key) => {
    if (key === "dashboard") {
      navigate("/admin/dashboard");
    } else {
      navigate(`/admin/dashboard?tab=${key}`);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await logoutAdmin();
      if (!response.ok) throw new Error("Logout failed");
      window.localStorage.removeItem("adminAccessToken");
      window.localStorage.removeItem("adminProfile");
      navigate("/admin/login");
    } catch (error) {
      console.error(error);
      window.alert("Logout request failed. Please retry.");
    }
  };

  return (
    <div className="admin-dashboard-page">
      <aside className="admin-dashboard-sidebar">
        <div className="admin-dashboard-sidebar__brand">
          <div className="admin-dashboard-sidebar__logo">g</div>
          <div>
            <strong>give N token</strong>
            <span>Admin Console</span>
          </div>
        </div>

        {Object.entries(groupedItems).map(([section, items]) => (
          <SidebarSection
            key={section}
            title={section}
            items={items}
            activeKey={activeKey}
            onSelect={handleSelect}
          />
        ))}

        <button type="button" className="admin-dashboard-sidebar__logout" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </aside>

      <div className="admin-dashboard-main">
        <Outlet />
      </div>
    </div>
  );
}

export default function AdminApp() {
  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route element={<AdminShell />}>
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/foundation/:foundationNo" element={<AdminFoundationDetailPage />} />
        <Route path="/admin/campaign/:campaignNo" element={<AdminCampaignDetailPage />} />
        <Route path="/admin/report/:reportNo" element={<AdminEventDetailPage kind="report" />} />
        <Route path="/admin/request/:requestNo" element={<AdminEventDetailPage kind="request" />} />
        <Route path="/admin/log/:logNo" element={<AdminEventDetailPage kind="log" />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  );
}
