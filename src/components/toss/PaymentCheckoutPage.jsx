import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const clientKey = "test_ck_AQ92ymxN34Nq0j94xYgyrajRKXvd";

export default function PaymentCheckoutPage() {
  const [payment, setPayment] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // 💡 로딩 상태 추가
  const isProcessing = useRef(false); // 💡 중복 클릭 방지 플래그
  
  const location = useLocation();
  const navigate = useNavigate();

  const { campaignNo, amount, orderName, isAnonymous } = location.state || {
    campaignNo: 216,
    amount: 1000,
    orderName: "올드페리도넛-기부테스트",
    isAnonymous: false
  };

  useEffect(() => {
    async function fetchPayment() {
      try {
        const tossPayments = await loadTossPayments(clientKey);
        const paymentInstance = tossPayments.payment({ customerKey: "USER_TEST_ID" });
        setPayment(paymentInstance);
      } catch (error) {
        console.error("토스 SDK 로드 실패:", error);
      }
    }
    fetchPayment();
  }, []);

  async function requestPayment() {
    // 💡 [가드] 이미 처리 중이면 함수 실행 차단
    if (isProcessing.current) return;
    
    try {
      isProcessing.current = true;
      setIsLoading(true);

      // [STEP 1] 백엔드 결제 준비 (Ready API)
      const readyResponse = await axios.post("/api/payments/ready", {
        campaignNo: campaignNo,
        amount: amount.toString(),
        isAnonymous: isAnonymous,
        method: "CARD" // 💡 백엔드 DTO의 필드명이 'method'임을 다시 확인!
      }, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem("token")}` 
        }
      });

      const { orderId, amount: serverAmount, orderName: serverOrderName } = readyResponse.data;

      // [STEP 2] 토스 결제창 띄우기
      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: serverAmount },
        orderId: orderId,
        orderName: serverOrderName,
        successUrl: window.location.origin + "/payments/success",
        failUrl: window.location.origin + "/payments/fail",
        customerName: "이채원", // 실제 유저 이름으로 연동 가능
      });

    } catch (error) {
      console.error("결제 요청 오류:", error.response?.data || error.message);
      alert("결제 준비 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      // 에러가 나거나 결제창이 닫히면 다시 클릭 가능하게 해제
      isProcessing.current = false;
      setIsLoading(false);
    }
  }

  return (
    <div style={{ padding: "40px 20px", textAlign: "center", maxWidth: "500px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "30px" }}>기부 주문서</h2>
      <div style={{ textAlign: "left", background: "#f8f9fa", padding: "20px", borderRadius: "12px", marginBottom: "30px" }}>
        <p><strong>캠페인:</strong> {orderName}</p>
        <p><strong>기부 금액:</strong> <span style={{ color: "#3182f6" }}>{amount.toLocaleString()}원</span></p>
        <p><strong>익명 여부:</strong> {isAnonymous ? "익명 기부" : "실명 기부"}</p>
      </div>
      
      <button 
        onClick={requestPayment} 
        disabled={isLoading || !payment} // 💡 로딩 중이거나 SDK 로드 전엔 버튼 비활성화
        className="button" 
        style={{ 
          width: "100%",
          padding: "16px", 
          fontSize: "18px",
          fontWeight: "bold",
          cursor: isLoading ? "not-allowed" : "pointer", 
          backgroundColor: isLoading ? "#ccc" : "#3182f6", 
          color: "#fff", 
          border: "none", 
          borderRadius: "12px",
          transition: "0.3s"
        }}
      >
        {isLoading ? "처리 중..." : `${amount.toLocaleString()}원 기부하기`}
      </button>
    </div>
  );
}