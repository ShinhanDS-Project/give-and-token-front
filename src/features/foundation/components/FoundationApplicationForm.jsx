import { useEffect, useState } from "react";

const CAMPAIGN_CATEGORY_OPTIONS = [
  { value: "", label: "카테고리 선택" },
  { value: "CHILD_YOUTH", label: "아동/청소년" },
  { value: "SENIOR", label: "어르신" },
  { value: "DISABLED", label: "장애인" },
  { value: "ANIMAL", label: "동물" },
  { value: "ENVIRONMENT", label: "환경" },
  { value: "ETC", label: "기타" },
];

function SectionTitle({ children }) {
  return (
    <h2 className="text-[1.02rem] font-bold text-ink [font-family:'Nanum_Gothic',sans-serif]">
      {children}
    </h2>
  );
}

const FIELD_INPUT_CLASS =
  "w-full rounded-xl border border-[#e8ecf2] bg-white px-3 py-2.5 text-sm font-medium text-[#1f2937] outline-none transition-colors focus:border-primary";

const SECTION_CARD_CLASS =
  "space-y-5 rounded-[1.25rem] border border-[#e8ecf2] bg-white p-6 shadow-sm";

function Field({ label, required, children, hint }) {
  return (
    <label className="flex flex-col gap-2.5">
      <span className="text-sm font-semibold leading-relaxed text-ink">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
      {hint ? <span className="text-xs leading-relaxed text-slate-500">{hint}</span> : null}
    </label>
  );
}

function toImageSrc(path) {
  if (!path) {
    return "";
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  if (path.startsWith("/")) {
    return path;
  }

  return `/${path}`;
}

function FilePreviewImage({ file, alt, className }) {
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    setPreviewUrl(nextUrl);

    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [file]);

  if (!previewUrl) {
    return null;
  }

  return <img src={previewUrl} alt={alt} className={className} />;
}

