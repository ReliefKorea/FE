import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getEvents } from '../api'
import { AppHeader, EmptyState, SeverityBadge, SkeletonCard, StatusBadge } from '../components/DesignSystem'
import { disasterTypeIcons, disasterTypeLabels, severityConfig, timeAgo } from '../data/mockData'
import type { DisasterType, RiskEvent, Severity } from '../types'
import './MapMain.css'

const EVENT_REFRESH_INTERVAL_MS = 30000
const SEVERITY_ORDER: Record<Severity, number> = { critical: 4, high: 3, medium: 2, low: 1 }
const MARKER_SIZE: Record<Severity, number> = { critical: 50, high: 46, medium: 42, low: 38 }

const DISASTER_IMAGES: Record<string, string> = {
  wildfire: 'https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?auto=format&fit=crop&w=700&q=80',
  typhoon: 'https://images.unsplash.com/photo-1428592953211-077101b2021b?auto=format&fit=crop&w=700&q=80',
  earthquake: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=700&q=80',
  heavy_rain: 'https://images.unsplash.com/photo-1500674425229-f692875b0ab7?auto=format&fit=crop&w=700&q=80',
}

const CATEGORIES: { key: DisasterType | 'all'; label: string; icon: string }[] = [
  { key: 'all', label: '전체 재난', icon: '⌖' },
  { key: 'wildfire', label: '산불', icon: '🔥' },
  { key: 'typhoon', label: '태풍', icon: '🌀' },
  { key: 'earthquake', label: '지진', icon: '⚡' },
  { key: 'heavy_rain', label: '호우', icon: '☂' },
]

type MapCluster = {
  getChildCount(): number
}

const KOREA_OPERATION_BOUNDS = {
  minLat: 32,
  maxLat: 43,
  minLng: 124,
  maxLng: 132,
}

const KOREA_REGION_KEYWORDS = [
  '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
  '충청', '전라', '경상',
]

const NON_DOMESTIC_REGION_KEYWORDS = [
  '북한', '일본', '중국', '대만', '괌', '팔라우', '필리핀', '하와이', '칠레', '카리브해',
]

function isDomesticKoreanEvent(event: RiskEvent) {
  const inBounds = event.center_lat >= KOREA_OPERATION_BOUNDS.minLat
    && event.center_lat <= KOREA_OPERATION_BOUNDS.maxLat
    && event.center_lng >= KOREA_OPERATION_BOUNDS.minLng
    && event.center_lng <= KOREA_OPERATION_BOUNDS.maxLng
  const domesticName = KOREA_REGION_KEYWORDS.some(keyword => event.region_name.includes(keyword))
    && !NON_DOMESTIC_REGION_KEYWORDS.some(keyword => event.region_name.includes(keyword))

  return inBounds && domesticName
}

