import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Globe, { type GlobeMethods } from 'react-globe.gl'
import { getEvents } from '../api'
import { AppHeader, SectionHeader, SeverityBadge, SkeletonCard, StatusBadge } from '../components/DesignSystem'
import { disasterTypeIcons, timeAgo } from '../data/mockData'
import type { RiskEvent } from '../types'
import './Landing.css'

const GLOBE_ALTITUDE = 1.85

function globeSizeForViewport() {
  if (typeof window === 'undefined') return 520
  return Math.min(540, Math.max(310, window.innerWidth < 760 ? window.innerWidth - 44 : window.innerWidth * .37))
}

export default function Landing() {
  const navigate = useNavigate()
  const globeRef = useRef<GlobeMethods | undefined>(undefined)
  const [events, setEvents] = useState<RiskEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [globeSize, setGlobeSize] = useState(globeSizeForViewport)

  useEffect(() => {
    getEvents()
      .then(setEvents)
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    const onResize = () => setGlobeSize(globeSizeForViewport())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const handleGlobeReady = useCallback(() => {
    const globe = globeRef.current
    if (!globe) return
    const controls = globe.controls()
    controls.enablePan = false
    controls.enableZoom = false
    controls.autoRotate = true
    controls.autoRotateSpeed = .35
    globe.pointOfView({ lat: 36, lng: 128, altitude: GLOBE_ALTITUDE }, 900)
  }, [])

  const activeEvents = events.filter(event => event.status === 'active')
  const urgentEvents = [...events]
    .sort((a, b) => {
      const order = { critical: 4, high: 3, medium: 2, low: 1 }
      return order[b.severity] - order[a.severity]
    })
    .slice(0, 3)

  return (
    <div className="landing-page">
      <AppHeader active="home" activeAlerts={activeEvents.length} />

      <main>
        <section className="landing-hero rk-page-shell">
          <div className="landing-hero-copy">
            <span className="rk-eyebrow">재난 정보에서 실제 도움까지</span>
            <h1>
              <span className="landing-hero-nowrap">도움이 필요한 순간,</span><br />
              <em className="landing-hero-nowrap">마음이 길을 잃지 않도록</em>
            </h1>
            <p>
              지금 한국에서 발생한 재난을 한눈에 확인하고, 공식 정보와 검증 가능한 지원 방법을 따라
              가장 필요한 곳에 빠르게 마음을 전하세요.
            </p>
            <div className="landing-actions">
              <button className="rk-button rk-button-primary" type="button" onClick={() => navigate('/map')}>
                현재 재난 확인하기 <span>→</span>
              </button>
              <a className="rk-button rk-button-secondary" href="#how-it-works">서비스 알아보기</a>
            </div>
            <div className="landing-trust-row">
              <span>공식 출처 우선</span>
              <span>30초 단위 업데이트</span>
              <span>후원 근거 자료 확인</span>
            </div>
          </div>

          <div className="landing-visual" aria-label="한국 주변 재난 모니터링">
            <div className="landing-globe">
              <Globe
                ref={globeRef}
                width={globeSize}
                height={globeSize}
                backgroundColor="rgba(0,0,0,0)"
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
                showAtmosphere
                atmosphereColor="#74d7bb"
                atmosphereAltitude={.13}
                onGlobeReady={handleGlobeReady}
              />
            </div>
            <div className="landing-live-card">
              <div><span className="rk-live-dot" /> 실시간 재난 모니터링</div>
              <strong>{activeEvents.length}건</strong>
              <small>현재 대응이 진행 중입니다</small>
            </div>
            <div className="landing-visual-note">
              <strong>정보를 확인하고,</strong>
              <span>도움이 필요한 현장으로 연결합니다.</span>
            </div>
          </div>
        </section>

        <section className="landing-metrics rk-page-shell" aria-label="서비스 현황">
          <div><strong>{events.length}</strong><span>확인 가능한 재난</span></div>
          <div><strong>{activeEvents.length}</strong><span>진행 중 재난</span></div>
          <div><strong>공식 출처</strong><span>우선 연결 원칙</span></div>
          <div><strong>한 번에</strong><span>상황 확인부터 지원까지</span></div>
        </section>

        <section className="landing-section rk-page-shell" id="how-it-works">
          <SectionHeader
            eyebrow="Why Relief Korea"
            title="돕고 싶은 마음이 행동으로 이어지는 데 필요한 것"
            description="흩어진 재난 정보와 지원 방법을 하나의 흐름으로 정리해, 사용자가 판단하고 행동하는 시간을 줄입니다."
          />
          <div className="landing-value-grid">
            <article className="landing-value-card rk-surface-card">
              <span>01</span>
              <div className="landing-value-icon">⌖</div>
              <h3>지금 어디가 위험한지</h3>
              <p>라이브맵에서 위치, 위험도, 진행 상태를 한눈에 살펴봅니다.</p>
            </article>
            <article className="landing-value-card rk-surface-card">
              <span>02</span>
              <div className="landing-value-icon">✓</div>
              <h3>무엇을 믿어야 하는지</h3>
              <p>공식 리포트와 관련 보도, 공개 근거를 함께 확인합니다.</p>
            </article>
            <article className="landing-value-card rk-surface-card">
              <span>03</span>
              <div className="landing-value-icon">♥</div>
              <h3>어떻게 힘을 보탤지</h3>
              <p>재난별로 연결 가능한 후원과 지원 방법을 확인하고 행동합니다.</p>
            </article>
          </div>
        </section>

        <section className="landing-section landing-alerts-section">
          <div className="rk-page-shell">
            <SectionHeader
              eyebrow="Live alerts"
              title="지금 확인이 필요한 재난"
              description="가장 위험도가 높은 재난부터 살펴보고 상세 정보와 지원 방법으로 이어집니다."
            />
            <div className="landing-alert-grid">
              {isLoading && Array.from({ length: 3 }, (_, index) => <SkeletonCard key={index} />)}
              {!isLoading && urgentEvents.map(event => (
                <button className="landing-alert-card rk-surface-card" type="button" key={event.event_id} onClick={() => navigate(`/event/${event.event_id}`)}>
                  <div className="landing-alert-top">
                    <span className="landing-disaster-icon">{disasterTypeIcons[event.disaster_type] ?? '!'}</span>
                    <SeverityBadge severity={event.severity} />
                  </div>
                  <h3>{event.title}</h3>
                  <div className="landing-alert-meta">
                    <span>{event.region_name}</span>
                    <StatusBadge status={event.status} />
                  </div>
                  <p>{event.official_summary}</p>
                  <strong>상세 정보와 지원 방법 보기 <span>→</span></strong>
                  <small>마지막 갱신 {timeAgo(event.updated_at)}</small>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-cta rk-page-shell">
          <div>
            <span className="rk-eyebrow">마음이 닿는 가장 빠른 길</span>
            <h2>오늘 필요한 도움을<br />지금 확인해 보세요.</h2>
            <p>정확한 정보는 안전한 판단으로, 따뜻한 마음은 실제 지원으로 이어집니다.</p>
          </div>
          <button className="rk-button rk-button-primary" type="button" onClick={() => navigate('/map')}>
            재난 라이브맵 열기 <span>→</span>
          </button>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="rk-page-shell">
          <strong>Relief Korea</strong>
          <span>공식 출처와 공개 근거를 중심으로 재난 정보와 지원 방법을 연결합니다.</span>
        </div>
      </footer>
    </div>
  )
}
