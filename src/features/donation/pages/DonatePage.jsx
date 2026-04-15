import { useEffect, useMemo, useState } from "react";
import { Heart, ShieldCheck } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { campaigns, formatWon } from "../data/campaigns";

const presets = [10000, 30000, 50000, 100000];
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

const METHOD_LABEL = {
  card: "Card",
  kakao: "KakaoPay",
  bank: "Bank Transfer"
};

export default function DonatePage() {
  const { id } = useParams();
  const localCampaign = useMemo(() => campaigns.find((item) => item.id === Number(id)), [id]);
  const [campaign, setCampaign] = useState(localCampaign ?? null);
  const [isLoading, setIsLoading] = useState(!localCampaign);
  const [selectedAmount, setSelectedAmount] = useState(30000);
  const [method, setMethod] = useState("card");

  useEffect(() => {
    let ignore = false;

    if (localCampaign) {
      setCampaign(localCampaign);
      setIsLoading(false);
      return () => {
        ignore = true;
      };
    }

    async function loadCampaignDetail() {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/foundation/campaigns/${id}/detail`);
        if (!response.ok) {
          throw new Error(`detail request failed: ${response.status}`);
        }
        const data = await response.json();
        if (!ignore) {
          setCampaign({
            id: Number(id),
            shortTitle: data?.title || "",
            summary: data?.description || ""
          });
        }
      } catch {
        if (!ignore) {
          setCampaign(null);
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadCampaignDetail();

    return () => {
      ignore = true;
    };
  }, [id, localCampaign]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white pb-32 pt-52">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-lg font-bold text-stone-500">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-white pb-32 pt-52">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="mb-6 text-4xl font-display font-bold text-ink">Campaign not found.</h1>
          <Link to="/campaigns" className="btn-fairytale inline-flex">
            Back to campaigns
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 pt-52 watercolor-bg">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[3rem] border-4 border-line bg-white p-10 md:p-12">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/5 px-5 py-2 text-sm font-bold text-primary">
              <Heart size={16} fill="currentColor" />
              Donation
            </div>
            <h1 className="mb-4 text-4xl font-display font-bold text-ink md:text-5xl">{campaign.shortTitle}</h1>
            <p className="mb-10 leading-relaxed text-stone-500">{campaign.summary}</p>

            <div className="space-y-8">
              <div>
                <h2 className="mb-4 text-xl font-display font-bold text-ink">Amount</h2>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {presets.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setSelectedAmount(amount)}
                      className={`rounded-2xl border-2 px-5 py-5 font-bold transition-all ${
                        selectedAmount === amount
                          ? "border-primary bg-primary text-white"
                          : "border-line bg-stone-50 text-stone-500"
                      }`}
                    >
                      {formatWon(amount)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="mb-4 text-xl font-display font-bold text-ink">Payment Method</h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  {Object.entries(METHOD_LABEL).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setMethod(value)}
                      className={`rounded-2xl border-2 px-5 py-5 font-bold transition-all ${
                        method === value
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-line bg-white text-stone-500"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border-2 border-line bg-[#FFF9F5] p-6">
                <div className="flex items-center gap-3 text-stone-600">
                  <ShieldCheck size={18} className="text-primary" />
                  This is a UI mock. Payment gateway integration will be connected next.
                </div>
              </div>
            </div>
          </section>

          <aside className="h-fit rounded-[3rem] border-4 border-line bg-white p-10 md:p-12">
            <h2 className="mb-6 text-2xl font-display font-bold text-ink">Summary</h2>
            <div className="space-y-4 font-medium text-stone-600">
              <div className="flex justify-between gap-6">
                <span>Campaign</span>
                <span className="text-right font-bold text-ink">{campaign.shortTitle}</span>
              </div>
              <div className="flex justify-between gap-6">
                <span>Amount</span>
                <span className="font-bold text-primary">{formatWon(selectedAmount)}</span>
              </div>
              <div className="flex justify-between gap-6">
                <span>Method</span>
                <span className="font-bold text-ink">{METHOD_LABEL[method]}</span>
              </div>
            </div>
            <button className="mt-10 w-full rounded-full bg-primary py-5 text-lg font-bold text-white transition-all hover:bg-primary/90">
              Donate {formatWon(selectedAmount)}
            </button>
            <Link
              to={`/campaign/${campaign.id}`}
              className="mt-4 flex w-full items-center justify-center rounded-full border border-line py-5 text-lg font-bold text-stone-500 transition-all hover:bg-stone-50"
            >
              Back to detail
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
