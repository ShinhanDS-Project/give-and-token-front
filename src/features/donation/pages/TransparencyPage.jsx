import { useEffect } from "react";
import { motion } from "motion/react";
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import BlockchainLedger from "../components/BlockchainLedger";

const principles = [
  "모든 캠페인의 목표 금액, 집행 범위, 종료 일정은 공개합니다.",
  "주요 집행 서류와 후원 문서는 캠페인 상세 페이지에서 함께 확인할 수 있습니다.",
  "기부 흐름은 블록체인 기반 원장으로 추적 가능하게 관리합니다.",
];

const missionValues = [
  {
    title: "연결",
    description: "기부를 숫자만이 아닌 사람과 이야기의 흐름으로 전달합니다.",
    icon: HeartHandshake,
  },
  {
    title: "투명성",
    description: "감정과 결과가 함께 보이도록 기록을 공개합니다.",
    icon: Sparkles,
  },
  {
    title: "지속성",
    description: "한 번의 후원으로 끝나지 않도록 더 긴 지원 구조를 고민합니다.",
    icon: Target,
  },
  {
    title: "연대",
    description: "기부자와 현장 파트너, 수혜자의 변화를 하나의 흐름으로 연결합니다.",
    icon: Users,
  },
];

const viewport = { once: true, amount: 0.18 };

function PageSection({ className = "", children }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 56 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewport}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`page-snap-target min-h-[88vh] flex items-center ${className}`}
    >
      {children}
    </motion.section>
  );
}

