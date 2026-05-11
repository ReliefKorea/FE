import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockEvents, disasterTypeLabels, disasterTypeIcons, severityConfig, statusConfig } from '../data/mockData'
import type { RiskEvent, DisasterType } from '../types'

declare global {
  interface Window { kakao: any }
}

const CATEGORIES: { key: DisasterType | 'all'; label: string; icon: string }[] = [
  { key: 'all',        label: 'All Alerts', icon: '🏠' },
  { key: 'wildfire',   label: 'Wildfires',  icon: '🔥' },
  { key: 'typhoon',    label: 'Typhoons',   icon: '🌀' },
  { key: 'flood',      label: 'Floods',     icon: '🌊' },
  { key: 'heavy_rain', label: 'Heavy Rain', icon: '🌧️' },
  { key: 'earthquake', label: 'Earthquakes',icon: '⚡' },
]

export default function MapMain() {
  const navigate = useNavigate()
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  const [activeCategory, setActiveCategory] = useState<DisasterType | 'all'>('all')
  const [selectedEvent, setSelectedEvent] = useState<RiskEvent | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredEvents = mockEvents.filter(e => {
    const matchCat = activeCategory === 'all' || e.disaster_type === activeCategory
    const matchSearch = searchQuery === '' ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.region_name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCat && matchSearch
  })

  // 지도 초기화
  useEffect(() => {
    const initMap = () => {
      window.kakao.maps.load(() => {
        if (!mapContainer.current) return
        const map = new window.kakao.maps.Map(mapContainer.current, {
          center: new window.kakao.maps.LatLng(36.5, 127.8),
          level: 8,
        })
        mapRef.current = map
        renderMarkers(map, mockEvents)
      })
    }
    if (window.kakao) initMap()
    else {
      const script = document.querySelector('script[src*="dapi.kakao.com"]') as HTMLScriptElement
      if (script) script.addEventListener('load', initMap)
    }
  }, [])

  // 필터 변경 시 마커 갱신
  useEffect(() => {
    if (mapRef.current) renderMarkers(mapRef.current, filteredEvents)
  }, [filteredEvents.length, activeCategory, searchQuery])

  function renderMarkers(map: any, events: RiskEvent[]) {
    markersRef.current.forEach(m => m.setMap(null))
    markersRef.current = []

    events.forEach(event => {
      const cfg = severityConfig[event.severity]
      const content = `
        <div style="position:relative;cursor:pointer;">
          <div style="
            position:absolute;inset:0;border-radius:50%;
            background:${cfg.dotColor};opacity:0.4;
            animation:pulseMarker 2s ease-in-out infinite;
          "></div>
          <div style="
            position:relative;width:36px;height:36px;border-radius:50%;
            background:${cfg.bgColor};border:2px solid ${cfg.dotColor};
            display:flex;align-items:center;justify-content:center;
            font-size:16px;box-shadow:0 0 12px ${cfg.dotColor}55;
          ">${disasterTypeIcons[event.disaster_type] ?? '⚠️'}</div>
        </div>`

      const marker = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(event.center_lat, event.center_lng),
        content,
        zIndex: event.severity === 'critical' ? 10 : 5,
      })
      marker.setMap(map)

      // 클릭 이벤트는 DOM에 직접
      setTimeout(() => {
        const el = marker.getContent()
        if (el && typeof el !== 'string') {
          el.addEventListener('click', () => setSelectedEvent(event))
        }
      }, 100)

      markersRef.current.push(marker)
    })
  }

  const activeCount = mockEvents.filter(e => e.status === 'active').length

  return (
    <div style={s.root}>
      {/* 상단 헤더 */}
      <header style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.logo} onClick={() => navigate('/')}>
            <span style={s.logoIcon}>⊕</span>
            <span style={s.logoText}>재난지도</span>
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
              style={{
                ...s.catItem,
                ...(activeCategory === cat.key ? s.catItemActive : {}),
              }}
              onClick={() => setActiveCategory(cat.key)}
            >
              <span style={s.catIcon}>{cat.icon}</span>
              <span>{cat.label}</span>
              {activeCategory === cat.key && <div style={s.catActiveBar} />}
            </button>
          ))}

          <div style={s.sidebarDivider} />

          <button style={s.catItem} onClick={() => navigate('/map')}>
            <span style={s.catIcon}>🗺️</span>
            <span>Map View</span>
          </button>
          <button style={s.catItem}>
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
            <button style={s.myRegionBtn}>📍 My Region</button>
            <button style={s.filterBtn}>⚡</button>
          </div>

          {/* 카카오 지도 */}
          <div ref={mapContainer} style={s.map} />

          {/* 하단 상태 바 */}
          <div style={s.bottomBar}>
            <div style={s.legendItem}><span style={{ ...s.legendDot, background: '#c084fc' }} />CRITICAL</div>
            <div style={s.legendItem}><span style={{ ...s.legendDot, background: '#f87171' }} />HIGH</div>
            <div style={s.legendItem}><span style={{ ...s.legendDot, background: '#fb923c' }} />MODERATE</div>
            <div style={s.legendItem}><span style={{ ...s.legendDot, background: '#facc15' }} />LOW</div>
            <div style={s.legendSep} />
            <div style={s.legendItem}>
              <span style={{ ...s.legendDot, background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
              KMA CONNECTIVITY &nbsp;<strong style={{ color: '#4ade80' }}>STABLE</strong>
            </div>
          </div>
        </div>

        {/* 우측 패널 - 사건 선택 시 표시 */}
        {selectedEvent ? (
          <EventPanel event={selectedEvent} onClose={() => setSelectedEvent(null)} navigate={navigate} />
        ) : (
          <AlertListPanel events={filteredEvents} onSelect={setSelectedEvent} />
        )}
      </div>
    </div>
  )
}

