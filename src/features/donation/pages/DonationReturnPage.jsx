import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

const PAYMENT_METHOD_STORAGE_KEY = "donation_payment_method";
const PAYMENT_SUMMARY_STORAGE_KEY = "donation_payment_summary";
const CONFETTI_COLORS = ["#FF8A65", "#9575CD", "#FFF176", "#4A7CFF", "#7DD3A7"];

async function confirmPayment(payload) {
  const token = window.localStorage.getItem("accessToken");
  const response = await fetch("/api/payments/confirm", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const contentType = response.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    throw new Error(data?.message ?? `${response.status} ${response.statusText}`);
  }

  return data?.data ?? data ?? {};
}

async function fetchDonationByPaymentNo(paymentNo) {
  const token = window.localStorage.getItem("accessToken");
  try {
    const response = await fetch("/api/donation/see/mydonation", {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
    });
    if (!response.ok) return null;
    const list = await response.json();
    return list.find((d) => d.paymentNo === paymentNo) ?? null;
  } catch {
    return null;
  }
}

function formatAmount(amount) {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) return "-";
  return `${numericAmount.toLocaleString()}원`;
}

function formatDateTime(value) {
  if (value == null) return "-";
  try {
    // LocalDateTime 배열 형식: [2024, 1, 15, 10, 30, 0]
    const date = Array.isArray(value)
      ? new Date(value[0], value[1] - 1, value[2], value[3] ?? 0, value[4] ?? 0)
      : new Date(value);
    if (isNaN(date.getTime())) return String(value);
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(value);
  }
}

