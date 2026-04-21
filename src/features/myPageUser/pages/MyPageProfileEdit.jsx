import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { User, Camera, Check, AlertCircle } from "lucide-react";
import "../styles/MyPage.css";
import {
  checkNicknameDuplicate,
  updateMyPageInfo,
} from "../api/mypageApi";

export default function MyPageProfileEdit() {
  const navigate = useNavigate();
  const { myInfo } = useOutletContext();

  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    email: "",
    name: "",
    phone: "",
    nameHash: "",
    profilePath: "",
  });

  const [previewImage, setPreviewImage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const [originalNickname, setOriginalNickname] = useState("");
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [nicknameMessage, setNicknameMessage] = useState("");
  const [error, setError] = useState("");

  const IMAGE_BASE_URL = "/uploads/";

  const formatPhoneNumber = (value) => {
    const digits = String(value ?? "").replace(/\D/g, "");
    if (!digits) return "";

    if (digits.length === 11) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
    }

    if (digits.length === 10) {
      if (digits.startsWith("02")) {
        return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
      }
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }

    if (digits.length === 9 && digits.startsWith("02")) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
    }

    return value ?? "";
  };

  useEffect(() => {
    if (myInfo) {
      setForm({
        email: myInfo.email ?? "",
        name: myInfo.name ?? "",
        phone: myInfo.phone ?? "",
        nameHash: myInfo.nameHash ?? "",
        profilePath: myInfo.profilePath ?? "",
      });

      setOriginalNickname(myInfo.nameHash ?? "");

      if (myInfo.profilePath) {
        const fullPath = myInfo.profilePath.startsWith("http")
          ? myInfo.profilePath
          : `${IMAGE_BASE_URL}${myInfo.profilePath}`;
        setPreviewImage(fullPath);
      }

      setNicknameChecked(false);
      setNicknameMessage("");
    }
  }, [myInfo]);

  const handleNicknameChange = (e) => {
    const value = e.target.value;

    setForm((prev) => ({
      ...prev,
      nameHash: value,
    }));

    setNicknameChecked(false);
    setNicknameMessage("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);

    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewImage(objectUrl);
    }
  };

  const handleNicknameCheck = async () => {
    try {
      if (!form.nameHash.trim()) {
        setNicknameChecked(false);
        setNicknameMessage("닉네임을 입력해주세요.");
        return;
      }

      if (form.nameHash === originalNickname) {
        setNicknameChecked(true);
        setNicknameMessage("현재 사용 중인 닉네임입니다.");
        return;
      }

      const response = await checkNicknameDuplicate(form.nameHash);
      const data = response.data;

      const isAvailable =
        data?.available === true ||
        data?.duplicated === false ||
        data === true;

      if (isAvailable) {
        setNicknameChecked(true);
        setNicknameMessage("사용 가능한 닉네임입니다.");
      } else {
        setNicknameChecked(false);
        setNicknameMessage("이미 사용 중인 닉네임입니다.");
      }
    } catch (err) {
      console.error(err);
      setNicknameChecked(false);
      setNicknameMessage("닉네임 중복 확인에 실패했습니다.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      if (!form.nameHash.trim()) {
        setError("닉네임을 입력해주세요.");
        return;
      }

      if (form.nameHash !== originalNickname && !nicknameChecked) {
        setError("닉네임 중복 확인을 먼저 해주세요.");
        return;
      }

      const formData = new FormData();
      formData.append("nameHash", form.nameHash);

      if (selectedFile) {
        formData.append("profileImage", selectedFile);
      }

      await updateMyPageInfo(formData);

      alert("정보 수정이 완료되었습니다.");
      navigate("/mypage");
    } catch (err) {
      console.error(err);

      const message =
        err?.response?.data?.message ||
        err?.response?.data ||
        "정보 수정에 실패했습니다.";

      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mypage-sub-page scrollbar-hide">
      <div className="mypage-sub-container scrollbar-hide">
        <header className="mb-12">
          <h1 className="!mb-0 text-3xl font-bold text-ink">나의 정보 수정</h1>
        </header>

        <section className="mypage-card mypage-sub-card">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-2 text-sm font-medium border border-red-100">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            <div className="flex flex-col items-center gap-4">
              <div className="profile-image-container group relative">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="프로필 미리보기"
                    className="profile-image"
                  />
                ) : (
                  <div className="profile-image flex items-center justify-center bg-stone-100">
                    <User size={64} className="text-stone-300" />
                  </div>
                )}
                <label className="absolute -bottom-1 -right-1 p-2.5 bg-primary text-white rounded-full cursor-pointer shadow-lg hover:scale-110 transition-all border-4 border-white">
                  <Camera size={18} />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              <p className="card-label-clean !mb-0 text-[11px]">프로필 사진 변경</p>
            </div>

            <div className="grid gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-bold text-ink/60 uppercase tracking-wider ml-1">
                  닉네임
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-5 py-3 rounded-2xl border-2 border-line focus:border-primary outline-none transition-colors text-ink font-medium"
                    value={form.nameHash}
                    onChange={handleNicknameChange}
                    placeholder="새 닉네임을 입력하세요"
                  />
                  <button
                    type="button"
                    className="whitespace-nowrap !px-6 !py-2 rounded-2xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors"
                    onClick={handleNicknameCheck}
                  >
                    중복 확인
                  </button>
                </div>
                {nicknameMessage && (
                  <p
                    className={`text-[12px] ml-1 flex items-center gap-1 font-medium ${
                      nicknameChecked ? "text-emerald-500" : "text-rose-400"
                    }`}
                  >
                    {nicknameChecked ? (
                      <Check size={14} />
                    ) : (
                      <AlertCircle size={14} />
                    )}
                    {nicknameMessage}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-bold text-ink/60 uppercase tracking-wider ml-1">
                  이메일 (변경 불가)
                </label>
                <input
                  type="text"
                  className="px-5 py-3 rounded-2xl border-2 border-line bg-surface text-ink/40 cursor-not-allowed font-medium"
                  value={form.email}
                  disabled
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[12px] font-bold text-ink/80 uppercase tracking-wider ml-1">
                    이름
                  </label>
                  <input
                    type="text"
                    className="px-5 py-3 rounded-2xl border-2 border-line bg-surface text-ink/40 cursor-not-allowed font-medium"
                    value={form.name}
                    disabled
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[12px] font-bold text-ink/80 uppercase tracking-wider ml-1">
                    전화번호
                  </label>
                  <input
                    type="text"
                    className="px-5 py-3 rounded-2xl border-2 border-line bg-surface text-ink/40 cursor-not-allowed font-medium"
                    value={formatPhoneNumber(form.phone)}
                    disabled
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                type="submit"
                className="bg-primary text-white flex-1 py-4 rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-primary/90 transition-all justify-center flex items-center"
                disabled={submitting}
              >
                {submitting ? "수정 중..." : "수정 완료"}
              </button>
              <button
                type="button"
                className="btn-mypage-outline flex-1 py-4 text-ink/60"
                onClick={() => navigate("/mypage")}
              >
                취소
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

