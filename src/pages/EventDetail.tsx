import { useParams, useNavigate } from 'react-router-dom'
import {
  mockEvents, mockOfficialUpdates, mockArticles, mockOrganizations,
  disasterTypeLabels, disasterTypeIcons, severityConfig, statusConfig, timeAgo,
} from '../data/mockData'

export default function EventDetail() {
  const { eventId } = useParams()
  const navigate = useNavigate()

  const event = mockEvents.find(e => e.event_id === eventId)
  if (!event) {
    return (
      <div style={{ background: '#080b14', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e2e8f0' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <div style={{ fontSize: 20, marginBottom: 12 }}>사건을 찾을 수 없습니다</div>
          <button onClick={() => navigate('/map')} style={s.backBtn}>← 지도로 돌아가기</button>
        </div>
      </div>
    )
  }

  const officialUpdates = mockOfficialUpdates.filter(u => u.event_id === eventId)
  const articles = mockArticles.filter(a => a.event_id === eventId)
  const orgs = mockOrganizations.filter(o => o.event_id === eventId)
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

      {/* 사건 제목 바 */}
      <div style={s.titleBar}>
        <button onClick={() => navigate('/map')} style={s.backBtn}>← Back to Map</button>
        <div style={s.titleMain}>
          <span style={{ ...s.riskBadge, background: cfg.bgColor, color: cfg.color, border: `1px solid ${cfg.color}44` }}>
            {cfg.label.toUpperCase()} RISK
          </span>
          <h1 style={s.eventTitle}>{event.title.toUpperCase()}</h1>
        </div>
        <div style={s.titleMeta}>
          <span>📍 {event.region_name} &nbsp;·&nbsp; {disasterTypeLabels[event.disaster_type]}</span>
          <span>🕐 Last Updated: {timeAgo(event.updated_at)}</span>
        </div>
        <div style={s.titleActions}>
          <button style={s.actionBtn}>↗ 공유</button>
          <button style={s.actionBtnPrimary}>📊 공식 보고서 확인</button>
        </div>
      </div>

      {/* 본문 3열 */}
      <div style={s.body}>
        {/* 좌측: 지도 미니 + 요약 */}
        <div style={s.colLeft}>
          <div style={s.miniMapPlaceholder}>
            <div style={s.liveRegionBadge}>🔴 LIVE: 활성 위험 구역</div>
            <div style={s.miniMapCoords}>
              <div style={s.coordBadge}>
                <div style={{ fontSize: 10, color: '#64748b' }}>📍 좌표</div>
                <div style={{ fontSize: 12, color: '#e2e8f0' }}>{event.center_lat.toFixed(4)}° N, {event.center_lng.toFixed(4)}° E</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{event.region_name}</div>
              </div>
            </div>
            <div style={s.warningOrb}>
              <span style={{ fontSize: 28 }}>⚠️</span>
            </div>
          </div>

          <div style={s.summaryCard}>
            <div style={s.cardLabel}>공식 요약</div>
            <p style={s.summaryText}>{event.official_summary}</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <span style={{ ...s.statusPill, color: stCfg.color, background: `${stCfg.color}18`, border: `1px solid ${stCfg.color}44` }}>
                ● {stCfg.label}
              </span>
              <span style={{ ...s.statusPill, color: '#818cf8', background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.3)' }}>
                {disasterTypeIcons[event.disaster_type]} {disasterTypeLabels[event.disaster_type]}
              </span>
            </div>
          </div>
        </div>

        {/* 중앙: Live Coverage (공식정보 + 기사) */}
        <div style={s.colCenter}>
          {/* 공식 정보 */}
          {officialUpdates.length > 0 && (
            <section style={s.section}>
              <div style={s.sectionHeader}>
                <span style={s.sectionIcon}>🛡️</span>
                <span style={s.sectionTitle}>공식 리포트 및 지침</span>
                <div style={{ ...s.livePulse }}>
                  <span style={s.liveDot} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {officialUpdates.map(upd => (
                  <div key={upd.update_id} style={s.officialCard}>
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
              </div>
            </section>
          )}

          {/* 관련 기사 */}
          {articles.length > 0 && (
            <section style={s.section}>
              <div style={s.sectionHeader}>
                <span style={s.sectionIcon}>🌐</span>
                <span style={s.sectionTitle}>관련 뉴스 피드</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {articles.map(art => (
                  <a key={art.article_id} href={art.url} target="_blank" rel="noopener noreferrer" style={s.articleCard}>
                    <div style={s.articleTop}>
                      <span style={s.articlePublisher}>{art.publisher}</span>
                      <span style={s.articleTime}>{timeAgo(art.published_at)}</span>
                    </div>
                    <div style={s.articleTitle}>{art.title}</div>
                    <p style={s.articleSummary}>{art.summary}</p>
                    <div style={s.articleReadMore}>기사 전문 보기 →</div>
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* 우측: 긴급 연락처 + 후원 */}
        <div style={s.colRight}>
          {/* 긴급 연락처 */}
          <div style={s.emergencyCard}>
            <div style={s.cardLabel}>⚡ Quick Emergency</div>
            <div style={s.emergencyBtns}>
              <div style={s.emergencyCall}>
                <div style={s.emergencyCallLabel}>FIRE / RESCUE</div>
                <div style={s.emergencyCallNum}>119</div>
              </div>
              <div style={{ ...s.emergencyCall, background: 'rgba(79,70,229,0.15)', border: '1px solid rgba(79,70,229,0.3)' }}>
                <div style={s.emergencyCallLabel}>POLICE</div>
                <div style={{ ...s.emergencyCallNum, color: '#818cf8' }}>112</div>
              </div>
            </div>
          </div>

          {/* 후원 단체 */}
          {orgs.length > 0 && (
            <div style={s.supportSection}>
              <div style={s.cardLabel}>♡ Support Relief</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {orgs.map(org => (
                  <div key={org.org_id} style={s.orgCard}>
                    <div style={s.orgHeader}>
                      <div style={s.orgAvatar}>{org.org_name[0]}</div>
                      <div>
                        <div style={s.orgName}>{org.org_name}</div>
                        {org.verified_by_admin && (
                          <div style={s.verifiedBadge}>✓ 관리자 인증</div>
                        )}
                      </div>
                    </div>
                    <p style={s.orgDesc}>{org.activity_summary}</p>
                    {org.donation_link && (
                      <a href={org.donation_link} target="_blank" rel="noopener noreferrer" style={s.donateBtn}>
                        후원하기 ↗
                      </a>
                    )}
                    {org.volunteer_link && (
                      <a href={org.volunteer_link} target="_blank" rel="noopener noreferrer" style={{ ...s.donateBtn, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', marginTop: 6 }}>
                        봉사 신청 ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 인증 안내 */}
          <div style={s.verifiedNote}>
            <span style={{ fontSize: 16 }}>🛡️</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 12, color: '#4ade80', marginBottom: 4 }}>Verified Actions</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>All donation links are verified by the Ministry of Interior and Safety.</div>
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
  logoIcon: { width: 28, height: 28, background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#818cf8' },
  logoText: { color: '#818cf8', fontWeight: 700, fontSize: 15 },
  navTabs: { display: 'flex', gap: 4 },
  navTab: { background: 'none', border: 'none', color: '#64748b', fontSize: 13, padding: '6px 14px', borderRadius: 6, cursor: 'pointer' },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
  liveAlert: { display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '5px 12px', fontSize: 12, color: '#fca5a5', fontWeight: 600 },
  liveDot: { width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block', boxShadow: '0 0 6px #ef4444' },
  avatar: { width: 32, height: 32, borderRadius: '50%', background: '#1e293b', border: '2px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 },
  titleBar: { padding: '16px 28px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: '#0d1117', flexShrink: 0 },
  backBtn: { background: 'none', border: 'none', color: '#64748b', fontSize: 13, cursor: 'pointer', marginBottom: 10, padding: 0 },
  titleMain: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 },
  riskBadge: { fontSize: 11, padding: '3px 10px', borderRadius: 5, fontWeight: 700, letterSpacing: 0.5 },
  eventTitle: { fontSize: 22, fontWeight: 900, color: '#f1f5f9', margin: 0, letterSpacing: 0.5 },
  titleMeta: { fontSize: 12, color: '#64748b', display: 'flex', gap: 16, marginBottom: 10 },
  titleActions: { display: 'flex', gap: 8 },
  actionBtn: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '7px 16px', color: '#94a3b8', fontSize: 12, cursor: 'pointer' },
  actionBtnPrimary: { background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 6, padding: '7px 16px', color: '#818cf8', fontSize: 12, cursor: 'pointer', fontWeight: 600 },
  body: { display: 'flex', flex: 1, gap: 0, overflow: 'hidden' },
  colLeft: { width: 260, background: '#0d1117', borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' },
  miniMapPlaceholder: { position: 'relative', height: 240, background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', borderBottom: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  liveRegionBadge: { position: 'absolute', top: 12, left: 12, background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: '#fca5a5', fontWeight: 600 },
  miniMapCoords: { position: 'absolute', bottom: 12, left: 12 },
  coordBadge: { background: 'rgba(0,0,0,0.6)', borderRadius: 8, padding: '8px 12px', backdropFilter: 'blur(8px)' },
  warningOrb: { width: 60, height: 60, borderRadius: '50%', background: 'rgba(239,68,68,0.2)', border: '2px solid rgba(239,68,68,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(239,68,68,0.3)' },
  summaryCard: { padding: 16 },
  cardLabel: { fontSize: 11, color: '#64748b', letterSpacing: 1, fontWeight: 600, marginBottom: 10, textTransform: 'uppercase' as const },
  summaryText: { fontSize: 13, color: '#94a3b8', lineHeight: 1.7, margin: 0 },
  statusPill: { fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600 },
  colCenter: { flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 24 },
  section: {},
  sectionHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionIcon: { fontSize: 16 },
  sectionTitle: { fontSize: 15, fontWeight: 700, color: '#e2e8f0' },
  livePulse: { display: 'flex', alignItems: 'center', gap: 4 },
  officialCard: { background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '14px 16px', borderLeft: '3px solid #4f46e5' },
  officialCardTop: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 },
  officialSource: { fontSize: 11, color: '#818cf8', fontWeight: 600, letterSpacing: 0.5 },
  officialTime: { fontSize: 11, color: '#475569' },
  officialTitle: { fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 6 },
  officialSummary: { fontSize: 13, color: '#94a3b8', lineHeight: 1.6, margin: 0 },
  officialLink: { display: 'inline-block', marginTop: 8, fontSize: 12, color: '#818cf8', textDecoration: 'none' },
  articleCard: { background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '14px 16px', textDecoration: 'none', display: 'block', transition: 'border-color 0.15s' },
  articleTop: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 },
  articlePublisher: { fontSize: 11, color: '#64748b' },
  articleTime: { fontSize: 11, color: '#475569' },
  articleTitle: { fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 6, lineHeight: 1.4 },
  articleSummary: { fontSize: 12, color: '#64748b', lineHeight: 1.5, margin: 0 },
  articleReadMore: { fontSize: 11, color: '#818cf8', marginTop: 8 },
  colRight: { width: 300, background: '#0d1117', borderLeft: '1px solid rgba(255,255,255,0.07)', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16, flexShrink: 0, overflowY: 'auto' },
  emergencyCard: { background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: 14 },
  emergencyBtns: { display: 'flex', gap: 10, marginTop: 10 },
  emergencyCall: { flex: 1, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px', textAlign: 'center' },
  emergencyCallLabel: { fontSize: 9, color: '#64748b', letterSpacing: 1, marginBottom: 4 },
  emergencyCallNum: { fontSize: 24, fontWeight: 900, color: '#f87171' },
  supportSection: {},
  orgCard: { background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: 14 },
  orgHeader: { display: 'flex', gap: 10, marginBottom: 10 },
  orgAvatar: { width: 36, height: 36, borderRadius: '50%', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#818cf8', flexShrink: 0 },
  orgName: { fontSize: 13, fontWeight: 600, color: '#e2e8f0' },
  verifiedBadge: { fontSize: 10, color: '#4ade80', marginTop: 2 },
  orgDesc: { fontSize: 12, color: '#64748b', lineHeight: 1.5, margin: '0 0 10px' },
  donateBtn: { display: 'block', textAlign: 'center', background: '#16a34a', border: 'none', borderRadius: 6, padding: '9px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', transition: 'opacity 0.2s' },
  verifiedNote: { background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.15)', borderRadius: 10, padding: 14, display: 'flex', gap: 10, alignItems: 'flex-start' },
  footer: { padding: '12px 28px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0d1117', flexShrink: 0 },
  footerLink: { fontSize: 11, color: '#334155', cursor: 'pointer' },
}
