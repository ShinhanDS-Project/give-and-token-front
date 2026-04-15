import { useState, useRef } from "react";
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../css/FoundationSignupPage.css";

const foundationTypeOptions = [
  { value: "COMPANY", label: "재단 및 단체" },
  { value: "SCHOOL", label: "학교" },
  { value: "RELIGION", label: "종교" },
  { value: "MEDICAL", label: "의료" },
  { value: "ETC", label: "기타" },
];

const bankOptions = [
  { value: "", label: "은행 선택" },
  { value: "국민은행", label: "국민은행" },
  { value: "신한은행", label: "신한은행" },
  { value: "우리은행", label: "우리은행" },
  { value: "하나은행", label: "하나은행" },
  { value: "농협은행", label: "농협은행" },
  { value: "기업은행", label: "기업은행" },
  { value: "SC제일은행", label: "SC제일은행" },
  { value: "카카오뱅크", label: "카카오뱅크" },
  { value: "케이뱅크", label: "케이뱅크" },
  { value: "토스뱅크", label: "토스뱅크" },
  { value: "우체국", label: "우체국" },
];

const INITIAL_FORM = {
  foundationType: "",
  foundationName: "",
  foundationEmail: "",
  representativeName: "",
  contactPhone: "",
  businessRegistrationNumber: "",
  feeRate: "",
  description: "",
  bankName: "",
  account: "",
};

function FormField({ label, children }) {
  return (
    <label>
      <span className="fs-label">{label}</span>
      {children}
    </label>
  );
}

function formatBrn(value) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

