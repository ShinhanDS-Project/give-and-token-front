import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import ProfileCardPage from '../components/ProfileCardPage';
import { getMyInfo } from '../api/myPageApi'; // API 경로 확인 필요
import '../styles/MyPage.css'; // 기존 스타일 재사용

const MyPageLayout = () => {
    const [myInfo, setMyInfo] = useState(null);

    useEffect(() => {
        const fetchMyInfo = async () => {
            try {
                const data = await getMyInfo();
                setMyInfo(data);
            } catch (error) {
                console.error("내 정보 불러오기 실패:", error);
            }
        };
        fetchMyInfo();
    }, []);

    return (
        <div className="mypage-main-page">
            <div className="mypage-main-container">
                {/* 사이드바: myInfo를 prop으로 전달 */}
                <ProfileCardPage myInfo={myInfo} />

                {/* 우측 콘텐츠 영역: 하위 라우트들이 여기에 렌더링됨 */}
                <div className="mypage-content-area">
                    <Outlet context={{ myInfo, setMyInfo }} />
                </div>
            </div>
        </div>
    );
};

export default MyPageLayout;