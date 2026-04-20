import { useEffect, useMemo, useState } from "react";
import { Smile, UserRound } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { campaigns, formatWon } from "../data/campaigns";

const presets = [5000, 10000, 50000, 100000];
const MIN_DONATION_AMOUNT = 100;
const MAX_DONATION_AMOUNT = 100000000;
const TOSS_PAYMENTS_SDK_URL = "https://js.tosspayments.com/v2/standard";
const TOSS_CLIENT_KEY = "test_ck_AQ92ymxN34Nq0j94xYgyrajRKXvd";
const PAYMENT_METHOD_STORAGE_KEY = "donation_payment_method";
const PAYMENT_SUMMARY_STORAGE_KEY = "donation_payment_summary";
const TOSS_REQUEST_METHOD = "CARD";
const PAYMENT_METHOD_OPTIONS = [
  { paymentMethod: "CARD", label: "카드 결제" },
  { paymentMethod: "EASY_PAY", label: "간편결제" },
];


function loadTossPaymentsSdk() {
  if (window.TossPayments) return Promise.resolve(window.TossPayments);

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(
      `script[src="${TOSS_PAYMENTS_SDK_URL}"]`,
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.TossPayments));
      existingScript.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.src = TOSS_PAYMENTS_SDK_URL;
    script.async = true;
    script.onload = () => resolve(window.TossPayments);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function createOrderId() {
  const randomValue = Math.random().toString(36).slice(2, 10);
  return `donation_${Date.now()}_${randomValue}`;
}

function getCustomerKey() {
  const storageKey = "donation_customer_key";
  const savedKey = window.localStorage.getItem(storageKey);
  if (savedKey) return savedKey;

  const customerKey = `donor_${crypto.randomUUID()}`;
  window.localStorage.setItem(storageKey, customerKey);
  return customerKey;
}

