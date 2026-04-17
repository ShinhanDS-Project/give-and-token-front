export default function SocialLoginSection({
  role,
  onGoToSignUp,
  onGoogleLogin,
}) {
  return (
    <div className="space-y-4">
      <div className="text-center text-sm">
        <p>
          처음이신가요?{" "}
          <button
            type="button"
            onClick={onGoToSignUp}
            className="font-medium text-primary hover:text-primary-dark focus:outline-none"
          >
            가입하기
          </button>
        </p>
      </div>

      {role === "user" && (
        <div>
          <button
            type="button"
            onClick={onGoogleLogin}
            className="group relative flex w-full justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.8 0-5.18-1.88-6.04-4.42H2.34v2.84C4.12 20.98 7.79 23 12 23z" fill="#34A853"/>
              <path d="M5.96 14.25c-.21-.66-.32-1.36-.32-2.08s.11-1.42.32-2.08V7.29H2.34C1.5 8.83 1 10.55 1 12.33s.5 3.5 1.34 5.04l3.62-2.87z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.79 1 4.12 3.02 2.34 6.16l3.62 2.85c.86-2.54 3.24-4.42 6.04-4.42z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </div>
      )}
    </div>
  );
}