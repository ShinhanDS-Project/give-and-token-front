import React, { useState, useEffect } from "react";
import FoundationProfileCard from "../components/FoundationProfileCard";

/**
 * TestCampaignPage - 캠페인 상세 + FoundationProfileCard 연결 테스트용 상세 페이지.
 *
 * 고정 테스트 대상: 캠페인 No.472
 *
 * API 호출 순서:
 *   1. GET /api/foundation/campaigns/472/detail  → CampaignDetailResponseDTO
 *   2. GET /api/foundation/{foundationNo}         → FoundationDetailResponseDTO  (캠페인 내 foundationNo 사용)
 *
 * 레이아웃 구성:
 *   [캠페인 헤더]  제목 / 상태 / 진행률
 *   [캠페인 정보]  기간 / 금액 / 지갑 / 사용계획
 *   [단체 프로필]  FoundationProfileCard (핵심 확인 대상)
 *   [캠페인 설명]  description / historyTitle / historyDescription
 *   [이미지]       대표 이미지 / 상세 이미지 목록
 *   [디버그]       원본 API 응답 JSON
 */

const CAMPAIGN_NO = 472;

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
  return res.json();
}

// ── 작은 헬퍼 ──────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2
        style={{
          fontSize: 14,
          fontWeight: 800,
          color: "#64748b",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 12,
          paddingBottom: 8,
          borderBottom: "2px solid #f1f5f9",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({ label, value }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div>
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#94a3b8",
          marginBottom: 3,
        }}
      >
        {label}
      </p>
      <p style={{ fontSize: 14, color: "#1e293b", fontWeight: 600, margin: 0 }}>
        {String(value)}
      </p>
    </div>
  );
}

