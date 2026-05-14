import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockEvents } from '../data/mockData'

export default function Landing() {
  const navigate = useNavigate()
  const [time, setTime] = useState(new Date())
  const activeCount = mockEvents.filter(e => e.status === 'active').length

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const pad = (n: number) => String(n).padStart(2, '0')
  const timeStr = `${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}`

  return (
    <div style={styles.root}>
      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />

      {/* 상단 헤더 */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>⊕</div>
          <span style={styles.logoText}>Relief Korea</span>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.statusBadge}>
            <span style={styles.statusIcon}>🕐</span>
            <div>
              <div style={styles.statusLabel}>LOCAL TIME (KST)</div>
              <div style={styles.statusValue}>{timeStr}</div>
            </div>
          </div>
          <div style={styles.statusBadge}>
            <span style={styles.statusIcon}>📡</span>
            <div>
              <div style={styles.statusLabel}>DATA STREAM</div>
              <div style={styles.statusValue}>Stable</div>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main style={styles.main}>
        {/* 중앙 구체 */}
        <div style={styles.orb}>
          <div style={styles.orbRing} />
          <div style={styles.orbInner}>
            <div style={styles.orbSubtitle}>STRATEGIC DISASTER INTELLIGENCE</div>
            <h1 style={{ ...styles.orbTitle, fontSize: 52 }}>
              Relief Korea
            </h1>
            <p style={styles.orbDesc}>
              지금 발생한 재난과 현재 필요한<br />
              도움을 <span style={{ color: '#818cf8' }}>지역별로 실시간 확인</span>하세요.
            </p>
            <button style={styles.ctaBtn} onClick={() => navigate('/map')}>
              현재 재난 보기 &nbsp;&gt;
            </button>
            <div style={styles.orbMeta}>
              <span style={styles.metaItem}>⚡ LIVE UPDATES</span>
              <span style={styles.metaSep}>·</span>
              <span style={styles.metaItem}>✓ VERIFIED DATA</span>
            </div>
          </div>
        </div>
      </main>

      <footer style={styles.footer}>
        <div style={styles.footerLeft}>
          <div style={styles.alertBadge}>
            <span style={styles.alertDot} />
            <span>{activeCount} Active Incidents Detected</span>
          </div>
        </div>
      </footer>

    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    position: 'relative',
    width: '100%',
    height: '100vh',
    background: '#080b14',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  bgGlow1: {
    position: 'absolute',
    top: '-20%',
    left: '20%',
    width: 600,
    height: 600,
    background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
    borderRadius: '50%',
    pointerEvents: 'none',
  },
  bgGlow2: {
    position: 'absolute',
    bottom: '-10%',
    right: '10%',
    width: 500,
    height: 500,
    background: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)',
    borderRadius: '50%',
    pointerEvents: 'none',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 32px',
    zIndex: 10,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    width: 36,
    height: 36,
    background: 'rgba(99,102,241,0.2)',
    border: '1px solid rgba(99,102,241,0.5)',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    color: '#818cf8',
  },
  logoText: {
    color: '#818cf8',
    fontWeight: 700,
    fontSize: 18,
    letterSpacing: 0.5,
  },
  headerRight: {
    display: 'flex',
    gap: 12,
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: '10px 16px',
  },
  statusIcon: {
    fontSize: 18,
  },
  statusLabel: {
    fontSize: 9,
    color: '#64748b',
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
  statusValue: {
    fontSize: 14,
    color: '#e2e8f0',
    fontWeight: 600,
    marginTop: 2,
  },
  main: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  orb: {
    position: 'relative',
    width: 560,
    height: 560,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbRing: {
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(15,23,42,0.95) 55%, rgba(30,27,75,0.6) 80%, transparent 100%)',
    border: '1.5px solid rgba(99,102,241,0.25)',
    boxShadow: '0 0 80px rgba(99,102,241,0.15), inset 0 0 80px rgba(99,102,241,0.05)',
  },
  orbInner: {
    position: 'relative',
    textAlign: 'center',
    padding: '0 40px',
    zIndex: 2,
  },
  orbSubtitle: {
    fontSize: 10,
    color: '#64748b',
    letterSpacing: 3,
    marginBottom: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  orbTitle: {
    fontSize: 52,
    fontWeight: 900,
    color: '#f1f5f9',
    margin: '0 0 8px',
    lineHeight: 1.1,
    letterSpacing: -1,
  },
  orbTitleAccent: {
    color: '#818cf8',
  },
  orbDesc: {
    fontSize: 15,
    color: '#94a3b8',
    lineHeight: 1.7,
    margin: '16px 0 28px',
  },
  ctaBtn: {
    background: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: 50,
    padding: '14px 36px',
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: 1,
    cursor: 'pointer',
    transition: 'background 0.2s, transform 0.1s',
    boxShadow: '0 4px 24px rgba(79,70,229,0.4)',
  },
  orbMeta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 20,
    fontSize: 11,
    color: '#475569',
    letterSpacing: 1,
  },
  metaItem: {},
  metaSep: { color: '#334155' },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 32px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    zIndex: 10,
  },
  footerLeft: {},
  alertBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 6,
    padding: '6px 14px',
    fontSize: 12,
    color: '#fca5a5',
    fontWeight: 600,
  },
  alertDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#ef4444',
    display: 'inline-block',
    boxShadow: '0 0 6px #ef4444',
  },
  footerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 10,
    color: '#334155',
    letterSpacing: 1,
  },
  footerRegion: { color: '#475569' },
  footerMetaText: {},
  footerMetaDot: { color: '#1e293b' },
  sideLeftBadge: {
    position: 'absolute',
    bottom: 70,
    left: 32,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: '10px 16px',
    zIndex: 10,
  },
  sideIcon: { fontSize: 20 },
}
