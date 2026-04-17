import { useEffect } from "react";
import { House, Layers, Settings, Wallet } from "lucide-react";
import "../css/foundationTheme.css";

export default function FoundationChrome() {
  useEffect(() => {
    const appShell = document.querySelector("#root > div");
    const chromeTargets = appShell
      ? appShell.querySelectorAll(":scope > nav, :scope > footer")
      : [];

    const previousDisplays = Array.from(chromeTargets).map((element) => ({
      element,
      display: element.style.display,
    }));

    chromeTargets.forEach((element) => {
      element.style.display = "none";
    });

    return () => {
      previousDisplays.forEach(({ element, display }) => {
        element.style.display = display;
      });
    };
  }, []);

  return (
    <aside className="foundation-chrome" aria-label="기부단체 메뉴">
      <h1>기부엔토큰</h1>
      <nav className="foundation-chrome-nav">
        <a href="/foundation/me" className="foundation-chrome-link">
          <House size={14} /> 홈
        </a>
        <a href="/foundation/me?menu=campaign" className="foundation-chrome-link">
          <Layers size={14} /> 캠페인
        </a>
        <a href="/foundation/me?menu=settlement" className="foundation-chrome-link">
          <Wallet size={14} /> 정산
        </a>
        <a href="/foundation/me?menu=settings" className="foundation-chrome-link">
          <Settings size={14} /> 정보관리
        </a>
        <a href="http://localhost:5173/" className="foundation-chrome-link">
          <House size={14} /> <span>기부엔토큰<br />바로가기</span>
        </a>
      </nav>
    </aside>
  );
}
