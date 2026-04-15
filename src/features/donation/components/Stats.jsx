import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Users, Heart, ShieldCheck, Sparkles } from "lucide-react";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

const EMPTY_SUMMARY = {
  totalDonationCount: 0,
  totalUserCount: 0,
  totalCampaignCount: 0
};

function toCount(value) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatCount(value, unit) {
  return `${toCount(value).toLocaleString("ko-KR")}${unit}`;
}

export default function Stats() {
  const [summary, setSummary] = useState(EMPTY_SUMMARY);

  useEffect(() => {
    let ignore = false;

    async function loadStats() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/donation/public/stats`);
        if (!response.ok) {
          throw new Error(`stats request failed: ${response.status}`);
        }

        const data = await response.json();
        if (!ignore) {
          setSummary({
            totalDonationCount: toCount(data.totalDonationCount),
            totalUserCount: toCount(data.totalUserCount),
            totalCampaignCount: toCount(data.totalCampaignCount)
          });
        }
      } catch {
        if (!ignore) {
          setSummary(EMPTY_SUMMARY);
        }
      }
    }

    loadStats();
    return () => {
      ignore = true;
    };
  }, []);

  const stats = useMemo(
    () => [
      {
        label: "누적 기부수",
        value: formatCount(summary.totalDonationCount, "건"),
        icon: Heart,
        color: "bg-primary/10 text-primary"
      },
      {
        label: "누적 사용자 수",
        value: formatCount(summary.totalUserCount, "명"),
        icon: Users,
        color: "bg-secondary/10 text-secondary"
      },
      {
        label: "누적 캠페인 수",
        value: formatCount(summary.totalCampaignCount, "개"),
        icon: Sparkles,
        color: "bg-accent/20 text-ink"
      },
      {
        label: "투명한 믿음",
        value: "100%",
        icon: ShieldCheck,
        color: "bg-green-50 text-green-600"
      }
    ],
    [summary]
  );

  return (
    <section className="snap-start snap-always pt-44 pb-32 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
              className="text-center group"
            >
              <div className={`w-24 h-24 mx-auto organic-shape flex items-center justify-center mb-8 transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 ${stat.color} shadow-lg shadow-current/5`}>
                <stat.icon size={40} />
              </div>
              <div className="text-4xl font-display font-bold text-ink mb-3">
                {stat.value}
              </div>
              <div className="text-sm font-bold text-stone-400 tracking-wider">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
