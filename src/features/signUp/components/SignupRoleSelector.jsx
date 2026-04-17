// give-and-token-front/src/features/signUp/components/SignupRoleSelector.jsx

export default function SignupRoleSelector({ role, onChange }) {
  return (
    <div className="role-selector-container">
      <h3 className="role-title">가입 유형 선택</h3>
      <div className="role-options">
        <label className="role-option">
          <input
            type="radio"
            name="role"
            value="user"
            checked={role === "user"}
            onChange={onChange}
          />
          <div className="role-card">
            <span className="role-icon">👤</span>
            <span className="role-label">일반 사용자</span>
          </div>
        </label>
        <label className="role-option">
          <input
            type="radio"
            name="role"
            value="beneficiary"
            checked={role === "beneficiary"}
            onChange={onChange}
          />
          <div className="role-card">
            <span className="role-icon">🎁</span>
            <span className="role-label">수혜자</span>
          </div>
        </label>
      </div>
    </div>
  );
}