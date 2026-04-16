import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Heart, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { getCampaignCards } from "../api/campaignApi";

export default function Campaigns() {
  const [featuredCampaigns, setFeaturedCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const campaigns = await getCampaignCards({ sort: "deadline" });

        if (isMounted) {
          setFeaturedCampaigns(campaigns.slice(0, 3));
        }
      } catch {
        if (isMounted) {
          setError("캠페인 목록을 불러오지 못했습니다.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="relative bg-[#FFFDFB] py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-20 max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-6 py-2 text-sm font-bold text-primary">
            <Sparkles size={16} fill="currentColor" />
            지금 진행 중인 캠페인
          </div>
          <h2 className="mb-8 text-5xl font-display font-bold text-ink md:text-6xl">
            여러분의 <span className="text-primary italic">마음</span>이
            <br />
            필요한 곳에 닿도록
          </h2>
          <p className="text-lg font-medium text-stone-500">
            아이들의 웃음이 끊이지 않도록, 따뜻한 관심과 후원이 이어질 수 있게 도와주세요.
            <br />
            모든 기부 과정은 투명하게 공개됩니다.
          </p>
        </div>

        {isLoading && (
          <div className="rounded-[2rem] border-2 border-line bg-white p-10 text-center text-stone-500">
            캠페인 목록을 불러오는 중입니다.
          </div>
        )}

        {error && !isLoading && (
          <div className="rounded-[2rem] border-2 border-line bg-white p-10 text-center text-stone-500">
            {error}
          </div>
        )}

        {!isLoading && !error && (
          <div className="grid gap-12 md:grid-cols-3">
          {featuredCampaigns.map((camp) => (
            <Link
              key={camp.id}
              to={`/campaign/${camp.id}`}
              className="storybook-card group block p-0"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={camp.image}
                  alt={camp.shortTitle}
                  className="h-full w-full object-cover grayscale-[0.1] sepia-[0.05] transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute left-6 top-6">
                  <div className="rounded-full border border-line bg-white/90 px-5 py-2 text-xs font-bold text-ink shadow-lg backdrop-blur-md">
                    {camp.category}
                  </div>
                </div>
              </div>

              <div className="p-10">
                <div className="mb-6 flex items-center gap-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-50 ${camp.color}`}
                  >
                    <camp.icon size={24} />
                  </div>
                  <h3 className="text-2xl font-display font-bold leading-tight text-ink transition-colors group-hover:text-primary">
                    {camp.shortTitle}
                  </h3>
                </div>

                <div className="space-y-5">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-primary">{camp.progress}% 달성</span>
                    <div className="flex items-center gap-1 text-stone-400">
                      <Heart size={14} fill="currentColor" className="text-primary/30" />
                      나눔 중
                    </div>
                  </div>
                  <div className="h-4 overflow-hidden rounded-full border border-line bg-stone-100 p-1">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${camp.progress}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full rounded-full bg-primary shadow-sm"
                    />
                  </div>
                </div>

                <button className="mt-10 flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-50 py-5 font-bold text-stone-500 shadow-sm transition-all group-hover:bg-primary group-hover:text-white">
                  자세히 보기 <ArrowRight size={18} />
                </button>
              </div>
            </Link>
          ))}
        </div>
        )}

        <div className="mt-20 flex justify-end">
          <Link
            to="/campaigns"
            className="btn-fairytale-outline inline-flex items-center gap-2 px-12 py-4 transition-all duration-300 hover:-translate-y-1 active:translate-y-0"
          >
            전체 캠페인 둘러보기 <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </section>
  );
}
