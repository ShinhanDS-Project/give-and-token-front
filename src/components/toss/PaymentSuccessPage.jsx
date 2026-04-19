import { useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // 💡 컴포넌트가 두 번 렌더링되더라도 값을 유지하는 절대 자물쇠!
  const isProcessed = useRef(false);

  useEffect(() => {
    // 💡 [가드] 이미 승인 로직이 시작되었다면 두 번째 실행(Strict Mode)은 즉각 차단!
    if (isProcessed.current) return;

    const paymentKey = searchParams.get("paymentKey");
    const orderId = searchParams.get("orderId");
    const amount = searchParams.get("amount");

    // 결제키가 없으면 굳이 API를 찌를 필요가 없으므로 종료
    if (!paymentKey) return;

    const confirmPayment = async () => {
      // 💡 여기서 문을 잠급니다. 이 시점 이후로는 절대 다시 호출되지 않음.
      isProcessed.current = true;

      try {
        // 💡 실제 백엔드 승인 API 호출
        const response = await axios.post("/api/payments/confirm", {
          paymentKey,
          orderId,
          amount,
          method: "CARD"
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });

        alert("기부가 완료되었습니다!");
        navigate("/");
        
      } catch (error) {
        console.error("승인 실패:", error.response?.data);
        navigate(`/payments/fail?message=${error.response?.data?.message || "결제 승인에 실패했습니다."}`);
      }
    };

    confirmPayment();

    // 이제 클린업 함수(isSubscribed = false)는 useRef가 방어해주므로 필요 없습니다.
  }, [searchParams, navigate]);

  return <div style={{ textAlign: "center", marginTop: "50px" }}>결제 승인 중입니다...</div>;
}