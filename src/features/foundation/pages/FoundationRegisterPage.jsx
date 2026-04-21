import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import FoundationApplicationForm from "../components/FoundationApplicationForm";
import FoundationApplicationResult from "../components/FoundationApplicationResult";
import {
  checkBeneficiary,
  checkFoundationWalletAvailability,
  fetchPendingCampaignEditDetail,
  getStoredFoundationAuth,
  submitCampaignApplication,
  updatePendingCampaign,
} from "../api/foundationApi";

function createUsePlan() {
  return {
    id: `${Date.now()}-${Math.random()}`,
    planContent: "",
    planAmount: "",
  };
}

function createDetailImageItem() {
  return {
    id: `${Date.now()}-${Math.random()}`,
    file: null,
  };
}

const INITIAL_FORM_VALUES = {
  title: "",
  startAt: "",
  endAt: "",
  usageStartAt: "",
  usageEndAt: "",
  recruitDurationDays: "0일",
  usageDurationDays: "0일",
  targetAmount: "0",
  category: "",
  description: "",
  imageFile: null,
  entryCode: "",
  usePlans: [createUsePlan()],
  detailImageFiles: [createDetailImageItem()],
  deletedDetailImageNos: [],
};

function isEmpty(value) {
  return !String(value || "").trim();
}

function calculateDurationLabel(startValue, endValue) {
  if (!startValue || !endValue) {
    return "0일";
  }

  const startDate = new Date(startValue);
  const endDate = new Date(endValue);
  const diff = endDate.getTime() - startDate.getTime();

  if (Number.isNaN(diff) || diff < 0) {
    return "0일";
  }

  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return `${days}일`;
}

