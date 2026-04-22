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

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col overflow-hidden">
                {/* 헤더 */}
                <div className="flex justify-between items-center p-5 border-b">
                    <h2 className="text-2xl font-black text-gray-900">기부 트래킹 기록</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-8 overflow-y-auto max-h-[70vh]">
                    {isLoading ? (
                        <div className="text-center py-10 text-gray-500">불러오는 중...</div>
                    ) : (
                        <>
                            {/* 캠페인 진행 상태 문구 (보고서가 없을 때만 표시) */}
                            {!report?.isExist && (
                                <section className="p-5 bg-gray-50 rounded-xl border border-gray-200">
                                    <p className="text-base font-bold text-gray-800">
                                        {report?.isPassed 
                                            ? `캠페인 종료 후 ${report?.dayPassed || 0}일이 경과되었습니다.`
                                            : `캠페인 종료까지 ${report?.dayPassed || 0}일 남았습니다.`
                                        }
                                    </p>
                                    <p className="text-sm text-gray-400 mt-1 font-medium">
                                        {report?.isPassed 
                                            ? "최종 보고서가 아직 등록되지 않았습니다."
                                            : "캠페인 종료 후 최종 보고서가 게시될 예정입니다."
                                        }
                                    </p>
                                </section>
                            )}

                            {/* 1. 정산 기록 (순서 변경: 정산 먼저) */}
                            {settlement && (
                                <section>
                                    <h3 className="text-base font-black text-gray-500 mb-3 uppercase tracking-wider">정산 내역</h3>
                                    <div className="border-2 rounded-xl divide-y overflow-hidden shadow-sm">
                                        <div className="flex justify-between p-4 text-sm bg-gray-50/50">
                                            <span className="text-gray-500 font-medium">정산 일시</span>
                                            <span className="font-bold text-gray-900">{formatDate(settlement.settledAt)}</span>
                                        </div>
                                        <div className="flex justify-between p-4 text-sm">
                                            <span className="text-gray-500 font-medium">단체 수령액</span>
                                            <span className="font-bold text-gray-900">{formatAmount(settlement.foundationAmount)}</span>
                                        </div>
                                        <div className="flex justify-between p-4 text-sm">
                                            <span className="text-gray-500 font-medium">수혜자 수령액</span>
                                            <span className="font-bold text-primary text-base">{formatAmount(settlement.beneficiaryAmount)}</span>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* 2. 최종 보고서 기록 (순서 변경: 보고서 나중) */}
                            {report?.isExist && report.reportData && (
                                <section>
                                    <h3 className="text-base font-black text-gray-500 mb-3 uppercase tracking-wider">최종 보고서</h3>
                                    <div className="bg-white border-2 border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                        <div className="p-6">
                                            <h4 className="font-black text-gray-900 text-lg mb-2 leading-snug">
                                                {report.reportData.title}
                                            </h4>
                                            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-5">
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
                                </section>
                            )}

                            {/* 데이터가 아예 없는 경우 */}
                            {!report?.isExist && !settlement && (
                                <div className="text-center py-10 text-gray-400 text-sm font-medium">
                                    등록된 트래킹 기록이 없습니다.
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
