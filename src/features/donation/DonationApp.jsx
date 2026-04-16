import { useEffect } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { Heart } from "lucide-react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import HomeCampaignHub from "./components/HomeCampaignHub";
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
import LoginPage from "../login/pages/LoginPage";
import SignupPage from "../signUp/pages/SignupPage";
import MyPageMain from "../myPageUser/pages/MyPageMain";
import MyPageDonationHistory from "../myPageUser/pages/MyPageDonationHistory";
import MyPagePasswordChange from "../myPageUser/pages/MyPagePasswordChange";
import MyPageProfileEdit from "../myPageUser/pages/MyPageProfileEdit";
import GoogleSignupPage from "../signUp/pages/GoogleSignupPage";
import TestCampaignPage from "../foundation/pages/GabeenCampaignPageTest";
import FoundationDetailPage from "../foundation/pages/FoundationDetailPage";
import FoundationListPage from "../foundation/pages/FoundationListPage";
import FoundationSignupPage from "../foundation/pages/FoundationSignupPage";
import FoundationSignupCompletePage from "../foundation/pages/FoundationSignupCompletePage";

function HomePage() {
  useEffect(() => {
    document.documentElement.classList.add("home-scroll-snap");
    document.body.classList.add("home-scroll-snap");
    let isSnapping = false;
    let lastY = window.scrollY;
    let lastSnapAt = 0;
    const SNAP_COOLDOWN = 520;
    const SNAP_DEAD_ZONE = 56;

    const forceSnapToHub = () => {
      if (isSnapping) {
        return;
      }

      const hub = document.getElementById("home-hub");
      if (!hub) {
        return;
      }

      const hubTop = hub.getBoundingClientRect().top + window.scrollY;
      const currentY = window.scrollY;
      const now = Date.now();
      if (now - lastSnapAt < SNAP_COOLDOWN) {
        lastY = currentY;
        return;
      }

      const isGoingDown = currentY > lastY;
      const isGoingUp = currentY < lastY;
      const downTriggerPoint = hubTop * 0.20;
      const upTriggerPoint = hubTop * 0.75;
      lastY = currentY;

      if (
        isGoingDown &&
        currentY > downTriggerPoint &&
        currentY < hubTop - SNAP_DEAD_ZONE
      ) {
        isSnapping = true;
        lastSnapAt = now;
        window.scrollTo({ top: hubTop, behavior: "smooth" });
        window.setTimeout(() => {
          isSnapping = false;
        }, SNAP_COOLDOWN);
        return;
      }

      if (
        isGoingUp &&
        currentY < upTriggerPoint &&
        currentY > SNAP_DEAD_ZONE &&
        currentY < hubTop + SNAP_DEAD_ZONE
      ) {
        isSnapping = true;
        lastSnapAt = now;
        window.scrollTo({ top: 0, behavior: "smooth" });
        window.setTimeout(() => {
          isSnapping = false;
        }, SNAP_COOLDOWN);
      }
    };

    window.addEventListener("scroll", forceSnapToHub, { passive: true });

    return () => {
      document.documentElement.classList.remove("home-scroll-snap");
      document.body.classList.remove("home-scroll-snap");
      window.removeEventListener("scroll", forceSnapToHub);
    };
  }, []);

  return (
    <>
      <Hero />
      <HomeCampaignHub />

      <section className="pt-20 pb-44 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full watercolor-bg opacity-30" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="bg-primary px-5 py-7 md:px-8 md:py-8 rounded-[2rem] text-center text-white relative overflow-hidden shadow-2xl shadow-primary/20 border-[5px] border-white">
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.2),transparent)]" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-bold mb-4">
                <Heart size={14} fill="currentColor" />
                따뜻한 변화의 시작
              </div>
              <h2 className="text-[1.65rem] md:text-[2rem] font-display font-bold mb-4 leading-tight">
                여러분의 <span className="text-accent italic">마음</span>이
                <br />
                아이들을 웃게 합니다
              </h2>
              <p className="text-white/80 text-sm mb-6 max-w-md mx-auto leading-relaxed font-medium">
                지금 바로 기부엔토큰의 후원 흐름을 만나보세요. <br/>
                작은 실천이 모여 누군가의 일상에 더 큰 빛이 됩니다.
              </p>
              <div className="flex flex-wrap justify-center gap-2.5">
                <Link
                  to="/campaigns"
                  className="bg-white text-primary px-6 py-2.5 rounded-full text-sm font-bold hover:scale-105 transition-all shadow-2xl shadow-black/10"
                >
                  캠페인 둘러보기
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

          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/mypage" element={<MyPageMain />} />
          <Route path="/mypage/history" element={<MyPageDonationHistory />} />
          <Route path="/mypage/password" element={<MyPagePasswordChange />} />
          <Route path="/mypage/profile" element={<MyPageProfileEdit />} />
          <Route path="/signup/google" element={<GoogleSignupPage />} />
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
