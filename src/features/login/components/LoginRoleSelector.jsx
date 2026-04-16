export default function LoginRoleSelector({ role, onChange }) {
  return (
    <fieldset className="mb-6">
      <legend className="sr-only">권한 선택</legend>
      <div className="flex justify-center space-x-4">
        <label className={`flex items-center space-x-2 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
            role === "user" ? "bg-primary text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}>
          <input
            type="radio"
            name="role"
            value="user"
            checked={role === "user"}
            onChange={onChange}
            className="form-radio h-4 w-4 text-primary transition duration-150 ease-in-out"
          />
          <span className="font-medium">사용자</span>
        </label>

        <label className={`flex items-center space-x-2 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
            role === "foundation" ? "bg-primary text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}>
          <input
            type="radio"
            name="role"
            value="foundation"
            checked={role === "foundation"}
            onChange={onChange}
            className="form-radio h-4 w-4 text-primary transition duration-150 ease-in-out"
          />
          <span className="font-medium">기업단체</span>
        </label>

        <label className={`flex items-center space-x-2 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
            role === "beneficiary" ? "bg-primary text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}>
          <input
            type="radio"
            name="role"
            value="beneficiary"
            checked={role === "beneficiary"}
            onChange={onChange}
            className="form-radio h-4 w-4 text-primary transition duration-150 ease-in-out"
          />
          <span className="font-medium">수혜자</span>
        </label>
      </div>
    </fieldset>
  );
}