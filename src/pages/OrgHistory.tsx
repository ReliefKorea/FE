import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getOrg, getOrgHistory } from '../api'
import {
  disasterTypeLabels, disasterTypeIcons,
} from '../data/mockData'
import type { DonationRecord, OrganizationAction } from '../types'

const trustConfig = {
  strong: { label: '근거 충분', color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
  moderate: { label: '근거 보통', color: '#38bdf8', bg: 'rgba(56,189,248,0.1)' },
  limited: { label: '근거 제한', color: '#facc15', bg: 'rgba(250,204,21,0.1)' },
  needs_review: { label: '근거 약함', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
} as const

const spendingDecisionConfig = {
  strong: {
    label: '사용처 판단 쉬움',
    color: '#4ade80',
    bg: 'rgba(74,222,128,0.1)',
    description: '공개 수치와 근거 링크가 충분해 후원금 사용 흐름을 비교적 명확히 확인할 수 있습니다.',
  },
  moderate: {
    label: '사용처 근거 보통',
    color: '#38bdf8',
    bg: 'rgba(56,189,248,0.1)',
    description: '후원금 사용 목적과 일부 공개 지표가 확인되어 기본 판단이 가능합니다.',
  },
  limited: {
    label: '사용처 근거 제한',
    color: '#facc15',
    bg: 'rgba(250,204,21,0.1)',
    description: '공개 근거는 있으나 금액, 수혜 규모, 사용처 지표가 충분하지 않습니다.',
  },
  needs_review: {
    label: '공개 지표 부족',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.1)',
    description: '후원금 사용을 판단할 공개 수치와 근거 링크가 부족합니다.',
  },
} as const

function beneficiaryUnit(label?: string) {
  if (!label) return '명'
  if (label.includes('세대')) return '세대'
  return ''
}

function parseWonAmount(amount?: string) {
  if (!amount) return 0
  const digits = amount.replace(/[^\d]/g, '')
  return digits ? Number(digits) : 0
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }) + ' KST'
}

function getSpendingDecision(org: OrganizationAction, records: DonationRecord[]) {
  const trustScore = org.trust_score ?? 0
  const evidenceCount = (org.evidence_sources?.length ?? 0) + records.filter(record => record.evidence_url).length
  const hasPublicMoneyUse = records.some(record => record.amount || record.beneficiaries) || Boolean(org.finance_summary)

  if (trustScore >= 75 && evidenceCount >= 3 && hasPublicMoneyUse) return spendingDecisionConfig.strong
  if (trustScore >= 60 && evidenceCount >= 1 && hasPublicMoneyUse) return spendingDecisionConfig.moderate
  if (trustScore >= 35 && (evidenceCount > 0 || hasPublicMoneyUse)) return spendingDecisionConfig.limited
  return spendingDecisionConfig.needs_review
}

