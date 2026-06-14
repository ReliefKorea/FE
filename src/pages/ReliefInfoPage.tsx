import { useEffect, useMemo, useState, type SyntheticEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getOrg, getOrgHistory } from '../api'
import { AppHeader, EmptyState, SkeletonCard } from '../components/DesignSystem'
import type { DonationRecord, OrganizationAction } from '../types'
import {
  categoryPresentation,
  formatOrgDate,
  isOrgDataStale,
  orgCategory,
  orgLastUpdated,
  trustPresentation,
} from '../utils/orgPresentation'
import './OrgPages.css'

type SourceFilter = 'all' | 'official' | 'organization' | 'news' | 'weather' | 'other'
type ReliefSource = {
  id: string
  title: string
  url?: string
  type: SourceFilter
  typeLabel: string
  trustLabel: string
  summary: string
  checkedAt: string
  important: boolean
}

const SOURCE_FILTERS: { key: SourceFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'official', label: '공식 기관' },
  { key: 'organization', label: '구호단체' },
  { key: 'news', label: '뉴스' },
  { key: 'weather', label: '기상 정보' },
]

const ACTIVITY_TIMELINE = [
  ['재난 발생 직후', '현장 상황과 필요한 지원을 확인합니다.'],
  ['긴급 대피 및 구조', '안전한 대피 공간과 긴급 구조 활동을 지원합니다.'],
  ['식수와 식량 지원', '대피 생활에 필요한 기본 물품을 전달합니다.'],
  ['임시 주거 지원', '집으로 돌아가기 어려운 가정을 위한 거처를 연결합니다.'],
  ['의료 및 심리 지원', '신체적·정서적 회복에 필요한 지원을 이어갑니다.'],
  ['복구와 재건', '지역과 가정이 일상을 회복하도록 장기 지원합니다.'],
] as const

function classifySource(sourceType = '', title = ''): Pick<ReliefSource, 'type' | 'typeLabel' | 'trustLabel' | 'important'> {
  const value = `${sourceType} ${title}`.toLowerCase()
  if (value.includes('weather') || value.includes('기상')) {
    return { type: 'weather', typeLabel: '기상 특보', trustLabel: '공식 출처', important: true }
  }
  if (value.includes('news')) {
    return { type: 'news', typeLabel: '뉴스', trustLabel: '뉴스 출처', important: false }
  }
  if (value.includes('official_report') || value.includes('government') || value.includes('정부') || value.includes('공공')) {
    return { type: 'official', typeLabel: '공식 기관·보고서', trustLabel: '검증된 출처', important: true }
  }
  if (value.includes('official_site') || value.includes('organization') || value.includes('단체')) {
    return { type: 'organization', typeLabel: '구호단체', trustLabel: '구호단체 출처', important: true }
  }
  return { type: 'other', typeLabel: '공개 근거', trustLabel: '공개 출처', important: false }
}

function buildSources(org: OrganizationAction, records: DonationRecord[]): ReliefSource[] {
  const checkedAt = formatOrgDate(orgLastUpdated(org))
  const sources: ReliefSource[] = []
  const seen = new Set<string>()

  const add = (title: string, url: string | undefined, sourceType: string, summary: string) => {
    const key = url || `${title}:${sourceType}`
    if (!title || seen.has(key)) return
    seen.add(key)
    sources.push({ id: key, title, url, summary, checkedAt, ...classifySource(sourceType, title) })
  }

  org.evidence_sources?.forEach(source => add(source.title, source.url, source.source_type, '추천 요약과 신뢰도 판단에 참고한 공개 근거입니다.'))
  org.source_urls?.forEach((url, index) => add(`추가 공개 출처 ${index + 1}`, url, 'other', '구호 활동과 지원 채널을 확인하는 데 참고한 출처입니다.'))
  if (org.official_url) add(`${org.org_name} 공식 페이지`, org.official_url, 'official_site', '단체의 공식 활동과 지원 채널을 확인할 수 있습니다.')
  records.forEach(record => {
    if (record.evidence_url) add(record.evidence_title ?? record.title, record.evidence_url, record.evidence_source ?? 'official_report', record.description)
  })

  return sources
}