export default function FoundationSignupPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [profileImage, setProfileImage] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [brnStatus, setBrnStatus] = useState(null);
  const [brnChecked, setBrnChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  function handleChange(event) {
    const { name, value } = event.target;
    if (name === "businessRegistrationNumber") {
      setForm((prev) => ({ ...prev, businessRegistrationNumber: formatBrn(value) }));
      setBrnStatus(null);
      setBrnChecked(false);
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setProfileImage(file);
    setProfilePreview(URL.createObjectURL(file));
  }

  function removeImage() {
    setProfileImage(null);
    setProfilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleCheckBrn() {
    if (form.businessRegistrationNumber.replace(/\D/g, "").length !== 10) {
      setBrnStatus("invalid");
      setBrnChecked(false);
      return;
    }
    try {
      const query = encodeURIComponent(form.businessRegistrationNumber);
      const res = await fetch(`/api/foundation/check-brn?businessRegistrationNumber=${query}`);
      if (!res.ok) throw new Error();
      const isDuplicate = await res.json();
      setBrnStatus(isDuplicate ? "duplicate" : "available");
      setBrnChecked(!isDuplicate);
    } catch {
      setBrnStatus("error");
      setBrnChecked(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!brnChecked) {
      setSubmitError("사업자등록번호 중복 확인을 완료해주세요.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const dto = {
        foundationEmail: form.foundationEmail,
        foundationName: form.foundationName,
        foundationType: form.foundationType,
        representativeName: form.representativeName,
        businessRegistrationNumber: form.businessRegistrationNumber,
        contactPhone: form.contactPhone,
        description: form.description,
        account: form.account,
        bankName: form.bankName,
        feeRate: Number(form.feeRate),
      };
      const formData = new FormData();
      formData.append("data", new Blob([JSON.stringify(dto)], { type: "application/json" }));
      if (profileImage) {
        formData.append("profileImage", profileImage);
      }
      const res = await fetch("/api/foundation/signup", { method: "POST", body: formData });
      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "신청에 실패했습니다.");
      }
      const result = await res.json();
      navigate("/organization/apply/complete", { state: { result } });  //응답 값ㅇ르 가지고 완료 페이지로 네비게이팅
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="bg-white">
      <div className="fs-wrapper">
        <div className="mb-10">
          <h1 className="text-3xl font-black tracking-tight text-black">
            단체 등록 신청
          </h1>
          <p className="mt-3 text-sm font-medium text-stone-500">
            정확한 정보를 입력해 주시면 검토 후 승인 여부를 안내해 드립니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="fs-card">
          <div className="space-y-10">

            {/* 단체 기본 정보 */}
            <section>
              <h3 className="fs-section-title">단체 기본 정보</h3>
              <div className="flex flex-col gap-6">

                {/* 단체 유형 라디오 */}
                <div>
                  <span className="fs-label">단체 유형</span>
                  <div className="fs-radio-group">
                    {foundationTypeOptions.map((opt) => (
                      <label key={opt.value} className="fs-radio-label">
                        <input
                          type="radio"
                          name="foundationType"
                          value={opt.value}
                          checked={form.foundationType === opt.value}
                          onChange={handleChange}
                          required
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>

                <FormField label="단체명">
                  <input className="fs-input" name="foundationName" value={form.foundationName} onChange={handleChange} placeholder="단체명을 입력하세요" required />
                </FormField>

                <FormField label="단체 이메일 계정">
                  <input className="fs-input" name="foundationEmail" type="email" value={form.foundationEmail} onChange={handleChange} placeholder="example@organization.com" required />
                </FormField>

                <FormField label="대표자명">
                  <input className="fs-input" name="representativeName" value={form.representativeName} onChange={handleChange} placeholder="대표자 성명을 입력하세요" required />
                </FormField>

                <FormField label="연락처">
                  <input className="fs-input" name="contactPhone" value={form.contactPhone} onChange={handleChange} placeholder="010-0000-0000" required />
                </FormField>

                {/* 사업자등록번호 */}
                <div>
                  <span className="fs-label">사업자등록번호</span>
                  <div className="flex gap-2">
                    <input className="fs-input" name="businessRegistrationNumber" value={form.businessRegistrationNumber} onChange={handleChange} placeholder="000-00-00000" maxLength={12} required />
                    <button type="button" onClick={handleCheckBrn} disabled={!form.businessRegistrationNumber.trim()} className="fs-check-button">
                      중복 확인
                    </button>
                  </div>
                  {brnStatus === "invalid" && <p className="fs-status-error">사업자등록번호 10자리를 입력해주세요.</p>}
                  {brnStatus === "available" && <p className="fs-status-available">사용 가능한 번호입니다.</p>}
                  {brnStatus === "duplicate" && <p className="fs-status-duplicate">이미 등록된 번호입니다.</p>}
                  {brnStatus === "error" && <p className="fs-status-error">확인 중 오류가 발생했습니다.</p>}
                </div>
              </div>
            </section>

            {/* 단체 상세 정보 */}
            <section>
              <h3 className="fs-section-title">단체 상세 정보</h3>
              <div className="flex flex-col gap-6">
                <FormField label="단체 설명">
                  <textarea className="fs-textarea" name="description" value={form.description} onChange={handleChange} placeholder="단체의 목적과 주요 활동을 설명해 주세요" required />
                </FormField>

                {/* 프로필 이미지 업로드 */}
                <div>
                  <span className="fs-label">프로필 이미지 (선택)</span>
                  <input ref={fileInputRef} id="profileImageInput" type="file" accept="image/*" onChange={handleFileChange} className="fs-file-input" />
                  <label htmlFor="profileImageInput" className="fs-file-button">
                    이미지 파일 선택
                  </label>
                  {profilePreview && (
                    <div className="fs-preview-wrap">
                      <img src={profilePreview} alt="프로필 미리보기" className="fs-preview-img" />
                      <button type="button" onClick={removeImage} className="fs-preview-remove">
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* 정산 정보 */}
            <section>
              <h3 className="fs-section-title">정산 정보</h3>
              <div className="flex flex-col gap-6">
                <FormField label="은행명">
                  <select className="fs-input fs-select" name="bankName" value={form.bankName} onChange={handleChange} required>
                    {bankOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="계좌 번호">
                  <input className="fs-input" name="account" value={form.account} onChange={handleChange} placeholder="하이픈(-) 없이 입력하세요" required />
                </FormField>
                <FormField label="수수료율 (0.00 ~ 1.00)">
                  <input className="fs-input" name="feeRate" type="number" min="0" max="1" step="0.01" value={form.feeRate} onChange={handleChange} placeholder="예: 0.05" required />
                </FormField>
              </div>
            </section>
          </div>

          <label className="fs-checkbox-label">
            <input type="checkbox" required />
            개인정보 수집 및 이용에 동의합니다. (필수)
          </label>

          {submitError && <p className="fs-error-message">{submitError}</p>}

          <button type="submit" disabled={submitting} className="fs-submit-button">
            {submitting ? "신청 중..." : "단체 등록 신청하기"}
            {!submitting && <Check size={20} />}
          </button>

          <p className="fs-footer-note">
            신청 등록 후 승인 여부가 이메일로 회신됩니다.
          </p>
        </form>
      </div>
    </section>
  );
}
