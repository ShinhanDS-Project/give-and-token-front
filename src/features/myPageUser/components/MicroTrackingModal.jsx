import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function formatAmount(amount) {
    if (amount == null) return '0원';
    return `${Number(amount).toLocaleString()}원`;
}

function formatDate(dateValue) {
    if (!dateValue) return '-';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return dateValue;
    return date.toLocaleDateString('ko-KR', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export default function MicroTrackingModal({ isOpen, onClose, trackingData, isLoading, campaignId: propCampaignId }) {
    const navigate = useNavigate();
    if (!isOpen) return null;

    const report = trackingData?.userFinalReportDTO;
    const settlement = trackingData?.userSettlementDTO;
    const campaignId = propCampaignId || trackingData?.campaignNo || report?.reportData?.campaignNo;

    const handleMoveToReport = () => {
        if (!campaignId) return;
        navigate(`/campaign/${campaignId}?tab=proof`);
        onClose();
    };

    // 상태 메시지 생성 함수
    const getStatusMessage = () => {
        if (!report) return null;
        const days = report.dayPassed || 0;
        
        switch (report.trackingStatus) {
            case 'FUNDRAISING':
                return `모금 종료까지 ${days}일 남았습니다.`;
            case 'IN_PROGRESS':
                return `사업 종료일까지 ${days}일 남았습니다.`;
            case 'FINISHED':
                return `사업 종료 후 ${days}일이 경과되었습니다.`;
            default:
                return report.isPassed 
                    ? `캠페인 종료 후 ${days}일이 경과되었습니다.`
                    : `캠페인 종료까지 ${days}일 남았습니다.`;
        }
    };

    const statusMsg = getStatusMessage();

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* 헤더 */}
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">기부 트래킹 기록</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-10 overflow-y-auto max-h-[75vh]">
                    {isLoading ? (
                        <div className="text-center py-20 flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin"></div>
                            <p className="font-bold text-gray-400 text-sm">기록을 불러오는 중...</p>
                        </div>
                    ) : (
                        <>
                            {/* 1. 정산 내역 섹션 (항상 위) */}
                            <section>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">정산 내역</h3>
                                {settlement ? (
                                    <div className="border-2 rounded-2xl divide-y overflow-hidden shadow-sm">
                                        <div className="flex justify-between p-4 text-sm bg-gray-50/50">
                                            <span className="text-gray-500 font-bold">정산 일시</span>
                                            <span className="font-black text-gray-900">{formatDate(settlement.settledAt)}</span>
                                        </div>
                                        <div className="flex justify-between p-4 text-sm">
                                            <span className="text-gray-500 font-bold">단체 수령액</span>
                                            <span className="font-black text-gray-900">{formatAmount(settlement.foundationAmount)}</span>
                                        </div>
                                        <div className="flex justify-between p-4 text-sm">
                                            <span className="text-gray-500 font-bold">수혜자 수령액</span>
                                            <span className="font-black text-primary text-base">{formatAmount(settlement.beneficiaryAmount)}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-8 border-2 border-dashed border-gray-100 rounded-2xl text-center">
                                        <p className="text-sm font-bold text-gray-300">정산 내역이 아직 없습니다.</p>
                                    </div>
                                )}
                            </section>

                            {/* 2. 최종 보고서 섹션 (항상 아래) */}
                            <section>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">최종 보고서</h3>
                                
                                {report?.isExist && report.reportData ? (
                                    /* 보고서가 있는 경우: 카드 출력 */
                                    <div className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                        <div className="p-6">
                                            <h4 className="font-black text-gray-900 text-lg mb-2 leading-snug">
                                                {report.reportData.title}
                                            </h4>
                                            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-5 font-medium">
                                                {report.reportData.content}
                                            </p>
                                            <button 
                                                onClick={handleMoveToReport}
                                                className="w-full py-4 bg-gray-900 hover:bg-primary text-white text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-gray-900/10"
                                            >
                                                최종 보고서 확인하기
                                                <svg width="16" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* 보고서가 없는 경우: 상태 메시지만 깔끔하게 출력 */
                                    <div className="p-6 bg-gray-50 rounded-2xl border-2 border-gray-100">
                                        <p className="text-base font-black text-gray-700 leading-snug">
                                            {statusMsg}
                                        </p>
                                        <p className="text-sm text-gray-400 mt-2 font-medium">
                                            {report?.trackingStatus === 'FINISHED' 
                                                ? "최종 보고서가 아직 등록되지 않았습니다." 
                                                : "기한 종료 후 최종 보고서가 등록될 예정입니다."}
                                        </p>
                                    </div>
                                )}
                            </section>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
