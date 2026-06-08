import type { DonationRecord, OfficialUpdate, OrganizationAction, RelatedArticle, RiskEvent } from './types'
import {
  mockArticles,
  mockDonationHistory,
  mockEvents,
  mockOfficialUpdates,
  mockOrganizations,
} from './data/mockData'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api'
const NO_STORE: RequestInit = { cache: 'no-store' }
const EVENT_ORG_DISPLAY_LIMIT = 3

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

export async function getEventArticles(eventId: string): Promise<RelatedArticle[]> {
  const mockItems = mockArticles.filter(article => article.event_id === eventId)
  const hasMockEvent = mockEvents.some(event => event.event_id === eventId)

  try {
    const articles = await fetchJson<RelatedArticle[]>(`/events/${encodeURIComponent(eventId)}/articles`)
    return articles.length > 0 || !hasMockEvent ? articles : mockItems
  } catch {
    if (hasMockEvent) return mockItems
    throw new Error('Failed to fetch event articles')
  }
}

export async function getEventUpdates(eventId: string): Promise<OfficialUpdate[]> {
  const mockItems = mockOfficialUpdates.filter(update => update.event_id === eventId)
  const hasMockEvent = mockEvents.some(event => event.event_id === eventId)

  try {
    const updates = await fetchJson<OfficialUpdate[]>(`/events/${encodeURIComponent(eventId)}/updates`)
    return updates.length > 0 || !hasMockEvent ? updates : mockItems
  } catch {
    if (hasMockEvent) return mockItems
    throw new Error('Failed to fetch event updates')
  }
}

export async function getEventOrganizations(eventId: string): Promise<OrganizationAction[]> {
  const mockItems = mockOrganizations.filter(organization => organization.event_id === eventId)
  const hasMockEvent = mockEvents.some(event => event.event_id === eventId)

  try {
    const organizations = await fetchJson<OrganizationAction[]>(`/events/${encodeURIComponent(eventId)}/orgs`)
    return limitEventOrganizations(organizations.length > 0 || !hasMockEvent ? organizations : mockItems)
  } catch {
    if (hasMockEvent) return limitEventOrganizations(mockItems)
    throw new Error('Failed to fetch event organizations')
  }
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