function createConfettiPieces() {
  return Array.from({ length: 28 }, (_, index) => ({
    id: index,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 0.7}s`,
    duration: `${3.2 + Math.random() * 1.4}s`,
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    rotate: `${-24 + Math.random() * 48}deg`,
    size: `${8 + Math.random() * 6}px`,
    drift: `${(Math.random() > 0.5 ? 1 : -1) * (20 + Math.random() * 40)}px`,
  }));
}

function readPaymentSummary(orderId) {
  if (!orderId) return null;

  try {
    const rawValue = window.sessionStorage.getItem(
      `${PAYMENT_SUMMARY_STORAGE_KEY}:${orderId}`,
    );
    return rawValue ? JSON.parse(rawValue) : null;
  } catch {
    return null;
  }
}

export default function DonationReturnPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [result, setResult] = useState(null);
  const [donationDetail, setDonationDetail] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const hasConfirmedRef = useRef(false);

  const paymentKey = searchParams.get("paymentKey");
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");
  const code = searchParams.get("code");
  const message = searchParams.get("message");

  const method = useMemo(() => {
    if (!orderId) return "CARD";
    return (
      window.sessionStorage.getItem(`${PAYMENT_METHOD_STORAGE_KEY}:${orderId}`) ??
      "CARD"
    );
  }, [orderId]);

  const paymentSummary = useMemo(() => readPaymentSummary(orderId), [orderId]);
  const confettiPieces = useMemo(() => createConfettiPieces(), []);

  useEffect(() => {
    if (code || message) {
      setStatus("failed");
      setErrorMessage(message ?? "결제가 취소되었거나 실패했습니다.");
      return;
    }

    if (!paymentKey || !orderId || !amount || hasConfirmedRef.current) {
      if (!paymentKey || !orderId || !amount) {
        setStatus("failed");
        setErrorMessage("결제 확인에 필요한 정보가 누락되었습니다.");
      }
      return;
    }

    hasConfirmedRef.current = true;

    (async () => {
      try {
        const confirmResult = await confirmPayment({
          paymentKey,
          orderId,
          amount: Number(amount),
          method,
        });

        setResult(confirmResult);

        if (confirmResult?.status === "SUCCESS" || confirmResult?.status === "DONE") {
          setStatus("success");
          if (confirmResult.paymentNo != null) {
            const detail = await fetchDonationByPaymentNo(confirmResult.paymentNo);
            setDonationDetail(detail);
          }
        } else if (
          confirmResult?.status === "FAILED" ||
          confirmResult?.status === "CANCELLED"
        ) {
          setErrorMessage(confirmResult?.message || "결제에 실패했습니다.");
          setStatus("failed");
        } else {
          // READY, IN_PROGRESS 등 아직 완료되지 않은 상태
          setErrorMessage(
            confirmResult?.message || "결제가 아직 완료되지 않았습니다.",
          );
          setStatus("ready");
        }
      } catch (error) {
        setErrorMessage(error.message || "결제 검증 중 오류가 발생했습니다.");
        setStatus("failed");
      } finally {
        if (orderId) {
          window.sessionStorage.removeItem(`${PAYMENT_METHOD_STORAGE_KEY}:${orderId}`);
          window.sessionStorage.removeItem(`${PAYMENT_SUMMARY_STORAGE_KEY}:${orderId}`);
        }
      }
    })();
  }, [amount, code, message, method, orderId, paymentKey]);

  const title =
    status === "success"
      ? "기부가 완료되었습니다"
      : status === "failed"
        ? "결제를 완료하지 못했습니다"
        : status === "ready"
          ? "결제가 완료되지 않았습니다"
          : "결제를 확인하고 있습니다";

  const description =
    status === "success"
      ? result?.message ?? "따뜻한 마음이 캠페인에 안전하게 전달되었습니다."
      : status === "failed"
        ? errorMessage || "결제 처리 중 문제가 발생했습니다."
        : status === "ready"
          ? errorMessage || "결제가 아직 처리되지 않았습니다. 결제 상태를 확인해 주세요."
          : "토스페이먼츠 결제 정보를 서버에서 검증하고 있습니다. 잠시만 기다려 주세요.";

  return (
    <div className="min-h-screen bg-[#fffaf7] px-5 text-ink sm:px-8">
      {status === "success" && (
        <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
          {confettiPieces.map((piece) => (
            <span
              key={piece.id}
              className="absolute top-[-10%] rounded-sm opacity-80"
              style={{
                left: piece.left,
                width: piece.size,
                height: `calc(${piece.size} * 1.6)`,
                backgroundColor: piece.color,
                transform: `rotate(${piece.rotate})`,
                animation: `donation-confetti-fall ${piece.duration} ease-in forwards`,
                animationDelay: piece.delay,
                "--confetti-drift": piece.drift,
              }}
            />
          ))}
        </div>
      )}

      <div className="mx-auto max-w-3xl pb-10 pt-[calc(4rem+40px)]">
        <section className="mb-10 text-center">
          {status === "loading" ? (
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-stone-100">
              <Loader2 size={40} strokeWidth={2} className="animate-spin text-stone-400" />
            </div>
          ) : status === "failed" || status === "ready" ? (
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-500">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-200">
                <X size={30} strokeWidth={2.4} />
              </div>
            </div>
          ) : (
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 text-primary">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30">
                <Check size={30} strokeWidth={2.4} />
              </div>
            </div>
          )}

          <h1 className="mb-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {title}
          </h1>
          <p className="mx-auto max-w-2xl break-keep text-lg font-medium leading-relaxed text-stone-500">
            {description}
          </p>

        </section>

        <section className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="border-b border-stone-100 px-8 py-7">
            <h2 className="text-3xl font-bold text-ink">기부한 캠페인</h2>
          </div>

          <div className="px-8 py-7">
            <div className="flex items-center gap-5 border-b border-stone-100 pb-6">
              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-stone-100">
                {paymentSummary?.image ? (
                  <img
                    src={paymentSummary.image}
                    alt={paymentSummary.title ?? "캠페인 이미지"}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="mb-1 text-sm font-bold uppercase tracking-[0.12em] text-primary/70">
                  {paymentSummary?.foundationName ?? "기부 캠페인"}
                </p>
                <strong className="block break-keep text-2xl font-bold text-ink">
                  {paymentSummary?.title ?? "캠페인 정보 확인 중"}
                </strong>
                <p className="mt-2 break-keep text-sm leading-6 text-stone-500">
                  {paymentSummary?.summary ?? "선택한 캠페인에 기부가 전달되었습니다."}
                </p>
              </div>
              <div className="text-right text-2xl font-bold text-ink">
                {formatAmount(result?.amount ?? paymentSummary?.amount ?? amount)}
              </div>
            </div>

            <div className="space-y-4 py-6">
              {[
                ["주문 번호", result?.orderId ?? orderId ?? "-"],
                ["결제 상태", result?.status ?? (status === "success" ? "SUCCESS" : "FAILED")],
                [
                  "기부자 공개 여부",
                  donationDetail
                    ? (donationDetail.anonymous ?? donationDetail.isAnonymous)
                      ? "비공개 (숨은천사)"
                      : "공개"
                    : "-",
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-start justify-between gap-6 border-b border-stone-100 pb-4 text-base last:border-b-0 last:pb-0"
                >
                  <span className="font-semibold text-stone-400">{label}</span>
                  <span className="max-w-[70%] break-all text-right font-bold text-ink">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-10 grid grid-cols-2 gap-3">
          <Link
            to="/"
            className="inline-flex w-full items-center justify-center rounded border border-stone-200 bg-white py-3 text-sm font-bold text-ink transition-colors hover:border-primary hover:bg-primary hover:text-white"
          >
            메인으로 돌아가기
          </Link>
          <Link
            to="/mypage/history"
            className="inline-flex w-full items-center justify-center rounded border border-stone-200 bg-white py-3 text-sm font-bold text-ink transition-colors hover:border-primary hover:bg-primary hover:text-white"
          >
            기부내역 보러가기
          </Link>
        </div>

      </div>

    </div>
  );
}