export default function FoundationApplicationForm({
  formValues,
  beneficiaryInfo,
  beneficiaryChecked,
  beneficiaryStatusMessage,
  submitting,
  errorMessage,
  isEditMode,
  existingRepresentativeImagePath,
  existingDetailImages,
  onChange,
  onFileChange,
  onDetailImageChange,
  onAddUsePlan,
  onRemoveUsePlan,
  onUsePlanChange,
  onAddDetailImage,
  onRemoveDetailImage,
  onRemoveExistingDetailImage,
  onBeneficiaryCheck,
  onCancel,
  onSubmit,
}) {
  const hasBeneficiaryStatusMessage = Boolean(beneficiaryStatusMessage?.trim());
  const beneficiaryStatusClass = beneficiaryChecked
    ? "text-emerald-600"
    : /실패|유효하지|입력/.test(beneficiaryStatusMessage || "")
      ? "text-rose-600"
      : "text-slate-600";

  return (
    <form className="mx-auto flex max-w-5xl flex-col gap-7 px-4 py-7" onSubmit={onSubmit}>
      <header className="space-y-3 text-center">
        <p className="text-sm font-bold text-primary">{isEditMode ? "캠페인 정보 수정" : "새 캠페인 신청"}</p>
        <p className="text-[1.7rem] font-bold leading-snug text-ink">
          {isEditMode ? "기부단체 캠페인 수정" : "기부단체 캠페인 등록"}
        </p>
        <p className="text-sm leading-relaxed text-ink/60">
          {isEditMode
            ? "PENDING 상태 캠페인 정보를 수정하고 다시 제출하세요."
            : "필수 정보를 입력하고 등록 요청을 진행하세요."}
        </p>
      </header>

      <section className={SECTION_CARD_CLASS}>
        <div className="mb-7">
          <Field label="캠페인명" required>
            <input
              name="title"
              value={formValues.title}
              onChange={onChange}
              placeholder="캠페인 제목을 입력하세요"
              className={FIELD_INPUT_CLASS}
            />
          </Field>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <Field label="모집 시작일" required>
            <input name="startAt" type="date" value={formValues.startAt} onChange={onChange} className={FIELD_INPUT_CLASS} />
          </Field>
          <Field label="모집 종료일" required>
            <input name="endAt" type="date" value={formValues.endAt} onChange={onChange} className={FIELD_INPUT_CLASS} />
          </Field>
          <Field label="기간 (일)">
            <input value={formValues.recruitDurationDays} readOnly className={FIELD_INPUT_CLASS} />
          </Field>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <Field label="사업 시작일" required>
            <input
              name="usageStartAt"
              type="date"
              value={formValues.usageStartAt}
              onChange={onChange}
              className={FIELD_INPUT_CLASS}
            />
          </Field>
          <Field label="사업 종료일" required>
            <input
              name="usageEndAt"
              type="date"
              value={formValues.usageEndAt}
              onChange={onChange}
              className={FIELD_INPUT_CLASS}
            />
          </Field>
          <Field label="기간 (일)">
            <input value={formValues.usageDurationDays} readOnly className={FIELD_INPUT_CLASS} />
          </Field>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="목표 금액" required>
            <input
              name="targetAmount"
              type="number"
              min="0"
              value={formValues.targetAmount}
              onChange={onChange}
              placeholder="0"
              className={FIELD_INPUT_CLASS}
            />
          </Field>
          <Field label="카테고리" required>
            <select name="category" value={formValues.category} onChange={onChange} className={FIELD_INPUT_CLASS}>
              {CAMPAIGN_CATEGORY_OPTIONS.map((option) => (
                <option key={option.value || "empty"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="상세 설명" required>
          <textarea
            name="description"
            rows="7"
            value={formValues.description}
            onChange={onChange}
            placeholder="캠페인 설명과 목적을 작성해주세요."
            className={FIELD_INPUT_CLASS}
          />
        </Field>

        <Field label="대표 이미지" required={!isEditMode}>
          {isEditMode && existingRepresentativeImagePath ? (
            <div className="mb-2 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              <img
                src={toImageSrc(existingRepresentativeImagePath)}
                alt="기존 대표 이미지"
                className="h-40 w-full object-cover"
              />
            </div>
          ) : null}
          {formValues.imageFile ? (
            <div className="mb-2 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              <FilePreviewImage
                file={formValues.imageFile}
                alt="선택한 대표 이미지 미리보기"
                className="h-40 w-full object-cover"
              />
            </div>
          ) : null}
          <input name="imageFile" type="file" accept="image/*" onChange={onFileChange} />
          <span className="text-sm text-slate-600">
            {formValues.imageFile?.name ||
              (isEditMode
                ? "기존 이미지를 유지하려면 선택하지 않아도 됩니다."
                : "선택된 대표 이미지가 없습니다.")}
          </span>
        </Field>
      </section>

      <section className={SECTION_CARD_CLASS}>
        <div className="flex items-center justify-between">
          <SectionTitle>상세 이미지</SectionTitle>
          {/* <button
            type="button"
            className="rounded-full bg-line px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary hover:text-white"
            onClick={onAddDetailImage}
          >
            + 항목 추가
          </button> */}
        </div>

        {isEditMode && existingDetailImages?.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-3">
            {existingDetailImages.map((image, index) => (
              <div
                key={`${image.imgNo || image.imgPath}-${index}`}
                className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
              >
                <img
                  src={toImageSrc(image.imgPath)}
                  alt={`기존 상세 이미지 ${index + 1}`}
                  className="h-32 w-full object-cover"
                />
                {image.imgNo ? (
                  <button
                    type="button"
                    className="w-full bg-white px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    onClick={() => onRemoveExistingDetailImage(image.imgNo)}
                  >
                    삭제
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        <div className="space-y-4">
          {formValues.detailImageFiles.map((imageItem, index) => (
            <div
              key={imageItem.id}
              className="grid gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100 md:grid-cols-[1fr_auto]"
            >
              <Field label={`상세 이미지 ${index + 1}`}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => onDetailImageChange(imageItem.id, event)}
                />
                {imageItem.file ? (
                  <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <FilePreviewImage
                      file={imageItem.file}
                      alt={`선택한 상세 이미지 ${index + 1} 미리보기`}
                      className="h-32 w-full object-cover"
                    />
                  </div>
                ) : null}
                <span className="text-sm text-slate-600">
                  {imageItem.file?.name || "선택된 파일이 없습니다."}
                </span>
              </Field>
              <div className="flex items-end">
                <button
                  type="button"
                  className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                  onClick={() => onRemoveDetailImage(imageItem.id)}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={SECTION_CARD_CLASS}>
        <div className="flex items-center justify-between">
          <SectionTitle>지출 계획</SectionTitle>
          <button
            type="button"
            className="rounded-full bg-line px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary hover:text-white"
            onClick={onAddUsePlan}
          >
            + 항목 추가
          </button>
        </div>

        <div className="space-y-4">
          {formValues.usePlans.map((plan, index) => (
            <div
              key={plan.id}
              className="grid gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100 md:grid-cols-[1fr_160px_auto]"
            >
              <Field label={`지출 계획 ${index + 1}`} required>
                <input
                  value={plan.planContent}
                  onChange={(event) => onUsePlanChange(plan.id, "planContent", event.target.value)}
                  placeholder="지출 내용 입력"
                  className={FIELD_INPUT_CLASS}
                />
              </Field>
              <Field label="금액" required>
                <input
                  type="number"
                  min="0"
                  value={plan.planAmount}
                  onChange={(event) => onUsePlanChange(plan.id, "planAmount", event.target.value)}
                  placeholder="0"
                  className={FIELD_INPUT_CLASS}
                />
              </Field>
              <div className="flex items-end">
                <button
                  type="button"
                  className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                  onClick={() => onRemoveUsePlan(plan.id)}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={SECTION_CARD_CLASS}>
        <div className="flex items-center justify-between">
          <SectionTitle>수혜자 확인</SectionTitle>
        </div>

        <Field
          label="엔트리 코드"
          required
          hint="등록 전에 수혜자 코드가 유효한지 먼저 확인합니다."
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              name="entryCode"
              value={formValues.entryCode}
              onChange={onChange}
              placeholder="entry code를 입력하세요"
              className={FIELD_INPUT_CLASS}
            />
            <button
              type="button"
              className="shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90"
              onClick={onBeneficiaryCheck}
            >
              수혜자 확인
            </button>
          </div>
        </Field>

        <div className="rounded-2xl p-5">
          {hasBeneficiaryStatusMessage ? (
            <p className={`text-sm font-medium ${beneficiaryStatusClass}`}>
              {beneficiaryStatusMessage}
            </p>
          ) : null}
          {beneficiaryInfo ? (
            <dl className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <dt className="text-sm text-slate-500">이름</dt>
                <dd className="font-medium text-slate-900">{beneficiaryInfo.name || "-"}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">수혜자 번호</dt>
                <dd className="font-medium text-slate-900">{beneficiaryInfo.beneficiaryNo || "-"}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">유형</dt>
                <dd className="font-medium text-slate-900">{beneficiaryInfo.beneficiaryType || "-"}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">검증 상태</dt>
                <dd className="font-medium text-slate-900">
                  {beneficiaryChecked ? "확인 완료" : "미확인"}
                </dd>
              </div>
            </dl>
          ) : null}
        </div>
      </section>

      {errorMessage ? (
        <p className="text-sm text-rose-600" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <div className="flex justify-end gap-3">
        <button
          type="submit"
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={submitting}
        >
          {submitting ? (isEditMode ? "수정 중..." : "신청 중...") : isEditMode ? "수정 완료" : "신청 완료"}
        </button>
        <button
          type="button"
          className="rounded-full border-2 border-primary bg-white px-5 py-2.5 text-sm font-bold text-primary hover:bg-primary/5"
          onClick={onCancel}
        >
          취소
        </button>
      </div>
    </form>
  );
}