function makeIcon(event: RiskEvent) {
  const config = severityConfig[event.severity]
  const size = MARKER_SIZE[event.severity]
  const icon = disasterTypeIcons[event.disaster_type] ?? '!'
  const html = `
    <div class="disaster-marker disaster-marker-${event.severity}" style="--marker-color:${config.dotColor};width:${size}px;height:${size}px">
      <span>${icon}</span>
    </div>
  `

  return L.divIcon({
    html,
    className: 'disaster-marker-shell',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function MapFocusController({ event }: { event: RiskEvent | null }) {
  const map = useMap()

  useEffect(() => {
    if (!event) return
    map.flyTo([event.center_lat, event.center_lng], Math.max(map.getZoom(), 8), {
      animate: true,
      duration: .65,
    })
  }, [event, map])

  return null
}

export default function MapMain() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<RiskEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<DisasterType | 'all'>('all')
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all')
  const [helpOnly, setHelpOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<RiskEvent | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadEvents() {
      try {
        const nextEvents = await getEvents()
        if (cancelled) return
        setEvents(nextEvents)
        setError(null)
        setSelectedEvent(current => current
          ? nextEvents.find(event => event.event_id === current.event_id) ?? null
          : current)
      } catch {
        if (!cancelled) setError('재난 데이터를 불러오지 못했습니다.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadEvents()
    const timer = window.setInterval(loadEvents, EVENT_REFRESH_INTERVAL_MS)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  const mapEvents = events.filter(isDomesticKoreanEvent)
  const filteredEvents = mapEvents
    .filter(event => {
      const query = searchQuery.trim().toLowerCase()
      const matchesQuery = !query
        || event.title.toLowerCase().includes(query)
        || event.region_name.toLowerCase().includes(query)
      const matchesCategory = activeCategory === 'all' || event.disaster_type === activeCategory
      const matchesSeverity = severityFilter === 'all' || event.severity === severityFilter
      const matchesHelp = !helpOnly || event.help_status !== 'none'
      return matchesQuery && matchesCategory && matchesSeverity && matchesHelp
    })
    .sort((a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity])

  const activeCount = mapEvents.filter(event => event.status === 'active').length

  return (
    <div className="live-map-page">
      <AppHeader active="map" activeAlerts={activeCount} />

      <main className="live-map-main rk-page-shell">
        <div className="live-map-heading">
          <div>
            <span className="rk-eyebrow">실시간 재난 현황</span>
            <h1>재난 라이브맵</h1>
            <p>현재 위치와 위험도를 확인하고, 상세 정보와 필요한 지원 방법으로 이어집니다.</p>
          </div>
          <div className="live-map-heading-metric">
            <span className="rk-live-dot" />
            <div><strong>{activeCount}건</strong><small>현재 대응 진행 중</small></div>
          </div>
        </div>

        <div className="live-map-workspace">
          <section className="map-surface rk-surface-card" aria-label="재난 지도">
            <div className="map-toolbar">
              <label className="map-search">
                <span>⌕</span>
                <input
                  value={searchQuery}
                  onChange={event => setSearchQuery(event.target.value)}
                  placeholder="지역 또는 재난명 검색"
                />
              </label>
              <div className="map-category-chips" aria-label="재난 유형 필터">
                {CATEGORIES.map(category => (
                  <button
                    className={activeCategory === category.key ? 'is-active' : ''}
                    type="button"
                    key={category.key}
                    onClick={() => setActiveCategory(category.key)}
                  >
                    <span>{category.icon}</span>{category.label}
                  </button>
                ))}
              </div>
              <div className="map-secondary-filters">
                <select value={severityFilter} onChange={event => setSeverityFilter(event.target.value as Severity | 'all')} aria-label="위험도 필터">
                  <option value="all">모든 위험도</option>
                  <option value="critical">심각</option>
                  <option value="high">높음</option>
                  <option value="medium">보통</option>
                  <option value="low">낮음</option>
                </select>
                <button className={helpOnly ? 'is-active' : ''} type="button" onClick={() => setHelpOnly(current => !current)}>
                  ♥ 지원 연결 가능
                </button>
              </div>
            </div>

            <div className="map-canvas-wrap">
              {error && <div className="map-message">{error}</div>}
              <MapContainer center={[36.5, 127.8]} zoom={7} className="live-map-canvas" zoomControl>
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; OpenStreetMap &copy; CARTO'
                  subdomains="abcd"
                  maxZoom={19}
                />
                <MapFocusController event={selectedEvent} />
                <MarkerClusterGroup
                  chunkedLoading
                  disableClusteringAtZoom={10}
                  maxClusterRadius={58}
                  iconCreateFunction={(cluster: MapCluster) => {
                    const count = cluster.getChildCount()
                    return L.divIcon({
                      html: `<div class="disaster-cluster"><strong>${count}</strong><span>재난</span></div>`,
                      className: 'disaster-marker-shell',
                      iconSize: [50, 50],
                      iconAnchor: [25, 25],
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
                      <Tooltip className="event-map-tooltip" direction="top" offset={[0, -24]} opacity={1}>
                        <div className="map-tooltip-card">
                          <img src={DISASTER_IMAGES[event.disaster_type]} alt="" />
                          <div>
                            <strong>{event.title}</strong>
                            <span>{event.region_name}</span>
                          </div>
                        </div>
                      </Tooltip>
                    </Marker>
                  ))}
                </MarkerClusterGroup>
              </MapContainer>
            </div>

            <MapLegend />
          </section>

          <aside className="map-side-panel rk-surface-card">
            {selectedEvent
              ? <SelectedEventCard event={selectedEvent} onClose={() => setSelectedEvent(null)} onOpen={() => navigate(`/event/${selectedEvent.event_id}`)} />
              : <EventList events={filteredEvents} isLoading={isLoading} onSelect={setSelectedEvent} />
            }
          </aside>
        </div>
      </main>
    </div>
  )
}

function MapLegend() {
  return (
    <div className="map-legend" aria-label="위험도 범례">
      <strong>위험도 범례</strong>
      {(Object.keys(SEVERITY_ORDER) as Severity[]).reverse().map(severity => (
        <span key={severity}>
          <i style={{ background: severityConfig[severity].dotColor }} />
          {severityConfig[severity].label}
        </span>
      ))}
      <small>마커가 클수록 위험도가 높습니다.</small>
    </div>
  )
}

function EventList({
  events,
  isLoading,
  onSelect,
}: {
  events: RiskEvent[]
  isLoading: boolean
  onSelect: (event: RiskEvent) => void
}) {
  return (
    <>
      <div className="map-panel-heading">
        <div>
          <span className="rk-eyebrow">Current alerts</span>
          <h2>현재 재난 목록</h2>
        </div>
        <strong>{events.length}건</strong>
      </div>
      <div className="map-event-list">
        {isLoading && Array.from({ length: 4 }, (_, index) => <SkeletonCard key={index} />)}
        {!isLoading && events.length === 0 && <EmptyState>조건에 맞는 재난이 없습니다.</EmptyState>}
        {!isLoading && events.map(event => (
          <button className="map-event-card" type="button" key={event.event_id} onClick={() => onSelect(event)}>
            <div className="map-event-card-top">
              <SeverityBadge severity={event.severity} />
              <StatusBadge status={event.status} />
            </div>
            <h3>{event.title}</h3>
            <div className="map-event-location">
              <span>⌖ {event.region_name}</span>
              <time>{timeAgo(event.updated_at)}</time>
            </div>
            <p>{event.official_summary}</p>
            <strong>지도에서 확인하고 상세 보기 <span>→</span></strong>
          </button>
        ))}
      </div>
    </>
  )
}

function SelectedEventCard({
  event,
  onClose,
  onOpen,
}: {
  event: RiskEvent
  onClose: () => void
  onOpen: () => void
}) {
  const hasDonation = event.help_status === 'donation_available' || event.help_status === 'both_available'
  const hasVolunteer = event.help_status === 'volunteer_available' || event.help_status === 'both_available'

  return (
    <div className="selected-event">
      <div className="selected-event-image">
        <img src={DISASTER_IMAGES[event.disaster_type]} alt="" />
        <button type="button" onClick={onClose} aria-label="선택 닫기">×</button>
      </div>
      <div className="selected-event-body">
        <span className="rk-eyebrow">선택한 재난</span>
        <h2>{event.title}</h2>
        <div className="selected-event-badges">
          <SeverityBadge severity={event.severity} />
          <StatusBadge status={event.status} />
          <span className="rk-source-badge">{disasterTypeLabels[event.disaster_type] ?? event.disaster_type}</span>
        </div>
        <div className="selected-event-metric">
          <div><span>위치</span><strong>{event.region_name}</strong></div>
          <div><span>최신 업데이트</span><strong>{timeAgo(event.updated_at)}</strong></div>
        </div>
        <p>{event.official_summary}</p>
        {(hasDonation || hasVolunteer) && (
          <div className="selected-event-support">
            <strong>현재 연결 가능한 지원</strong>
            <span>{[hasDonation && '후원', hasVolunteer && '봉사'].filter(Boolean).join(' · ')}</span>
          </div>
        )}
        <button className="rk-button rk-button-primary" type="button" onClick={onOpen}>
          상세 정보와 지원 방법 보기 <span>→</span>
        </button>
      </div>
    </div>
  )
}