function ProgressBar({ percent }) {
  const pct = Math.min(100, Math.max(0, percent || 0));
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: "#3b82f6" }}>
          {pct}% 달성
        </span>
        <span style={{ fontSize: 12, color: "#94a3b8" }}>서버 계산값</span>
      </div>
      <div
        style={{
          height: 10,
          background: "#e2e8f0",
          borderRadius: 99,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: "#3b82f6",
            borderRadius: 99,
            transition: "width 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}

function StatusChip({ label, type }) {
  const styles = {
    ACTIVE: { background: "#dbeafe", color: "#1d4ed8" },
    RECRUITING: { background: "#dcfce7", color: "#15803d" },
    ENDED: { background: "#fee2e2", color: "#b91c1c" },
    APPROVED: { background: "#dcfce7", color: "#15803d" },
    PENDING: { background: "#fef9c3", color: "#a16207" },
    REJECTED: { background: "#fee2e2", color: "#b91c1c" },
    SETTLED: { background: "#ede9fe", color: "#7c3aed" },
    COMPLETED: { background: "#d1fae5", color: "#065f46" },
    CANCELLED: { background: "#f1f5f9", color: "#64748b" },
  };
  const s = styles[label] || { background: "#f1f5f9", color: "#475569" };
  return (
    <span
      style={{
        padding: "3px 10px",
        borderRadius: 99,
        fontSize: 12,
        fontWeight: 700,
        ...s,
      }}
    >
      {label}
    </span>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────────────

export default function TestCampaignPage() {
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const campaignData = await fetchJson(
          `/api/foundation/campaigns/${CAMPAIGN_NO}/detail`,
        );
        if (cancelled) return;
        setCampaign(campaignData);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ── 로딩 / 에러 ────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
        <p style={{ fontSize: 16, fontWeight: 700 }}>
          캠페인 #{CAMPAIGN_NO} 불러오는 중...
        </p>
        <p style={{ fontSize: 12, marginTop: 8 }}>
          GET /api/foundation/campaigns/{CAMPAIGN_NO}/detail
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 40, maxWidth: 600, margin: "0 auto" }}>
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 12,
            padding: 24,
          }}
        >
          <p
            style={{
              fontWeight: 800,
              color: "#b91c1c",
              fontSize: 16,
              marginBottom: 8,
            }}
          >
            API 호출 실패
          </p>
          <p style={{ fontSize: 13, color: "#7f1d1d", marginBottom: 16 }}>
            {error}
          </p>
          <p style={{ fontSize: 12, color: "#94a3b8" }}>
            백엔드 서버가 실행 중인지 확인하세요 (포트 8090). vite.config.js의
            프록시 포트가 8080으로 되어 있으면 8090으로 수정이 필요합니다.
          </p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
        캠페인 데이터 없음
      </div>
    );
  }

  // ── 렌더 ────────────────────────────────────────────────────

  return (
    <div
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: 32,
        fontFamily: "sans-serif",
      }}
    >
      {/* 테스트 페이지 배너 */}
      <div
        style={{
          background: "#fef9c3",
          border: "1px solid #fde68a",
          borderRadius: 10,
          padding: "8px 16px",
          marginBottom: 24,
          fontSize: 12,
          color: "#92400e",
          fontWeight: 600,
        }}
      >
        [TEST] FoundationProfileCard 데이터 연결 확인 페이지 — 캠페인 #
        {CAMPAIGN_NO} 고정
      </div>

      {/* ── 캠페인 헤더 ──────────────────────────────────────── */}
      <Section title="캠페인 헤더">
        {/* 대표 이미지 */}
        {campaign.representativeImagePath && (
          <div
            style={{
              marginBottom: 16,
              borderRadius: 12,
              overflow: "hidden",
              maxHeight: 320,
            }}
          >
            <img
              src={campaign.representativeImagePath}
              alt="대표 이미지"
              style={{ width: "100%", objectFit: "cover", display: "block" }}
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <h1
            style={{
              fontSize: 24,
              fontWeight: 900,
              color: "#0f172a",
              margin: 0,
              flex: 1,
            }}
          >
            {campaign.title}
          </h1>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <StatusChip label={campaign.approvalStatus} />
            <StatusChip label={campaign.campaignStatus} />
          </div>
        </div>

        {campaign.campaignStatusLabel && (
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
            {campaign.campaignStatusLabel}
          </p>
        )}

        {/* 카테고리 */}
        {campaign.category && (
          <span
            style={{
              display: "inline-block",
              padding: "3px 10px",
              background: "#ede9fe",
              color: "#6d28d9",
              borderRadius: 99,
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 20,
            }}
          >
            {campaign.category}
          </span>
        )}

        {/* 진행률 */}
        <ProgressBar percent={campaign.progressPercent} />
      </Section>

      {/* ── 금액 / 기간 / 지갑 ───────────────────────────────── */}
      <Section title="캠페인 수치 정보">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              background: "#f8fafc",
              borderRadius: 10,
              padding: 16,
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: 11,
                color: "#94a3b8",
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              목표 금액
            </p>
            <p style={{ fontSize: 18, fontWeight: 900, color: "#0f172a" }}>
              {campaign.targetAmount?.toLocaleString()}원
            </p>
          </div>
          <div
            style={{
              background: "#eff6ff",
              borderRadius: 10,
              padding: 16,
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: 11,
                color: "#94a3b8",
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              현재 모금액
            </p>
            <p style={{ fontSize: 18, fontWeight: 900, color: "#3b82f6" }}>
              {campaign.currentAmount?.toLocaleString()}원
            </p>
          </div>
          <div
            style={{
              background: "#f0fdf4",
              borderRadius: 10,
              padding: 16,
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: 11,
                color: "#94a3b8",
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              달성률
            </p>
            <p style={{ fontSize: 18, fontWeight: 900, color: "#16a34a" }}>
              {campaign.progressPercent}%
            </p>
          </div>
          <div
            style={{
              background: "#fef9c3",
              borderRadius: 10,
              padding: 16,
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: 11,
                color: "#94a3b8",
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              남은 일수
            </p>
            <p style={{ fontSize: 18, fontWeight: 900, color: "#d97706" }}>
              {campaign.daysLeft}일
            </p>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
          }}
        >
          <Field
            label="모금 시작"
            value={
              campaign.startAt
                ? new Date(campaign.startAt).toLocaleDateString("ko-KR")
                : null
            }
          />
          <Field
            label="모금 종료"
            value={
              campaign.endAt
                ? new Date(campaign.endAt).toLocaleDateString("ko-KR")
                : null
            }
          />
          <Field
            label="잔여 금액"
            value={
              campaign.remainingAmount != null
                ? `${campaign.remainingAmount.toLocaleString()}원`
                : null
            }
          />
          <Field
            label="사용 시작일"
            value={
              campaign.usageStartAt
                ? new Date(campaign.usageStartAt).toLocaleDateString("ko-KR")
                : null
            }
          />
          <Field
            label="사용 종료일"
            value={
              campaign.usageEndAt
                ? new Date(campaign.usageEndAt).toLocaleDateString("ko-KR")
                : null
            }
          />
          <Field label="지갑 주소" value={campaign.walletAddress} />
        </div>
      </Section>

      {/* ── FoundationProfileCard (핵심 확인 대상) ────────────── */}
      <Section title="기부단체 프로필 (FoundationProfileCard)">
        {/*[가빈] 이것처럼 캠페인 상세 보기 페이지 DTO로 넘어온 기부단체 키값을 변수로 넘겨 줌.*/}
        <FoundationProfileCard foundation={campaign.foundation} />
      </Section>

      {/* ── 사용 계획 ────────────────────────────────────────── */}
      {campaign.usePlans && campaign.usePlans.length > 0 && (
        <Section title={`사용 계획 (${campaign.usePlans.length}건)`}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {campaign.usePlans.map((plan, i) => (
              <div
                key={plan.usePlanNo || i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 16px",
                  border: "1px solid #f1f5f9",
                  borderRadius: 10,
                  background: "#f8fafc",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{ fontSize: 11, fontWeight: 700, color: "#1e293b" }}
                  >
                    #{plan.usePlanNo}
                  </span>
                  <span style={{ fontSize: 14, color: "#1e293b" }}>
                    {plan.planContent}
                  </span>
                </div>
                <span
                  style={{ fontSize: 14, fontWeight: 700, color: "#3b82f6" }}
                >
                  {plan.planAmount?.toLocaleString()}원
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── 캠페인 설명 ─────────────────────────────────────── */}
      <Section title="캠페인 설명">
        {campaign.historyTitle && (
          <h3
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: "#0f172a",
              marginBottom: 8,
            }}
          >
            {campaign.historyTitle}
          </h3>
        )}
        {campaign.historyDescription && (
          <p
            style={{
              fontSize: 14,
              color: "#64748b",
              lineHeight: 1.7,
              marginBottom: 16,
              whiteSpace: "pre-wrap",
            }}
          >
            {campaign.historyDescription}
          </p>
        )}
        {campaign.description && (
          <p
            style={{
              fontSize: 14,
              color: "#475569",
              lineHeight: 1.8,
              whiteSpace: "pre-wrap",
            }}
          >
            {campaign.description}
          </p>
        )}
      </Section>

      {/* ── 상세 이미지 ─────────────────────────────────────── */}
      {campaign.detailImagePaths && campaign.detailImagePaths.length > 0 && (
        <Section title={`상세 이미지 (${campaign.detailImagePaths.length}장)`}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
            }}
          >
            {campaign.detailImagePaths.map((path, i) => (
              <img
                key={i}
                src={path}
                alt={`상세 이미지 ${i + 1}`}
                style={{
                  width: "100%",
                  borderRadius: 10,
                  border: "1px solid #f1f5f9",
                }}
                referrerPolicy="no-referrer"
              />
            ))}
          </div>
        </Section>
      )}

      {/* ── 원본 API 응답 (디버그) ──────────────────────────── */}
      <Section title="원본 API 응답 (디버그)">
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          <details open>
            <summary
              style={{
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 700,
                color: "#64748b",
                padding: "8px 0",
                marginBottom: 8,
              }}
            >
              CampaignDetailResponseDTO (campaign)
            </summary>
            <pre
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: 12,
                fontSize: 11,
                overflow: "auto",
                maxHeight: 400,
                margin: 0,
              }}
            >
              {JSON.stringify(campaign, null, 2)}
            </pre>
          </details>
          <details open>
            <summary
              style={{
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 700,
                color: "#64748b",
                padding: "8px 0",
                marginBottom: 8,
              }}
            >
              FoundationSummary (campaign.foundation)
            </summary>
            <pre
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: 12,
                fontSize: 11,
                overflow: "auto",
                maxHeight: 400,
                margin: 0,
              }}
            >
              {JSON.stringify(campaign.foundation, null, 2)}
            </pre>
          </details>
        </div>
      </Section>
    </div>
  );
}
