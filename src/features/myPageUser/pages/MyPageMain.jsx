import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProfileCard from "../components/ProfileCardPage";
import WalletCard from "../components/MyWalletCard";
import DonationSummaryCard from "../components/MyDonationSummaryCard";
import DonationHistorySection from "../components/DonationHistorySection";
import {
  getMyPageInfo,
  getTransactionHistory,
  getWalletInfo,
} from "../api/mypageApi";

export default function MyPageMain() {
  const navigate = useNavigate();

  const [myInfo, setMyInfo] = useState(null);
  const [walletInfo, setWalletInfo] = useState(null);
  const [transactionList, setTransactionList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMyPageData();
  }, []);

  const fetchMyPageData = async () => {
    try {
      setLoading(true);
      setError("");

      const [myInfoRes, walletRes, transactionRes] = await Promise.all([
        getMyPageInfo(),
        getWalletInfo(),
        getTransactionHistory(),
      ]);

      setMyInfo(myInfoRes.data);
      setWalletInfo(walletRes.data);
      setTransactionList(transactionRes.data ?? []);
    } catch (err) {
      console.error(err);
      setError("마이페이지 정보를 불러오지 못했어.");
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    if (!transactionList.length) {
      return {
        transactionNum: 0,
        totalAmount: 0,
      };
    }

    return {
      transactionNum: transactionList[0]?.transactionNum ?? 0,
      totalAmount: transactionList[0]?.total_amount ?? 0,
    };
  }, [transactionList]);

  if (loading) {
    return <div>로딩 중...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="mypage-main-page">
      <h1>마이페이지</h1>

      <section className="mypage-main-top">
        <ProfileCard
          myInfo={myInfo}
          onEditProfile={() => navigate("/mypage/profile/edit")}
          onChangePassword={() => navigate("/mypage/password/change")}
          onViewDonations={() => navigate("/mypage/donations")}
        />

        <div className="mypage-main-side">
          <WalletCard walletInfo={walletInfo} />
          <DonationSummaryCard summary={summary} />
        </div>
      </section>

      <section className="mypage-main-bottom">
        <DonationHistorySection
          donationHistory={transactionList}
          onViewAll={() => navigate("/mypage/donations")}
        />
      </section>
    </div>
  );
}