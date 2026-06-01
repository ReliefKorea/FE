import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { NavigateFunction } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getEvents } from '../api'
import { disasterTypeLabels, disasterTypeIcons, severityConfig, statusConfig } from '../data/mockData'
import type { RiskEvent, DisasterType } from '../types'

// leaflet 기본 아이콘 경로 문제 해결
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const DISASTER_IMAGES: Record<string, string> = {
  wildfire:   'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/2007_california_wildfires.jpg/320px-2007_california_wildfires.jpg',
  typhoon:    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Typhoon_Haiyan_Nov_7_2013_0305Z.jpg/320px-Typhoon_Haiyan_Nov_7_2013_0305Z.jpg',
  earthquake: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Haiti_earthquake_damage.jpg/320px-Haiti_earthquake_damage.jpg',
}

const CATEGORIES: { key: DisasterType | 'all'; label: string; icon: string }[] = [
  { key: 'all',        label: 'All Alerts', icon: '🏠' },
  { key: 'wildfire',   label: '산불',       icon: '🔥' },
  { key: 'typhoon',    label: '태풍',       icon: '🌀' },
  { key: 'earthquake', label: '지진',       icon: '⚡' },
]

const EVENT_REFRESH_INTERVAL_MS = 30000

const KOREA_OPERATION_BOUNDS = {
  minLat: 32,
  maxLat: 43,
  minLng: 124,
  maxLng: 132,
}

const KOREA_REGION_KEYWORDS = [
  '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
  '충청', '전라', '경상'
]

const NON_DOMESTIC_REGION_KEYWORDS = [
  '북한', '일본', '중국', '대만', '괌', '팔라우', '필리핀', '하와이', '칠레', '카리브해'
]

function isInKoreaOperationBounds(event: RiskEvent) {
  return event.center_lat >= KOREA_OPERATION_BOUNDS.minLat
    && event.center_lat <= KOREA_OPERATION_BOUNDS.maxLat
    && event.center_lng >= KOREA_OPERATION_BOUNDS.minLng
    && event.center_lng <= KOREA_OPERATION_BOUNDS.maxLng
}

function hasDomesticRegionName(event: RiskEvent) {
  return KOREA_REGION_KEYWORDS.some(keyword => event.region_name.includes(keyword))
    && !NON_DOMESTIC_REGION_KEYWORDS.some(keyword => event.region_name.includes(keyword))
}

function isDomesticKoreanEvent(event: RiskEvent) {
  return isInKoreaOperationBounds(event) && hasDomesticRegionName(event)
}

function makeIcon(event: RiskEvent) {
  const cfg = severityConfig[event.severity]
  const icon = disasterTypeIcons[event.disaster_type] ?? '⚠️'
  const html = `
    <div style="position:relative;width:40px;height:40px;">
      <div style="
        position:absolute;inset:-4px;border-radius:50%;
        background:${cfg.dotColor};opacity:0.3;
        animation:pulseMarker 2s ease-in-out infinite;
      "></div>
      <div style="
        position:relative;width:40px;height:40px;border-radius:50%;
        background:${cfg.bgColor};border:2px solid ${cfg.dotColor};
        display:flex;align-items:center;justify-content:center;
        font-size:18px;box-shadow:0 0 12px ${cfg.dotColor}88;
      ">${icon}</div>
    </div>`
  return L.divIcon({ html, className: '', iconSize: [40, 40], iconAnchor: [20, 20] })
}

function SmoothKeyboardPan() {
  const map = useMap()

  useEffect(() => {
    const keys = new Set<string>()
    let rafId = 0

    const DIRS: Record<string, [number, number]> = {
      ArrowLeft:  [-1,  0],
      ArrowRight: [ 1,  0],
      ArrowUp:    [ 0, -1],
      ArrowDown:  [ 0,  1],
    }

    function step() {
      if (keys.size === 0) return
      let vx = 0, vy = 0
      for (const key of keys) {
        const d = DIRS[key]
        if (d) { vx += d[0]; vy += d[1] }
      }
      map.panBy([vx * 8, vy * 8], { animate: false, noMoveStart: true })
      rafId = requestAnimationFrame(step)
    }

    function onKeyDown(e: KeyboardEvent) {
      if (!(e.key in DIRS)) return
      e.preventDefault()
      const wasEmpty = keys.size === 0
      keys.add(e.key)
      if (wasEmpty) rafId = requestAnimationFrame(step)
    }

    function onKeyUp(e: KeyboardEvent) {
      keys.delete(e.key)
      if (keys.size === 0) cancelAnimationFrame(rafId)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      cancelAnimationFrame(rafId)
    }
  }, [map])

  return null
}

