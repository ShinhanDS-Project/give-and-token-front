import { Link } from "react-router-dom";
import childIcon from "../../../img/category/child.svg";
import seniorIcon from "../../../img/category/senior.svg";
import disabledIcon from "../../../img/category/disabled.svg";
import animalIcon from "../../../img/category/animal.svg";
import environmentIcon from "../../../img/category/environment.svg";
import etcIcon from "../../../img/category/etc.svg";

const QUICK_CATEGORIES = [
  {
    label: "아동/청소년",
    iconSrc: childIcon,
    iconAlt: "아동 아이콘"
  },
  {
    label: "어르신",
    iconSrc: seniorIcon,
    iconAlt: "어르신 아이콘"
  },
  {
    label: "장애인",
    iconSrc: disabledIcon,
    iconAlt: "장애인 아이콘"
  },
  {
    label: "동물",
    iconSrc: animalIcon,
    iconAlt: "동물 아이콘"
  },
  {
    label: "환경",
    iconSrc: environmentIcon,
    iconAlt: "환경 아이콘"
  },
  {
    label: "기타",
    iconSrc: etcIcon,
    iconAlt: "기타 아이콘"
  }
];

export default function CategoryQuickNav() {
  return (
    <section className="relative pt-6 pb-8 md:pt-8 md:pb-10 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-5">
          {QUICK_CATEGORIES.map((item) => (
            <Link
              key={item.label}
              to={`/campaigns?category=${encodeURIComponent(item.label)}`}
              className="group w-[92px] text-center transition-all hover:-translate-y-0.5"
            >
              <div className="mx-auto h-[72px] w-[72px] rounded-full border border-line bg-white flex items-center justify-center shadow-sm transition-all group-hover:border-primary/40">
                <img
                  src={item.iconSrc}
                  alt={item.iconAlt}
                  className="h-9 w-9 object-contain"
                  loading="lazy"
                />
              </div>
              <div className="mt-2 text-sm font-bold text-ink group-hover:text-primary">{item.label}</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
