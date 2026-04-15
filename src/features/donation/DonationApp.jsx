import { Link, Navigate, Route, Routes } from "react-router-dom";
import { Heart } from "lucide-react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Stats from "./components/Stats";
import Campaigns from "./components/Campaigns";
import TransparencyReport from "./components/TransparencyReport";
import Footer from "./components/Footer";
import CampaignList from "./pages/CampaignList";
import CampaignDetail from "./pages/CampaignDetail";
import DonatePage from "./pages/DonatePage";
import DonationGuidePage from "./pages/DonationGuidePage";
import LedgerPage from "./pages/LedgerPage";
import LegalPage from "./pages/LegalPage";
import MissionPage from "./pages/MissionPage";
import NotFoundPage from "./pages/NotFoundPage";
import OrganizationApplyPage from "./pages/OrganizationApplyPage";
import TransparencyPage from "./pages/TransparencyPage";
import ScrollToTop from "./components/ScrollToTop";
import TestCampaignPage from "../foundation/pages/GabeenCampaignPageTest";
import FoundationDetailPage from "../foundation/pages/FoundationDetailPage";
import FoundationListPage from "../foundation/pages/FoundationListPage";
import FoundationSignupPage from "../foundation/pages/FoundationSignupPage";
import FoundationSignupCompletePage from "../foundation/pages/FoundationSignupCompletePage";

function HomePage() {
  return (
    <>
      <Hero />
      <Stats />
      <Campaigns />
      <TransparencyReport />

      <section className="pt-28 pb-44 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full watercolor-bg opacity-30" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="bg-primary px-8 py-10 md:px-14 md:py-14 rounded-[3rem] text-center text-white relative overflow-hidden shadow-2xl shadow-primary/20 border-[8px] border-white">
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.2),transparent)]" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold mb-6">
                <Heart size={14} fill="currentColor" />
                따뜻한 변화의 시작
              </div>
              <h2 className="text-3xl md:text-5xl font-display font-bold mb-6 leading-tight">
                여러분의 <span className="text-accent italic">마음</span>이
                <br />
                아이들을 웃게 합니다
              </h2>
              <p className="text-white/80 text-base md:text-lg mb-8 max-w-xl mx-auto leading-relaxed font-medium">
                지금 바로 기부엔토큰의 후원 흐름을 만나보세요. <br />
                작은 실천이 모여 누군가의 일상에 더 큰 빛이 됩니다.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  to="/campaigns"
                  className="bg-white text-primary px-8 py-3.5 rounded-full text-base font-bold hover:scale-105 transition-all shadow-2xl shadow-black/10"
                >
                  캠페인 둘러보기
                </Link>
                <Link
                  to="/campaigns"
                  className="bg-white/10 backdrop-blur-md border-2 border-white/30 px-8 py-3.5 rounded-full text-base font-bold hover:bg-white/20 transition-all"
                >
                  지금 참여하기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default function DonationApp() {
  return (
    <div className="min-h-screen bg-surface selection:bg-primary selection:text-white">
      <ScrollToTop />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/donation-return" element={<Navigate to="/" replace />} />
          <Route path="/campaigns" element={<CampaignList />} />
          <Route path="/campaign/:id" element={<CampaignDetail />} />
          <Route path="/campaign/:id/donate" element={<DonatePage />} />
          <Route path="/transparency" element={<TransparencyPage />} />
          <Route path="/mission" element={<MissionPage />} />
          <Route path="/guide" element={<DonationGuidePage />} />
          <Route path="/ledger" element={<LedgerPage />} />
          <Route path="/organization/apply" element={<OrganizationApplyPage />} />
          <Route path="/organization/apply/form" element={<FoundationSignupPage />} />
          <Route path="/organization/apply/complete" element={<FoundationSignupCompletePage />} />
          <Route path="/terms" element={<LegalPage />} />
          <Route path="/privacy" element={<LegalPage />} />
          <Route path="/policy" element={<LegalPage />} />
          <Route path="/test/campaign" element={<TestCampaignPage />} />
          <Route path="/foundation/:foundationNo" element={<FoundationDetailPage />} />
          <Route path="/foundation/:foundationNo/campaigns" element={<FoundationListPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
