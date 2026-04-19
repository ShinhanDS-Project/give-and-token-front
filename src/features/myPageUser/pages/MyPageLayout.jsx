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
            <div className="flex flex-col lg:flex-row gap-16 scrollbar-hide">
                <aside className="w-full lg:w-80 shrink-0 scrollbar-hide">
                    <div className="lg:sticky lg:top-48 h-full scrollbar-hide">
                        <ProfileCard
                            myInfo={myInfo}
                            onEditProfile={() => navigate("/mypage/profile-edit")}
                            onChangePassword={() => navigate("/mypage/password-change")}
                            onViewDonations={() => navigate("/mypage/donation-history")}
                        />
                    </div>
                </aside>
                <main className="flex-1 min-w-0">
                    <Outlet context={{ myInfo }} />
                </main>
            </div>
        </div>
    );
};

export default MyPageLayout;