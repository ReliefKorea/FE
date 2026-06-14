import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getEvent, getEventArticles, getEventMedia, getEventOrganizations, getEventUpdates } from '../api'
import { mockEvents, severityConfig, statusConfig, timeAgo } from '../data/mockData'
import type { EventMedia, OfficialUpdate, OrganizationAction, RelatedArticle, RiskEvent } from '../types'
import { AppHeader } from '../components/DesignSystem'
import { disasterImageFor } from '../utils/disasterMedia'
import './EventDetail.css'

const ARTICLE_REFRESH_INTERVAL_MS = 30000

const categoryContent = {
  wildfire: {
    eyebrow: '산불 긴급구호',
    emotionalCopy: '집을 떠나 대피한 가족에게 오늘 밤 머물 곳과 다시 시작할 생활 기반이 필요합니다.',
    cta: '산불 피해 주민 돕기',
    needs: ['임시 거처', '식수와 생필품', '주거 복구', '심리 회복'],
  },
  earthquake: {
    eyebrow: '지진 긴급구호',
    emotionalCopy: '무너진 일상 속에서도 다시 일어설 수 있도록, 지금의 차분하고 지속적인 지원이 필요합니다.',
    cta: '지진 피해 주민 돕기',
    needs: ['안전한 대피 공간', '긴급 생활 물품', '주거 안전 점검', '지역 복구'],
  },
  typhoon: {
    eyebrow: '태풍 긴급구호',
    emotionalCopy: '젖은 옷과 차가운 바닥 위에서 밤을 보내는 이들에게 따뜻한 도움과 안전한 쉼터가 필요합니다.',
    cta: '태풍 피해 주민 돕기',
    needs: ['대피소 물품', '식수와 위생용품', '긴급 생계', '침수 주거 복구'],
  },
  heavy_rain: {
    eyebrow: '호우 긴급구호',
    emotionalCopy: '젖은 옷과 차가운 바닥 위에서 밤을 보내는 이들에게 따뜻한 도움과 안전한 쉼터가 필요합니다.',
    cta: '수해 피해 주민 돕기',
    needs: ['대피소 물품', '식수와 위생용품', '긴급 생계', '침수 주거 복구'],
  },
} as const

const trustLabels = {
  strong: '근거 충분',
  moderate: '근거 확인',
  limited: '근거 제한',
  needs_review: '추가 확인 필요',
} as const

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function mediaFallback(event: RiskEvent): EventMedia {
  return {
    image_url: disasterImageFor(event),
    image_alt: `${event.title} 관련 구호 활동 이미지`,
    image_source_name: '카테고리 기본 이미지',
    image_source_url: 'https://unsplash.com',
    is_fallback: true,
    fetched_at: event.updated_at,
    expires_at: event.updated_at,
  }
}

function sourceConfidenceLabel(event: RiskEvent) {
  if (event.source_confidence === 'verified') return '공식 출처 확인'
  if (event.source_confidence === 'monitoring') return '출처 모니터링 중'
  return '출처 확인 중'
}

function organizationSummary(org: OrganizationAction) {
  return org.summary ?? org.report_summary ?? org.ai_message ?? org.activity_summary
}

