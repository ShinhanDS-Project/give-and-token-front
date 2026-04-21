import { UserRound, HandHeart } from "lucide-react";

export default function SignupRoleSelector({ role, onChange }) {
  return (
    <div className="role-selector-container">
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
            <span className="role-icon" aria-hidden="true">
              <UserRound size={26} strokeWidth={2.2} />
            </span>
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
            <span className="role-icon" aria-hidden="true">
              <HandHeart size={26} strokeWidth={2.2} />
            </span>
            <span className="role-label">수혜자</span>
          </div>
        </label>
      </div>
    </div>
  );
}
