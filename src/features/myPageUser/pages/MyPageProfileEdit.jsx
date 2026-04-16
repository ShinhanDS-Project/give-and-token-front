import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  checkNicknameDuplicate,
  getMyPageInfo,
  updateMyPageInfo,
} from "../api/mypageApi";

export default function MyPageProfileEdit() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetchMyInfo();
  }, []);

  const fetchMyInfo = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getMyPageInfo();
      const data = response.data;

      setForm({
        email: data.email ?? "",
        name: data.name ?? "",
        phone: data.phone ?? "",
        nameHash: data.nameHash ?? "",
        profilePath: data.profilePath ?? "",
      });

      setOriginalNickname(data.nameHash ?? "");
      setPreviewImage(data.profilePath ?? "");
      setNicknameChecked(true);
      setNicknameMessage("현재 사용 중인 닉네임이야.");
    } catch (err) {
      console.error(err);
      setError("내 정보를 불러오지 못했어.");
    } finally {
      setLoading(false);
    }
  };

  const handleNicknameChange = (e) => {
    const value = e.target.value;

    setForm((prev) => ({
      ...prev,
      nameHash: value,
    }));

    if (value === originalNickname) {
      setNicknameChecked(true);
      setNicknameMessage("현재 사용 중인 닉네임이야.");
      return;
    }

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
        setNicknameMessage("닉네임을 입력해.");
        return;
      }

      if (form.nameHash === originalNickname) {
        setNicknameChecked(true);
        setNicknameMessage("현재 사용 중인 닉네임이야.");
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
        setNicknameMessage("사용 가능한 닉네임이야.");
      } else {
        setNicknameChecked(false);
        setNicknameMessage("이미 사용 중인 닉네임이야.");
      }
    } catch (err) {
      console.error(err);
      setNicknameChecked(false);
      setNicknameMessage("닉네임 중복 확인에 실패했어.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      if (!form.nameHash.trim()) {
        setError("닉네임을 입력해.");
        return;
      }

      if (form.nameHash !== originalNickname && !nicknameChecked) {
        setError("닉네임 중복 확인을 먼저 해줘.");
        return;
      }

      const formData = new FormData();
      formData.append("nameHash", form.nameHash);

      if (selectedFile) {
        formData.append("profileImage", selectedFile);
      }

      await updateMyPageInfo(formData);

      alert("정보 수정이 완료됐어.");
      navigate("/mypage");
    } catch (err) {
      console.error(err);

      const message =
        err?.response?.data?.message ||
        err?.response?.data ||
        "정보 수정에 실패했어.";

      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div>불러오는 중...</div>;
  }

  return (
    <div>
      <h1>나의 정보 수정</h1>

      {error && <p>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <p>프로필 사진</p>

          {previewImage ? (
            <img src={previewImage} alt="프로필 미리보기" width="120" />
          ) : (
            <p>등록된 사진 없음</p>
          )}

          <input type="file" accept="image/*" onChange={handleFileChange} />
        </div>

        <hr />

        <div>
          <label>닉네임</label>
          <div>
            <input
              type="text"
              value={form.nameHash}
              onChange={handleNicknameChange}
            />
            <button type="button" onClick={handleNicknameCheck}>
              중복 확인
            </button>
          </div>
          {nicknameMessage && <p>{nicknameMessage}</p>}
        </div>

        <div>
          <label>이메일</label>
          <input type="text" value={form.email} disabled />
        </div>

        <div>
          <label>이름</label>
          <input type="text" value={form.name} disabled />
        </div>

        <div>
          <label>전화번호</label>
          <input type="text" value={form.phone} disabled />
        </div>

        <br />

        <button type="submit" disabled={submitting}>
          {submitting ? "수정 중..." : "수정하기"}
        </button>
      </form>
    </div>
  );
}