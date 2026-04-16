import { useEffect, useMemo, useState } from "react";
import { Smile, UserRound } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { campaigns, formatWon } from "../data/campaigns";

const presets = [5000, 10000, 50000, 100000];
const MIN_DONATION_AMOUNT = 100;
const MAX_DONATION_AMOUNT = 100000000;
const TOSS_PAYMENTS_SDK_URL = "https://js.tosspayments.com/v2/standard";
const TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY;

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
  const response = await fetch("/api/payments/ready", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
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

function normalizeCampaign(campaign) {
  if (!campaign) return null;

  return {
    title: campaign.shortTitle ?? campaign.title,
    foundationName:
      campaign.foundation?.foundationName ??
      campaign.foundationName ??
      campaign.category ??
      "기부 캠페인",
    image: campaign.image ?? campaign.representativeImagePath,
  };
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
  const [amount, setAmount] = useState("");
  const [donorVisibility, setDonorVisibility] = useState("public");
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
      setPaymentError(".env에 VITE_TOSS_CLIENT_KEY를 설정해 주세요.");
      return;
    }

    try {
      setPaymentError("");
      setRequestingPayment(true);

      const customerKey = getCustomerKey();
      const orderName = campaign.title.slice(0, 100);
      const successUrl = `${window.location.origin}/donation-return`;
      const failUrl = `${window.location.origin}/donation-return`;
      const readyData = await requestPaymentReady({
        campaignId: Number(id),
        amount: selectedAmount,
        donorVisibility,
        customerKey,
        orderName,
        successUrl,
        failUrl,
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

      await payment.requestPayment({
        method: "CARD",
        amount: paymentAmount,
        orderId: readyData.orderId ?? createOrderId(),
        orderName: readyData.orderName ?? orderName,
        customerName: donorVisibility === "public" ? "김가빈가" : "숨은천사",
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
            캠페인 목록으로 가기
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
          </div>
        </section>

        <section className="mb-20">
          <h2 className="mb-5 text-2xl font-bold text-stone-300">금액 직접 입력</h2>
          <div className="mb-14 flex items-center border-b-2 border-stone-400 pb-5">
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
              ["public", "공개", "김가빈가", UserRound],
              ["private", "비공개", "숨은천사", Smile],
            ].map(([value, label, name, Icon]) => {
              const selected = donorVisibility === value;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDonorVisibility(value)}
                  className={`min-h-[180px] rounded-md border bg-white p-5 text-left transition-colors ${
                    selected ? "border-stone-500" : "border-stone-200"
                  }`}
                >
                  <span className="mb-7 flex items-center gap-4 text-xl font-bold text-stone-500">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                        selected
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
