// give-and-token-front/src/features/signUp/components/SignupFormFields.jsx

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
                                         }) {
    const isUser = role === "user";
    const isBeneficiary = role === "beneficiary";

    // 공통 필드 (이메일, 비밀번호)
    const commonFields = (
        <>
            <p>
                이메일:{" "}
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={onChange}
                    required
                    disabled={isEmailVerified && isUser}
                />
                {isUser && (
                    <button
                        type="button"
                        onClick={onSendVerification}
                        disabled={isEmailVerified}
                    >
                        {isEmailVerified ? "인증완료" : "인증하기"}
                    </button>
                )}
            </p>

            {isUser && showVerificationInput && !isEmailVerified && (
                <p>
                    인증코드:{" "}
                    <input
                        type="text"
                        value={verificationCode}
                        onChange={onVerificationCodeChange}
                        placeholder="인증코드 입력"
                    />
                    <button type="button" onClick={onVerifyCode}>
                        확인하기
                    </button>
                </p>
            )}

            <p>
                비밀번호:{" "}
                <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={onChange}
                    required
                />
            </p>
            <p>
                비밀번호 확인:{" "}
                <input
                    type="password"
                    name="password2"
                    value={formData.password2}
                    onChange={onChange}
                    required
                />
            </p>
        </>
    );

    return (
        <div>
            {/* 일반 사용자 전용 프로필 사진 업로드 필드 */}
            {isUser && (
                <p>
                    프로필 사진:{" "}
                    <input type="file" accept="image/*" onChange={onFileChange} />
                </p>
            )}

            {/* 공통 필드 적용 */}
            {commonFields}

            {/* 사용자 전용 필드 */}
            {isUser && (
                <>
                    <p>
                        이름:{" "}
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={onChange}
                            required
                        />
                    </p>
                    <p>
                        닉네임:{" "}
                        <input
                            type="text"
                            name="nameHash"
                            value={formData.nameHash}
                            onChange={onChange}
                            required
                        />
                        <button type="button" onClick={onNicknameCheck}>
                            중복체크
                        </button>
                    </p>
                    <p>
                        전화번호:{" "}
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={onChange}
                            placeholder="010-0000-0000"
                            required
                        />
                    </p>
                    <p>
                        생일:{" "}
                        <input
                            type="date"
                            name="birth"
                            value={formData.birth}
                            onChange={onChange}
                            required
                        />
                    </p>
                </>
            )}

            {/* 수혜자 전용 필드 */}
            {isBeneficiary && (
                <>
                    <p>
                        이름:{" "}
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={onChange}
                            required
                        />
                    </p>
                    <p>
                        전화번호:{" "}
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={onChange}
                            required
                        />
                    </p>
                    <p>
                        계좌번호:{" "}
                        <input
                            type="text"
                            name="account"
                            value={formData.account}
                            onChange={onChange}
                            required
                        />
                    </p>
                    <p>
                        수혜자 유형:{" "}
                        <select
                            name="beneficiaryType"
                            value={formData.beneficiaryType}
                            onChange={onChange}
                            required
                        >
                            <option value="">선택하세요</option>
                            <option value="SENIOR">노인</option>
                            <option value="CHILD">아동</option>
                        </select>
                    </p>
                </>
            )}
        </div>
    );
}