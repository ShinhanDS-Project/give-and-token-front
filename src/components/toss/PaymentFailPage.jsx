import { useSearchParams, useNavigate } from "react-router-dom";

export default function PaymentFailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // 토스에서 보내주는 에러 메시지들
  const errorCode = searchParams.get("code");
  const errorMessage = searchParams.get("message");

  return (
    <div style={{ padding: "50px", textAlign: "center" }}>
      <h2 style={{ color: "#f04452" }}>결제에 실패했습니다.</h2>
      <div style={{ backgroundColor: "#f8f9fa", padding: "20px", margin: "20px 0", borderRadius: "8px" }}>
        <p><strong>에러 코드:</strong> {errorCode}</p>
        <p><strong>사유:</strong> {errorMessage || "알 수 없는 오류가 발생했습니다."}</p>
      </div>
      
      <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
        <button onClick={() => navigate("/checkout")} style={{ padding: "10px 20px" }}>
          다시 결제하기
        </button>
        <button onClick={() => navigate("/")} style={{ padding: "10px 20px", border: "none", background: "none", color: "#666" }}>
          홈으로 이동
        </button>
      </div>
    </div>
  );
}