export default function EventDetail() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState<RiskEvent | null>(null)
  const [media, setMedia] = useState<EventMedia | null>(null)
  const [updates, setUpdates] = useState<OfficialUpdate[]>([])
  const [articles, setArticles] = useState<RelatedArticle[]>([])
  const [organizations, setOrganizations] = useState<OrganizationAction[]>([])
  const [eventError, setEventError] = useState<string | null>(null)
  const [isLoadingEvent, setIsLoadingEvent] = useState(true)
  const [isLoadingContent, setIsLoadingContent] = useState(true)
  const [heroLoaded, setHeroLoaded] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [copyDone, setCopyDone] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadEvent() {
      if (!eventId) return
      setIsLoadingEvent(true)

      try {
        const nextEvent = await getEvent(eventId)
        if (!cancelled) {
          setEvent(nextEvent)
          setEventError(null)
        }
      } catch {
        if (!cancelled) setEventError('재난 정보를 불러오지 못했습니다.')
      } finally {
        if (!cancelled) setIsLoadingEvent(false)
      }
    }

    loadEvent()
    return () => { cancelled = true }
  }, [eventId])

  useEffect(() => {
    if (!event) return
    let cancelled = false
    let articleTimer = 0

    async function loadContent() {
      setIsLoadingContent(true)
      const results = await Promise.allSettled([
        getEventUpdates(event!.event_id),
        getEventArticles(event!),
        getEventOrganizations(event!),
        getEventMedia(event!),
      ])

      if (cancelled) return
      const [updatesResult, articlesResult, orgsResult, mediaResult] = results
      if (updatesResult.status === 'fulfilled') setUpdates(updatesResult.value)
      if (articlesResult.status === 'fulfilled') setArticles(articlesResult.value)
      if (orgsResult.status === 'fulfilled') setOrganizations(orgsResult.value)
      setMedia(mediaResult.status === 'fulfilled' ? mediaResult.value : mediaFallback(event!))
      setIsLoadingContent(false)

      articleTimer = window.setInterval(async () => {
        try {
          const nextArticles = await getEventArticles(event!)
          if (!cancelled) setArticles(nextArticles)
        } catch {
          // Keep the last successful feed during transient refresh failures.
        }
      }, ARTICLE_REFRESH_INTERVAL_MS)
    }

    loadContent()
    return () => {
      cancelled = true
      window.clearInterval(articleTimer)
    }
  }, [event])

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href)
    setCopyDone(true)
    window.setTimeout(() => setCopyDone(false), 1800)
  }

  if (isLoadingEvent) {
    return <div className="detail-state"><div className="state-spinner" /><p>재난 정보를 확인하고 있습니다.</p></div>
  }

  if (eventError || !event) {
    return (
      <div className="detail-state">
        <strong>{eventError ?? '사건을 찾을 수 없습니다.'}</strong>
        <button type="button" onClick={() => navigate('/map')}>지도로 돌아가기</button>
      </div>
    )
  }

  const content = categoryContent[event.disaster_type]
  const severity = severityConfig[event.severity]
  const status = statusConfig[event.status]
  const heroMedia = media ?? mediaFallback(event)
  const activeAlerts = mockEvents.filter(item => item.status === 'active').length
  const supportUpdatedAt = organizations
    .map(org => org.last_ragged_at ?? org.report_generated_at ?? org.last_checked_at)
    .sort()
    .at(-1)
  const featuredOrganization = organizations[0]
  const additionalOrganizations = organizations.slice(1)

  return (
    <div className="event-detail">
      <AppHeader active="map" activeAlerts={activeAlerts} />

      <main>
        <section className="event-hero">
          <div className={`hero-image-skeleton ${heroLoaded ? 'is-loaded' : ''}`} />
          <img
            className={`hero-image ${heroLoaded ? 'is-loaded' : ''}`}
            src={heroMedia.image_url}
            alt={heroMedia.image_alt}
            onLoad={() => setHeroLoaded(true)}
            onError={() => {
              setMedia(mediaFallback(event))
              setHeroLoaded(true)
            }}
          />
          <div className="hero-shade" />
          <div className="hero-content page-shell">
            <button className="back-link" type="button" onClick={() => navigate('/map')}>재난 지도로 돌아가기</button>
            <div className="hero-grid">
              <div>
                <div className="hero-badges">
                  <span className="category-badge">{content.eyebrow}</span>
                  <span className="severity-badge" style={{ color: severity.color, background: severity.bgColor }}>
                    위험도 {severity.label}
                  </span>
                </div>
                <h1>{event.title}</h1>
                <div className="hero-meta">
                  <span>{event.region_name}</span>
                  <span style={{ color: status.color }}>{status.label}</span>
                  <span>마지막 갱신 {timeAgo(event.updated_at)}</span>
                </div>
                <p className="hero-summary">{event.official_summary}</p>
                <div className="hero-actions">
                  <button className="rk-button rk-button-primary primary-cta" type="button" onClick={() => document.querySelector('#support-relief')?.scrollIntoView({ behavior: 'smooth' })}>
                    {content.cta}
                  </button>
                  <button className="rk-button secondary-cta" type="button" onClick={() => setShareOpen(true)}>정보 공유하기</button>
                </div>
              </div>
              <aside className="hero-empathy">
                <p>{content.emotionalCopy}</p>
                <small>작은 후원도 대피소 물품과 생활 회복 지원으로 이어질 수 있습니다.</small>
              </aside>
            </div>
            {!heroMedia.is_fallback && heroMedia.image_source_url && (
              <a className="image-source" href={heroMedia.image_source_url} target="_blank" rel="noreferrer">
                이미지 출처: {heroMedia.image_source_name}
              </a>
            )}
          </div>
        </section>

        <div className="detail-sheet">
          <div className="page-shell detail-body">
            <section className="impact-strip" aria-label="지원 현황 요약">
              <div><strong>{updates.length}</strong><span>공식 리포트</span></div>
              <div><strong>{articles.length}</strong><span>관련 보도</span></div>
              <div><strong>{organizations.length}</strong><span>추천 구호단체</span></div>
              <div><strong>{sourceConfidenceLabel(event)}</strong><span>정보 신뢰 상태</span></div>
            </section>

            <section className="content-section official-section">
              <div className="section-heading">
                <div><span>공식 정보</span><h2>공식 리포트 및 행동 지침</h2></div>
                <p>정부·지자체·공공기관 원문을 우선 제공합니다.</p>
              </div>
              <div className="official-grid">
                {isLoadingContent && <LoadingCards count={3} />}
                {!isLoadingContent && updates.map(update => (
                  <a className="official-card" key={update.update_id} href={update.original_link || '#'} target="_blank" rel="noreferrer">
                    <div><span>{update.source_name}</span><time>{timeAgo(update.issued_at)}</time></div>
                    <h3>{update.title}</h3>
                    <p>{update.summary}</p>
                    <strong>공식 원문 확인</strong>
                  </a>
                ))}
                {!isLoadingContent && updates.length === 0 && <EmptyState text="등록된 공식 리포트가 없습니다." />}
              </div>
            </section>

            <div className="detail-layout">
              <div className="detail-main-column">
                <section className="needs-panel">
                  <div>
                    <span>필요한 지원</span>
                    <h2>{event.region_name}의 회복에 필요한 것</h2>
                    <p>대피 직후의 기본 생활부터 다시 일상을 세우는 과정까지 도움이 이어집니다.</p>
                  </div>
                  <ul>{content.needs.map(need => <li key={need}>{need}</li>)}</ul>
                </section>

                <section className="content-section">
                  <div className="section-heading">
                    <div><span>상황 업데이트</span><h2>관련 뉴스 피드</h2></div>
                    <p>새로운 보도는 30초마다 갱신합니다.</p>
                  </div>
                  <div className="news-list">
                    {isLoadingContent && <LoadingCards count={3} />}
                    {!isLoadingContent && articles.map(article => (
                      <a
                        className={`news-card ${article.image_url ? '' : 'news-card-no-image'}`}
                        key={article.article_id}
                        href={article.url}
                        aria-label={`${article.title} 기사로 이동`}
                      >
                        {article.image_url && <img src={article.image_url} alt="" loading="lazy" />}
                        <div>
                          <div className="news-meta"><span>{article.publisher}</span><time>{timeAgo(article.published_at)}</time></div>
                          <h3>{article.title}</h3>
                          <p>{article.summary}</p>
                          <strong>기사 전문 보기 →</strong>
                        </div>
                      </a>
                    ))}
                    {!isLoadingContent && articles.length === 0 && <EmptyState text="관련 뉴스가 아직 없습니다." />}
                  </div>
                </section>
              </div>

              <aside className="support-column" id="support-relief">
                <div className="support-intro">
                  <span>Support relief</span>
                  <h2>검증 가능한 후원으로<br />회복에 힘을 보태세요.</h2>
                  <p>{content.emotionalCopy}</p>
                  <div className="support-trust">
                    <strong>AI 근거 자료 확인</strong>
                    <span>공개 활동, 후원 채널, 사용처 근거를 분석했습니다.</span>
                    {supportUpdatedAt && <time>마지막 분석 {formatDateTime(supportUpdatedAt)}</time>}
                  </div>
                  {featuredOrganization?.donation_link && (
                    <a className="support-primary-action" href={featuredOrganization.donation_link} target="_blank" rel="noreferrer">
                      <strong>{content.cta}</strong>
                      <span>{featuredOrganization.org_name} 공식 후원 페이지로 이동 <b>→</b></span>
                    </a>
                  )}
                </div>

                <div className="organization-list">
                  {isLoadingContent && <LoadingCards count={1} />}
                  {!isLoadingContent && featuredOrganization && (
                    <OrganizationCard
                      org={featuredOrganization}
                      heroImage={heroMedia.image_url}
                      cta={content.cta}
                      onInfo={orgId => navigate(`/org/${orgId}/info`)}
                      featured
                    />
                  )}
                  {!isLoadingContent && organizations.length === 0 && <EmptyState text="현재 연결 가능한 후원 단체를 확인 중입니다." />}
                </div>
              </aside>
            </div>

            {additionalOrganizations.length > 0 && (
              <section className="additional-support">
                <div className="section-heading">
                  <div><span>카테고리 기반 구호 네트워크</span><h2>함께 살펴볼 수 있는 지원 단체</h2></div>
                </div>
                <div className="additional-support-grid">
                  {additionalOrganizations.map(org => (
                    <OrganizationCard
                      key={org.org_id}
                      org={org}
                      heroImage={heroMedia.image_url}
                      cta={content.cta}
                      onInfo={orgId => navigate(`/org/${orgId}/info`)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>

      <footer className="detail-footer"><span>© 2026 Relief Korea</span><span>공식 출처와 공개 근거를 중심으로 정보를 제공합니다.</span></footer>

      {shareOpen && (
        <div className="share-overlay" onClick={() => setShareOpen(false)}>
          <div className="share-dialog" onClick={event => event.stopPropagation()}>
            <button className="share-close" type="button" onClick={() => setShareOpen(false)}>닫기</button>
            <span>재난 정보 공유</span>
            <h2>{event.title}</h2>
            <p>정확한 재난 정보와 검증 가능한 지원 방법을 함께 알려주세요.</p>
            <button className="rk-button rk-button-primary primary-cta" type="button" onClick={copyLink}>{copyDone ? '링크를 복사했습니다' : '링크 복사하기'}</button>
          </div>
        </div>
      )}
    </div>
  )
}

function LoadingCards({ count }: { count: number }) {
  return <>{Array.from({ length: count }, (_, index) => <div className="loading-card" key={index} />)}</>
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty-state">{text}</div>
}

function OrganizationCard({
  org,
  heroImage,
  cta,
  onInfo,
  featured = false,
}: {
  org: OrganizationAction
  heroImage: string
  cta: string
  onInfo: (orgId: string) => void
  featured?: boolean
}) {
  return (
    <article className={`organization-card ${featured ? 'organization-card-featured' : ''}`}>
      <div className="organization-image">
        <img src={org.image_url || heroImage} alt={org.image_alt || `${org.org_name} 구호 활동`} loading="lazy" />
        <span>{org.is_mock_category_recommendation ? '카테고리 기반 추천' : '재난 대응 추천'}</span>
      </div>
      <div className="organization-body">
        <div className="organization-title">
          <div><small>{org.activity_type}</small><h3>{org.org_name}</h3></div>
          {org.trust_level && <span className={`trust-badge trust-${org.trust_level}`}>{trustLabels[org.trust_level]}</span>}
        </div>
        <p className="organization-summary">{organizationSummary(org)}</p>
        {(org.donation_use_cases?.length ?? 0) > 0 && (
          <div className="use-cases">
            <strong>후원금 사용 가능 영역</strong>
            <ul>{org.donation_use_cases!.slice(0, 3).map(item => <li key={item}>{item}</li>)}</ul>
          </div>
        )}
        <div className="organization-footer">
          <button type="button" onClick={() => onInfo(org.org_id)}>구호 정보 보기</button>
          {org.donation_link && (
            <a className="donate-action" href={org.donation_link} target="_blank" rel="noreferrer">
              <span>{cta}</span><b>→</b>
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
