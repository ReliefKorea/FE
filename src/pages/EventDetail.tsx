import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getEvent, getEventArticles, getEventOrganizations, getEventUpdates } from '../api'
import {
  mockEvents,
  disasterTypeLabels, disasterTypeIcons, severityConfig, statusConfig, timeAgo,
} from '../data/mockData'
import type { OfficialUpdate, OrganizationAction, RelatedArticle, RiskEvent } from '../types'

const ARTICLE_REFRESH_INTERVAL_MS = 30000

export default function EventDetail() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [hoveredOrg, setHoveredOrg] = useState<string | null>(null)
  const [event, setEvent] = useState<RiskEvent | null>(null)
  const [isLoadingEvent, setIsLoadingEvent] = useState(true)
  const [eventError, setEventError] = useState<string | null>(null)
  const [articles, setArticles] = useState<RelatedArticle[]>([])
  const [isLoadingArticles, setIsLoadingArticles] = useState(false)
  const [articlesError, setArticlesError] = useState<string | null>(null)
  const [officialUpdates, setOfficialUpdates] = useState<OfficialUpdate[]>([])
  const [isLoadingUpdates, setIsLoadingUpdates] = useState(false)
  const [updatesError, setUpdatesError] = useState<string | null>(null)
  const [orgs, setOrgs] = useState<OrganizationAction[]>([])
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false)
  const [orgsError, setOrgsError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadEvent() {
      if (!eventId) {
        setEvent(null)
        setEventError('사건을 찾을 수 없습니다')
        setIsLoadingEvent(false)
        return
      }

      setIsLoadingEvent(true)

      try {
        const nextEvent = await getEvent(eventId)

        if (cancelled) return
        setEvent(nextEvent)
        setEventError(null)
      } catch (error) {
        if (!cancelled) {
          setEvent(null)
          setEventError(error instanceof Error && error.message === 'Event not found'
            ? '사건을 찾을 수 없습니다'
            : '재난 정보를 불러오지 못했습니다')
        }
      } finally {
        if (!cancelled) {
          setIsLoadingEvent(false)
        }
      }
    }

    loadEvent()

    return () => {
      cancelled = true
    }
  }, [eventId])

  useEffect(() => {
    let cancelled = false

    async function loadUpdates() {
      if (!eventId) {
        setOfficialUpdates([])
        setUpdatesError(null)
        setIsLoadingUpdates(false)
        return
      }

      setIsLoadingUpdates(true)

      try {
        const nextUpdates = await getEventUpdates(eventId)

        if (cancelled) return
        setOfficialUpdates(nextUpdates)
        setUpdatesError(null)
      } catch (_) {
        if (!cancelled) {
          setOfficialUpdates([])
          setUpdatesError('공식 리포트를 불러오지 못했습니다')
        }
      } finally {
        if (!cancelled) {
          setIsLoadingUpdates(false)
        }
      }
    }

    loadUpdates()

    return () => {
      cancelled = true
    }
  }, [eventId])

  useEffect(() => {
    let cancelled = false

    async function loadArticles(showLoading = true) {
      if (!eventId) {
        setArticles([])
        setArticlesError(null)
        setIsLoadingArticles(false)
        return
      }

      if (showLoading) {
        setIsLoadingArticles(true)
      }

      try {
        const nextArticles = await getEventArticles(eventId)

        if (cancelled) return
        setArticles(nextArticles)
        setArticlesError(null)
      } catch (_) {
        if (!cancelled) {
          setArticles([])
          setArticlesError('관련 뉴스를 불러오지 못했습니다')
        }
      } finally {
        if (!cancelled) {
          setIsLoadingArticles(false)
        }
      }
    }

    loadArticles()
    const refreshTimer = window.setInterval(() => loadArticles(false), ARTICLE_REFRESH_INTERVAL_MS)

    function refreshOnVisible() {
      if (document.visibilityState === 'visible') {
        loadArticles(false)
      }
    }

    document.addEventListener('visibilitychange', refreshOnVisible)

    return () => {
      cancelled = true
      window.clearInterval(refreshTimer)
      document.removeEventListener('visibilitychange', refreshOnVisible)
    }
  }, [eventId])

  useEffect(() => {
    let cancelled = false

    async function loadOrganizations() {
      if (!eventId) {
        setOrgs([])
        setOrgsError(null)
        setIsLoadingOrgs(false)
        return
      }

      setIsLoadingOrgs(true)

      try {
        const nextOrgs = await getEventOrganizations(eventId)

        if (cancelled) return
        setOrgs(nextOrgs)
        setOrgsError(null)
      } catch (_) {
        if (!cancelled) {
          setOrgs([])
          setOrgsError('후원 단체를 불러오지 못했습니다')
        }
      } finally {
        if (!cancelled) {
          setIsLoadingOrgs(false)
        }
      }
    }

    loadOrganizations()

    return () => {
      cancelled = true
    }
  }, [eventId])

  if (isLoadingEvent) {
    return (
      <div style={{ background: '#080b14', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e2e8f0' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, marginBottom: 12 }}>재난 정보를 불러오는 중입니다</div>
          <button onClick={() => navigate('/map')} style={s.backBtn}>← 지도로 돌아가기</button>
        </div>
      </div>
    )
  }

  if (eventError || !event) {
    return (
      <div style={{ background: '#080b14', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e2e8f0' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <div style={{ fontSize: 20, marginBottom: 12 }}>{eventError ?? '사건을 찾을 수 없습니다'}</div>
          <button onClick={() => navigate('/map')} style={s.backBtn}>← 지도로 돌아가기</button>
        </div>
      </div>
    )
  }

  const cfg = severityConfig[event.severity]
  const stCfg = statusConfig[event.status]

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
          <div style={s.liveAlert}>
            <span style={s.liveDot} />
            LIVE ALERTS: {mockEvents.filter(e => e.status === 'active').length}
          </div>
          <div style={s.avatar}>👤</div>
        </div>
      </header>

      {/* 사건 제목 바 — 히어로 이미지 위에 글자 오버레이 */}
      <div style={s.titleBar}>
        <img
          src={`https://picsum.photos/seed/${event.event_id}/1600/260`}
          alt=""
          style={s.titleBgImg}
        />
        <div style={s.titleOverlay} />
        <div style={s.titleContent}>
          <button onClick={() => navigate('/map')} style={s.backBtn}>← Back to Map</button>
          <div style={s.titleMain}>
            <span style={{ ...s.riskBadge, background: cfg.bgColor, color: cfg.color, border: `1px solid ${cfg.color}44` }}>
              {cfg.label.toUpperCase()} RISK
            </span>
            <h1 style={s.eventTitle}>{event.title.toUpperCase()}</h1>
          </div>
          <div style={s.titleMeta}>
            <span>📍 {event.region_name} &nbsp;·&nbsp; {disasterTypeLabels[event.disaster_type]}</span>
            <span style={{ color: stCfg.color }}>● {stCfg.label}</span>
            <span>{disasterTypeIcons[event.disaster_type]} {disasterTypeLabels[event.disaster_type]}</span>
            <span>🕐 Last Updated: {timeAgo(event.updated_at)}</span>
          </div>
          <div style={s.titleSummary}>{event.official_summary}</div>
          <div style={s.titleActions}>
            <button style={s.actionBtn}>↗ 공유</button>
            <button style={s.actionBtnPrimary}>📊 공식 보고서 확인</button>
          </div>
        </div>
      </div>

      {/* 본문 3열 */}
      <div style={s.body}>
        {/* 1열: 공식 리포트 */}
        <div style={s.col}>
          <section style={s.section}>
            <div style={s.sectionHeader}>
              <span style={s.sectionIcon}>🛡️</span>
              <span style={s.sectionTitle}>공식 리포트 및 지침</span>
              <div style={s.livePulse}>
                <span style={s.liveDot} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {isLoadingUpdates && (
                <div style={{ fontSize: 13, color: '#475569', textAlign: 'center', padding: '24px 0' }}>
                  공식 리포트를 불러오는 중입니다
                </div>
              )}
              {!isLoadingUpdates && updatesError && (
                <div style={{ fontSize: 13, color: '#fca5a5', textAlign: 'center', padding: '24px 0' }}>
                  {updatesError}
                </div>
              )}
              {!isLoadingUpdates && !updatesError && officialUpdates.map(upd => (
                <div
                  key={upd.update_id}
                  style={{ ...s.officialCard, cursor: upd.original_link ? 'pointer' : 'default' }}
                  onClick={() => upd.original_link && window.open(upd.original_link, '_blank', 'noopener,noreferrer')}
                >
                  <div style={s.officialCardTop}>
                    <span style={s.officialSource}>{upd.source_name}</span>
                    <span style={s.officialTime}>{timeAgo(upd.issued_at)}</span>
                  </div>
                  <div style={s.officialTitle}>{upd.title}</div>
                  <p style={s.officialSummary}>{upd.summary}</p>
                  {upd.original_link && (
                    <a href={upd.original_link} target="_blank" rel="noopener noreferrer" style={s.officialLink}>
                      원문 보기 →
                    </a>
                  )}
                </div>
              ))}
              {!isLoadingUpdates && !updatesError && officialUpdates.length === 0 && (
                <div style={{ fontSize: 13, color: '#475569', textAlign: 'center', padding: '24px 0' }}>
                  등록된 공식 리포트가 없습니다
                </div>
              )}
            </div>
          </section>
        </div>

        {/* 2열: 관련 뉴스 피드 */}
        <div style={s.col}>
          <section style={s.section}>
            <div style={s.sectionHeader}>
              <span style={s.sectionIcon}>🌐</span>
              <span style={s.sectionTitle}>관련 뉴스 피드</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {isLoadingArticles && (
                <div style={{ fontSize: 13, color: '#475569', textAlign: 'center', padding: '24px 0' }}>
                  관련 뉴스를 불러오는 중입니다
                </div>
              )}
              {!isLoadingArticles && articlesError && (
                <div style={{ fontSize: 13, color: '#fca5a5', textAlign: 'center', padding: '24px 0' }}>
                  {articlesError}
                </div>
              )}
              {!isLoadingArticles && !articlesError && articles.map(art => (
                  <a key={art.article_id} href={art.url} target="_blank" rel="noopener noreferrer" style={s.articleCard}>
                    {art.image_url && (
                      <img
                        src={art.image_url}
                        alt=""
                        loading="lazy"
                        style={s.articleThumb}
                      />
                    )}
                    <div style={s.articleBody}>
                      <div style={s.articleTop}>
                        <span style={s.articlePublisher}>{art.publisher}</span>
                        <span style={s.articleTime}>{timeAgo(art.published_at)}</span>
                      </div>
                      <div style={s.articleTitle}>{art.title}</div>
                      <p style={s.articleSummary}>{art.summary}</p>
                      <div style={s.articleReadMore}>기사 전문 보기 →</div>
                    </div>
                  </a>
                ))}
              {!isLoadingArticles && !articlesError && articles.length === 0 && (
                <div style={{ fontSize: 13, color: '#475569', textAlign: 'center', padding: '24px 0' }}>
                  관련 뉴스가 없습니다
                </div>
              )}
            </div>
          </section>
        </div>

        {/* 3열: 후원하기 */}
        <div style={s.colRight}>
          <div style={s.supportSection}>
            <div style={s.cardLabel}>♡ Support Relief</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, overflowY: 'auto' }}>
              {isLoadingOrgs && (
                <div style={{ fontSize: 13, color: '#475569', textAlign: 'center', padding: '24px 0' }}>
                  후원 단체를 불러오는 중입니다
                </div>
              )}
              {!isLoadingOrgs && orgsError && (
                <div style={{ fontSize: 13, color: '#fca5a5', textAlign: 'center', padding: '24px 0' }}>
                  {orgsError}
                </div>
              )}
              {!isLoadingOrgs && !orgsError && orgs.map(org => (
                <div key={org.org_id} style={s.orgCard}>
                  <div
                    style={s.orgImageWrap}
                    onMouseEnter={() => setHoveredOrg(org.org_id)}
                    onMouseLeave={() => setHoveredOrg(null)}
                  >
                    <img
                      src={`https://picsum.photos/seed/${org.org_id}/600/140`}
                      alt=""
                      style={s.orgImage}
                    />
                    {hoveredOrg === org.org_id && (
                      <div style={s.orgImageOverlay}>
                        <button style={s.orgHistoryBtn} onClick={() => navigate(`/org/${org.org_id}/history`)}>🤖 AI 후원 히스토리 보기</button>
                      </div>
                    )}
                  </div>
                  <div style={s.orgCardBody}>
                    <div style={s.orgName}>{org.org_name}</div>
                    {org.verified_by_admin && (
                      <div style={s.verifiedBadge}>✓ 관리자 인증</div>
                    )}
                    <p style={s.orgDesc}>{org.ai_message ?? org.activity_summary}</p>
                    {org.donation_link && (
                      <a href={org.donation_link} target="_blank" rel="noopener noreferrer" style={s.donateBtn}>
                        후원하기 ↗
                      </a>
                    )}
                    {org.volunteer_link && (
                      <a href={org.volunteer_link} target="_blank" rel="noopener noreferrer" style={{ ...s.donateBtn, background: 'rgba(22,163,74,0.15)', border: '1px solid rgba(22,163,74,0.3)', color: '#4ade80', marginTop: 6 }}>
                        봉사 신청 ↗
                      </a>
                    )}
                  </div>
                </div>
              ))}
              {!isLoadingOrgs && !orgsError && orgs.length === 0 && (
                <div style={{ fontSize: 13, color: '#475569', textAlign: 'center', padding: '24px 0' }}>
                  등록된 후원 단체가 없습니다
                </div>
              )}
            </div>
            <div style={{ ...s.verifiedNote, marginTop: 12, flexShrink: 0 }}>
              <span style={{ fontSize: 16 }}>🛡️</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 12, color: '#4ade80', marginBottom: 4 }}>Official Donation Sites</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>재난별 실제 지원 여부와 모금 용도는 각 공식 사이트에서 확인해 주세요.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 */}
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
  liveAlert: { display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '5px 12px', fontSize: 12, color: '#fca5a5', fontWeight: 600 },
  liveDot: { width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block', boxShadow: '0 0 6px #ef4444' },
  avatar: { width: 32, height: 32, borderRadius: '50%', background: '#1e293b', border: '2px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 },
  titleBar: { position: 'relative', padding: 0, borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0, overflow: 'hidden' },
  titleBgImg: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  titleOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(8,11,20,0.92) 50%, rgba(8,11,20,0.6) 100%)' },
  titleContent: { position: 'relative', zIndex: 1, padding: '24px 32px 22px' },
  backBtn: { background: 'none', border: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer', marginBottom: 14, padding: 0 },
  titleMain: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 },
  riskBadge: { fontSize: 12, padding: '4px 12px', borderRadius: 5, fontWeight: 700, letterSpacing: 0.5 },
  eventTitle: { fontSize: 32, fontWeight: 900, color: '#f1f5f9', margin: 0, letterSpacing: 0.5 },
  titleMeta: { fontSize: 12, color: '#94a3b8', display: 'flex', gap: 20, marginBottom: 12 },
  titleSummary: { fontSize: 14, color: '#cbd5e1', lineHeight: 1.7, marginBottom: 16, maxWidth: 760 },
  titleActions: { display: 'flex', gap: 8 },
  actionBtn: { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '7px 16px', color: '#94a3b8', fontSize: 12, cursor: 'pointer' },
  actionBtnPrimary: { background: 'rgba(22,163,74,0.2)', border: '1px solid rgba(22,163,74,0.4)', borderRadius: 6, padding: '7px 16px', color: '#4ade80', fontSize: 12, cursor: 'pointer', fontWeight: 600 },
  body: { display: 'flex', flex: 1, overflow: 'hidden' },
  col: { flex: 1, overflowY: 'auto', padding: '20px 24px', borderRight: '1px solid rgba(255,255,255,0.07)' },
  section: {},
  sectionHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionIcon: { fontSize: 16 },
  sectionTitle: { fontSize: 15, fontWeight: 700, color: '#e2e8f0' },
  livePulse: { display: 'flex', alignItems: 'center', gap: 4 },
  officialCard: { background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '14px 16px', borderLeft: '3px solid #16a34a' },
  officialCardTop: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 },
  officialSource: { fontSize: 11, color: '#4ade80', fontWeight: 600, letterSpacing: 0.5 },
  officialTime: { fontSize: 11, color: '#475569' },
  officialTitle: { fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 6 },
  officialSummary: { fontSize: 13, color: '#94a3b8', lineHeight: 1.6, margin: 0 },
  officialLink: { display: 'inline-block', marginTop: 8, fontSize: 12, color: '#4ade80', textDecoration: 'none' },
  articleCard: { background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: 12, textDecoration: 'none', display: 'flex', gap: 12, alignItems: 'stretch', transition: 'border-color 0.15s' },
  articleThumb: { width: 96, minWidth: 96, aspectRatio: '4 / 3', objectFit: 'cover' as const, borderRadius: 7, background: '#0d1117', border: '1px solid rgba(255,255,255,0.06)' },
  articleBody: { minWidth: 0, flex: 1 },
  articleTop: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 },
  articlePublisher: { fontSize: 11, color: '#64748b' },
  articleTime: { fontSize: 11, color: '#475569' },
  articleTitle: { fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 6, lineHeight: 1.4 },
  articleSummary: { fontSize: 12, color: '#64748b', lineHeight: 1.5, margin: 0 },
  articleReadMore: { fontSize: 11, color: '#4ade80', marginTop: 8 },
  colRight: { flex: 1, background: '#0d1117', borderLeft: '1px solid rgba(255,255,255,0.07)', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' },
  cardLabel: { fontSize: 11, color: '#64748b', letterSpacing: 1, fontWeight: 600, marginBottom: 10, textTransform: 'uppercase' as const },
  supportSection: { flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 },
  orgCard: { background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, overflow: 'hidden' },
  orgImageWrap: { position: 'relative', overflow: 'hidden' },
  orgImage: { width: '100%', height: 140, objectFit: 'cover' as const, display: 'block' },
  orgImageOverlay: { position: 'absolute', inset: 0, background: 'rgba(8,11,20,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  orgHistoryBtn: { background: 'rgba(22,163,74,0.25)', border: '1px solid rgba(22,163,74,0.5)', borderRadius: 8, padding: '9px 18px', color: '#bbf7d0', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  orgCardBody: { padding: 14 },
  orgName: { fontSize: 13, fontWeight: 600, color: '#e2e8f0' },
  verifiedBadge: { fontSize: 10, color: '#4ade80', marginTop: 2, marginBottom: 8 },
  orgDesc: { fontSize: 12, color: '#64748b', lineHeight: 1.5, margin: '0 0 10px' },
  donateBtn: { display: 'block', textAlign: 'center', background: '#16a34a', border: 'none', borderRadius: 6, padding: '9px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', transition: 'opacity 0.2s' },
  verifiedNote: { background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.15)', borderRadius: 10, padding: 14, display: 'flex', gap: 10, alignItems: 'flex-start' },
  footer: { padding: '12px 28px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0d1117', flexShrink: 0 },
  footerLink: { fontSize: 11, color: '#334155', cursor: 'pointer' },
}