function MapFocusController({ event }: { event: RiskEvent | null }) {
  const map = useMap()

  useEffect(() => {
    if (!event) return

    map.flyTo([event.center_lat, event.center_lng], Math.max(map.getZoom(), 6), {
      animate: true,
      duration: 0.6,
    })
  }, [event, map])

  return null
}

export default function MapMain() {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState<DisasterType | 'all'>('all')
  const [selectedEvent, setSelectedEvent] = useState<RiskEvent | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [events, setEvents] = useState<RiskEvent[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(true)
  const [eventsError, setEventsError] = useState<string | null>(null)
  const [panelWidth, setPanelWidth] = useState(300)
  const [filterOpen, setFilterOpen] = useState(false)
  const [severityFilter, setSeverityFilter] = useState<Set<string>>(new Set())
  const [helpFilter, setHelpFilter] = useState<Set<string>>(new Set())
  const isResizing = useRef(false)
  const resizeStartX = useRef(0)
  const resizeStartWidth = useRef(0)

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!isResizing.current) return
      const delta = resizeStartX.current - e.clientX
      setPanelWidth(Math.min(520, Math.max(200, resizeStartWidth.current + delta)))
    }
    function onMouseUp() {
      if (!isResizing.current) return
      isResizing.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadEvents() {
      try {
        const nextEvents = await getEvents()

        if (cancelled) return
        setEvents(nextEvents)
        setEventsError(null)
        setSelectedEvent(current => {
          if (!current) return current
          return nextEvents.find(event => event.event_id === current.event_id) ?? null
        })
      } catch (error) {
        if (!cancelled) {
          setEventsError(error instanceof Error ? error.message : '재난 데이터를 불러오지 못했습니다')
        }
      } finally {
        if (!cancelled) {
          setIsLoadingEvents(false)
        }
      }
    }

    loadEvents()
    const refreshTimer = window.setInterval(loadEvents, EVENT_REFRESH_INTERVAL_MS)

    function refreshOnVisible() {
      if (document.visibilityState === 'visible') {
        loadEvents()
      }
    }

    document.addEventListener('visibilitychange', refreshOnVisible)

    return () => {
      cancelled = true
      window.clearInterval(refreshTimer)
      document.removeEventListener('visibilitychange', refreshOnVisible)
    }
  }, [])

  const mapEvents = events.filter(isDomesticKoreanEvent)

  const SEVERITY_MONTHS: Record<string, number> = {
    critical: 6,
    high: 4,
    medium: 2,
    low: 1,
  }

  const [now] = useState(() => Date.now())

  const filteredEvents = mapEvents.filter(e => {
    const matchCat = activeCategory === 'all' || e.disaster_type === activeCategory
    const matchSearch = searchQuery === '' ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.region_name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchSeverity = severityFilter.size === 0 || severityFilter.has(e.severity)
    const matchHelp = helpFilter.size === 0 ||
      (helpFilter.has('donation') && (e.help_status === 'donation_available' || e.help_status === 'both_available')) ||
      (helpFilter.has('volunteer') && (e.help_status === 'volunteer_available' || e.help_status === 'both_available'))
    const months = SEVERITY_MONTHS[e.severity] ?? 1
    const matchAge = (now - new Date(e.started_at).getTime()) <= months * 30 * 24 * 60 * 60 * 1000
    return matchCat && matchSearch && matchSeverity && matchHelp && matchAge
  })

  function toggleSeverity(val: string) {
    setSeverityFilter(prev => {
      const next = new Set(prev)
      next.has(val) ? next.delete(val) : next.add(val)
      return next
    })
  }

  function toggleHelp(val: string) {
    setHelpFilter(prev => {
      const next = new Set(prev)
      next.has(val) ? next.delete(val) : next.add(val)
      return next
    })
  }

  const activeFilterCount = severityFilter.size + helpFilter.size

  const activeCount = mapEvents.filter(e => e.status === 'active').length

  return (
    <div style={s.root}>
      <style>{`
        @keyframes pulseMarker {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.5); opacity: 0.1; }
        }
        .leaflet-container { background: #0d1117; }
        .leaflet-popup-content-wrapper {
          background: #111827;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          color: #e2e8f0;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }
        .leaflet-popup-tip { background: #111827; }
        .leaflet-popup-close-button { color: #64748b !important; }
        .leaflet-control-zoom a {
          background: #0d1117 !important;
          color: #94a3b8 !important;
          border-color: rgba(255,255,255,0.1) !important;
        }
        .leaflet-control-attribution {
          background: rgba(13,17,23,0.8) !important;
          color: #475569 !important;
        }
        .leaflet-control-attribution a { color: #64748b !important; }
        .leaflet-tooltip {
          background: #0d1117 !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.6) !important;
          padding: 8px !important;
          color: #e2e8f0 !important;
        }
        .leaflet-tooltip-top:before {
          border-top-color: rgba(255,255,255,0.1) !important;
        }
      `}</style>

      {/* 상단 헤더 */}
      <header style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.logo} onClick={() => navigate('/')}>
            <span style={s.logoIcon}>⊕</span>
            <span style={s.logoText}>Relief Korea</span>
          </div>
          <nav style={s.navTabs}>
            <button style={{ ...s.navTab, ...s.navTabActive }}>🗺️ Live Map</button>
            <button style={s.navTab} onClick={() => navigate('/admin')}>⚙️ Operator Console</button>
          </nav>
        </div>
        <div style={s.headerRight}>
          <div style={s.liveAlert}>
            <span style={s.liveDot} />
            LIVE ALERTS: {activeCount}
          </div>
          <div style={s.avatar}>👤</div>
        </div>
      </header>

      <div style={s.body}>
        {/* 좌측 카테고리 사이드바 */}
        <aside style={s.sidebar}>
          <div style={s.sidebarSection}>CATEGORIES</div>
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              style={{ ...s.catItem, ...(activeCategory === cat.key ? s.catItemActive : {}) }}
              onClick={() => setActiveCategory(cat.key)}
            >
              <span style={s.catIcon}>{cat.icon}</span>
              <span>{cat.label}</span>
              {activeCategory === cat.key && <div style={s.catActiveBar} />}
            </button>
          ))}

          <div style={s.sidebarDivider} />

          <button style={s.catItem} onClick={() => window.open('https://www.safekorea.go.kr/safekorea-kor/acts/nacts/nationalActionTips.do?menuSn=4', '_blank')}>
            <span style={s.catIcon}>ℹ️</span>
            <span>Emergency Guide</span>
          </button>
        </aside>

        {/* 지도 영역 */}
        <div style={s.mapWrapper}>
          {/* 검색바 */}
          <div style={s.searchBar}>
            <input
              style={s.searchInput}
              placeholder="🔍  지역 또는 재난 유형 검색..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <div style={{ position: 'relative' }}>
              <button
                style={{ ...s.filterBtn, ...(filterOpen || activeFilterCount > 0 ? s.filterBtnActive : {}) }}
                onClick={() => setFilterOpen(v => !v)}
              >
                🔧 필터{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </button>

              {filterOpen && (
                <div style={s.filterPanel}>
                  <div style={s.filterSection}>
                    <div style={s.filterLabel}>위험도</div>
                    <div style={s.filterChips}>
                      {(['critical','high','medium','low'] as const).map(val => {
                        const cfg = severityConfig[val]
                        return (
                          <button
                            key={val}
                            style={{ ...s.chip, ...(severityFilter.has(val) ? { background: cfg.bgColor, border: `1px solid ${cfg.dotColor}`, color: cfg.color } : {}) }}
                            onClick={() => toggleSeverity(val)}
                          >{cfg.label}</button>
                        )
                      })}
                    </div>
                  </div>
                  <div style={s.filterSection}>
                    <div style={s.filterLabel}>구호 가능 여부</div>
                    <div style={s.filterChips}>
                      {([['donation','후원 가능'],['volunteer','봉사 가능']] as [string,string][]).map(([val, label]) => (
                        <button
                          key={val}
                          style={{ ...s.chip, ...(helpFilter.has(val) ? { background: 'rgba(74,222,128,0.15)', border: '1px solid #4ade80', color: '#4ade80' } : {}) }}
                          onClick={() => toggleHelp(val)}
                        >{label}</button>
                      ))}
                    </div>
                  </div>
                  {activeFilterCount > 0 && (
                    <button style={s.filterReset} onClick={() => { setSeverityFilter(new Set()); setHelpFilter(new Set()) }}>
                      초기화
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {(isLoadingEvents || eventsError) && (
            <div style={{ ...s.mapStatus, ...(eventsError ? s.mapStatusError : {}) }}>
              {isLoadingEvents ? '재난 데이터를 불러오는 중...' : eventsError}
            </div>
          )}

          {/* Leaflet 지도 */}
          <MapContainer
            center={[36.5, 127.8]}
            zoom={7}
            style={{ flex: 1, width: '100%' }}
            zoomControl
            keyboard={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
              subdomains="abcd"
              maxZoom={19}
            />
            <MapFocusController event={selectedEvent} />
            <SmoothKeyboardPan />
            <MarkerClusterGroup
              chunkedLoading
              disableClusteringAtZoom={10}
              maxClusterRadius={60}
              iconCreateFunction={(cluster) => {
                const count = cluster.getChildCount()
                return L.divIcon({
                  html: `<div style="
                    width:44px;height:44px;border-radius:50%;
                    background:rgba(13,17,23,0.92);
                    border:2px solid rgba(74,222,128,0.6);
                    display:flex;align-items:center;justify-content:center;
                    flex-direction:column;
                    box-shadow:0 0 14px rgba(74,222,128,0.25);
                    font-family:system-ui,sans-serif;
                  ">
                    <span style="color:#4ade80;font-size:14px;font-weight:700;line-height:1">${count}</span>
                    <span style="color:#64748b;font-size:8px;letter-spacing:0.5px">건</span>
                  </div>`,
                  className: '',
                  iconSize: [44, 44],
                  iconAnchor: [22, 22],
                })
              }}
            >
              {filteredEvents.map(event => (
                <Marker
                  key={event.event_id}
                  position={[event.center_lat, event.center_lng]}
                  icon={makeIcon(event)}
                  eventHandlers={{ click: () => setSelectedEvent(event) }}
                >
                  <Tooltip direction="top" offset={[0, -24]} opacity={1}>
                    <div style={{ width: 180, fontSize: 12, lineHeight: 1.4 }}>
                      <img
                        src={DISASTER_IMAGES[event.disaster_type]}
                        alt={event.disaster_type}
                        style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 4, display: 'block', marginBottom: 6 }}
                      />
                      <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 2 }}>{event.title}</div>
                      <div style={{ color: '#94a3b8' }}>📍 {event.region_name}</div>
                    </div>
                  </Tooltip>
                </Marker>
              ))}
            </MarkerClusterGroup>
          </MapContainer>

          {/* 하단 범례 */}
          <div style={s.bottomBar}>
            {Object.entries(severityConfig).reverse().map(([key, cfg]) => (
              <div key={key} style={s.legendItem}>
                <span style={{ ...s.legendDot, background: cfg.dotColor, boxShadow: `0 0 5px ${cfg.dotColor}` }} />
                {cfg.label}
              </div>
            ))}
            <div style={s.legendSep} />
            <div style={s.legendItem}>
              <span style={{ ...s.legendDot, background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
              KMA CONNECTIVITY &nbsp;<strong style={{ color: '#4ade80' }}>STABLE</strong>
            </div>
          </div>
        </div>

        {/* 우측 패널 */}
        <div style={{ position: 'relative', width: panelWidth, flexShrink: 0, display: 'flex' }}>
          {/* 드래그 핸들 */}
          <div
            style={s.resizeHandle}
            onMouseDown={e => {
              isResizing.current = true
              resizeStartX.current = e.clientX
              resizeStartWidth.current = panelWidth
              document.body.style.cursor = 'col-resize'
              document.body.style.userSelect = 'none'
              e.preventDefault()
            }}
          />
          {selectedEvent ? (
            <EventPanel event={selectedEvent} onClose={() => setSelectedEvent(null)} navigate={navigate} />
          ) : (
            <AlertListPanel events={filteredEvents} onSelect={setSelectedEvent} />
          )}
        </div>
      </div>
    </div>
  )
}

function AlertListPanel({ events, onSelect }: { events: RiskEvent[]; onSelect: (e: RiskEvent) => void }) {
  return (
    <aside style={s.rightPanel}>
      <div style={s.panelHeader}>
        <span style={s.panelBadgeGreen}>최신 알림</span>
        <span style={s.panelCount}>{events.length} active</span>
      </div>
      <div style={{ overflowY: 'auto' as const, flex: 1 }}>
        {events.map(event => {
          const cfg = severityConfig[event.severity]
          const stCfg = statusConfig[event.status]
          return (
            <div key={event.event_id} style={s.alertCard} onClick={() => onSelect(event)}>
              <div style={s.alertCardHeader}>
                <span style={{ ...s.riskBadge, background: cfg.bgColor, color: cfg.color, border: `1px solid ${cfg.color}44` }}>
                  {cfg.label.toUpperCase()} RISK
                </span>
                {(event.help_status === 'donation_available' || event.help_status === 'both_available') && (
                  <span style={s.helpBadge}>♡ 후원 가능</span>
                )}
              </div>
              <div style={s.alertTitle}>{event.title}</div>
              <div style={s.alertMeta}>
                <span>📍 {event.region_name}</span>
                <span style={{ color: stCfg.color }}>● {stCfg.label}</span>
              </div>
              <div style={s.alertSummary}>{event.official_summary}</div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}

function EventPanel({ event, onClose, navigate }: { event: RiskEvent; onClose: () => void; navigate: NavigateFunction }) {
  const cfg = severityConfig[event.severity]
  const startDate = new Date(event.started_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
  const hasDonation = event.help_status === 'donation_available' || event.help_status === 'both_available'
  const hasVolunteer = event.help_status === 'volunteer_available' || event.help_status === 'both_available'

  return (
    <aside style={s.rightPanel}>
      {/* 헤더 */}
      <div style={s.epHeader}>
        <div>
          <div style={s.epRegion}>
            <span style={{ color: '#4ade80', marginRight: 6 }}>📍</span>
            {event.region_name}
          </div>
          <div style={s.epSubtitle}>1건의 재난 사건</div>
        </div>
        <button onClick={onClose} style={s.closeBtn}>✕</button>
      </div>

      {/* 사건 카드 */}
      <div style={{ padding: '16px', overflowY: 'auto' as const, flex: 1 }}>
        <div style={s.epCard}>
          {/* 사건 제목 */}
          <div style={s.epTitle}>{event.title}</div>

          {/* 배지 */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginBottom: 12 }}>
            <span style={{ ...s.epBadge, background: cfg.bgColor, color: cfg.color, border: `1px solid ${cfg.color}66` }}>
              위험도: {cfg.label}
            </span>
            <span style={{ ...s.epBadge, background: 'rgba(22,163,74,0.15)', color: '#4ade80', border: '1px solid rgba(22,163,74,0.3)' }}>
              {disasterTypeLabels[event.disaster_type] ?? event.disaster_type}
            </span>
          </div>

          {/* 발생일 */}
          <div style={s.epRow}>
            <span style={s.epRowIcon}>🗓</span>
            <span style={s.epRowLabel}>발생:</span>
            <span style={s.epRowValue}>{startDate}</span>
          </div>

          {/* 상황 */}
          <div style={s.epRow}>
            <span style={s.epRowIcon}>ℹ️</span>
            <span style={s.epRowText}>{event.official_summary}</span>
          </div>

          {/* 후원/봉사 가능 여부 */}
          {(hasDonation || hasVolunteer) && (
            <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
              {hasDonation && (
                <span style={s.epHelpBadge}>후원 가능</span>
              )}
              {hasVolunteer && (
                <span style={{ ...s.epHelpBadge, background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' }}>
                  봉사 가능
                </span>
              )}
            </div>
          )}

          {/* 자세히 보기 */}
          <button
            style={s.epDetailBtn}
            onClick={() => navigate(`/event/${event.event_id}`)}
          >
            자세히 보기 →
          </button>
        </div>
      </div>
    </aside>
  )
}

const s: Record<string, React.CSSProperties> = {
  root: { display: 'flex', flexDirection: 'column', height: '100vh', background: '#080b14', color: '#e2e8f0', fontFamily: "'Segoe UI', system-ui, sans-serif", overflow: 'hidden' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 56, background: '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.07)', zIndex: 20, flexShrink: 0 },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 24 },
  logo: { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' },
  logoIcon: { width: 28, height: 28, background: 'rgba(22,163,74,0.2)', border: '1px solid rgba(22,163,74,0.4)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#4ade80' },
  logoText: { color: '#4ade80', fontWeight: 700, fontSize: 15 },
  navTabs: { display: 'flex', gap: 4 },
  navTab: { background: 'none', border: 'none', color: '#64748b', fontSize: 13, padding: '6px 14px', borderRadius: 6, cursor: 'pointer' },
  navTabActive: { background: 'rgba(22,163,74,0.12)', color: '#4ade80' },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
  liveAlert: { display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '5px 12px', fontSize: 12, color: '#fca5a5', fontWeight: 600 },
  liveDot: { width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block', boxShadow: '0 0 6px #ef4444' },
  avatar: { width: 32, height: 32, borderRadius: '50%', background: '#1e293b', border: '2px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 },
  body: { display: 'flex', flex: 1, overflow: 'hidden' },
  sidebar: { width: 220, background: '#0d1117', borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', padding: '16px 0', flexShrink: 0, overflowY: 'auto' },
  sidebarSection: { fontSize: 10, color: '#475569', letterSpacing: 2, padding: '0 20px 10px', fontWeight: 600 },
  catItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', background: 'none', border: 'none', color: '#64748b', fontSize: 13, cursor: 'pointer', width: '100%', textAlign: 'left', position: 'relative', transition: 'background 0.15s' },
  catItemActive: { background: 'rgba(22,163,74,0.08)', color: '#bbf7d0' },
  catActiveBar: { position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, background: '#16a34a', borderRadius: '0 2px 2px 0' },
  catIcon: { fontSize: 16, width: 20, textAlign: 'center' },
  sidebarDivider: { height: 1, background: 'rgba(255,255,255,0.06)', margin: '12px 16px' },
  mapWrapper: { flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' },
  searchBar: { position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, display: 'flex', gap: 8, width: '60%', minWidth: 340 },
  searchInput: { flex: 1, background: 'rgba(15,23,42,0.92)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 16px', color: '#e2e8f0', fontSize: 13, outline: 'none', backdropFilter: 'blur(12px)' },
  filterBtn: { background: 'rgba(15,23,42,0.92)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 14px', color: '#94a3b8', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' as const, backdropFilter: 'blur(12px)' },
  filterBtnActive: { border: '1px solid rgba(74,222,128,0.5)', color: '#4ade80' },
  filterPanel: { position: 'absolute' as const, top: 'calc(100% + 8px)', right: 0, width: 240, background: 'rgba(13,17,23,0.97)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px', zIndex: 1100, backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' },
  filterSection: { marginBottom: 14 },
  filterLabel: { fontSize: 10, color: '#64748b', letterSpacing: 1, textTransform: 'uppercase' as const, marginBottom: 8, fontWeight: 600 },
  filterChips: { display: 'flex', flexWrap: 'wrap' as const, gap: 6 },
  chip: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '5px 10px', color: '#94a3b8', fontSize: 12, cursor: 'pointer' },
  filterReset: { width: '100%', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '6px', color: '#64748b', fontSize: 11, cursor: 'pointer', marginTop: 4 },
  mapStatus: { position: 'absolute', top: 68, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: 'rgba(15,23,42,0.92)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '8px 12px', color: '#94a3b8', fontSize: 12, backdropFilter: 'blur(12px)' },
  mapStatusError: { color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(127,29,29,0.72)' },
  bottomBar: { height: 40, background: 'rgba(13,17,23,0.95)', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 20, padding: '0 20px', flexShrink: 0, zIndex: 5 },
  legendItem: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b', letterSpacing: 0.5 },
  legendDot: { width: 8, height: 8, borderRadius: '50%', display: 'inline-block' },
  legendSep: { flex: 1 },
  rightPanel: { flex: 1, background: '#0d1117', borderLeft: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  resizeHandle: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, cursor: 'col-resize', zIndex: 10, background: 'transparent', transition: 'background 0.15s' },
  panelHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.07)' },
  panelBadgeGreen: { fontSize: 11, color: '#4ade80', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 4, padding: '3px 8px', fontWeight: 600, letterSpacing: 0.5 },
  panelCount: { fontSize: 12, color: '#64748b' },
  closeBtn: { background: 'none', border: 'none', color: '#64748b', fontSize: 16, cursor: 'pointer', padding: 4 },
  alertCard: { padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.15s' },
  alertCardHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 },
  riskBadge: { fontSize: 10, padding: '2px 7px', borderRadius: 4, fontWeight: 700, letterSpacing: 0.5 },
  helpBadge: { fontSize: 10, color: '#4ade80', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 4, padding: '2px 7px' },
  alertTitle: { fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 4, lineHeight: 1.4 },
  alertMeta: { display: 'flex', gap: 12, fontSize: 11, color: '#475569', marginBottom: 6 },
  alertSummary: { fontSize: 11, color: '#64748b', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  regionTitle: { fontSize: 22, fontWeight: 700, color: '#e2e8f0', padding: '16px 0 12px' },
  regionStats: { background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 14, marginBottom: 16 },
  statRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#64748b' },
  statValue: { fontSize: 13, fontWeight: 700 },
  ongoingLabel: { fontSize: 10, color: '#475569', letterSpacing: 2, marginBottom: 10, fontWeight: 600 },
  incidentRow: { display: 'flex', alignItems: 'center', gap: 10, background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px', marginBottom: 16, cursor: 'pointer' },
  incidentTitle: { fontSize: 13, fontWeight: 600, color: '#e2e8f0' },
  incidentSub: { fontSize: 11, color: '#64748b', marginTop: 2 },
  emergencyBtn: { width: '100%', background: '#16a34a', border: 'none', borderRadius: 8, padding: '12px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', letterSpacing: 0.3 },

  epHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.07)' },
  epRegion: { fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 },
  epSubtitle: { fontSize: 12, color: '#64748b' },
  epCard: { background: '#1a2236', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px' },
  epTitle: { fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 10, lineHeight: 1.4 },
  epBadge: { fontSize: 11, padding: '3px 9px', borderRadius: 20, fontWeight: 600 },
  epRow: { display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: 10, fontSize: 12 },
  epRowIcon: { fontSize: 13, flexShrink: 0, marginTop: 1 },
  epRowLabel: { color: '#64748b', flexShrink: 0 },
  epRowValue: { color: '#94a3b8' },
  epRowText: { color: '#94a3b8', lineHeight: 1.6 },
  epHelpBadge: { fontSize: 12, padding: '4px 10px', borderRadius: 20, background: 'rgba(74,222,128,0.15)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)', fontWeight: 600 },
  epDetailBtn: { marginTop: 14, background: 'none', border: 'none', color: '#4ade80', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline', textUnderlineOffset: 3 },
}
