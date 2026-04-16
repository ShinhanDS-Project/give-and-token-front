export default function ProfileCard({
  myInfo,
  onEditProfile,
  onChangePassword,
  onViewDonations,
}) {
  return (
    <section style={styles.profileCard}>
     {myInfo?.profilePath ? (
        <img src={myInfo.profilePath} alt="프로필" width="120" />
      ) : (
        <div>프로필 이미지 없음</div>
      )}
           <h2>{myInfo?.name ?? "-"}님</h2>

      <div style={styles.menuButtonGroup}>
        <button style={styles.menuButton} onClick={onEditProfile}>
          나의 정보 수정
        </button>

        <button style={styles.menuButton} onClick={onChangePassword}>
          비밀번호 변경
        </button>

        <button style={styles.menuButton} onClick={onViewDonations}>
          나의 기부내역
        </button>
      </div>
    </section>
  );
}

const styles = {
  profileCard: {
    width: "280px",
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    padding: "28px 20px",
    boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  profileImage: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    objectFit: "cover",
    marginBottom: "16px",
    border: "1px solid #eee",
  },
  userName: {
    fontSize: "24px",
    fontWeight: "700",
    marginBottom: "24px",
  },
  menuButtonGroup: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  menuButton: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "12px",
    border: "1px solid #ddd",
    backgroundColor: "#fff",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "600",
  },
};