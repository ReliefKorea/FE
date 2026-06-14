import type { DonationRecord, EventMedia, OfficialUpdate, OrganizationAction, RelatedArticle, RiskEvent } from './types'
import {
  mockArticles,
  mockDonationHistory,
  mockEvents,
  mockOfficialUpdates,
  mockOrganizations,
} from './data/mockData'
import { API_BASE_URL } from './config'

const NO_STORE: RequestInit = { cache: 'no-store' }
const EVENT_ORG_DISPLAY_LIMIT = 3
const IMAGE_PARAMS = '?auto=format&fit=crop&w=1200&q=82'
const ARTICLE_IMAGE_FALLBACKS = {
  wildfire: [
    `https://images.unsplash.com/photo-1523712999610-f77fbcfc3843${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1547683905-f686c993aae5${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1473448912268-2022ce9509d8${IMAGE_PARAMS}`,
  ],
  earthquake: [
    `https://images.unsplash.com/photo-1518005020951-eccb494ad742${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1469571486292-0ba58a3f068b${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1532629345422-7515f3d16bb6${IMAGE_PARAMS}`,
  ],
  typhoon: [
    `https://images.unsplash.com/photo-1428592953211-077101b2021b${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1500674425229-f692875b0ab7${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1559027615-cd4628902d4a${IMAGE_PARAMS}`,
  ],
  heavy_rain: [
    `https://images.unsplash.com/photo-1428592953211-077101b2021b${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1500674425229-f692875b0ab7${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1593113598332-cd288d649433${IMAGE_PARAMS}`,
  ],
} as const
const ORGANIZATION_IMAGE_FALLBACKS = [
  `https://images.unsplash.com/photo-1469571486292-0ba58a3f068b${IMAGE_PARAMS}`,
  `https://images.unsplash.com/photo-1559027615-cd4628902d4a${IMAGE_PARAMS}`,
  `https://images.unsplash.com/photo-1593113598332-cd288d649433${IMAGE_PARAMS}`,
  `https://images.unsplash.com/photo-1532629345422-7515f3d16bb6${IMAGE_PARAMS}`,
]

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, NO_STORE)

  if (response.status === 404) {
    throw new Error('Not found')
  }

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }

  return response.json() as Promise<T>
}

function limitEventOrganizations(organizations: OrganizationAction[]) {
  return organizations.slice(0, EVENT_ORG_DISPLAY_LIMIT)
}

function stableImageIndex(value: string, length: number) {
  const hash = [...value].reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 0)
  return hash % length
}

