export default function LoginForm({
  loginData,
  onChange,
  onSubmit,
  errorMessage,
}) {
  return (
    <form className="mt-8 space-y-6" onSubmit={onSubmit}>
      <div className="-space-y-px rounded-md shadow-sm">
        <div>
          <label htmlFor="email-address" className="sr-only">
            이메일 주소
          </label>
          <input
            id="email-address"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
            placeholder="이메일 주소"
            value={loginData.email}
            onChange={onChange}
          />
        </div>
        <div>
          <label htmlFor="password" className="sr-only">
            비밀번호
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="relative block w-full appearance-none rounded-none rounded-b-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
            placeholder="비밀번호"
            value={loginData.password}
            onChange={onChange}
          />
        </div>
      </div>

      {errorMessage && (
        <p className="mt-2 text-center text-sm text-red-600">{errorMessage}</p>
      )}

      <div>
        <button
          type="submit"
          className="group relative flex w-full justify-center rounded-md border border-transparent bg-primary py-2 px-4 text-sm font-medium text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          로그인
        </button>
      </div>
    </form>
  );
}