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
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
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
    <div style={s.root}>
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

      {activeEventCount !== null && (
        <div style={s.statusBarLeft}>
          <div style={s.statusBadge}>
            <span style={s.statusIcon}>⚠️</span>
            <div>
              <div style={s.statusLabel}>ACTIVE ALERTS</div>
              <div style={s.statusValue}>{activeEventCount}건 진행 중</div>
            </div>
          </div>
        </div>
      )}

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
                <div style={s.scrollHint}>스크롤하여 알아보기 &nbsp;↓</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{
        ...s.introPanel,
        transform: `translateY(${(1 - introProgress) * 100}%)`,
        transition: introProgress > 0 ? 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
      }}>
        <div style={s.introContent}>
          <div style={s.introLabel}>About</div>
          <p style={{ ...s.introText, fontSize: 14, color: '#e2e8f0', fontWeight: 600, marginBottom: 16 }}>
            도움의 마음, 행동으로 이어지도록.
          </p>
          <p style={s.introText}>
            재난이 발생했다는 소식을 들었을 때, 우리는 본능적으로 생각합니다.<br />
            "내가 뭔가 도울 수 있을까?"<br />
            하지만 막상 검색창을 열면 수많은 정보들이 쏟아집니다.<br />
            어느 기사가 최신인지, 어떤 후원 단체가 믿을 만한지, 봉사는 어디서 신청해야 하는지—<br />
            정작 돕고 싶은 마음은 있는데, 무엇을 해야 할지 몰라 멈춰버리게 됩니다.
          </p>
          <p style={s.introText}>
            그래서 이 플랫폼을 만들었습니다.<br />
            저희는 충북대학교 소프트웨어학부 윤수진, 정준서, 남연서 세 학생으로 이루어진 Dominator 팀입니다.<br />
            Relief Korea를 통해 지금 한국에서 도움이 필요한 재난을 한눈에 확인하세요.<br />
            검증된 공식 기사와 신뢰할 수 있는 후원·봉사 정보만을 모아 실제 행동에 더 빨리 닿을 수 있도록 도와드립니다.<br />
            흩어진 정보를 찾아 헤매는 대신, 오늘 이 자리에서 바로 도움으로 이어지세요.
          </p>
          <p style={{ ...s.introText, color: '#e2e8f0', fontWeight: 700, marginBottom: 0 }}>
            신뢰할 수 있는 정보, 빠른 연결, 그리고 당신의 선한 마음.<br />
            함께라면 더 많은 곳에 닿을 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  root: {
    width: '100%',
    minHeight: '200vh',
    background: '#080b14',
    position: 'relative',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    color: '#e2e8f0',
  },
  statusBarLeft: {
    position: 'fixed',
    top: 20,
    left: 28,
    display: 'flex',
    gap: 10,
    zIndex: 20,
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
    height: '80vh',
    borderRadius: '20px 20px 0 0',
    background: 'rgba(13, 17, 23, 0.5)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderBottom: 'none',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    willChange: 'transform',
    overflow: 'hidden',
  },
  introContent: {
    textAlign: 'center',
    maxWidth: 780,
    padding: '32px 40px',
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
    fontSize: 13,
    color: '#64748b',
    lineHeight: 1.85,
    margin: '0 0 16px 0',
  },
}