export default function FoundationRegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const authInfo = getStoredFoundationAuth();

  const editCampaignNo = useMemo(() => {
    const raw = searchParams.get("editCampaignNo");
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [searchParams]);

  const isEditMode = editCampaignNo !== null;

  const [accessChecked, setAccessChecked] = useState(false);
  const [formValues, setFormValues] = useState(INITIAL_FORM_VALUES);
  const [existingRepresentativeImagePath, setExistingRepresentativeImagePath] =
    useState("");
  const [existingDetailImages, setExistingDetailImages] = useState([]);
  const [beneficiaryInfo, setBeneficiaryInfo] = useState(null);
  const [beneficiaryChecked, setBeneficiaryChecked] = useState(false);
  const [beneficiaryStatusMessage, setBeneficiaryStatusMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitResult, setSubmitResult] = useState(null);

  useEffect(() => {
    let mounted = true;

    const guardAccess = async () => {
      if (isEditMode) {
        setAccessChecked(true);
        return;
      }

      try {
        const result = await checkFoundationWalletAvailability();

        if (!mounted) {
          return;
        }

        if (!result.hasAvailableWallet) {
          window.alert("등록 가능한 캠페인은 3개 입니다.");
          navigate("/foundation/me", { replace: true });
          return;
        }

        setAccessChecked(true);
      } catch (error) {
        if (!mounted) {
          return;
        }

        window.alert(error.message || "기부단체 정보 확인에 실패했습니다.");
        navigate("/login", { replace: true });
      }
    };

    guardAccess();

    return () => {
      mounted = false;
    };
  }, [isEditMode, navigate]);

  useEffect(() => {
    let mounted = true;

    if (!isEditMode || !accessChecked) {
      return () => {
        mounted = false;
      };
    }

    const loadEditDetail = async () => {
      try {
        const detail = await fetchPendingCampaignEditDetail(editCampaignNo);
        if (!mounted) {
          return;
        }

        setFormValues((previousValues) => ({
          ...previousValues,
          title: detail.title || "",
          startAt: detail.startAt ? String(detail.startAt).slice(0, 10) : "",
          endAt: detail.endAt ? String(detail.endAt).slice(0, 10) : "",
          usageStartAt: detail.usageStartAt
            ? String(detail.usageStartAt).slice(0, 10)
            : "",
          usageEndAt: detail.usageEndAt
            ? String(detail.usageEndAt).slice(0, 10)
            : "",
          recruitDurationDays: calculateDurationLabel(
            detail.startAt ? String(detail.startAt).slice(0, 10) : "",
            detail.endAt ? String(detail.endAt).slice(0, 10) : "",
          ),
          usageDurationDays: calculateDurationLabel(
            detail.usageStartAt ? String(detail.usageStartAt).slice(0, 10) : "",
            detail.usageEndAt ? String(detail.usageEndAt).slice(0, 10) : "",
          ),
          targetAmount: String(detail.targetAmount ?? "0"),
          category: detail.categoryCode || "",
          description: detail.description || "",
          imageFile: null,
          entryCode: detail.entryCode || "",
          usePlans:
            detail.usePlans?.length > 0
              ? detail.usePlans.map((plan) => ({
                  id: `${Date.now()}-${Math.random()}`,
                  planContent: plan.planContent || "",
                  planAmount: String(plan.planAmount ?? 0),
                }))
              : [createUsePlan()],
          detailImageFiles: [createDetailImageItem()],
        }));
        setExistingRepresentativeImagePath(
          detail.representativeImagePath || "",
        );
        const detailImages = Array.isArray(detail.images)
          ? detail.images
              .filter((image) => String(image?.purpose || "").toUpperCase() === "DETAIL")
              .map((image) => ({
                imgNo: image.imgNo,
                imgPath: image.imgPath,
              }))
              .filter((image) => image.imgNo && image.imgPath)
          : Array.isArray(detail.detailImagePaths)
            ? detail.detailImagePaths
                .filter(Boolean)
                .map((imgPath) => ({ imgNo: null, imgPath }))
            : [];
        setExistingDetailImages(detailImages);

        setBeneficiaryChecked(Boolean(detail.entryCode));
        setBeneficiaryStatusMessage("");
      } catch (error) {
        if (!mounted) {
          return;
        }
        setErrorMessage(
          error.message || "수정할 캠페인 정보를 불러오지 못했습니다.",
        );
      }
    };

    loadEditDetail();

    return () => {
      mounted = false;
    };
  }, [accessChecked, editCampaignNo, isEditMode]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormValues((previousValues) => {
      const nextValues = {
        ...previousValues,
        [name]: value,
      };

      if (name === "startAt" || name === "endAt") {
        nextValues.recruitDurationDays = calculateDurationLabel(
          name === "startAt" ? value : nextValues.startAt,
          name === "endAt" ? value : nextValues.endAt,
        );
      }

      if (name === "usageStartAt" || name === "usageEndAt") {
        nextValues.usageDurationDays = calculateDurationLabel(
          name === "usageStartAt" ? value : nextValues.usageStartAt,
          name === "usageEndAt" ? value : nextValues.usageEndAt,
        );
      }

      return nextValues;
    });

    if (name === "entryCode") {
      setBeneficiaryChecked(false);
      setBeneficiaryInfo(null);
      setBeneficiaryStatusMessage("");
    }

    setErrorMessage("");
  };

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0] ?? null;

    setFormValues((previousValues) => ({
      ...previousValues,
      imageFile: nextFile,
    }));

    setErrorMessage("");
  };

  const handleDetailImageChange = (itemId, event) => {
    const nextFile = event.target.files?.[0] ?? null;

    setFormValues((previousValues) => ({
      ...previousValues,
      detailImageFiles: previousValues.detailImageFiles.map((imageItem) =>
        imageItem.id === itemId ? { ...imageItem, file: nextFile } : imageItem,
      ),
    }));
  };

  const handleAddUsePlan = () => {
    setFormValues((previousValues) => ({
      ...previousValues,
      usePlans: [...previousValues.usePlans, createUsePlan()],
    }));
  };

  const handleRemoveUsePlan = (planId) => {
    setFormValues((previousValues) => ({
      ...previousValues,
      usePlans:
        previousValues.usePlans.length === 1
          ? previousValues.usePlans
          : previousValues.usePlans.filter((plan) => plan.id !== planId),
    }));
  };

  const handleUsePlanChange = (planId, key, value) => {
    setFormValues((previousValues) => ({
      ...previousValues,
      usePlans: previousValues.usePlans.map((plan) =>
        plan.id === planId ? { ...plan, [key]: value } : plan,
      ),
    }));
  };

  const handleAddDetailImage = () => {
    setFormValues((previousValues) => ({
      ...previousValues,
      detailImageFiles: [
        ...previousValues.detailImageFiles,
        createDetailImageItem(),
      ],
    }));
  };

  const handleRemoveDetailImage = (itemId) => {
    setFormValues((previousValues) => ({
      ...previousValues,
      detailImageFiles:
        previousValues.detailImageFiles.length === 1
          ? previousValues.detailImageFiles
          : previousValues.detailImageFiles.filter(
              (imageItem) => imageItem.id !== itemId,
            ),
    }));
  };

  const handleRemoveExistingDetailImage = (imageNo) => {
    if (!imageNo) {
      return;
    }

    setExistingDetailImages((previousImages) =>
      previousImages.filter((image) => image.imgNo !== imageNo),
    );
    setFormValues((previousValues) => ({
      ...previousValues,
      deletedDetailImageNos: Array.from(
        new Set([...(previousValues.deletedDetailImageNos || []), imageNo]),
      ),
    }));
  };

  const handleBeneficiaryCheck = async () => {
    if (isEmpty(formValues.entryCode)) {
      setBeneficiaryChecked(false);
      setBeneficiaryInfo(null);
      setBeneficiaryStatusMessage(
        "엔트리 코드를 입력한 뒤 수혜자 확인을 진행해주세요.",
      );
      return;
    }

    try {
      setErrorMessage("");
      setBeneficiaryStatusMessage("수혜자 정보를 확인하는 중입니다...");

      const result = await checkBeneficiary(formValues.entryCode);

      if (!result.valid) {
        setBeneficiaryChecked(false);
        setBeneficiaryInfo(null);
        setBeneficiaryStatusMessage(
          result.message || "유효하지 않은 수혜자 코드입니다.",
        );
        return;
      }

      setBeneficiaryChecked(true);
      setBeneficiaryInfo(result);
      setBeneficiaryStatusMessage(
        result.message || "수혜자 확인이 완료되었습니다.",
      );
    } catch (error) {
      setBeneficiaryChecked(false);
      setBeneficiaryInfo(null);
      setBeneficiaryStatusMessage(
        error.message || "수혜자 확인 요청에 실패했습니다.",
      );
    }
  };

  const validateBeforeSubmit = () => {
    if (isEmpty(formValues.title)) {
      return "캠페인명을 입력해주세요.";
    }

    if (isEmpty(formValues.category)) {
      return "카테고리를 선택해주세요.";
    }

    if (isEmpty(formValues.description)) {
      return "상세 설명을 입력해주세요.";
    }

    if (Number(formValues.targetAmount) <= 0) {
      return "목표 금액은 0보다 크게 입력해주세요.";
    }

    if (!formValues.startAt || !formValues.endAt) {
      return "모집 기간을 모두 입력해주세요.";
    }

    if (!formValues.usageStartAt || !formValues.usageEndAt) {
      return "사업 기간을 모두 입력해주세요.";
    }

    if (new Date(formValues.endAt) < new Date(formValues.startAt)) {
      return "모집 종료일은 시작일보다 이후여야 합니다.";
    }

    if (new Date(formValues.usageEndAt) < new Date(formValues.usageStartAt)) {
      return "사업 종료일은 시작일보다 이후여야 합니다.";
    }

    if (!beneficiaryChecked) {
      return "수혜자 확인을 먼저 완료해주세요.";
    }

    if (!isEditMode && !formValues.imageFile) {
      return "대표 이미지를 등록해주세요.";
    }

    const hasInvalidUsePlan = formValues.usePlans.some(
      (plan) => isEmpty(plan.planContent) || Number(plan.planAmount) < 0,
    );

    if (hasInvalidUsePlan) {
      return "지출 계획 내용을 모두 입력해주세요.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationMessage = validateBeforeSubmit();

    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage("");

      const payload = {
        ...formValues,
        detailImageFiles: formValues.detailImageFiles.map(
          (imageItem) => imageItem.file,
        ),
      };

      const result = isEditMode
        ? await updatePendingCampaign(editCampaignNo, payload)
        : await submitCampaignApplication(payload);
      setSubmitResult(result);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/foundation/me");
  };

  if (submitResult) {
    return (
      <FoundationApplicationResult result={submitResult} authInfo={authInfo} />
    );
  }

  if (!accessChecked) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 pb-12 pt-32 text-ink">
      <div className="mx-auto max-w-6xl space-y-4 md:[zoom:1.06]">
        <header className="rounded-2xl border border-[#e8ecf2] bg-white px-6 py-4 shadow-sm">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            onClick={() => navigate("/foundation/me")}
          >
            <ArrowLeft size={16} />
            뒤로가기
          </button>
        </header>

        <section className="rounded-2xl border border-[#e8ecf2] bg-white p-2 shadow-sm md:p-4">
          <FoundationApplicationForm
            formValues={formValues}
            beneficiaryInfo={beneficiaryInfo}
            beneficiaryChecked={beneficiaryChecked}
            beneficiaryStatusMessage={beneficiaryStatusMessage}
            submitting={submitting}
            errorMessage={errorMessage}
            onChange={handleChange}
            onFileChange={handleFileChange}
            onDetailImageChange={handleDetailImageChange}
            onAddUsePlan={handleAddUsePlan}
            onRemoveUsePlan={handleRemoveUsePlan}
            onUsePlanChange={handleUsePlanChange}
            onAddDetailImage={handleAddDetailImage}
            onRemoveDetailImage={handleRemoveDetailImage}
            onBeneficiaryCheck={handleBeneficiaryCheck}
            onCancel={handleCancel}
            isEditMode={isEditMode}
            existingRepresentativeImagePath={existingRepresentativeImagePath}
            existingDetailImages={existingDetailImages}
            onRemoveExistingDetailImage={handleRemoveExistingDetailImage}
            onSubmit={handleSubmit}
          />
        </section>
      </div>
    </main>
  );
}
