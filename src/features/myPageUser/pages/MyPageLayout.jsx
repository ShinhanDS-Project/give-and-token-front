import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import ProfileCard from "../components/ProfileCardPage";
import { getMyPageInfo } from "../api/mypageApi";
import "../styles/MyPage.css";

const MyPageLayout = () => {
    const navigate = useNavigate();
    const [myInfo, setMyInfo] = useState(null);

    useEffect(() => {
        const fetchMyInfo = async () => {
            try {
                const res = await getMyPageInfo();
                setMyInfo(res.data);
            } catch (error) {
                console.error("Failed to fetch user info", error);
                // Handle error appropriately, maybe redirect to login
            }
        };

        fetchMyInfo();
    }, []);

    return (
        <div className="mypage-main-page scrollbar-hide">
            <div className="mypage-layout-shell scrollbar-hide">
                <aside className="mypage-layout-nav scrollbar-hide">
                    <div className="lg:sticky lg:top-48 h-full scrollbar-hide">
                        <ProfileCard
                            myInfo={myInfo}
                            onGoHome={() => navigate("/mypage")}
                            onEditProfile={() => navigate("/mypage/profile-edit")}
                            onChangePassword={() => navigate("/mypage/password-change")}
                            onViewDonations={() => navigate("/mypage/donation-history")}
                        />
                    </div>
                </aside>
                <main className="mypage-layout-content">
                    <Outlet context={{ myInfo }} />
                </main>
            </div>
        </div>
    );
};

export default MyPageLayout;
