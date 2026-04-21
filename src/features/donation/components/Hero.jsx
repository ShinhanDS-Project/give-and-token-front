import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Heart, Sparkles, Cloud, Sun } from "lucide-react";
import { Link } from "react-router-dom";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export default function Hero() {
  const [totalDonorCount, setTotalDonorCount] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function loadPublicStats() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/donation/public/stats`);
        if (!response.ok) {
          throw new Error(`stats request failed: ${response.status}`);
        }

        const data = await response.json();
        if (!ignore) {
          setTotalDonorCount(Number(data?.totalUserCount ?? 0));
        }
      } catch {
        if (!ignore) {
          setTotalDonorCount(0);
        }
      }
    }

    loadPublicStats();
    return () => {
      ignore = true;
    };
  }, []);

  const formattedDonorCount = Number.isFinite(totalDonorCount)
    ? totalDonorCount.toLocaleString("ko-KR")
    : "0";

  return (
    <section className="home-snap-target relative min-h-screen pt-28 pb-14 md:pt-32 md:pb-16 overflow-hidden watercolor-bg">
      <motion.div
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-24 left-[10%] text-primary opacity-20"
      >
        <Cloud size={120} fill="currentColor" />
      </motion.div>

      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-12 right-[15%] text-accent opacity-30"
      >
        <Sun size={100} fill="currentColor" />
      </motion.div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid min-h-[calc(100vh-9.5rem)] lg:grid-cols-2 gap-12 lg:gap-14 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white border-2 border-line text-primary text-sm font-bold mb-8 shadow-sm">
              <Sparkles size={16} fill="currentColor" />
              사랑으로 세상을 따뜻하게 만들어요
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-[4.8rem] font-display font-bold leading-[0.92] text-ink mb-10">
              아이들의 <span className="text-primary italic">꿈이</span>
              <br />
              <span className="relative inline-block">
                피어날 수 있게
                <svg className="absolute -bottom-4 left-0 w-full" viewBox="0 0 300 20" fill="none">
                  <path d="M5 15C50 5 150 5 295 15" stroke="#FF8A65" strokeWidth="8" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            <p className="text-xl sm:text-[1.3rem] text-stone-500 mb-12 leading-relaxed max-w-xl font-medium">
              우리의 작은 나눔이 모여 커다란 기적을 만듭니다.
              <br />
              동화처럼 아름다운 변화를 함께 만들어가요.
            </p>

            <div className="flex flex-wrap gap-6 items-center ">
              <Link to="/campaigns" className="btn-fairytale !px-9 !py-4">
                지금 사랑 전하기 <Heart size={20} fill="currentColor" />
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className="relative w-full max-w-[650px] justify-self-center lg:justify-self-end"
          >
            <div className="relative z-10">
              <div className="organic-shape overflow-hidden border-[10px] border-white shadow-xl aspect-square">
                <img
                  src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070&auto=format&fit=crop"
                  alt="Children smiling"
                  className="w-full h-full object-cover grayscale-[0.2] sepia-[0.1]"
                  referrerPolicy="no-referrer"
                />
              </div>

              <motion.div
                animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-8 -right-8 bg-accent p-6 rounded-[2.6rem] shadow-xl border-4 border-white max-w-[220px]"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-white/50 rounded-full flex items-center justify-center text-primary">
                    <Sparkles size={20} fill="currentColor" />
                  </div>
                  <span className="font-display font-bold text-[1.55rem] text-ink leading-none">투명한 나눔</span>
                </div>
                <p className="text-ink/70 text-xs font-medium leading-relaxed">
                  블록체인으로 믿음을 더해요
                </p>
              </motion.div>

              <motion.div
                animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-8 -left-8 bg-white p-6 rounded-[2.6rem] shadow-xl border-4 border-line max-w-[210px]"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <Heart size={20} fill="currentColor" />
                  </div>
                  <span className="font-display font-bold text-[1.55rem] text-ink leading-none">함께해요</span>
                </div>
                <p className="text-stone-500 text-xs font-medium leading-relaxed">
                  {formattedDonorCount}명의 기부자가 함께하고 있습니다.
                </p>
              </motion.div>
            </div>

            <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
            <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl -z-10" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