export default function TransparencyPage() {
  useEffect(() => {
    document.documentElement.classList.add("page-scroll-snap");
    document.body.classList.add("page-scroll-snap");
    let isSnapping = false;
    let lastY = window.scrollY;
    let lastSnapAt = 0;
    const SNAP_COOLDOWN = 420;
    const DOWN_TRIGGER_RATIO = 0.4;
    const UP_TRIGGER_RATIO = 0.5;

    const snapByProgress = () => {
      if (isSnapping) return;

      const sections = Array.from(document.querySelectorAll(".page-snap-target"));
      if (sections.length < 2) return;

      const currentY = window.scrollY;
      const now = Date.now();
      if (now - lastSnapAt < SNAP_COOLDOWN) {
        lastY = currentY;
        return;
      }

      const isGoingDown = currentY > lastY;
      const isGoingUp = currentY < lastY;
      lastY = currentY;

      for (let i = 0; i < sections.length; i += 1) {
        const section = sections[i];
        const top = section.getBoundingClientRect().top + window.scrollY;
        const height = section.offsetHeight || window.innerHeight;
        const bottom = top + height;

        if (currentY < top || currentY >= bottom) {
          continue;
        }

        const progress = (currentY - top) / Math.max(1, height);

        if (isGoingDown && progress >= DOWN_TRIGGER_RATIO && i < sections.length - 1) {
          const nextTop = sections[i + 1].getBoundingClientRect().top + window.scrollY;
          isSnapping = true;
          lastSnapAt = now;
          window.scrollTo({ top: nextTop, behavior: "smooth" });
          window.setTimeout(() => {
            isSnapping = false;
          }, SNAP_COOLDOWN);
          return;
        }

        if (isGoingUp && progress <= UP_TRIGGER_RATIO && i > 0) {
          const prevTop = sections[i - 1].getBoundingClientRect().top + window.scrollY;
          isSnapping = true;
          lastSnapAt = now;
          window.scrollTo({ top: prevTop, behavior: "smooth" });
          window.setTimeout(() => {
            isSnapping = false;
          }, SNAP_COOLDOWN);
          return;
        }
      }
    };

    window.addEventListener("scroll", snapByProgress, { passive: true });

    return () => {
      document.documentElement.classList.remove("page-scroll-snap");
      document.body.classList.remove("page-scroll-snap");
      window.removeEventListener("scroll", snapByProgress);
    };
  }, []);

  return (
    <div className="pt-52 pb-32 watercolor-bg min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageSection className="min-h-[calc(100svh-14rem)] lg:min-h-[calc(100svh-13rem)]">
          <div className="w-full space-y-5">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white border-2 border-line text-primary text-sm font-bold shadow-sm mb-5">
                <ShieldCheck size={16} fill="currentColor" />
                투명성 센터
              </div>
              <h1 className="text-4xl md:text-[3.15rem] xl:text-[3.55rem] font-display font-bold text-ink leading-[1.16] mb-5">
                기부가 어떻게 <span className="text-primary italic">기록</span>되고
                <br />
                어디에 쓰이는지 보여드립니다
              </h1>
              <p className="text-[15px] md:text-[17px] text-stone-500 leading-relaxed max-w-3xl">
                기부엔토큰은 감성적인 메시지에만 기대지 않고, 실제 집행과 검증 과정을 함께
                보여주는 구조를 지향합니다. 누구나 캠페인 진행 상황과 증빙 흐름을 이해할 수
                있도록 대시보드와 문서, 보고 흐름을 연결해두었습니다.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-4">
              {principles.map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewport}
                  transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
                  className="storybook-card bg-white p-5 md:p-6"
                >
                  <div className="w-11 h-11 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                    <CheckCircle2 size={20} />
                  </div>
                  <p className="text-stone-600 font-medium leading-relaxed text-sm md:text-[15px]">
                    {item}
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="bg-white border-4 border-line rounded-[2.6rem] p-7 md:p-8">
              <div className="flex flex-col lg:flex-row gap-8 justify-between">
                <div className="max-w-2xl">
                  <h2 className="text-[1.7rem] md:text-[2rem] font-display font-bold text-ink mb-4">
                    검증 기준
                  </h2>
                  <p className="text-sm md:text-[15px] text-stone-500 leading-relaxed">
                    캠페인 등록 전후의 기본 검토, 예산 확인, 종료 후 집행 보고까지 기본 원칙으로
                    운영합니다. <br/> 고정된 형식으로 관리해 비교와 추적이 가능하도록 구성했습니다.
                  </p>
                </div>

                <div className="flex flex-col gap-3 lg:items-end">
                  <Link to="/blockchain" className="btn-fairytale">
                    블록체인 대시보드 보기 <ExternalLink size={18} />
                  </Link>
                  <Link to="/guide" className="btn-fairytale-outline">
                    기부 가이드 보기 <FileText size={18} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </PageSection>

        <PageSection className="mt-10 md:mt-14">
          <div className="grid lg:grid-cols-2 gap-16 items-center w-full">
            <div>
              <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-primary/5 text-primary text-sm font-bold mb-8 border border-primary/10">
                <Sparkles size={16} fill="currentColor" />
                우리의 사명
              </div>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-ink leading-tight mb-8">
                의미를 남기는
                <br />
                <span className="text-primary italic">기부 경험</span>을 만듭니다
              </h2>
              <p className="text-lg text-stone-500 leading-relaxed">
                기부엔토큰은 아름다운 문구만 있는 기부 플랫폼이 아니라, <br/>
                기부 전의 이해와 기부 후의 확인까지 포함된 경험을 목표로 합니다. <br/>
                사용자는 왜 후원하는지 알 수 있어야 하고, <br/>
                후원 이후 어떤 변화가 만들어졌는지도 확인할 수 있어야 합니다.
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 36 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={viewport}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.08 }}
              className="bg-white border-4 border-line rounded-[3rem] p-10 md:p-12"
            >
              <h3 className="text-3xl font-display font-bold text-ink mb-8">
                우리가 중요하게 보는 것
              </h3>
              <div className="space-y-6">
                {missionValues.map((value, index) => (
                  <motion.div
                    key={value.title}
                    initial={{ opacity: 0, x: 18 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={viewport}
                    transition={{ duration: 0.45, delay: index * 0.1, ease: "easeOut" }}
                    className="flex gap-4"
                  >
                    <div className="w-14 h-14 rounded-3xl bg-stone-50 border-2 border-line text-primary flex items-center justify-center shrink-0">
                      <value.icon size={24} />
                    </div>
                    <div>
                      <h4 className="text-xl font-display font-bold text-ink mb-1">
                        {value.title}
                      </h4>
                      <p className="text-stone-500 font-medium">{value.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </PageSection>

        <PageSection className="mt-10 md:mt-14 min-h-[calc(100svh-12rem)]">
          <div className="w-full space-y-5">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white border-2 border-line text-primary text-sm font-bold shadow-sm mb-6">
                <ShieldCheck size={18} fill="currentColor" />
                실시간 투명성 원장
              </div>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-ink leading-tight mb-4">
                후원 흐름을
                <br />
                <span className="text-primary italic">실시간으로 확인</span>하세요
              </h2>
              <p className="text-base md:text-lg text-stone-500 leading-relaxed max-w-3xl">
                실제 서비스에서는 캠페인별 후원과 집행 흐름이 이 영역에서 이어집니다. <br/>
                모든 기부 내역은 암호화되어 공공 장부에 기록됩니다.  <br/>
                수정이나 삭제가 불가능한 블록체인 기술로 100% 신뢰할 수 있는 기부 문화를 만듭니다.
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.08 }}
              transition={{ duration: 0.85, ease: "easeOut" }}
              className="-mb-16 md:-mb-12"
            >
              <BlockchainLedger />
            </motion.div>
          </div>
        </PageSection>
      </div>
    </div>
  );
}