export default function ReliefInfoPage() {
  const { orgId } = useParams()
  const navigate = useNavigate()
  const [org, setOrg] = useState<OrganizationAction | null>(null)
  const [records, setRecords] = useState<DonationRecord[]>([])
  const [filter, setFilter] = useState<SourceFilter>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!orgId) return

    Promise.allSettled([getOrg(orgId), getOrgHistory(orgId)])
      .then(([orgResult, historyResult]) => {
        if (cancelled) return
        if (orgResult.status === 'rejected') {
          setError('구호단체 정보를 불러오지 못했습니다.')
          return
        }
        setOrg(orgResult.value)
        setRecords(historyResult.status === 'fulfilled' ? historyResult.value : [])
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [orgId])

  const sources = useMemo(() => org ? buildSources(org, records) : [], [org, records])
  const visibleSources = filter === 'all' ? sources : sources.filter(source => source.type === filter)

  if (isLoading) return <ReliefInfoLoading />
  if (error || !org) return <ReliefInfoError text={error ?? '구호단체 정보를 찾을 수 없습니다.'} onBack={() => navigate(-1)} />

  const category = orgCategory(org)
  const content = categoryPresentation[category]
  const activities = org.activities?.length ? org.activities : content.fallbackActivities
  const useCases = org.donation_use_cases?.length ? org.donation_use_cases : content.fallbackUseCases
  const images = [org.image_url, ...content.fallbackImages]
    .filter((value, index, list): value is string => Boolean(value) && list.indexOf(value) === index)
    .slice(0, 3)
  const trust = trustPresentation[org.trust_level ?? 'needs_review']
  const lastUpdated = orgLastUpdated(org)
  const hasRagContent = Boolean(org.ai_report_id || org.report_summary || org.evidence_sources?.length || org.source_urls?.length)
  const recommendationBasis = org.is_mock_category_recommendation
    ? '재난 카테고리와 지역 기반 추천'
    : org.ai_report_id
      ? '현재 재난 사건 기반 RAG 추천'
      : '공개 활동과 지원 채널 기반 추천'
  const evidenceDetails = [
    { label: '추천 이유', value: org.report_summary ?? org.summary ?? org.activity_summary, source: sources[0]?.title },
    { label: '후원금 사용처와 공개 지표', value: org.finance_summary ?? '공개된 후원금 사용처와 지표를 확인 중입니다.', source: sources.find(source => source.type === 'official')?.title },
    { label: '확인 기준과 제한', value: org.risk_notes ?? trust.description, source: sources[1]?.title },
    { label: '추천 기준', value: `${recommendationBasis} · ${org.activity_region}`, source: org.evidence_note },
  ]

  return (
    <div className="org-page relief-info-page">
      <AppHeader active="map" />
      <main>
        <section className="relief-info-hero">
          <img
            src={images[0]}
            alt={org.image_alt || `${org.org_name} 구호 활동`}
            onError={event => applyImageFallback(event, content.fallbackImages[1] ?? content.fallbackImages[0])}
          />
          <div className="relief-info-hero-shade" />
          <div className="rk-page-shell relief-info-hero-grid">
            <div className="relief-info-hero-copy">
              <button className="org-back-link" type="button" onClick={() => navigate(-1)}>← 이전 화면</button>
              <span className="rk-eyebrow">구호 활동과 근거</span>
              <h1>신뢰할 수 있는<br />구호 정보를 한눈에</h1>
              <p>추천된 구호단체의 활동, 후원금 사용처, 그리고 정보의 출처를 한 화면에서 확인할 수 있습니다.</p>
              <div className="org-hero-badges">
                <span>{content.label} 구호</span>
                <span>{org.activity_region}</span>
                <span>{recommendationBasis}</span>
                <span>마지막 업데이트 {formatOrgDate(lastUpdated)}</span>
              </div>
            </div>
            <article className="evidence-score-card">
              <span>공개 근거 신뢰도</span>
              <strong>{org.trust_score ?? '확인 중'}{typeof org.trust_score === 'number' && <small>/100</small>}</strong>
              <h2>{trust.label}</h2>
              <p>{trust.description}</p>
              <div><span>확인 가능한 출처</span><time>{sources.length}개</time></div>
            </article>
          </div>
        </section>

        <div className="rk-page-shell org-page-body">
          {isOrgDataStale(org) && <div className="org-refresh-note">정보 유효기간이 지나 최신 RAG 갱신을 요청했습니다. 갱신 실패 시 마지막 캐시를 유지합니다.</div>}

          {!hasRagContent && (
            <section className="org-fallback-state">
              <strong>현재 구호단체 정보를 확인 중입니다.</strong>
              <span>공식 출처 확인 후 추천 정보가 업데이트됩니다.</span>
              <span>지금은 일반적인 재난 구호 활동 정보를 안내합니다.</span>
              <span>확인된 출처가 추가되면 이 페이지가 업데이트됩니다.</span>
            </section>
          )}

          <section className="relief-summary-grid">
            <article className="relief-recommendation-card rk-surface-card">
              <span className="rk-eyebrow">추천 요약</span>
              <div className="relief-recommendation-heading">
                <div><small>{recommendationBasis}</small><h2>{org.org_name}</h2></div>
                <span className={`relief-trust-badge trust-${org.trust_level ?? 'needs_review'}`}>{trust.label}</span>
              </div>
              <dl>
                <div><dt>추천 이유</dt><dd>{org.report_summary ?? org.summary ?? org.activity_summary}</dd></div>
                <div><dt>주요 활동</dt><dd>{org.activity_summary}</dd></div>
                <div><dt>후원 연결</dt><dd>{org.finance_summary ?? '공식 활동 목적과 일반적인 재난 구호 사용처를 바탕으로 안내합니다.'}</dd></div>
              </dl>
              <div className="relief-card-actions">
                {org.official_url && <a className="rk-button rk-button-secondary" href={org.official_url} target="_blank" rel="noreferrer">공식 페이지 열기</a>}
                <a className="rk-button rk-button-secondary" href="#sources">출처 확인하기 ↓</a>
              </div>
            </article>

            <article className="activity-empathy-card">
              <span className="rk-eyebrow">함께 만드는 회복</span>
              <blockquote>{content.emotionalCopy}</blockquote>
              {org.donation_link && <a className="rk-button rk-button-primary" href={org.donation_link} target="_blank" rel="noreferrer">이 구호 활동 후원하기 →</a>}
            </article>
          </section>

          <section className="org-section">
            <OrgSectionHeading eyebrow="Relief activities" title="현장에서 이어지는 구호 활동" description="단체가 공개한 활동과 재난 대응에 필요한 주요 지원 항목을 함께 보여줍니다." />
            <div className="activity-card-grid">
              {activities.map((activity, index) => (
                <article className="activity-card rk-surface-card" key={`${activity}-${index}`}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <div>{['⌂', '▣', '✚', '↗'][index % 4]}</div>
                  <h3>{activity}</h3>
                  <p>{index === 0 ? org.activity_summary : `${org.activity_region}의 ${content.label} 대응과 회복 과정에 필요한 활동입니다.`}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="org-section">
            <OrgSectionHeading eyebrow="Donation use" title="후원은 이런 도움으로 이어질 수 있습니다" description="구체적인 가격을 임의로 만들지 않고 공개 활동 목적과 일반적인 구호 사용처를 안내합니다." />
            <div className="use-case-grid">
              {useCases.map((useCase, index) => (
                <article className="use-case-card" key={useCase}>
                  <span>{['◉', '⌂', '▤', '✚', '▦', '⌁'][index % 6]}</span>
                  <strong>{useCase}</strong>
                </article>
              ))}
            </div>
          </section>

          <section className="org-section activity-timeline-section">
            <OrgSectionHeading eyebrow="Recovery journey" title="긴급 대응에서 일상 회복까지" description="재난 직후의 긴급구호부터 지역 재건까지 지원은 단계적으로 이어집니다." />
            <div className="activity-timeline">
              {ACTIVITY_TIMELINE.map(([title, description], index) => (
                <article key={title}>
                  <div><span>{index + 1}</span></div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="org-section">
            <OrgSectionHeading eyebrow="Activity records" title="공개된 활동 기록" description="단체와 공개 자료에서 확인 가능한 활동 기록을 표시합니다." />
            {records.length === 0
              ? <EmptyState>현재 공개된 활동 기록을 확인 중입니다.</EmptyState>
              : <div className="activity-record-list">
                {records.map(record => (
                  <article className="activity-record-card rk-surface-card" key={record.record_id}>
                    <time>{record.date}</time>
                    <h3>{record.title}</h3>
                    <span>{record.region}</span>
                    <p>{record.description}</p>
                    <div>
                      {record.amount && <strong>{record.amount}</strong>}
                      {record.beneficiaries && <strong>{record.beneficiaries_label ?? '공개 지원 규모'} {record.beneficiaries.toLocaleString()}</strong>}
                    </div>
                    {record.evidence_url && <a href={record.evidence_url} target="_blank" rel="noreferrer">활동 근거 원문 보기 →</a>}
                  </article>
                ))}
              </div>
            }
          </section>

          <section className="org-section" id="sources">
            <OrgSectionHeading eyebrow="Evidence & sources" title="추천과 활동을 뒷받침하는 근거" description="후원 전에 추천 이유와 공개 출처를 확인할 수 있도록 활동 정보와 구분해 정리했습니다." />
            <div className="evidence-metrics">
              <div><strong>{sources.filter(source => source.type === 'official').length}</strong><span>공식 기관 출처</span></div>
              <div><strong>{sources.filter(source => source.type === 'news').length}</strong><span>뉴스 출처</span></div>
              <div><strong>{sources.filter(source => source.type === 'organization').length}</strong><span>구호단체 공식 링크</span></div>
              <div><strong>{trust.label}</strong><span>현재 신뢰 상태</span></div>
            </div>
            <div className="evidence-filter-chips" aria-label="출처 유형 필터">
              {SOURCE_FILTERS.map(item => <button className={filter === item.key ? 'is-active' : ''} type="button" key={item.key} onClick={() => setFilter(item.key)}>{item.label}</button>)}
            </div>
            {visibleSources.length === 0
              ? <EmptyState>확인된 출처가 추가되면 이 페이지가 업데이트됩니다.</EmptyState>
              : <div className="evidence-source-grid">
                {visibleSources.map(source => (
                  <article className={`evidence-source-card rk-surface-card ${source.important ? 'is-important' : ''}`} key={source.id}>
                    <div><span>{source.typeLabel}</span><strong>{source.trustLabel}</strong></div>
                    <h3>{source.title}</h3>
                    <p>{source.summary}</p>
                    <time>확인일 {source.checkedAt}</time>
                    {source.url
                      ? <a className="rk-button rk-button-secondary" href={source.url} target="_blank" rel="noreferrer">원문 출처 열기 ↗</a>
                      : <span className="evidence-no-link">원문 링크 확인 중</span>
                    }
                  </article>
                ))}
              </div>
            }
          </section>

          <section className="org-section">
            <OrgSectionHeading eyebrow="AI evidence summary" title="정보 항목별 핵심 근거" description="AI가 참고한 핵심 내용과 연결된 출처를 항목별로 표시합니다." />
            <div className="evidence-detail-list">
              {evidenceDetails.map(detail => (
                <article className="evidence-detail-card" key={detail.label}>
                  <span>{detail.label}</span>
                  <p>{detail.value}</p>
                  <div><strong>연결 근거</strong><span>{detail.source ?? '공개 근거 확인 중'}</span></div>
                </article>
              ))}
            </div>
          </section>

          <section className="org-link-panel">
            <div>
              <span className="rk-eyebrow">공식 정보와 후원 채널</span>
              <h2>근거를 확인한 뒤, 마음을 전하세요.</h2>
              <p>신뢰도 점수는 단체의 선악 평가가 아니라 공개 근거의 충실도와 재난 대응 적합성을 나타냅니다.</p>
            </div>
            <div>
              {org.official_url && <a className="rk-button rk-button-secondary" href={org.official_url} target="_blank" rel="noreferrer">공식 페이지</a>}
              {org.donation_link && <a className="rk-button rk-button-primary" href={org.donation_link} target="_blank" rel="noreferrer">피해 주민 돕기 →</a>}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

function OrgSectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return <div className="org-section-heading"><div><span className="rk-eyebrow">{eyebrow}</span><h2>{title}</h2></div>{description && <p>{description}</p>}</div>
}

function ReliefInfoLoading() {
  return <div className="org-page"><AppHeader /><main className="rk-page-shell org-loading-page"><SkeletonCard /><SkeletonCard /><p>구호 활동과 공개 근거를 확인하고 있습니다.</p></main></div>
}

function ReliefInfoError({ text, onBack }: { text: string; onBack: () => void }) {
  return <div className="org-page"><AppHeader /><main className="rk-page-shell org-error-page"><EmptyState>{text}<button className="rk-button rk-button-secondary" type="button" onClick={onBack}>이전 화면으로</button></EmptyState></main></div>
}

function applyImageFallback(event: SyntheticEvent<HTMLImageElement>, fallbackUrl: string) {
  const image = event.currentTarget
  if (image.dataset.fallbackApplied === 'true') return
  image.dataset.fallbackApplied = 'true'
  image.src = fallbackUrl
}
