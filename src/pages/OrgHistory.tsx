import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getOrg, getOrgHistory } from '../api'
import {
  disasterTypeLabels, disasterTypeIcons,
} from '../data/mockData'
import type { DonationRecord, OrganizationAction } from '../types'

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

  const totalAmount = records
    .filter(r => r.amount)
    .reduce((sum, r) => sum + parseInt(r.amount!.replace(/[₩,]/g, '')), 0)
  const totalBeneficiaries = records
    .filter(r => r.beneficiaries)
    .reduce((sum, r) => sum + (r.beneficiaries ?? 0), 0)
  const oldestRecordYear = records.length > 0
    ? new Date(records[records.length - 1].date).getFullYear()
    : null
  const activityStartYear = oldestRecordYear ? `${oldestRecordYear}년~` : '-'

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
          {org.verified_by_admin && (
            <div style={s.heroBadge}>✓ 관리자 인증 단체</div>
          )}
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
          <div style={s.statLabel}>누적 후원금</div>
        </div>
        <div style={s.statDivider} />
        <div style={s.statItem}>
          <div style={s.statValue}>{totalBeneficiaries.toLocaleString()}명</div>
          <div style={s.statLabel}>총 수혜 인원</div>
        </div>
        <div style={s.statDivider} />
        <div style={s.statItem}>
          <div style={s.statValue}>{activityStartYear}</div>
          <div style={s.statLabel}>활동 시작</div>
        </div>
      </div>

      {/* 본문 */}
      <div style={s.body}>
        {/* AI 감성 멘트 */}
        <div style={s.aiCard}>
          <div style={s.aiCardHeader}>
            <span style={s.aiIcon}>🤖</span>
            <span style={s.aiTitle}>AI 분석 멘트</span>
            <span style={s.aiBadge}>Beta</span>
          </div>
          <p style={s.aiText}>
            {org.ai_message ?? `${org.org_name}은(는) 재난 현장에서 가장 먼저 손을 내미는 단체입니다. 수년간의 꾸준한 활동을 통해 수천 명의 이재민에게 따뜻한 도움을 전해왔습니다. 그들의 헌신은 단순한 후원을 넘어, 무너진 일상을 다시 세우는 힘이 되고 있습니다.`}
          </p>
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
                          <span style={s.timelineStatLabel}>수혜 인원</span>
                          <span style={s.timelineStatValue}>{rec.beneficiaries.toLocaleString()}명</span>
                        </div>
                      )}
                    </div>
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
  logoIcon: { width: 28, height: 28, background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#818cf8' },
  logoText: { color: '#818cf8', fontWeight: 700, fontSize: 15 },
  navTabs: { display: 'flex', gap: 4 },
  navTab: { background: 'none', border: 'none', color: '#64748b', fontSize: 13, padding: '6px 14px', borderRadius: 6, cursor: 'pointer' },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
  avatar: { width: 32, height: 32, borderRadius: '50%', background: '#1e293b', border: '2px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 },
  hero: { position: 'relative', height: 280, flexShrink: 0, overflow: 'hidden' },
  heroBg: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  heroOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(8,11,20,0.93) 45%, rgba(8,11,20,0.55) 100%)' },
  heroContent: { position: 'relative', zIndex: 1, padding: '28px 40px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  backBtn: { background: 'none', border: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 16 },
  heroMeta: { fontSize: 12, color: '#818cf8', fontWeight: 600, letterSpacing: 1, marginBottom: 8 },
  heroTitle: { fontSize: 34, fontWeight: 900, color: '#f1f5f9', margin: '0 0 8px', letterSpacing: 0.3 },
  heroSub: { fontSize: 14, color: '#94a3b8', marginBottom: 12 },
  heroBadge: { display: 'inline-block', fontSize: 12, color: '#4ade80', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 20, padding: '4px 12px', fontWeight: 600 },
  statsBar: { display: 'flex', alignItems: 'center', background: '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 40px', flexShrink: 0 },
  statItem: { padding: '18px 32px', textAlign: 'center' },
  statValue: { fontSize: 20, fontWeight: 800, color: '#e2e8f0', marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#475569', letterSpacing: 0.5 },
  statDivider: { width: 1, height: 40, background: 'rgba(255,255,255,0.07)' },
  body: { flex: 1, maxWidth: 860, width: '100%', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 28 },
  aiCard: { background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 14, padding: '20px 24px' },
  aiCardHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
  aiIcon: { fontSize: 18 },
  aiTitle: { fontSize: 14, fontWeight: 700, color: '#a5b4fc' },
  aiBadge: { fontSize: 10, color: '#818cf8', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 4, padding: '2px 7px', fontWeight: 600 },
  aiText: { fontSize: 14, color: '#cbd5e1', lineHeight: 1.8, margin: 0 },
  timelineSection: {},
  sectionTitle: { fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 20 },
  timeline: { display: 'flex', flexDirection: 'column', gap: 0 },
  timelineItem: { display: 'flex', gap: 16, position: 'relative' },
  timelineDot: { width: 40, height: 40, borderRadius: '50%', background: '#111827', border: '2px solid rgba(99,102,241,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 },
  timelineLine: { position: 'absolute', left: 19, top: 40, bottom: -24, width: 2, background: 'rgba(99,102,241,0.2)' },
  timelineCard: { flex: 1, background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '16px 20px', marginBottom: 24 },
  timelineCardTop: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
  timelineDate: { fontSize: 12, color: '#475569' },
  disasterBadge: { fontSize: 11, color: '#818cf8', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 4, padding: '2px 8px' },
  timelineTitle: { fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 },
  timelineRegion: { fontSize: 12, color: '#64748b', marginBottom: 10 },
  timelineDesc: { fontSize: 13, color: '#94a3b8', lineHeight: 1.7, margin: '0 0 14px' },
  timelineStats: { display: 'flex', gap: 20 },
  timelineStat: { display: 'flex', flexDirection: 'column', gap: 2 },
  timelineStatLabel: { fontSize: 10, color: '#475569', letterSpacing: 0.5 },
  timelineStatValue: { fontSize: 14, fontWeight: 700, color: '#4ade80' },
  footer: { padding: '12px 28px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0d1117', flexShrink: 0 },
  footerLink: { fontSize: 11, color: '#334155', cursor: 'pointer' },
}