// 우측: 알림 목록 패널
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

// 우측: 사건 상세 패널
function EventPanel({ event, onClose, navigate }: { event: RiskEvent; onClose: () => void; navigate: any }) {
  const cfg = severityConfig[event.severity]
  return (
    <aside style={s.rightPanel}>
      <div style={s.panelHeader}>
        <span style={s.panelBadgeGreen}>LIVE REGION FOCUS</span>
        <button onClick={onClose} style={s.closeBtn}>✕</button>
      </div>

      <div style={{ padding: '0 16px 16px', overflowY: 'auto' as const, flex: 1 }}>
        <div style={s.regionTitle}>
          <span style={{ color: '#4ade80', marginRight: 6 }}>✈</span>
          {event.region_name}
        </div>

        <div style={s.regionStats}>
          <div style={s.statRow}>
            <span style={s.statLabel}>Active Alerts</span>
            <span style={{ ...s.statValue, color: cfg.color }}>1</span>
          </div>
          <div style={s.statRow}>
            <span style={s.statLabel}>Risk Level</span>
            <span style={{ ...s.statValue, color: cfg.color }}>{cfg.label.toUpperCase()}</span>
          </div>
          <div style={{ height: 4, background: '#1e293b', borderRadius: 2, marginTop: 6 }}>
            <div style={{
              height: '100%', borderRadius: 2, background: cfg.color,
              width: event.severity === 'critical' ? '100%' : event.severity === 'high' ? '75%' : event.severity === 'medium' ? '50%' : '25%',
              transition: 'width 0.5s',
            }} />
          </div>
        </div>

        <div style={s.ongoingLabel}>ONGOING INCIDENTS</div>
        <div style={s.incidentRow} onClick={() => navigate(`/event/${event.event_id}`)}>
          <span style={{ fontSize: 18 }}>{disasterTypeIcons[event.disaster_type]}</span>
          <div style={{ flex: 1 }}>
            <div style={s.incidentTitle}>{event.title}</div>
            <div style={s.incidentSub}>{event.official_summary.slice(0, 40)}...</div>
          </div>
          <span style={{ color: '#475569' }}>›</span>
        </div>

        <button style={s.emergencyBtn} onClick={() => navigate(`/event/${event.event_id}`)}>
          🛡️ &nbsp; 상세 정보 및 후원 보기
        </button>
      </div>
    </aside>
  )
}

const s: Record<string, React.CSSProperties> = {
  root: { display: 'flex', flexDirection: 'column', height: '100vh', background: '#080b14', color: '#e2e8f0', fontFamily: "'Segoe UI', system-ui, sans-serif", overflow: 'hidden' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 56, background: '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.07)', zIndex: 20, flexShrink: 0 },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 24 },
  logo: { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' },
  logoIcon: { width: 28, height: 28, background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#818cf8' },
  logoText: { color: '#818cf8', fontWeight: 700, fontSize: 15 },
  navTabs: { display: 'flex', gap: 4 },
  navTab: { background: 'none', border: 'none', color: '#64748b', fontSize: 13, padding: '6px 14px', borderRadius: 6, cursor: 'pointer' },
  navTabActive: { background: 'rgba(99,102,241,0.12)', color: '#818cf8' },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
  liveAlert: { display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '5px 12px', fontSize: 12, color: '#fca5a5', fontWeight: 600 },
  liveDot: { width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block', boxShadow: '0 0 6px #ef4444' },
  avatar: { width: 32, height: 32, borderRadius: '50%', background: '#1e293b', border: '2px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 },
  body: { display: 'flex', flex: 1, overflow: 'hidden' },
  sidebar: { width: 220, background: '#0d1117', borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', padding: '16px 0', flexShrink: 0, overflowY: 'auto' },
  sidebarSection: { fontSize: 10, color: '#475569', letterSpacing: 2, padding: '0 20px 10px', fontWeight: 600 },
  catItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', background: 'none', border: 'none', color: '#64748b', fontSize: 13, cursor: 'pointer', width: '100%', textAlign: 'left', position: 'relative', transition: 'background 0.15s' },
  catItemActive: { background: 'rgba(99,102,241,0.08)', color: '#c7d2fe' },
  catActiveBar: { position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, background: '#4f46e5', borderRadius: '0 2px 2px 0' },
  catIcon: { fontSize: 16, width: 20, textAlign: 'center' },
  sidebarDivider: { height: 1, background: 'rgba(255,255,255,0.06)', margin: '12px 16px' },
  mapWrapper: { flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' },
  searchBar: { position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 15, display: 'flex', gap: 8, width: '60%', minWidth: 340 },
  searchInput: { flex: 1, background: 'rgba(15,23,42,0.92)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 16px', color: '#e2e8f0', fontSize: 13, outline: 'none', backdropFilter: 'blur(12px)' },
  myRegionBtn: { background: 'rgba(15,23,42,0.92)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 14px', color: '#94a3b8', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap', backdropFilter: 'blur(12px)' },
  filterBtn: { background: 'rgba(15,23,42,0.92)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 14px', color: '#94a3b8', fontSize: 14, cursor: 'pointer', backdropFilter: 'blur(12px)' },
  map: { flex: 1, width: '100%' },
  bottomBar: { height: 40, background: 'rgba(13,17,23,0.95)', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 20, padding: '0 20px', flexShrink: 0, zIndex: 5 },
  legendItem: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b', letterSpacing: 0.5 },
  legendDot: { width: 8, height: 8, borderRadius: '50%', display: 'inline-block' },
  legendSep: { flex: 1 },
  rightPanel: { width: 300, background: '#0d1117', borderLeft: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', flexShrink: 0 },
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
}
