import { useMemo, useState } from "react";
import {
  checkCampaignBeneficiary,
  checkCampaignFoundation,
  getCategoryOptions,
  registerCampaign
} from "../data/campaignApi";

function createPlan() {
  return {
    id: crypto.randomUUID(),
    planContent: "",
    planAmount: ""
  };
}

function CampaignRegisterPage() {
  const categories = useMemo(() => getCategoryOptions(), []);
  const [form, setForm] = useState({
    title: "",
    category: "",
    entryCode: "",
    foundationNo: "",
    description: "",
    targetAmount: "",
    imageFile: null,
    startAt: "",
    endAt: "",
    usageStartAt: "",
    usageEndAt: ""
  });
  const [usePlans, setUsePlans] = useState([createPlan()]);
  const [detailImages, setDetailImages] = useState([{ id: crypto.randomUUID(), file: null }]);
  const [beneficiaryResult, setBeneficiaryResult] = useState(null);
  const [foundationResult, setFoundationResult] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));

    if (key === "entryCode") {
      setBeneficiaryResult(null);
    }

    if (key === "foundationNo") {
      setFoundationResult(null);
    }
  };

  const updatePlan = (id, key, value) => {
    setUsePlans((current) =>
      current.map((plan) => (plan.id === id ? { ...plan, [key]: value } : plan))
    );
  };

  const addPlan = () => {
    setUsePlans((current) => [...current, createPlan()]);
  };

  const removePlan = (id) => {
    setUsePlans((current) =>
      current.length === 1 ? current : current.filter((plan) => plan.id !== id)
    );
  };

  const updateDetailImage = (id, file) => {
    setDetailImages((current) =>
      current.map((item) => (item.id === id ? { ...item, file } : item))
    );
  };

  const addDetailImage = () => {
    setDetailImages((current) => [...current, { id: crypto.randomUUID(), file: null }]);
  };

  const removeDetailImage = (id) => {
    setDetailImages((current) =>
      current.length === 1 ? current : current.filter((item) => item.id !== id)
    );
  };

  const handleCheckBeneficiary = async () => {
    if (!form.entryCode.trim()) {
      setBeneficiaryResult({ type: "error", message: "Enter a beneficiary entry code first." });
      return;
    }

    try {
      const response = await checkCampaignBeneficiary(form.entryCode.trim());

      if (!response.valid) {
        setBeneficiaryResult({
          type: "error",
          message: response.message || "Beneficiary was not found."
        });
        return;
      }

      setBeneficiaryResult({
        type: "success",
        message: `Name: ${response.name} / No: ${response.beneficiaryNo} / Type: ${response.beneficiaryType || "-"}`
      });
    } catch (error) {
      setBeneficiaryResult({ type: "error", message: error.message });
    }
  };

  const handleCheckFoundation = async () => {
    if (!form.foundationNo.trim()) {
      setFoundationResult({ type: "error", message: "Enter a foundation number first." });
      return;
    }

    try {
      const response = await checkCampaignFoundation(form.foundationNo.trim());
      const walletSummary = (response.wallets || [])
        .map(
          (wallet) =>
            `${wallet.walletLabel}: ${wallet.status}${wallet.available ? " / available" : ""}`
        )
        .join(" | ");

      setFoundationResult({
        type: response.hasAvailableWallet ? "success" : "error",
        message: `${response.foundationName} - ${response.message}${walletSummary ? ` (${walletSummary})` : ""}`
      });
    } catch (error) {
      setFoundationResult({ type: "error", message: error.message });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatusMessage("");

    if (!beneficiaryResult || beneficiaryResult.type !== "success") {
      setStatusMessage("Complete beneficiary verification first.");
      return;
    }

    if (!foundationResult || foundationResult.type !== "success") {
      setStatusMessage("Complete foundation wallet verification first.");
      return;
    }

    if (!form.imageFile) {
      setStatusMessage("Attach a representative image first.");
      return;
    }

    const dto = {
      title: form.title,
      description: form.description,
      category: form.category,
      entryCode: form.entryCode.trim(),
      targetAmount: Number(form.targetAmount),
      startAt: form.startAt ? new Date(form.startAt).toISOString().slice(0, 19) : null,
      endAt: form.endAt ? new Date(form.endAt).toISOString().slice(0, 19) : null,
      usageStartAt: form.usageStartAt
        ? new Date(form.usageStartAt).toISOString().slice(0, 19)
        : null,
      usageEndAt: form.usageEndAt ? new Date(form.usageEndAt).toISOString().slice(0, 19) : null,
      usePlans: usePlans
        .map((plan) => ({
          planContent: plan.planContent.trim(),
          planAmount: Number(plan.planAmount)
        }))
        .filter((plan) => plan.planContent && !Number.isNaN(plan.planAmount))
    };

    try {
      setSubmitting(true);
      const response = await registerCampaign({
        dto,
        imageFile: form.imageFile,
        detailImageFiles: detailImages.map((item) => item.file).filter(Boolean),
        foundationNo: Number(form.foundationNo)
      });

      setStatusMessage(
        `${response.message} (campaignNo: ${response.campaignNo}, status: ${response.approvalStatus})`
      );
    } catch (error) {
      setStatusMessage(`Registration failed: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="campaign-page">
      <div className="campaign-hero panel">
        <div>
          <p className="hero__eyebrow">Campaign Register</p>
          <h2>Campaign registration request</h2>
          <p className="hero__text">
            This form follows the backend campaign package flow: beneficiary check,
            foundation wallet check, and multipart registration request.
          </p>
        </div>
      </div>

      <form className="campaign-register panel" onSubmit={handleSubmit}>
        <div className="campaign-register__grid">
          <label className="campaign-field">
            <span>Title</span>
            <input
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              required
            />
          </label>

          <label className="campaign-field">
            <span>Category</span>
            <select
              value={form.category}
              onChange={(event) => updateField("category", event.target.value)}
              required
            >
              <option value="">Select category</option>
              {categories.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <div className="campaign-field">
            <span>Beneficiary Entry Code</span>
            <div className="campaign-inline">
              <input
                value={form.entryCode}
                onChange={(event) => updateField("entryCode", event.target.value)}
                placeholder="Beneficiary entry code"
                required
              />
              <button type="button" className="ghost-button" onClick={handleCheckBeneficiary}>
                Check
              </button>
            </div>
            {beneficiaryResult && (
              <p
                className={
                  beneficiaryResult.type === "success"
                    ? "campaign-feedback campaign-feedback--success"
                    : "campaign-feedback campaign-feedback--error"
                }
              >
                {beneficiaryResult.message}
              </p>
            )}
          </div>

          <div className="campaign-field">
            <span>Foundation No</span>
            <div className="campaign-inline">
              <input
                type="number"
                min="1"
                value={form.foundationNo}
                onChange={(event) => updateField("foundationNo", event.target.value)}
                placeholder="Foundation number"
                required
              />
              <button type="button" className="ghost-button" onClick={handleCheckFoundation}>
                Check
              </button>
            </div>
            {foundationResult && (
              <p
                className={
                  foundationResult.type === "success"
                    ? "campaign-feedback campaign-feedback--success"
                    : "campaign-feedback campaign-feedback--error"
                }
              >
                {foundationResult.message}
              </p>
            )}
          </div>

          <label className="campaign-field campaign-field--full">
            <span>Description</span>
            <textarea
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              rows="6"
              required
            />
          </label>

          <label className="campaign-field">
            <span>Target amount</span>
            <input
              type="number"
              min="0"
              value={form.targetAmount}
              onChange={(event) => updateField("targetAmount", event.target.value)}
              required
            />
          </label>

          <label className="campaign-field">
            <span>Representative image</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => updateField("imageFile", event.target.files?.[0] || null)}
              required
            />
          </label>

          <label className="campaign-field">
            <span>Fundraising start</span>
            <input
              type="datetime-local"
              value={form.startAt}
              onChange={(event) => updateField("startAt", event.target.value)}
              required
            />
          </label>

          <label className="campaign-field">
            <span>Fundraising end</span>
            <input
              type="datetime-local"
              value={form.endAt}
              onChange={(event) => updateField("endAt", event.target.value)}
              required
            />
          </label>

          <label className="campaign-field">
            <span>Usage start</span>
            <input
              type="datetime-local"
              value={form.usageStartAt}
              onChange={(event) => updateField("usageStartAt", event.target.value)}
              required
            />
          </label>

          <label className="campaign-field">
            <span>Usage end</span>
            <input
              type="datetime-local"
              value={form.usageEndAt}
              onChange={(event) => updateField("usageEndAt", event.target.value)}
              required
            />
          </label>
        </div>

        <div className="campaign-register__section">
          <div className="campaign-register__section-head">
            <h3>Use plan items</h3>
            <button type="button" className="ghost-button" onClick={addPlan}>
              Add item
            </button>
          </div>

          <div className="campaign-register__stack">
            {usePlans.map((plan) => (
              <div key={plan.id} className="campaign-register__row">
                <input
                  value={plan.planContent}
                  onChange={(event) => updatePlan(plan.id, "planContent", event.target.value)}
                  placeholder="Use plan content"
                />
                <input
                  type="number"
                  min="0"
                  value={plan.planAmount}
                  onChange={(event) => updatePlan(plan.id, "planAmount", event.target.value)}
                  placeholder="Amount"
                />
                <button type="button" className="ghost-button" onClick={() => removePlan(plan.id)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="campaign-register__section">
          <div className="campaign-register__section-head">
            <h3>Detail images</h3>
            <button type="button" className="ghost-button" onClick={addDetailImage}>
              Add file
            </button>
          </div>

          <div className="campaign-register__stack">
            {detailImages.map((item) => (
              <div key={item.id} className="campaign-register__row campaign-register__row--file">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => updateDetailImage(item.id, event.target.files?.[0] || null)}
                />
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => removeDetailImage(item.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="campaign-register__footer">
          <button type="submit" className="campaign-primary-button" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit registration"}
          </button>
          {statusMessage && <p className="campaign-register__status">{statusMessage}</p>}
        </div>
      </form>
    </section>
  );
}

export default CampaignRegisterPage;
