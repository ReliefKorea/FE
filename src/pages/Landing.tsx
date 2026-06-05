import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Globe, { type GlobeMethods } from 'react-globe.gl'
import { getEvents } from '../api'

const GLOBE_SIZE = 620
const ALTITUDE = 1.9
const AUTO_ROTATE_SPEED = -4.0
const STOP_AFTER_MS = 2500

export default function Landing() {
  const navigate = useNavigate()
  const globeRef = useRef<GlobeMethods | undefined>(undefined)
  const animStarted = useRef(false)
  const rafRef = useRef<number>(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const [contentVisible, setContentVisible] = useState(false)
  const [time, setTime] = useState(new Date())
  const [scrollY, setScrollY] = useState(0)
  const [activeEventCount, setActiveEventCount] = useState<number | null>(null)

  useEffect(() => {
    const clock = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(clock)
  }, [])

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const onScroll = () => setScrollY(el.scrollTop)
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    getEvents()
      .then(events => setActiveEventCount(events.filter(e => e.status === 'active').length))
      .catch(() => setActiveEventCount(null))
  }, [])

  const handleGlobeReady = useCallback(() => {
    if (animStarted.current) return
    animStarted.current = true

    const globe = globeRef.current as GlobeMethods
    if (!globe) return

    const controls = globe.controls()

    controls.enableZoom = false
    controls.enableRotate = false
    controls.enablePan = false
    globe.pointOfView({ lat: 25, lng: 0, altitude: ALTITUDE })
    controls.autoRotate = true
    controls.autoRotateSpeed = AUTO_ROTATE_SPEED

    const start = performance.now()

    function tick() {
      const t = Math.min((performance.now() - start) / STOP_AFTER_MS, 1)

      if (t >= 0.6) {
        const phase = (t - 0.6) / 0.4
        controls.autoRotateSpeed = AUTO_ROTATE_SPEED * Math.cos(phase * Math.PI / 2)
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        controls.autoRotate = false
        controls.autoRotateSpeed = 0
        setContentVisible(true)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const pad = (n: number) => String(n).padStart(2, '0')
  const timeStr = `${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}`

  const introProgress = Math.min(1, Math.max(0, scrollY / (window.innerHeight * 0.7)))

  return (
    <div ref={rootRef} style={s.root}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes globeFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes scrollBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(5px); }
        }
      `}</style>

      {/* 스크롤 가능하게 만드는 스페이서 */}
      <div style={{ height: '200vh' }} />

      {/* 상태바 */}
      <div style={s.statusBar}>
        <div style={s.statusBadge}>
          <span style={s.statusIcon}>🕐</span>
          <div>
            <div style={s.statusLabel}>LOCAL TIME (KST)</div>
            <div style={s.statusValue}>{timeStr}</div>
          </div>
        </div>
        <div style={s.statusBadge}>
          <span style={s.statusIcon}>📡</span>
          <div>
            <div style={s.statusLabel}>DATA STREAM</div>
            <div style={s.statusValue}>Stable</div>
          </div>
        </div>
      </div>

      {/* 지구본 (뷰포트 중앙 고정) */}
      <div style={s.globeFixed}>
        <div style={s.globeWrapper}>
          <div style={s.globeFilter}>
            <Globe
              ref={globeRef}
              width={GLOBE_SIZE}
              height={GLOBE_SIZE}
              backgroundColor="rgba(0,0,0,0)"
              globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
              showAtmosphere={true}
              atmosphereColor="rgba(180,190,210,0.2)"
              atmosphereAltitude={0.1}
              onGlobeReady={handleGlobeReady}
            />
          </div>

          {contentVisible && (
            <div style={s.overlay}>
              <div style={s.overlayBg} />
              <div style={{ position: 'relative', zIndex: 2, animation: 'fadeUp 3s 0s cubic-bezier(0.16,1,0.3,1) both' }}>
                <div style={s.logoRow}>
                  <img src="/logo.png" alt="Relief Korea" style={{ width: 42, height: 42, borderRadius: 10, objectFit: 'contain' }} />
                  <span style={s.logoText}>Relief Korea</span>
                </div>
              </div>
              <div style={{ position: 'relative', zIndex: 2, animation: 'fadeUp 3s 0s cubic-bezier(0.16,1,0.3,1) both' }}>
                <p style={s.desc}>
                  지금 발생한 재난과 현재 필요한<br />
                  도움을 <span style={{ color: '#4ade80' }}>지역별로 실시간 확인</span>하세요.
                </p>
              </div>
              <div style={{ position: 'relative', zIndex: 2, animation: 'fadeUp 3s 0s cubic-bezier(0.16,1,0.3,1) both' }}>
                <button style={s.ctaBtn} onClick={() => navigate('/map')}>
                  현재 재난 보기 &nbsp;›
                </button>
              </div>
              <div style={{ position: 'relative', zIndex: 2, animation: 'fadeUp 3s 0.8s cubic-bezier(0.16,1,0.3,1) both' }}>
                <div style={s.scrollHint}>소개 보기 &nbsp;↓</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 소개 패널 — 스크롤하면 아래에서 위로, 반대로 스크롤하면 내려감 */}
      <div style={{
        ...s.introPanel,
        transform: `translateY(${(1 - introProgress) * 100}%)`,
        transition: introProgress > 0 ? 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
      }}>
        <div style={s.introContent}>
          <div style={s.introLabel}>About</div>
          {activeEventCount !== null && (
            <div style={s.liveCount}>
              <span style={{ color: '#ef4444', marginRight: 6 }}>●</span>
              현재 <span style={{ color: '#e2e8f0', fontWeight: 700 }}>{activeEventCount}건</span>의 재난이 진행 중입니다
            </div>
          )}
          <p style={s.introText}>
            Relief Korea는 충북대학교 소프트웨어학부<br />
            <span style={{ color: '#e2e8f0', fontWeight: 600 }}>윤수진, 정준서, 남연서</span>가 만든<br />
            재난 정보 플랫폼입니다.<br /><br />
            지금 어디서 무슨 위험이 발생했는지,<br />
            그 정보가 무엇으로 확인되는지,<br />
            내가 지금 할 수 있는 도움은 있는지.<br /><br />
            재난 현황·공식 정보·복구 단체·후원 링크를<br />
            사건 단위로 묶어 지도 위에 보여줍니다.<br /><br />
            당신의 조그마한 후원이<br />
            누군가의 일상을 되찾는 데 큰 힘이 됩니다.
          </p>
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  root: {
    width: '100%',
    height: '100vh',
    background: '#080b14',
    overflowY: 'scroll',
    position: 'relative',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    color: '#e2e8f0',
  },
  statusBar: {
    position: 'fixed',
    top: 20,
    right: 28,
    display: 'flex',
    gap: 10,
    zIndex: 20,
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
  statusIcon: { fontSize: 18 },
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
  globeFixed: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    pointerEvents: 'none',
  },
  globeWrapper: {
    position: 'relative',
    width: GLOBE_SIZE,
    height: GLOBE_SIZE,
    pointerEvents: 'auto',
  },
  globeFilter: {
    width: '100%',
    height: '100%',
    filter: 'grayscale(1) brightness(1.4) contrast(1.1)',
    animation: 'globeFadeIn 5s ease both',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    textAlign: 'center',
  },
  overlayBg: {
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(13,15,18,0.82) 28%, transparent 65%)',
    pointerEvents: 'none',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  logoText: {
    color: '#4ade80',
    fontWeight: 800,
    fontSize: 30,
    letterSpacing: 0.3,
  },
  desc: {
    fontSize: 15,
    color: '#94a3b8',
    lineHeight: 1.85,
    margin: 0,
  },
  ctaBtn: {
    background: '#16a34a',
    color: '#fff',
    border: 'none',
    borderRadius: 50,
    padding: '13px 38px',
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: 0.5,
    cursor: 'pointer',
    boxShadow: '0 4px 28px rgba(22,163,74,0.45)',
  },
  scrollHint: {
    fontSize: 11,
    color: '#475569',
    letterSpacing: 1,
    marginTop: 4,
    animation: 'scrollBounce 1.5s ease-in-out infinite',
  },
  introPanel: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '62vh',
    borderRadius: '20px 20px 0 0',
    background: 'rgba(13, 17, 23, 0.88)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderBottom: 'none',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    willChange: 'transform',
    overflowY: 'auto',
  },
  introContent: {
    textAlign: 'center',
    maxWidth: 520,
    padding: '32px 24px',
  },
  introLabel: {
    fontSize: 11,
    color: '#4ade80',
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    marginBottom: 16,
    fontWeight: 600,
  },
  liveCount: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  introText: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 2,
    margin: 0,
  },
}
