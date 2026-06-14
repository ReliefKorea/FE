import { useNavigate } from 'react-router-dom'
import type { EventStatus, Severity } from '../types'
import { severityConfig, statusConfig } from '../data/mockData'

export function AppHeader({
  active,
  activeAlerts,
}: {
  active?: 'home' | 'map' | 'admin'
  activeAlerts?: number
}) {
  const navigate = useNavigate()

  return (
    <header className="rk-app-header">
      <button className="rk-brand" type="button" onClick={() => navigate('/')}>
        <span className="rk-brand-mark">R</span>
        <span>Relief Korea</span>
      </button>
      <nav className="rk-app-nav" aria-label="주요 메뉴">
        <button className={active === 'home' ? 'is-active' : ''} type="button" onClick={() => navigate('/')}>서비스 소개</button>
        <button className={active === 'map' ? 'is-active' : ''} type="button" onClick={() => navigate('/map')}>재난 라이브맵</button>
        <button className={active === 'admin' ? 'is-active' : ''} type="button" onClick={() => navigate('/admin')}>운영 콘솔</button>
      </nav>
      <div className="rk-live-alert">진행 중 재난 {activeAlerts ?? 0}건</div>
    </header>
  )
}

export function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description?: string
}) {
  return (
    <div className="rk-section-header">
      <div>
        <span className="rk-eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {description && <p>{description}</p>}
    </div>
  )
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={`rk-severity-badge rk-severity-${severity}`}>
      위험도 {severityConfig[severity].label}
    </span>
  )
}

export function StatusBadge({ status }: { status: EventStatus }) {
  return (
    <span className={`rk-status-badge rk-status-${status}`}>
      {statusConfig[status].label}
    </span>
  )
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="rk-empty-state">{children}</div>
}

export function SkeletonCard() {
  return <div className="rk-skeleton-card" aria-label="불러오는 중" />
}