export default function OrgHistory() {
  const { orgId } = useParams()
  const navigate = useNavigate()
  const [org, setOrg] = useState<OrganizationAction | null>(null)
  const [records, setRecords] = useState<DonationRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadOrgHistory() {
      if (!orgId) {
        setOrg(null)
        setRecords([])
        setError('단체를 찾을 수 없습니다')
        setIsLoading(false)
        return
      }

      setIsLoading(true)

      try {
        const [nextOrg, nextRecords] = await Promise.all([
          getOrg(orgId),
          getOrgHistory(orgId),
        ])

        if (cancelled) return
        setOrg(nextOrg)
        setRecords(nextRecords)
        setError(null)
      } catch (loadError) {
        if (!cancelled) {
          setOrg(null)
          setRecords([])
          setError(loadError instanceof Error && loadError.message === 'Organization not found'
            ? '단체를 찾을 수 없습니다'
            : '단체 후원 기록을 불러오지 못했습니다')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadOrgHistory()

    return () => {
      cancelled = true
    }
  }, [orgId])

  if (isLoading) {
    return (
      <div style={{ background: '#080b14', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e2e8f0' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, marginBottom: 12 }}>후원 기록을 불러오는 중입니다</div>
          <button onClick={() => navigate(-1)} style={s.backBtn}>← 뒤로 가기</button>
        </div>
      </div>
    )
  }

  if (error || !org) {
    return (
      <div style={{ background: '#080b14', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e2e8f0' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <div style={{ fontSize: 20, marginBottom: 12 }}>{error ?? '단체를 찾을 수 없습니다'}</div>
          <button onClick={() => navigate(-1)} style={s.backBtn}>← 뒤로 가기</button>
        </div>
      </div>
    )
  }

  const totalAmount = records.reduce((sum, r) => sum + parseWonAmount(r.amount), 0)
  const beneficiaryRecords = records.filter(r => typeof r.beneficiaries === 'number')
  const totalBeneficiaries = beneficiaryRecords
    .reduce((sum, r) => sum + (r.beneficiaries ?? 0), 0)
  const beneficiaryLabels = new Set(beneficiaryRecords.map(r => r.beneficiaries_label ?? '수혜 인원'))
  const hasMixedBeneficiaryMetrics = beneficiaryLabels.size > 1
  const totalBeneficiariesLabel = hasMixedBeneficiaryMetrics
    ? '공개 규모 항목'
    : beneficiaryRecords[0]?.beneficiaries_label
  const totalBeneficiariesUnit = beneficiaryUnit(totalBeneficiariesLabel)
  const beneficiaryStatValue = hasMixedBeneficiaryMetrics
    ? `${beneficiaryRecords.length}건`
    : `${totalBeneficiaries.toLocaleString()}${totalBeneficiariesUnit}`
  const oldestRecordYear = records.length > 0
    ? new Date(records[records.length - 1].date).getFullYear()
    : null
  const activityStartYear = oldestRecordYear ? `${oldestRecordYear}년~` : '-'
  const evidenceCount = (org.evidence_sources?.length ?? 0) + records.filter(record => record.evidence_url).length
  const moneyUseRecords = records.filter(record => record.amount || record.beneficiaries).length
  const spendingDecision = getSpendingDecision(org, records)
  const ragRunAt = org.ai_report_id ? org.report_generated_at : undefined

  return (
    <div style={s.root}>
      {/* 헤더 */}
      <header style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.logo} onClick={() => navigate('/')}>
            <span style={s.logoIcon}>⊕</span>
            <span style={s.logoText}>Relief Korea</span>
          </div>
          <nav style={s.navTabs}>
            <button style={s.navTab} onClick={() => navigate('/map')}>🗺️ Live Map</button>
            <button style={s.navTab} onClick={() => navigate('/admin')}>⚙️ Operator Console</button>
          </nav>
        </div>
        <div style={s.headerRight}>
          <div style={s.avatar}>👤</div>
        </div>
      </header>

      {/* 히어로 */}
      <div style={s.hero}>
        <img
          src={`https://picsum.photos/seed/${orgId}-hero/1600/280`}
          alt=""
          style={s.heroBg}
        />
        <div style={s.heroOverlay} />
        <div style={s.heroContent}>
          <button onClick={() => navigate(-1)} style={s.backBtn}>← 뒤로 가기</button>
          <div style={s.heroMeta}>🤖 AI 후원 히스토리</div>
          <h1 style={s.heroTitle}>{org.org_name}</h1>
          <div style={s.heroSub}>{org.activity_region} · {org.activity_type}</div>
          <div style={s.heroBadgeRow}>
            {org.verified_by_admin && (
              <div style={s.heroBadge}>✓ 공식 채널 확인</div>
            )}
            {org.trust_level && (
              <div
                style={{
                  ...s.heroTrustBadge,
                  color: trustConfig[org.trust_level].color,
                  background: trustConfig[org.trust_level].bg,
                  border: `1px solid ${trustConfig[org.trust_level].color}44`,
                }}
              >
                {trustConfig[org.trust_level].label}
                {typeof org.trust_score === 'number' ? ` ${org.trust_score}` : ''}
              </div>
            )}
            {ragRunAt && (
              <div style={s.heroRagBadge}>RAG 마지막 실행 {formatDateTime(ragRunAt)}</div>
            )}
          </div>
        </div>
      </div>

      {/* 통계 바 */}
      <div style={s.statsBar}>
        <div style={s.statItem}>
          <div style={s.statValue}>{records.length}건</div>
          <div style={s.statLabel}>총 후원 활동</div>
        </div>
        <div style={s.statDivider} />
        <div style={s.statItem}>
          <div style={s.statValue}>₩{totalAmount.toLocaleString()}</div>
          <div style={s.statLabel}>공개 금액 지표</div>
        </div>
        <div style={s.statDivider} />
        <div style={s.statItem}>
          <div style={s.statValue}>{beneficiaryStatValue}</div>
          <div style={s.statLabel}>{totalBeneficiariesLabel ? '공개 규모 지표' : '수혜·참여 지표'}</div>
        </div>
        <div style={s.statDivider} />
        <div style={s.statItem}>
          <div style={s.statValue}>{activityStartYear}</div>
          <div style={s.statLabel}>활동 시작</div>
        </div>
      </div>

      {/* 본문 */}
      <div style={s.body}>
        <div style={s.decisionCard}>
          <div style={s.decisionTop}>
            <div>
              <div style={s.decisionEyebrow}>후원금 사용 판단</div>
              <div style={{ ...s.decisionLabel, color: spendingDecision.color }}>{spendingDecision.label}</div>
            </div>
            <div style={{ ...s.decisionScore, color: spendingDecision.color, background: spendingDecision.bg }}>
              {typeof org.trust_score === 'number' ? `${org.trust_score}/100` : 'N/A'}
            </div>
          </div>
          <p style={s.decisionDesc}>{spendingDecision.description}</p>
          <div style={s.decisionGrid}>
            <div style={s.decisionMetric}>
              <span style={s.decisionMetricLabel}>사용처 지표</span>
              <strong style={s.decisionMetricValue}>{moneyUseRecords}건</strong>
            </div>
            <div style={s.decisionMetric}>
              <span style={s.decisionMetricLabel}>근거 링크</span>
              <strong style={s.decisionMetricValue}>{evidenceCount}개</strong>
            </div>
            <div style={s.decisionMetric}>
              <span style={s.decisionMetricLabel}>후원 채널</span>
              <strong style={s.decisionMetricValue}>{org.donation_link ? '확인' : '없음'}</strong>
            </div>
          </div>
        </div>

        {/* AI 분석 */}
        <div style={s.aiCard}>
          <div style={s.aiCardHeader}>
            <span style={s.aiIcon}>🤖</span>
            <span style={s.aiTitle}>AI 근거 분석 리포트</span>
            <span style={s.aiBadge}>Beta</span>
            {ragRunAt && <span style={s.aiRunAt}>{formatDateTime(ragRunAt)} 기준</span>}
          </div>
          <p style={s.aiText}>
            {org.report_summary ?? org.ai_message ?? `${org.org_name}은(는) 재난 현장 지원 단체로 등록되어 있습니다. AI가 활동 근거와 후원 채널을 분석해 요약했습니다.`}
          </p>
          {org.finance_summary && (
            <div style={s.aiSubBlock}>
              <div style={s.aiSubTitle}>돈이 쓰이는 흐름</div>
              <div style={s.aiSubText}>{org.finance_summary}</div>
            </div>
          )}
          {org.risk_notes && (
            <div style={s.aiSubBlock}>
              <div style={s.aiSubTitle}>확인 기준</div>
              <div style={s.aiSubText}>{org.risk_notes}</div>
            </div>
          )}
          {org.evidence_sources && org.evidence_sources.length > 0 && (
            <div style={s.evidencePanel}>
              {org.evidence_sources.map((source, index) => (
                <a
                  key={`${source.url}-${index}`}
                  href={source.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={s.evidenceLink}
                  onClick={event => {
                    if (!source.url) event.preventDefault()
                  }}
                >
                  근거 {index + 1}. {source.title}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* 타임라인 */}
        <div style={s.timelineSection}>
          <div style={s.sectionTitle}>후원 활동 기록</div>
          {records.length === 0 ? (
            <div style={{ color: '#475569', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>
              등록된 후원 기록이 없습니다
            </div>
          ) : (
            <div style={s.timeline}>
              {records.map((rec, idx) => (
                <div key={rec.record_id} style={s.timelineItem}>
                  <div style={s.timelineDot}>
                    <span style={{ fontSize: 14 }}>
                      {rec.disaster_type ? disasterTypeIcons[rec.disaster_type] : '🤝'}
                    </span>
                  </div>
                  {idx < records.length - 1 && <div style={s.timelineLine} />}
                  <div style={s.timelineCard}>
                    <div style={s.timelineCardTop}>
                      <div style={s.timelineDate}>{rec.date}</div>
                      {rec.disaster_type && (
                        <span style={s.disasterBadge}>
                          {disasterTypeLabels[rec.disaster_type]}
                        </span>
                      )}
                    </div>
                    <div style={s.timelineTitle}>{rec.title}</div>
                    <div style={s.timelineRegion}>📍 {rec.region}</div>
                    <p style={s.timelineDesc}>{rec.description}</p>
                    <div style={s.timelineStats}>
                      {rec.amount && (
                        <div style={s.timelineStat}>
                          <span style={s.timelineStatLabel}>후원금</span>
                          <span style={s.timelineStatValue}>{rec.amount}</span>
                        </div>
                      )}
                      {rec.beneficiaries && (
                        <div style={s.timelineStat}>
                          <span style={s.timelineStatLabel}>{rec.beneficiaries_label ?? '수혜 인원'}</span>
                          <span style={s.timelineStatValue}>{rec.beneficiaries.toLocaleString()}{beneficiaryUnit(rec.beneficiaries_label)}</span>
                        </div>
                      )}
                    </div>
                    {rec.evidence_url && (
                      <a href={rec.evidence_url} target="_blank" rel="noopener noreferrer" style={s.timelineEvidenceLink}>
                        근거: {rec.evidence_title ?? rec.evidence_source ?? '공개 자료'} ↗
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <footer style={s.footer}>
        <span style={{ color: '#334155', fontSize: 11 }}>© 2026 Relief Korea. Real-time KMA Integration active.</span>
        <div style={{ display: 'flex', gap: 20 }}>
          <span style={s.footerLink}>Privacy Policy</span>
          <span style={s.footerLink}>Data Sources</span>
        </div>
      </footer>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  root: { display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#080b14', color: '#e2e8f0', fontFamily: "'Segoe UI', system-ui, sans-serif" },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 56, background: '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 24 },
  logo: { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' },
  logoIcon: { width: 28, height: 28, background: 'rgba(22,163,74,0.2)', border: '1px solid rgba(22,163,74,0.4)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#4ade80' },
  logoText: { color: '#4ade80', fontWeight: 700, fontSize: 15 },
  navTabs: { display: 'flex', gap: 4 },
  navTab: { background: 'none', border: 'none', color: '#64748b', fontSize: 13, padding: '6px 14px', borderRadius: 6, cursor: 'pointer' },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
  avatar: { width: 32, height: 32, borderRadius: '50%', background: '#1e293b', border: '2px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 },
  hero: { position: 'relative', height: 280, flexShrink: 0, overflow: 'hidden' },
  heroBg: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  heroOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(8,11,20,0.93) 45%, rgba(8,11,20,0.55) 100%)' },
  heroContent: { position: 'relative', zIndex: 1, padding: '28px 40px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  backBtn: { background: 'none', border: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 16 },
  heroMeta: { fontSize: 12, color: '#4ade80', fontWeight: 600, letterSpacing: 1, marginBottom: 8 },
  heroTitle: { fontSize: 34, fontWeight: 900, color: '#f1f5f9', margin: '0 0 8px', letterSpacing: 0.3 },
  heroSub: { fontSize: 14, color: '#94a3b8', marginBottom: 12 },
  heroBadgeRow: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  heroBadge: { display: 'inline-block', fontSize: 12, color: '#4ade80', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 20, padding: '4px 12px', fontWeight: 600 },
  heroTrustBadge: { display: 'inline-block', fontSize: 12, borderRadius: 20, padding: '4px 12px', fontWeight: 700 },
  heroRagBadge: { display: 'inline-block', fontSize: 12, color: '#c4b5fd', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 20, padding: '4px 12px', fontWeight: 700 },
  statsBar: { display: 'flex', alignItems: 'center', background: '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 40px', flexShrink: 0 },
  statItem: { padding: '18px 32px', textAlign: 'center' },
  statValue: { fontSize: 20, fontWeight: 800, color: '#e2e8f0', marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#475569', letterSpacing: 0.5 },
  statDivider: { width: 1, height: 40, background: 'rgba(255,255,255,0.07)' },
  body: { flex: 1, maxWidth: 860, width: '100%', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 28 },
  decisionCard: { background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '18px 22px', boxShadow: '0 18px 50px rgba(0,0,0,0.18)' },
  decisionTop: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 10 },
  decisionEyebrow: { fontSize: 11, color: '#64748b', fontWeight: 800, letterSpacing: 1, marginBottom: 5 },
  decisionLabel: { fontSize: 24, fontWeight: 900, letterSpacing: 0 },
  decisionScore: { borderRadius: 8, padding: '8px 12px', fontSize: 15, fontWeight: 900, whiteSpace: 'nowrap' },
  decisionDesc: { fontSize: 13, color: '#cbd5e1', lineHeight: 1.65, margin: '0 0 14px' },
  decisionGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 },
  decisionMetric: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '10px 12px', minWidth: 0 },
  decisionMetricLabel: { display: 'block', fontSize: 11, color: '#64748b', marginBottom: 4 },
  decisionMetricValue: { display: 'block', fontSize: 15, color: '#e2e8f0', overflowWrap: 'anywhere' },
  aiCard: { background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 14, padding: '20px 24px' },
  aiCardHeader: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  aiIcon: { fontSize: 18 },
  aiTitle: { fontSize: 14, fontWeight: 700, color: '#a5b4fc' },
  aiBadge: { fontSize: 10, color: '#4ade80', background: 'rgba(22,163,74,0.15)', border: '1px solid rgba(22,163,74,0.3)', borderRadius: 4, padding: '2px 7px', fontWeight: 600 },
  aiRunAt: { fontSize: 11, color: '#94a3b8', marginLeft: 'auto' },
  aiText: { fontSize: 14, color: '#cbd5e1', lineHeight: 1.8, margin: 0 },
  aiSubBlock: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px', marginTop: 12 },
  aiSubTitle: { fontSize: 12, color: '#94a3b8', fontWeight: 700, marginBottom: 5 },
  aiSubText: { fontSize: 13, color: '#94a3b8', lineHeight: 1.6 },
  evidencePanel: { display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 },
  evidenceLink: { fontSize: 12, color: '#818cf8', textDecoration: 'none', overflowWrap: 'anywhere' },
  timelineSection: {},
  sectionTitle: { fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 20 },
  timeline: { display: 'flex', flexDirection: 'column', gap: 0 },
  timelineItem: { display: 'flex', gap: 16, position: 'relative' },
  timelineDot: { width: 40, height: 40, borderRadius: '50%', background: '#111827', border: '2px solid rgba(22,163,74,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 },
  timelineLine: { position: 'absolute', left: 19, top: 40, bottom: -24, width: 2, background: 'rgba(22,163,74,0.2)' },
  timelineCard: { flex: 1, background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '16px 20px', marginBottom: 24 },
  timelineCardTop: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
  timelineDate: { fontSize: 12, color: '#475569' },
  disasterBadge: { fontSize: 11, color: '#4ade80', background: 'rgba(22,163,74,0.12)', border: '1px solid rgba(22,163,74,0.25)', borderRadius: 4, padding: '2px 8px' },
  timelineTitle: { fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 },
  timelineRegion: { fontSize: 12, color: '#64748b', marginBottom: 10 },
  timelineDesc: { fontSize: 13, color: '#94a3b8', lineHeight: 1.7, margin: '0 0 14px' },
  timelineStats: { display: 'flex', gap: 20 },
  timelineStat: { display: 'flex', flexDirection: 'column', gap: 2 },
  timelineStatLabel: { fontSize: 10, color: '#475569', letterSpacing: 0.5 },
  timelineStatValue: { fontSize: 14, fontWeight: 700, color: '#4ade80' },
  timelineEvidenceLink: { display: 'inline-block', marginTop: 12, fontSize: 12, color: '#818cf8', textDecoration: 'none', overflowWrap: 'anywhere' },
  footer: { padding: '12px 28px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0d1117', flexShrink: 0 },
  footerLink: { fontSize: 11, color: '#334155', cursor: 'pointer' },
}
