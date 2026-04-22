import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { getAdminAccessToken } from "./util";
import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  FileText,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminCampaignDetailPage from "./pages/AdminCampaignDetailPage";
import AdminEventDetailPage from "./pages/AdminEventDetailPage";
import AdminFoundationDetailPage from "./pages/AdminFoundationDetailPage";
import AdminReportDetailPage from "./pages/AdminReportDetailPage";
import AdminMemberDetailPage from "./pages/AdminMemberDetailPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import { logoutAdmin } from "./util";
import "./css/AdminDashboardPage.css";

const NAV_GROUPS = [
  {
    key: "foundations",
    label: "기부 단체",
    icon: BriefcaseBusiness,
    link: "foundations-list",
    items: [
      { key: "foundations-list", label: "단체 조회" },
      { key: "foundations-approval", label: "승인·반려 관리" },
      { key: "inactive", label: "비활성화 단체" },
    ],
  },
  {
    key: "campaigns",
    label: "캠페인",
    icon: Megaphone,
    link: "campaigns-list",
    items: [
      { key: "campaigns-list", label: "캠페인 조회" },
      { key: "campaigns-approval", label: "승인·반려 관리" },
    ],
  },
  {
    key: "reports",
    label: "활동 보고서",
    icon: FileText,
    link: "reports-list",
    items: [
      { key: "reports-list", label: "보고서 조회" },
      { key: "reports-approval", label: "승인·반려 관리" },
    ],
  },
  {
    key: "ops",
    label: "운영",
    icon: Settings,
    link: "members",
    items: [
      { key: "members", label: "회원 관리" },
      { key: "requests", label: "새 요청" },
      { key: "logs", label: "관리자 로그" },
      { key: "send-history", label: "발송 내역" },
      { key: "wallet", label: "지갑 정보" },
    ],
  },
];

const KEY_TO_URL = {
  dashboard:              "/admin/dashboard",
  "foundations-approval": "/admin/dashboard?tab=foundations",
  "foundations-list":     "/admin/dashboard?tab=foundations-list",
  inactive:               "/admin/dashboard?tab=inactive",
  "campaigns-approval":   "/admin/dashboard?tab=campaigns",
  "campaigns-list":       "/admin/dashboard?tab=campaigns-list",
  "reports-approval":     "/admin/dashboard?tab=reports",
  "reports-list":         "/admin/dashboard?tab=reports-list",
  members:                "/admin/dashboard?tab=members",
  requests:               "/admin/dashboard?tab=requests",
  logs:                   "/admin/dashboard?tab=logs",
  "send-history":         "/admin/dashboard?tab=send-history",
  wallet:                 "/admin/dashboard?tab=wallet",
};