function isUsableExternalUrl(value?: string) {
  if (!value || value === '#') return false

  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function articleSearchUrl(article: RelatedArticle) {
  const query = [article.publisher, article.title].filter(Boolean).join(' ')
  return `https://search.naver.com/search.naver?where=news&query=${encodeURIComponent(query)}`
}

function normalizeArticles(articles: RelatedArticle[], event: RiskEvent) {
  const imageOptions = ARTICLE_IMAGE_FALLBACKS[event.disaster_type]

  return articles.map(article => ({
    ...article,
    url: isUsableExternalUrl(article.url) ? article.url : articleSearchUrl(article),
    image_url: article.image_url || imageOptions[stableImageIndex(article.article_id, imageOptions.length)],
  }))
}

function normalizeOrganizations(organizations: OrganizationAction[]) {
  return organizations.map((organization, index) => {
    const fallbackImage = ORGANIZATION_IMAGE_FALLBACKS[index % ORGANIZATION_IMAGE_FALLBACKS.length]

    return {
      ...organization,
      image_url: organization.is_mock_category_recommendation
        ? fallbackImage
        : organization.image_url || fallbackImage,
      image_alt: organization.image_alt || `${organization.org_name} 구호 활동 이미지`,
    }
  })
}

export async function getEvents(): Promise<RiskEvent[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/events`, NO_STORE)
    if (!response.ok) throw new Error(`Failed to fetch events: ${response.status}`)
    const events = await response.json() as RiskEvent[]
    return [...events, ...mockEvents]
  } catch {
    return mockEvents
  }
}

export async function getEvent(eventId: string): Promise<RiskEvent> {
  const mockEvent = mockEvents.find(event => event.event_id === eventId)

  try {
    return await fetchJson<RiskEvent>(`/events/${encodeURIComponent(eventId)}`)
  } catch {
    if (mockEvent) return mockEvent

    throw new Error('Event not found')
  }
}

export async function getEventArticles(event: RiskEvent): Promise<RelatedArticle[]> {
  const eventId = event.event_id
  const mockItems = mockArticles.filter(article => article.event_id === eventId)
  const hasMockEvent = mockEvents.some(item => item.event_id === eventId)

  try {
    const articles = await fetchJson<RelatedArticle[]>(`/events/${encodeURIComponent(eventId)}/articles`)
    return normalizeArticles(articles.length > 0 || !hasMockEvent ? articles : mockItems, event)
  } catch {
    if (hasMockEvent) return normalizeArticles(mockItems, event)
    throw new Error('Failed to fetch event articles')
  }
}

export async function getEventUpdates(eventId: string): Promise<OfficialUpdate[]> {
  const mockItems = mockOfficialUpdates.filter(update => update.event_id === eventId)
  const hasMockEvent = mockEvents.some(event => event.event_id === eventId)

  try {
    const updates = await fetchJson<OfficialUpdate[]>(`/events/${encodeURIComponent(eventId)}/updates`)
    if (!hasMockEvent) return updates

    const seen = new Set<string>()
    return [...updates, ...mockItems].filter(update => {
      if (seen.has(update.update_id)) return false
      seen.add(update.update_id)
      return true
    })
  } catch {
    if (hasMockEvent) return mockItems
    throw new Error('Failed to fetch event updates')
  }
}

function mockRecommendationMetadata(organization: OrganizationAction, event: RiskEvent): OrganizationAction {
  const generatedAt = organization.report_generated_at ?? organization.last_checked_at

  return {
    ...organization,
    category: event.disaster_type,
    region: event.region_name,
    summary: organization.report_summary ?? organization.ai_message ?? organization.activity_summary,
    activities: [organization.activity_type, organization.activity_summary],
    donation_use_cases: [],
    official_url: organization.donation_link ?? organization.volunteer_link,
    source_urls: organization.evidence_sources?.map(source => source.url).filter(Boolean) ?? [],
    last_ragged_at: generatedAt,
    expires_at: new Date(new Date(generatedAt).getTime() + 72 * 60 * 60 * 1000).toISOString(),
    is_mock_category_recommendation: true,
  }
}

export async function getEventOrganizations(event: RiskEvent): Promise<OrganizationAction[]> {
  const eventId = event.event_id
  const mockItems = mockOrganizations
    .filter(organization => organization.event_id === eventId)
    .map(organization => mockRecommendationMetadata(organization, event))
  const hasMockEvent = mockEvents.some(item => item.event_id === eventId)

  try {
    const path = hasMockEvent
      ? `/relief-recommendations?category=${encodeURIComponent(event.disaster_type)}&region=${encodeURIComponent(event.region_name)}`
      : `/events/${encodeURIComponent(eventId)}/orgs`
    const organizations = await fetchJson<OrganizationAction[]>(path)
    return normalizeOrganizations(limitEventOrganizations(organizations.length > 0 || !hasMockEvent ? organizations : mockItems))
  } catch {
    if (hasMockEvent) return normalizeOrganizations(limitEventOrganizations(mockItems))
    throw new Error('Failed to fetch event organizations')
  }
}

export async function getEventMedia(event: RiskEvent): Promise<EventMedia> {
  const hasMockEvent = mockEvents.some(item => item.event_id === event.event_id)
  const params = new URLSearchParams({
    eventId: event.event_id,
    title: event.title,
    category: event.disaster_type,
    region: event.region_name,
    startedAt: event.started_at,
    isMock: String(hasMockEvent),
  })

  return fetchJson<EventMedia>(`/event-media?${params.toString()}`)
}

export async function getOrg(orgId: string): Promise<OrganizationAction> {
  const mockOrganization = mockOrganizations.find(organization => organization.org_id === orgId)

  try {
    return await fetchJson<OrganizationAction>(`/orgs/${encodeURIComponent(orgId)}`)
  } catch {
    if (mockOrganization) return mockOrganization

    throw new Error('Organization not found')
  }
}

export async function getOrgHistory(orgId: string): Promise<DonationRecord[]> {
  const mockOrganization = mockOrganizations.find(organization => organization.org_id === orgId)
  const mockItems = mockDonationHistory.filter(record => record.org_id === orgId)

  try {
    const records = await fetchJson<DonationRecord[]>(`/orgs/${encodeURIComponent(orgId)}/history`)
    return records.length > 0 || !mockOrganization ? records : mockItems
  } catch {
    if (mockOrganization) return mockItems
    throw new Error('Failed to fetch organization history')
  }
}

export interface IngestionRun {
  run_id: string
  started_at: string
  finished_at: string
  status: 'success' | 'partial_failure' | 'failed'
  sources: string[]
  inserted_count: number
  updated_count: number
  skipped_count: number
  error_message: string | null
}

export async function getIngestionStatus(): Promise<{ last_run: IngestionRun | null }> {
  const response = await fetch(`${API_BASE_URL}/ingestion/status`, NO_STORE)

  if (!response.ok) {
    throw new Error(`Failed to fetch ingestion status: ${response.status}`)
  }

  return response.json()
}
