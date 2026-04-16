import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
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
import FoundationRegisterPage from "../foundation/pages/FoundationRegisterPage";
import FoundationDashboardPage from "../foundation/pages/FoundationDashboardPage";
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
      const downTriggerPoint = hubTop * 0.2;
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

      <section className="pt-20 pb-44 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="bg-primary px-5 py-7 md:px-8 md:py-8 rounded-[2rem] text-center text-white relative overflow-hidden shadow-2xl shadow-primary/20 border-[5px] border-white">
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.2),transparent)]" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-bold mb-4">
                <Heart size={14} fill="currentColor" />
                ?곕쑜??蹂?붿쓽 ?쒖옉
              </div>
              <h2 className="text-[1.65rem] md:text-[2rem] font-display font-bold mb-4 leading-tight">
                ?щ윭遺꾩쓽 <span className="text-accent italic">留덉쓬</span>??
                <br />
                ?꾩씠?ㅼ쓣 ?껉쾶 ?⑸땲??
              </h2>
              <p className="text-white/80 text-sm mb-6 max-w-md mx-auto leading-relaxed font-medium">
                吏湲?諛붾줈 湲곕??뷀넗?곗쓽 ?꾩썝 ?먮쫫??留뚮굹蹂댁꽭?? <br />
                ?묒? ?ㅼ쿇??紐⑥뿬 ?꾧뎔媛???쇱긽??????鍮쏆씠 ?⑸땲??
              </p>
              <div className="flex flex-wrap justify-center gap-2.5">
                <Link
                  to="/campaigns"
                  className="bg-white text-primary px-6 py-2.5 rounded-full text-sm font-bold hover:scale-105 transition-all shadow-2xl shadow-black/10"
                >
                  罹좏럹???섎윭蹂닿린
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
  const location = useLocation();
  const isFoundationRoute = location.pathname.startsWith("/foundation/");

  return (
    <div className="min-h-screen bg-surface selection:bg-primary selection:text-white">
      <ScrollToTop />
      {!isFoundationRoute ? <Navbar /> : null}
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/donation-return"
            element={<Navigate to="/" replace />}
          />
          <Route path="/campaigns" element={<CampaignList />} />
          <Route path="/campaign/:id" element={<CampaignDetail />} />
          <Route path="/campaign/:id/donate" element={<DonatePage />} />
          <Route path="/transparency" element={<TransparencyPage />} />
          <Route path="/mission" element={<MissionPage />} />
          <Route path="/guide" element={<DonationGuidePage />} />
          <Route path="/ledger" element={<LedgerPage />} />

          {/* ?⑥껜 媛??愿??*/}
          <Route
            path="/organization/apply"
            element={<OrganizationApplyPage />}
          />
          <Route
            path="/organization/apply/form"
            element={<FoundationSignupPage />}
          />
          <Route
            path="/organization/apply/complete"
            element={<FoundationSignupCompletePage />}
          />

          {/* ?쎄? 諛??뺤콉 */}
          <Route path="/terms" element={<LegalPage />} />
          <Route path="/privacy" element={<LegalPage />} />
          <Route path="/policy" element={<LegalPage />} />

          {/* 濡쒓렇??諛??뚯썝媛??*/}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/signup/google" element={<GoogleSignupPage />} />

          {/* 留덉씠?섏씠吏 */}
          <Route path="/mypage" element={<MyPageMain />} />
          <Route path="/mypage/history" element={<MyPageDonationHistory />} />
          <Route path="/mypage/password" element={<MyPagePasswordChange />} />
          
          <Route path="/foundation/me" element={<FoundationDashboardPage />} />
          <Route path="/foundation/register" element={<FoundationRegisterPage />} />

          {/* ?щ떒/?뚯뒪??(以묐났 ?쒓굅?? */}
          <Route path="/test/campaign" element={<TestCampaignPage />} />
          <Route
            path="/foundation/:foundationNo"
            element={<FoundationDetailPage />}
          />
          <Route
            path="/foundation/:foundationNo/campaigns"
            element={<FoundationListPage />}
          />

          {/* 404 ?섏씠吏 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      {!isFoundationRoute ? <Footer /> : null}
    </div>
  );
}

