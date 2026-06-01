import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Globe, { type GlobeMethods } from 'react-globe.gl'

const GLOBE_SIZE = 620
const ALTITUDE = 1.9
// autoRotateSpeed=2.0 → 30s/orbit(360°). 180°=15s → speed=4.0 → ~7.5s
const AUTO_ROTATE_SPEED = -4.0
const STOP_AFTER_MS = 2500

export default function Landing() {
  const navigate = useNavigate()
  const globeRef = useRef<GlobeMethods | undefined>(undefined)
  const animStarted = useRef(false)
  const rafRef = useRef<number>(0)
  const [contentVisible, setContentVisible] = useState(false)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const clock = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(clock)
  }, [])

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const handleGlobeReady = useCallback(() => {
    if (animStarted.current) return
    animStarted.current = true

    const globe = globeRef.current as GlobeMethods
    if (!globe) return

    globe.controls().enableZoom = false
    globe.controls().enableRotate = false
    globe.controls().enablePan = false
    globe.pointOfView({ lat: 25, lng: 0, altitude: ALTITUDE })
    globe.controls().autoRotate = true
    globe.controls().autoRotateSpeed = AUTO_ROTATE_SPEED

    const start = performance.now()

    function tick() {
      const t = Math.min((performance.now() - start) / STOP_AFTER_MS, 1)

      // 60% 이후부터 코사인 곡선으로 감속
      if (t >= 0.6) {
        const phase = (t - 0.6) / 0.4
        globe.controls().autoRotateSpeed = AUTO_ROTATE_SPEED * Math.cos(phase * Math.PI / 2)
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        globe.controls().autoRotate = false
        globe.controls().autoRotateSpeed = 0
        setContentVisible(true)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const pad = (n: number) => String(n).padStart(2, '0')
  const timeStr = `${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}`

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
      `}</style>

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
                <div style={s.logoIcon}>⊕</div>
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
          </div>
        )}
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  root: {
    width: '100%',
    height: '100vh',
    background: '#080b14',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    color: '#e2e8f0',
  },
  statusBar: {
    position: 'absolute',
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
  globeWrapper: {
    position: 'relative',
    width: GLOBE_SIZE,
    height: GLOBE_SIZE,
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
  logoIcon: {
    width: 42,
    height: 42,
    background: 'rgba(22,163,74,0.2)',
    border: '1px solid rgba(22,163,74,0.5)',
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    color: '#4ade80',
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
}
