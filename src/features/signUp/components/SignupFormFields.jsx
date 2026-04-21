// give-and-token-front/src/features/signUp/components/SignupFormFields.jsx

import {
  Mail,
  Lock,
  User,
  Phone,
  Calendar,
  CreditCard,
  Tag,
  Upload,
  CheckCircle2,
} from "lucide-react";

export default function SignupFormFields({
  role,
  formData,
  onChange,
  onFileChange,
  onNicknameCheck,
  onSendVerification,
  verificationCode,
  onVerificationCodeChange,
  onVerifyCode,
  showVerificationInput,
  isEmailVerified,
  isGoogleSignup,
}) {
  const isUser = role === "user";
  const isBeneficiary = role === "beneficiary";

  // 프로필 미리보기 (파일이 있을 때)
  const profilePreview = formData.profileImage
    ? URL.createObjectURL(formData.profileImage)
    : "https://via.placeholder.com/100?text=Profile";

  // 공통 필드 (이메일, 비밀번호)
  const commonFields = (
    <>
      <div className="field-group">
        <label className="label-text">이메일</label>
        <div className="input-with-button">
          <div className="input-wrapper" style={{ flex: 1 }}>
            <Mail className="input-icon" size={18} />
            <input
              name="email"
              className="signup-input"
              value={formData.email}
              onChange={onChange}
              disabled={isGoogleSignup || isEmailVerified}
              placeholder="example@email.com"
            />
          </div>
          {isUser && !isGoogleSignup && (
            <button
              type="button"
              className={`action-button ${isEmailVerified ? "verified" : ""}`}
              onClick={onSendVerification}
              disabled={isEmailVerified}
            >
              {isEmailVerified ? (
                <>
                  <CheckCircle2 size={16} /> 인증됨
                </>
              ) : (
                "인증하기"
              )}
            </button>
          )}
        </div>
      </div>

      {isUser &&
        !isGoogleSignup &&
        showVerificationInput &&
        !isEmailVerified && (
          <div className="field-group">
            <label className="label-text">인증코드</label>
            <div className="input-with-button">
              <div className="input-wrapper" style={{ flex: 1 }}>
                <CheckCircle2 className="input-icon" size={18} />
                <input
                  type="text"
                  className="signup-input"
                  value={verificationCode}
                  onChange={onVerificationCodeChange}
                  placeholder="인증코드 6자리 입력"
                />
              </div>
              <button
                type="button"
                className="action-button"
                onClick={onVerifyCode}
              >
                확인
              </button>
            </div>
          </div>
        )}

      <div className="field-group">
        <label className="label-text">비밀번호</label>
        <div className="input-wrapper">
          <Lock className="input-icon" size={18} />
          <input
            type="password"
            name="password"
            className="signup-input"
            value={formData.password}
            onChange={onChange}
            required
            placeholder="••••••••"
          />
        </div>
      </div>

      <div className="field-group">
        <label className="label-text">비밀번호 확인</label>
        <div className="input-wrapper">
          <Lock className="input-icon" size={18} />
          <input
            type="password"
            name="password2"
            className="signup-input"
            value={formData.password2}
            onChange={onChange}
            required
            placeholder="••••••••"
          />
        </div>
      </div>
    </>
  );

  return (
    <div className="signup-fields">
      {/* 일반 사용자 전용 프로필 사진 업로드 필드 */}
      {isUser && (
        <div className="profile-upload-container">
          <div className="profile-preview">
            <img src={profilePreview} alt="Profile preview" />
          </div>
          <label className="file-input-label">
            <Upload size={16} />
            사진 선택
            <input
              type="file"
              accept="image/*"
              onChange={onFileChange}
              style={{ display: "none" }}
            />
          </label>
        </div>
      )}

      {/* 공통 필드 적용 */}
      {commonFields}

      {/* 사용자 전용 필드 */}
      {isUser && (
        <>
          <div className="field-group">
            <label className="label-text">이름</label>
            <div className="input-wrapper">
              <User className="input-icon" size={18} />
              <input
                name="name"
                className="signup-input"
                value={formData.name}
                onChange={onChange}
                disabled={isGoogleSignup}
                placeholder="홍길동"
              />
            </div>
          </div>

          <div className="field-group">
            <label className="label-text">닉네임</label>
            <div className="input-with-button">
              <div className="input-wrapper" style={{ flex: 1 }}>
                <Tag className="input-icon" size={18} />
                <input
                  type="text"
                  name="nameHash"
                  className="signup-input"
                  value={formData.nameHash}
                  onChange={onChange}
                  required
                  placeholder="별명"
                />
              </div>
              <button
                type="button"
                className="action-button"
                onClick={onNicknameCheck}
              >
                중복확인
              </button>
            </div>
          </div>

          <div className="field-group">
            <label className="label-text">전화번호</label>
            <div className="input-wrapper">
              <Phone className="input-icon" size={18} />
              <input
                type="tel"
                name="phone"
                className="signup-input"
                value={formData.phone}
                onChange={onChange}
                placeholder="01000000000"
                required
              />
            </div>
          </div>

          <div className="field-group">
            <label className="label-text">생일</label>
            <div className="input-wrapper">
              <Calendar className="input-icon" size={18} />
              <input
                type="date"
                name="birth"
                className="signup-input"
                value={formData.birth}
                onChange={onChange}
                required
              />
            </div>
          </div>
        </>
      )}

      {/* 수혜자 전용 필드 */}
      {isBeneficiary && (
        <>
          <div className="field-group">
            <label className="label-text">기관명 / 성함</label>
            <div className="input-wrapper">
              <User className="input-icon" size={18} />
              <input
                type="text"
                name="name"
                className="signup-input"
                value={formData.name}
                onChange={onChange}
                required
                placeholder="기관명 또는 성함을 입력해주세요"
              />
            </div>
          </div>

          <div className="field-group">
            <label className="label-text">전화번호</label>
            <div className="input-wrapper">
              <Phone className="input-icon" size={18} />
              <input
                type="tel"
                name="phone"
                className="signup-input"
                value={formData.phone}
                onChange={onChange}
                placeholder="01000000000"
                required
              />
            </div>
          </div>

          <div className="field-group">
            <label className="label-text">계좌번호</label>
            <div className="input-wrapper">
              <CreditCard className="input-icon" size={18} />
              <input
                type="text"
                name="account"
                className="signup-input"
                value={formData.account}
                onChange={onChange}
                required
                placeholder="정산받으실 계좌번호"
              />
            </div>
          </div>

          <div className="field-group">
            <label className="label-text">수혜자 유형</label>
            <div className="input-wrapper">
              <Tag className="input-icon" size={18} />
              <select
                name="beneficiaryType"
                className="signup-input signup-select"
                value={formData.beneficiaryType}
                onChange={onChange}
                required
              >
                <option value="">수혜 대상 선택</option>
                <option value="INDIVIDUAL">개인</option>
                <option value="ORGANIZATION">단체</option>
              </select>
            </div>
          </div>
        </>
      )}
    </div>
  );
}