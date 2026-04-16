export default function LoginLinks({
  onOpenFindEmail,
  onOpenPasswordReset,
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <button
        type="button"
        onClick={onOpenFindEmail}
        className="font-medium text-primary hover:text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        이메일 찾기
      </button>

      <button
        type="button"
        onClick={onOpenPasswordReset}
        className="font-medium text-primary hover:text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        비밀번호 재설정
      </button>
    </div>
  );
}