function SidebarGroup({ group, activeKey, onSelect, sidebarCollapsed, onOpenFlyout, isActiveFlyout }) {
  const [open, setOpen] = useState(true);
  const hasActive = group.items.some((item) => item.key === activeKey);
  const GroupIcon = group.icon;
  const hasGroupLink = !!group.link;

  const handleIconClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onOpenFlyout(isActiveFlyout ? null : { key: group.key, top: rect.top });
  };

  const handleLabelClick = (e) => {
    if (sidebarCollapsed) {
      handleIconClick(e);
    } else if (hasGroupLink) {
      onSelect(group.link);
    } else {
      setOpen((p) => !p);
    }
  };

  const flyoutStateClass = isActiveFlyout ? "is-flyout-open" : "";

  return (
    <div className="admin-sidebar-group">
      {hasGroupLink ? (
        <div className={`admin-sidebar-group__header-wrap ${hasActive ? "has-active" : ""} ${flyoutStateClass}`}>
          <button
            type="button"
            className="admin-sidebar-group__label-btn"
            onClick={handleLabelClick}
            title={group.label}
          >
            <GroupIcon size={16} />
            <span className="admin-sidebar-label-text">{group.label}</span>
          </button>
          <button
            type="button"
            className="admin-sidebar-group__toggle-btn"
            onClick={() => setOpen((p) => !p)}
            tabIndex={sidebarCollapsed ? -1 : 0}
            aria-hidden={sidebarCollapsed}
          >
            {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      ) : (
        <button
          type="button"
          className={`admin-sidebar-group__header ${hasActive ? "has-active" : ""} ${flyoutStateClass}`}
          onClick={handleLabelClick}
          title={group.label}
        >
          <div className="admin-sidebar-group__header-left">
            <GroupIcon size={16} />
            <span className="admin-sidebar-label-text">{group.label}</span>
          </div>
          <span className="admin-sidebar-group__chevron">
            {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </span>
        </button>
      )}
      {open && !sidebarCollapsed && (
        <div className="admin-sidebar-group__items">
          {group.items.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className={`admin-sidebar-sub-item ${activeKey === key ? "is-active" : ""}`}
            >
              <span className="admin-sidebar-sub-dot" />
              <span className="admin-sidebar-label-text">{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminShell() {
  const navigate = useNavigate();
  const location = useLocation();

  if (!getAdminAccessToken()) {
    return <Navigate to="/admin/login" replace />;
  }
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [flyoutState, setFlyoutState] = useState(null);

  const activeKey = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    const tab = sp.get("tab");
    const view = sp.get("view");

    if (location.pathname.startsWith("/admin/foundation/")) return "foundations-approval";
    if (location.pathname.startsWith("/admin/campaign/")) return "campaigns-approval";
    if (location.pathname.startsWith("/admin/report/")) return "reports-approval";
    if (location.pathname.startsWith("/admin/request/")) return "requests";
    if (location.pathname.startsWith("/admin/log/")) return "logs";
    if (location.pathname.startsWith("/admin/member/")) return "members";

    if (tab === "foundations-list") return "foundations-list";
    if (tab === "foundations") return "foundations-approval";
    if (tab === "campaigns-list") return "campaigns-list";
    if (tab === "campaigns") return "campaigns-approval";
    if (tab === "reports-list") return "reports-list";
    if (tab === "reports") return "reports-approval";
    return tab ?? "dashboard";
  }, [location]);

  useEffect(() => {
    if (!flyoutState) return;
    const handler = (e) => {
      if (
        !e.target.closest(".admin-sidebar-flyout") &&
        !e.target.closest(".admin-sidebar-group__icon-btn")
      ) {
        setFlyoutState(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [flyoutState]);

  const handleSelect = (key) => {
    navigate(KEY_TO_URL[key] ?? `/admin/dashboard?tab=${key}`);
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
      window.alert("로그아웃 요청에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const activeFlyoutGroup = flyoutState ? NAV_GROUPS.find((g) => g.key === flyoutState.key) : null;

  return (
    <div className={`admin-dashboard-page ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <div className="admin-sidebar-wrapper">
        <aside className="admin-dashboard-sidebar">
          {/* 브랜드 */}
          <div className={`admin-dashboard-sidebar__brand ${sidebarCollapsed ? "is-collapsed" : ""}`}>
            <div className="admin-dashboard-sidebar__logo">g</div>
            <div className="admin-dashboard-sidebar__brand-text">
              <strong>give N token</strong>
              <span>관리자 콘솔</span>
            </div>
          </div>

          {/* 대시보드 (단독 항목) */}
          <div className="admin-sidebar-dashboard-item">
            <button
              type="button"
              className={`admin-sidebar-group__header admin-sidebar-dashboard-btn ${activeKey === "dashboard" ? "has-active is-dashboard-active" : ""}`}
              onClick={() => handleSelect("dashboard")}
              title="대시보드"
            >
              <div className="admin-sidebar-group__header-left">
                <LayoutDashboard size={16} />
                <span className="admin-sidebar-label-text">대시보드</span>
              </div>
            </button>
          </div>

          {/* 그룹 메뉴 */}
          <nav className="admin-dashboard-sidebar__nav">
            {NAV_GROUPS.map((group) => (
              <SidebarGroup
                key={group.key}
                group={group}
                activeKey={activeKey}
                onSelect={handleSelect}
                sidebarCollapsed={sidebarCollapsed}
                onOpenFlyout={setFlyoutState}
                isActiveFlyout={flyoutState?.key === group.key}
              />
            ))}
          </nav>

          <button
            type="button"
            className="admin-dashboard-sidebar__logout"
            onClick={handleLogout}
            title="로그아웃"
          >
            <LogOut size={16} />
            <span className="admin-sidebar-label-text">로그아웃</span>
          </button>
        </aside>

        {/* 사이드바 토글 버튼 */}
        <button
          type="button"
          className="admin-sidebar-collapse-btn"
          onClick={() => { setSidebarCollapsed((p) => !p); setFlyoutState(null); }}
          title={sidebarCollapsed ? "사이드바 펼치기" : "사이드바 접기"}
        >
          {sidebarCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>

        {/* 플라이아웃 팝업 */}
        {flyoutState && sidebarCollapsed && activeFlyoutGroup && (
          <div className="admin-sidebar-flyout" style={{ top: flyoutState.top - 8 }}>
            <p className="admin-sidebar-flyout__title">{activeFlyoutGroup.label}</p>
            {activeFlyoutGroup.items.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => { handleSelect(key); setFlyoutState(null); }}
                className={`admin-sidebar-flyout__item ${activeKey === key ? "is-active" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

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
        <Route path="/admin/report/:reportNo" element={<AdminReportDetailPage />} />
        <Route path="/admin/member/:userNo" element={<AdminMemberDetailPage />} />
        <Route path="/admin/request/:requestNo" element={<AdminEventDetailPage kind="request" />} />
        <Route path="/admin/log/:logNo" element={<AdminEventDetailPage kind="log" />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  );
}
