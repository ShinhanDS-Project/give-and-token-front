import { Link } from "react-router-dom";

function DonationReturnPage() {
  return (
    <section className="donation-return">
      <div className="donation-return__hero">
        <div className="donation-return__content">
          <p className="donation-return__eyebrow">Give Again</p>
          <h2>작은 기부가 누군가의 하루를 바꿉니다</h2>
          <p className="donation-return__text">
            이 페이지는 실제 기부 메인으로 연결될 자리입니다. 지금은 임시 화면이지만,
            대시보드와는 전혀 다른 분위기의 후원 랜딩 페이지처럼 보이도록 구성했습니다.
          </p>

          <div className="donation-return__actions">
            <Link to="/campaigns" className="donation-return__primary">
              캠페인 둘러보기
            </Link>
            <Link to="/campaigns/register" className="donation-return__secondary">
              캠페인 등록하기
            </Link>
            <Link to="/" className="donation-return__secondary">
              대시보드 보기
            </Link>
          </div>
        </div>

        <div className="donation-return__badge-card">
          <span>오늘의 메시지</span>
          <strong>기부는 흐름이고, 흐름은 변화를 만듭니다.</strong>
        </div>
      </div>

      <div id="campaigns" className="donation-return__grid">
        <article className="donation-return__card">
          <p>추천 캠페인</p>
          <strong>청소년 디지털 학습 지원</strong>
          <span>배움의 격차를 줄이기 위한 장비와 튜터링 연결</span>
        </article>
        <article className="donation-return__card">
          <p>진행 중 캠페인</p>
          <strong>도심 숲 복원 캠페인</strong>
          <span>훼손된 지역에 다시 초록을 심는 회복 프로젝트</span>
        </article>
        <article className="donation-return__card">
          <p>참여 방식</p>
          <strong>간편 탐색</strong>
          <span>캠페인 목록, 상세, 등록 화면을 한 흐름으로 바로 이동할 수 있습니다</span>
        </article>
      </div>
    </section>
  );
}

export default DonationReturnPage;
