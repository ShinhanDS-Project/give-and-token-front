import { X, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';

function formatAmount(amount) {
    if (amount == null) return '-';
    return `${Number(amount).toLocaleString()}원`;
}

function formatDate(dateValue) {
    if (!dateValue) return '-';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return dateValue;
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export default function MicroTrackingModal({ isOpen, onClose, trackingData, isLoading }) {
    if (!isOpen) return null;

    const report = trackingData?.UserfinalReportDTO;
    const settlement = trackingData?.UsersettlementDTO;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto">
                {/* 헤더 */}
                <div className="flex justify-between items-center p-6 border-b border-line">
                    <div className="flex items-center gap-2">
                        <FileText size={20} className="text-primary" />
                        <h2 className="text-xl font-black text-ink">마이크로 트래킹</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full text-ink/80 hover:text-ink hover:bg-surface transition-colors"
                    >
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {isLoading ? (
                        <div className="text-center py-16">
                            <p className="font-bold text-ink/40">트래킹 데이터를 불러오는 중...</p>
                        </div>
                    ) : !trackingData ? (
                        <div className="text-center py-16">
                            <p className="font-bold text-ink/40">데이터를 불러올 수 없습니다.</p>
                        </div>
                    ) : (
                        <>
                            {/* 최종 보고서 섹션 */}
                            <section>
                                

                                {!report?.isPassed ? (
                                    /* 캠페인 진행 중 */
                                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                        <Clock size={20} className="text-blue-400 shrink-0" />
                                        <div>
                                            <p className="font-bold text-blue-700">캠페인 진행 중</p>
                                            <p className="text-sm text-blue-500">종료까지 <span className="font-black">{report?.dayPassed ?? '-'}일</span> 남았습니다.</p>
                                        </div>
                                    </div>
                                ) : report?.isExist ? (
                                    /* 보고서 있음 */
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-black text-ink/40 uppercase tracking-widest mb-3">최종 보고서</h3>
                                        <div className="flex items-center gap-2 text-emerald-600">
                                            <CheckCircle size={18} />
                                            <span className="text-sm font-bold">종료 후 {report.dayPassed}일 경과 · 보고서 제출 완료</span>
                                        </div>
                                        <div className="p-4 bg-surface rounded-xl border border-line space-y-2">
                                            <p className="font-black text-ink">{report.reportData?.title}</p>
                                            <p className="text-sm text-ink/60 leading-relaxed whitespace-pre-wrap">{report.reportData?.content}</p>
                                            {report.reportData?.reportFileUrl && (
                                                <a
                                                    href={report.reportData.reportFileUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-block text-xs font-bold text-primary hover:underline mt-1"
                                                >
                                                    보고서 파일 보기 →
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    /* 종료됐는데 보고서 없음 */
                                    <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                                        <AlertCircle size={20} className="text-amber-400 shrink-0" />
                                        <div>
                                            <p className="font-bold text-amber-700">보고서 미제출</p>
                                            <p className="text-sm text-amber-500">종료 후 <span className="font-black">{report?.dayPassed ?? '-'}일</span> 경과, 아직 제출되지 않았습니다.</p>
                                        </div>
                                    </div>
                                )}
                            </section>

                            {/* 정산 섹션 */}
                            {settlement?.settlementStatus === 'COMPLETED' && (
                                <section>
                                    <h3 className="text-sm font-black text-ink/40 uppercase tracking-widest mb-3">정산 내역</h3>
                                    <div className="p-4 bg-surface rounded-xl border border-line space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-ink/50 font-medium">정산일</span>
                                            <span className="font-bold text-ink">{formatDate(settlement.settledAt)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-ink/50 font-medium">단체 수령액</span>
                                            <span className="font-bold text-ink">{formatAmount(settlement.foundationAmount)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-ink/50 font-medium">수혜자 수령액</span>
                                            <span className="font-bold text-ink">{formatAmount(settlement.beneficiaryAmount)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm pt-2 border-t border-line">
                                            <span className="text-ink/50 font-medium">정산 상태</span>
                                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 text-xs font-black">완료</span>
                                        </div>
                                    </div>
                                </section>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
