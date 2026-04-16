import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTransactionHistory } from "../api/mypageApi";

export default function MyPageDonationHistory() {
  const navigate = useNavigate();

  const [transactionList, setTransactionList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDonationHistory();
  }, []);

  const fetchDonationHistory = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getTransactionHistory();
      setTransactionList(response.data ?? []);
    } catch (err) {
      console.error(err);

      const message =
        err?.response?.data?.message ||
        err?.response?.data ||
        "기부내역을 불러오지 못했어.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    if (amount == null) return "0원";
    return `${Number(amount).toLocaleString()}원`;
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "-";

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleString("ko-KR");
  };

  const summary =
    transactionList.length > 0
      ? {
          transactionNum: transactionList[0]?.transactionNum ?? 0,
          totalAmount: transactionList[0]?.total_amount ?? 0,
        }
      : {
          transactionNum: 0,
          totalAmount: 0,
        };

  if (loading) {
    return <div>기부내역 불러오는 중...</div>;
  }

  if (error) {
    return (
      <div>
        <p>{error}</p>
        <button type="button" onClick={() => navigate("/mypage")}>
          마이페이지로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1>나의 기부내역</h1>

      <button type="button" onClick={() => navigate("/mypage")}>
        마이페이지로 돌아가기
      </button>

      <hr />

      <div>
        <p>총 기부 횟수: {summary.transactionNum}회</p>
        <p>총 기부 금액: {formatAmount(summary.totalAmount)}</p>
      </div>

      <hr />

      {transactionList.length === 0 ? (
        <p>기부내역이 없어.</p>
      ) : (
        <div>
          {transactionList.map((item, index) => (
            <div
              key={item.transaction?.transactionNo ?? `${item.campaignNo}-${index}`}
            >
              <p>캠페인명: {item.title ?? "-"}</p>
              <p>캠페인 번호: {item.campaignNo ?? "-"}</p>
              <p>승인 상태: {item.approvalStatus ?? "-"}</p>
              <p>기부 금액: {formatAmount(item.transaction?.amount)}</p>
              <p>
                기부 일시:{" "}
                {formatDate(item.transaction?.sentAt || item.transaction?.createdAt)}
              </p>
              <p>트랜잭션 상태: {item.transaction?.status ?? "-"}</p>
              <p>트랜잭션 해시: {item.transaction?.txHash ?? "-"}</p>

              <hr />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}