async function requestPaymentReady(payload) {
  const token = window.localStorage.getItem("accessToken");
  const response = await fetch("/api/payments/ready", {
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

function parseDonationAmount(value) {
  const parsedAmount = Number.parseInt(value || "0", 10);
  if (!Number.isSafeInteger(parsedAmount) || parsedAmount < 0) return 0;
  return Math.min(parsedAmount, MAX_DONATION_AMOUNT);
}

function formatDate(value) {
  if (value == null) return "-";
  try {
    // LocalDateTime 배열 형식: [2024, 1, 15, ...]
    const date = Array.isArray(value)
      ? new Date(value[0], value[1] - 1, value[2])
      : new Date(value);
    if (isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return String(value);
  }
}

function normalizeCampaign(campaign) {
  if (!campaign) return null;

  return {
    campaignNo: campaign.campaignNo ?? campaign.id,
    title: campaign.shortTitle ?? campaign.title,
    foundationName:
      campaign.foundation?.foundationName ??
      campaign.foundationName ??
      campaign.category ??
      "기부 캠페인",
    image: campaign.image ?? campaign.representativeImagePath,
    summary: campaign.summary ?? campaign.description ?? "",
    start_at: campaign.startAt ?? campaign.startAt,
    end_at: campaign.endAt ?? campaign.endAt
  };
}

// JWT 페이로드를 디코딩해 클레임 객체를 반환 (서명 검증 없이 읽기만)
function decodeJwtPayload(token) {
  try {
    const payloadBase64 = token.split(".")[1];
    const padded = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

// 토큰에서 userNo(no 클레임) 추출
function getUserNoFromToken(token) {
  const payload = decodeJwtPayload(token);
  return payload?.no ?? null;
}

async function fetchCurrentUserProfile() {
  const token = window.localStorage.getItem("accessToken");
  if (!token) throw new Error("토큰 없음");

  const userNo = getUserNoFromToken(token);
  if (!userNo) throw new Error("토큰에 userNo 없음");

  // userNo는 백엔드에서 authentication.getDetails()로 추출하므로
  // Authorization 헤더만 실어서 /users/support/mypage/my 호출
  const response = await fetch("/users/support/mypage/my", {
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  });

  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json(); // { email, name, phone, nameHash, profilePath, birth }
}

export default function DonatePage() {
  const { id } = useParams();
  const staticCampaign = useMemo(
    () => campaigns.find((item) => item.id === Number(id)),
    [id],
  );
  const [apiCampaign, setApiCampaign] = useState(null);
  const [loading, setLoading] = useState(!staticCampaign);
  const [error, setError] = useState(null);
  const [currentUserName, setCurrentUserName] = useState("");
  const [amount, setAmount] = useState("");
  const [donorVisibility, setDonorVisibility] = useState("public");
  const [paymentMethod, setPaymentMethod] = useState("CARD");
  const [paymentError, setPaymentError] = useState("");
  const [requestingPayment, setRequestingPayment] = useState(false);

  useEffect(() => {
    if (staticCampaign) {
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(`/api/foundation/campaigns/${id}/detail`);
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const data = await res.json();
        if (!cancelled) setApiCampaign(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, staticCampaign]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const userProfile = await fetchCurrentUserProfile();
        if (!cancelled) {
          setCurrentUserName(
            userProfile?.nameHash ??
            userProfile?.nickname ??
            userProfile?.name ??
            "",
          );
        }
      } catch {
        if (!cancelled) {
          setCurrentUserName("");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const campaign = normalizeCampaign(staticCampaign ?? apiCampaign);
  const selectedAmount = parseDonationAmount(amount);

  const handleAmountChange = (event) => {
    const numericValue = event.target.value.replace(/\D/g, "");
    const nextAmount = parseDonationAmount(numericValue);
    setAmount(nextAmount > 0 ? String(nextAmount) : "");
  };

  const addAmount = (value) => {
    setAmount(String(Math.min(selectedAmount + value, MAX_DONATION_AMOUNT)));
  };

  const handlePayment = async () => {
    if (selectedAmount < MIN_DONATION_AMOUNT || requestingPayment) return;

    if (!TOSS_CLIENT_KEY) {
      setPaymentError(".env에 TOSS_CLIENT_KEY를 설정해 주세요.");
      return;
    }

    try {
      setPaymentError("");
      setRequestingPayment(true);

      const customerKey = getCustomerKey();
      const customerName = currentUserName || "기부자";
      const orderName = campaign.title.slice(0, 100);
      const successUrl = `${window.location.origin}/donation-return`;
      const failUrl = `${window.location.origin}/donation-return`;
      const readyData = await requestPaymentReady({
        campaignNo: Number(id),
        amount: selectedAmount,
        isAnonymous: donorVisibility === "private",
        method: paymentMethod,
      });

      const TossPayments = await loadTossPaymentsSdk();
      const tossPayments = TossPayments(readyData.clientKey ?? TOSS_CLIENT_KEY);
      const payment = tossPayments.payment({
        customerKey: readyData.customerKey ?? customerKey,
      });
      const paymentAmount =
        typeof readyData.amount === "object"
          ? readyData.amount
          : {
            currency: "KRW",
            value: readyData.amount ?? selectedAmount,
          };
      const requestMethod = paymentMethod;
      const requestOrderId = readyData.orderId ?? createOrderId();
      window.sessionStorage.setItem(
        `${PAYMENT_METHOD_STORAGE_KEY}:${requestOrderId}`,
        requestMethod,
      );
      window.sessionStorage.setItem(
        `${PAYMENT_SUMMARY_STORAGE_KEY}:${requestOrderId}`,
        JSON.stringify({
          campaignNo: campaign.campaignNo ?? Number(id),
          title: campaign.title,
          foundationName: campaign.foundationName,
          image: campaign.image,
          summary: campaign.summary,
          amount: paymentAmount.value ?? selectedAmount,
        }),
      );

      await payment.requestPayment({
        method: TOSS_REQUEST_METHOD,
        amount: paymentAmount,
        orderId: requestOrderId,
        orderName: readyData.orderName ?? orderName,
        customerName,
        successUrl: readyData.successUrl ?? successUrl,
        failUrl: readyData.failUrl ?? failUrl,
        metadata: {
          campaignId: String(id),
          donorVisibility,
          paymentReadyId: String(readyData.paymentReadyId ?? readyData.paymentId ?? ""),
        },
      });
    } catch (err) {
      setPaymentError(err?.message ?? "결제창을 여는 중 문제가 발생했습니다.");
      setRequestingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white pb-24 pt-36">
        <div className="mx-auto w-[90%] max-w-5xl">
          <p className="text-sm font-bold text-stone-400">불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-white pb-32 pt-52">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="mb-6 text-4xl font-display font-bold text-ink">
            캠페인을 찾을 수 없습니다.
          </h1>
          {error && <p className="mb-6 text-sm text-stone-400">{error}</p>}
          <Link to="/campaigns" className="btn-fairytale inline-flex">
            Back to campaigns
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-32 pt-28">
      <div className="mx-auto w-[90%] max-w-5xl">
        <section className="mb-16 flex items-center gap-6">
          <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-stone-100">
            {campaign.image && (
              <img
                src={campaign.image}
                alt={campaign.title}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            )}
          </div>
          <div className="min-w-0">
            <p className="mb-2 text-base font-bold text-stone-400">
              {campaign.foundationName}
            </p>
            <h1 className="break-keep text-2xl font-bold leading-snug text-ink">
              {campaign.title}
            </h1>
            <p className="mb-2 text-base font-bold text-stone-400">
              {formatDate(campaign.start_at)} ~ {formatDate(campaign.end_at)}
            </p>
          </div>
        </section>

        <section className="mb-20">
          <h2 className="mb-5 text-2xl font-bold text-stone-300">금액 직접 입력</h2>
          <div className="mb-14 flex items-center gap-3 border-b-2 border-stone-400 pb-5">
            <input
              value={amount}
              onChange={handleAmountChange}
              inputMode="numeric"
              maxLength={9}
              placeholder="100원부터 입력 가능합니다."
              aria-label="기부 금액"
              className="min-w-0 flex-1 border-none bg-transparent text-right text-2xl font-bold text-ink outline-none placeholder:text-base placeholder:text-stone-300 sm:text-3xl sm:placeholder:text-lg"
            />
            <span className="text-lg font-bold text-stone-400">원</span>
            {amount && (
              <button
                type="button"
                onClick={() => setAmount("")}
                className="flex-shrink-0 rounded border border-stone-200 px-3 py-1 text-sm font-bold text-stone-400 transition-colors hover:border-red-300 hover:text-red-400"
              >
                초기화
              </button>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => addAmount(preset)}
                className="h-12 rounded-md border border-stone-300 bg-white text-[11px] font-bold text-stone-400 transition-colors hover:border-ink hover:text-ink sm:text-sm"
              >
                {preset}원
              </button>
            ))}
          </div>
        </section>

        <section className="mb-20">
          <h2 className="mb-3 text-2xl font-bold text-ink">기부자 정보</h2>
          <p className="mb-5 break-keep text-base font-bold leading-relaxed text-stone-400">
            [공개] 상세페이지에 닉네임과 프로필 사진이 노출됩니다.
            <br />
            [비공개] 상세페이지에 숨은천사로 표시됩니다.
          </p>

          <div className="grid gap-5 sm:grid-cols-2">
            {[
              ["public", "공개", "사용자 닉네임", UserRound],
              ["private", "비공개", "숨은천사", Smile],
            ].map(([value, label, name, Icon]) => {
              const selected = donorVisibility === value;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDonorVisibility(value)}
                  className={`min-h-[180px] rounded-md border bg-white p-5 text-left transition-colors ${selected ? "border-stone-500" : "border-stone-200"
                    }`}
                >
                  <span className="mb-7 flex items-center gap-4 text-xl font-bold text-stone-500">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full border ${selected
                        ? "border-ink bg-ink text-white"
                        : "border-stone-300 text-transparent"
                        }`}
                    >
                      {selected && "✓"}
                    </span>
                    {label}
                  </span>
                  <span className="flex flex-col items-center gap-3">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-lime-500 bg-stone-100 text-stone-600">
                      <Icon size={30} />
                    </span>
                    <span className="text-lg font-bold text-stone-600">{name}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-8">
            <h3 className="mb-3 text-2xl font-bold text-ink">결제수단</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {PAYMENT_METHOD_OPTIONS.map(({ paymentMethod: optionValue, label }) => {
                const selected = paymentMethod === optionValue;

                return (
                  <button
                    key={optionValue}
                    type="button"
                    onClick={() => setPaymentMethod(optionValue)}
                    className={`h-14 rounded-md border text-base font-bold transition-colors ${selected
                      ? "border-ink bg-ink text-white"
                      : "border-stone-300 bg-white text-stone-500 hover:border-ink hover:text-ink"
                      }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-sm font-bold text-stone-400">
              ※ 선택한 결제수단으로 결제가 최종 완료되어야 기부 완료 처리됩니다.
            </p>
          </div>

          {paymentError && (
            <p className="mt-5 text-sm font-bold text-red-500">{paymentError}</p>
          )}

          <button
            type="button"
            disabled={selectedAmount < MIN_DONATION_AMOUNT || requestingPayment}
            onClick={handlePayment}
            className="mt-8 h-14 w-full rounded-md bg-slate-300 text-base font-bold text-white transition-colors enabled:bg-ink enabled:hover:bg-primary disabled:cursor-not-allowed"
          >
            {requestingPayment
              ? "결제창 여는 중..."
              : selectedAmount > 0
                ? `${formatWon(selectedAmount)} 결제하기`
                : "결제하기"}
          </button>
        </section>
      </div>
    </div>
  );
}
