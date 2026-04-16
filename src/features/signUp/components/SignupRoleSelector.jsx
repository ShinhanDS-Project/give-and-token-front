// give-and-token-front/src/features/signUp/components/SignupRoleSelector.jsx

export default function SignupRoleSelector({ role, onChange }) {
  return (
      <div>
        <h3>가입 유형 선택</h3>
        <label>
          <input
              type="radio"
              name="role"
              value="user"
              checked={role === "user"}
              onChange={onChange}
          />
          일반 사용자
        </label>
        <label>
          <input
              type="radio"
              name="role"
              value="beneficiary"
              checked={role === "beneficiary"}
              onChange={onChange}
          />
          수혜자
        </label>
      </div>
  );
}