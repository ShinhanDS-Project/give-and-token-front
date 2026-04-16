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
  return <h2 className="text-lg font-semibold text-slate-900">{children}</h2>;
}

function Field({ label, required, children, hint }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
      {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
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
  existingDetailImagePaths,
  onChange,
  onFileChange,
  onDetailImageChange,
  onAddUsePlan,
  onRemoveUsePlan,
  onUsePlanChange,
  onAddDetailImage,
  onRemoveDetailImage,
  onBeneficiaryCheck,
  onCancel,
  onSubmit,
}) {
  return (
    <form className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6" onSubmit={onSubmit}>
      <header className="space-y-2 text-center">
        <p className="text-sm text-slate-500">{isEditMode ? "캠페인 정보 수정" : "새 캠페인 신청"}</p>
        <h1 className="text-3xl font-semibold text-slate-900">
          {isEditMode ? "기부단체 캠페인 수정" : "기부단체 캠페인 등록"}
        </h1>
        <p className="text-sm text-slate-500">
          {isEditMode
            ? "PENDING 상태 캠페인 정보를 수정하고 다시 제출하세요."
            : "필수 정보를 입력하고 등록 요청을 진행하세요."}
        </p>
      </header>

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5">
        <Field label="캠페인명" required>
          <input
            name="title"
            value={formValues.title}
            onChange={onChange}
            placeholder="캠페인 제목을 입력하세요"
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-3">
          <Field label="모집 시작일" required>
            <input name="startAt" type="date" value={formValues.startAt} onChange={onChange} />
          </Field>
          <Field label="모집 종료일" required>
            <input name="endAt" type="date" value={formValues.endAt} onChange={onChange} />
          </Field>
          <Field label="기간 (일)">
            <input value={formValues.recruitDurationDays} readOnly />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Field label="사업 시작일" required>
            <input
              name="usageStartAt"
              type="date"
              value={formValues.usageStartAt}
              onChange={onChange}
            />
          </Field>
          <Field label="사업 종료일" required>
            <input
              name="usageEndAt"
              type="date"
              value={formValues.usageEndAt}
              onChange={onChange}
            />
          </Field>
          <Field label="기간 (일)">
            <input value={formValues.usageDurationDays} readOnly />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="목표 금액" required>
            <input
              name="targetAmount"
              type="number"
              min="0"
              value={formValues.targetAmount}
              onChange={onChange}
              placeholder="0"
            />
          </Field>
          <Field label="카테고리" required>
            <select name="category" value={formValues.category} onChange={onChange}>
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

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <SectionTitle>상세 이미지</SectionTitle>
          <button
            type="button"
            className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
            onClick={onAddDetailImage}
          >
            + 항목 추가
          </button>
        </div>

        {isEditMode && existingDetailImagePaths?.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-3">
            {existingDetailImagePaths.map((imagePath, index) => (
              <div
                key={`${imagePath}-${index}`}
                className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
              >
                <img
                  src={toImageSrc(imagePath)}
                  alt={`기존 상세 이미지 ${index + 1}`}
                  className="h-32 w-full object-cover"
                />
              </div>
            ))}
          </div>
        ) : null}

        <div className="space-y-3">
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

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <SectionTitle>지출 계획</SectionTitle>
          <button
            type="button"
            className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
            onClick={onAddUsePlan}
          >
            + 항목 추가
          </button>
        </div>

        <div className="space-y-3">
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
                />
              </Field>
              <Field label="금액" required>
                <input
                  type="number"
                  min="0"
                  value={plan.planAmount}
                  onChange={(event) => onUsePlanChange(plan.id, "planAmount", event.target.value)}
                  placeholder="0"
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

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <SectionTitle>수혜자 확인</SectionTitle>
          <button
            type="button"
            className="rounded-full bg-blue-500 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600"
            onClick={onBeneficiaryCheck}
          >
            수혜자 확인
          </button>
        </div>

        <Field
          label="엔트리 코드"
          required
          hint="등록 전에 수혜자 코드가 유효한지 먼저 확인합니다."
        >
          <input
            name="entryCode"
            value={formValues.entryCode}
            onChange={onChange}
            placeholder="entry code를 입력하세요"
          />
        </Field>

        <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
          <p className="text-sm text-slate-600">{beneficiaryStatusMessage}</p>
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
          type="button"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          onClick={onCancel}
        >
          취소
        </button>
        <button
          type="submit"
          className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={submitting}
        >
          {submitting ? (isEditMode ? "수정 중..." : "신청 중...") : isEditMode ? "수정 완료" : "신청 완료"}
        </button>
      </div>
    </form>
  );
}


