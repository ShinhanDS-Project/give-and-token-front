import { BookOpen, Droplets, HeartPulse } from "lucide-react";

export const campaigns = [
  {
    id: 1,
    title: "아프리카 깨끗한 식수 지원 프로젝트",
    shortTitle: "아프리카 아이들에게 깨끗한 물을",
    category: "식수 지원",
    image:
      "https://images.unsplash.com/photo-1541516166103-3ad290bb7dfa?q=80&w=2070&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1541516166103-3ad290bb7dfa?q=80&w=2070&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1594708767771-a7502209ff51?q=80&w=2070&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1509099836639-18ba1795216d?q=80&w=2071&auto=format&fit=crop",
    ],
    icon: Droplets,
    color: "text-blue-400",
    progress: 82,
    donors: 1240,
    raised: 41000000,
    goal: 50000000,
    daysLeft: 12,
    summary: "오염된 식수로 고통받는 마을에 우물과 위생 교육을 지원합니다.",
    description:
      "아프리카 사하라 이남 지역의 마을들은 여전히 깨끗한 물을 구하기 위해 매일 먼 길을 걸어야 합니다. 오염된 물로 인해 수많은 아이들이 질병에 노출되어 있습니다. 우리는 이 마을들에 지속 가능한 우물을 설치하고 위생 교육을 함께 지원해 아이들의 건강한 일상을 지키고자 합니다.",
    organization: {
    name: "글로벌 워터 파운데이션",
    description: "깨끗한 식수 접근이 어려운 지역에 지속 가능한 물 인프라와 위생 교육을 지원하는 국제 비영리 단체입니다.",
    image: "https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?q=80&w=300&auto=format&fit=crop"
  },
    recruitStartDate: "2026-03-01",
    recruitEndDate: "2026-05-31",
    projectStartDate: "2026-06-10",
    projectEndDate: "2026-11-30",
    beneficiary: {
      title: "마다가스카르 남부 지역 500명 아동과 가족",
      subtitle: "물 부족과 위생 문제를 겪는 농촌 공동체",
      description:
        "가뭄이 길어지며 식수 접근성이 크게 떨어진 마을을 중심으로 우물 설치와 위생 교육을 함께 지원합니다.",
      region: "마다가스카르 안드로이 지역",
      target: "아동 500명, 보호자 및 주민 공동체",
    },
    recentDonors: [
      { name: "김*은", amount: 50000, time: "2시간 전" },
      { name: "이**", amount: 100000, time: "5시간 전" },
      { name: "박준", amount: 30000, time: "8시간 전" },
    ],
    documents: [
      {
        name: "사업 계획서.pdf",
        size: "2.4 MB",
        href: "data:text/plain;charset=utf-8,%EC%8B%9D%EC%88%98%20%EC%A7%80%EC%9B%90%20%EC%82%AC%EC%97%85%20%EA%B3%84%ED%9A%8D%EC%84%9C",
      },
      {
        name: "현지 파트너십 협약서.pdf",
        size: "1.1 MB",
        href: "data:text/plain;charset=utf-8,%ED%98%84%EC%A7%80%20%ED%8C%8C%ED%8A%B8%EB%84%88%EC%8B%AD%20%ED%98%91%EC%95%BD%EC%84%9C",
      },
      {
        name: "예산 세부 내역서.xlsx",
        size: "850 KB",
        href: "data:text/plain;charset=utf-8,%EC%98%88%EC%82%B0%20%EC%84%B8%EB%B6%80%20%EB%82%B4%EC%97%AD%EC%84%9C",
      },
    ],
  },
  {
    id: 2,
    title: "배움의 기회를 이어주는 교육 지원 캠페인",
    shortTitle: "배움의 기회를 이어주세요",
    category: "교육 지원",
    image:
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=2073&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=2073&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2070&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1529390079861-591de354faf5?q=80&w=2071&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=2122&auto=format&fit=crop",
    ],
    icon: BookOpen,
    color: "text-primary",
    progress: 45,
    donors: 850,
    raised: 13500000,
    goal: 30000000,
    daysLeft: 24,
    summary: "교재, 멘토링, 디지털 학습 기회를 연결해 아이들의 학습 격차를 줄입니다.",
    description:
      "경제적 이유로 충분한 배움의 기회를 누리지 못하는 아이들에게 맞춤형 교육 지원을 제공합니다. 교재와 학습 기기, 정서적 멘토링을 함께 연결해 아이들이 스스로의 가능성을 발견하고 배움을 이어갈 수 있도록 돕습니다.",
      organization: {
      name: "희망교육재단",
      description: "교육 격차 해소를 위해 학습 지원과 멘토링 프로그램을 운영하는 비영리 기관입니다.",
      image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=300&auto=format&fit=crop"
    },
    recruitStartDate: "2026-04-01",
    recruitEndDate: "2026-06-30",
    projectStartDate: "2026-07-10",
    projectEndDate: "2026-12-20",
    beneficiary: {
      title: "지역아동센터와 저소득 가정 청소년 120명",
      subtitle: "학습 기기와 돌봄이 필요한 교육 취약 아동",
      description:
        "기기 지원과 멘토링이 필요한 초중등 학생을 중심으로 학습 환경 개선과 정서 지원을 함께 제공합니다.",
      region: "서울, 경기 지역 협력 기관",
      target: "초중등 학생 120명",
    },
    recentDonors: [
      { name: "최*미", amount: 20000, time: "1시간 전" },
      { name: "정**", amount: 50000, time: "3시간 전" },
      { name: "익명 기부자", amount: 100000, time: "어제" },
    ],
    documents: [
      {
        name: "교육 프로그램 안내서.pdf",
        size: "1.8 MB",
        href: "data:text/plain;charset=utf-8,%EA%B5%90%EC%9C%A1%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%A8%20%EC%95%88%EB%82%B4%EC%84%9C",
      },
      {
        name: "집행 일정표.xlsx",
        size: "620 KB",
        href: "data:text/plain;charset=utf-8,%EC%A7%91%ED%96%89%20%EC%9D%BC%EC%A0%95%ED%91%9C",
      },
    ],
  },
  {
    id: 3,
    title: "아픈 아이들의 웃음을 되찾는 의료 지원",
    shortTitle: "아픈 아이들의 웃음을 되찾아주세요",
    category: "의료 지원",
    image:
      "https://images.unsplash.com/photo-1584515933487-779824d29309?q=80&w=2070&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1584515933487-779824d29309?q=80&w=2070&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?q=80&w=2070&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2070&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=2070&auto=format&fit=crop",
    ],
    icon: HeartPulse,
    color: "text-secondary",
    progress: 91,
    donors: 3200,
    raised: 91000000,
    goal: 100000000,
    daysLeft: 7,
    summary: "긴급 수술비와 치료비, 회복기 돌봄 비용을 함께 지원합니다.",
    description:
      "중증 질환으로 장기 치료가 필요한 아이들과 가족은 의료비뿐 아니라 생활비, 돌봄 공백까지 함께 감당해야 합니다. 우리는 긴급 수술비와 입원 치료비, 회복기 지원을 연결해 가족이 치료에만 집중할 수 있도록 돕고자 합니다.",
      organization: {
      name: "세이브칠드런 의료지원팀",
      description: "의료 사각지대에 놓인 아동들에게 치료비와 긴급 의료 지원을 제공하는 단체입니다.",
      image: "https://images.unsplash.com/photo-1584515933487-779824d29309?q=80&w=300&auto=format&fit=crop"
    },
    recruitStartDate: "2026-02-15",
    recruitEndDate: "2026-04-30",
    projectStartDate: "2026-05-01",
    projectEndDate: "2026-10-31",
    beneficiary: {
      title: "장기 치료가 필요한 중증 질환 아동 30가정",
      subtitle: "수술비와 회복기 지원이 필요한 의료 취약 가정",
      description:
        "긴급 치료가 필요한 환아 가정을 대상으로 수술비, 입원비, 회복기 돌봄 비용을 단계별로 지원합니다.",
      region: "전국 협력 병원 및 쉼터 연계",
      target: "환아 30명과 보호자 가정",
    },
    recentDonors: [
      { name: "이**", amount: 100000, time: "30분 전" },
      { name: "김**", amount: 30000, time: "2시간 전" },
      { name: "박*현", amount: 50000, time: "6시간 전" },
    ],
    documents: [
      {
        name: "의료 지원 심사 기준.pdf",
        size: "980 KB",
        href: "data:text/plain;charset=utf-8,%EC%9D%98%EB%A3%8C%20%EC%A7%80%EC%9B%90%20%EC%8B%AC%EC%82%AC%20%EA%B8%B0%EC%A4%80",
      },
    ],
  },
];

export const featuredCampaigns = campaigns;
export const campaignCategories = ["전체", ...new Set(campaigns.map((campaign) => campaign.category))];
export const formatWon = (amount) => `${amount.toLocaleString()}원`;
