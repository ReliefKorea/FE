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
  if (mockEvent) return mockEvent

  const response = await fetch(`${API_BASE_URL}/events/${encodeURIComponent(eventId)}`, NO_STORE)

  if (response.status === 404) {
    throw new Error('Event not found')
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch event: ${response.status}`)
  }

  return response.json() as Promise<RiskEvent>
}

export async function getEventArticles(eventId: string): Promise<RelatedArticle[]> {
  if (mockEvents.some(event => event.event_id === eventId)) {
    return mockArticles.filter(article => article.event_id === eventId)
  }

  const response = await fetch(`${API_BASE_URL}/events/${encodeURIComponent(eventId)}/articles`, NO_STORE)

  if (!response.ok) {
    throw new Error(`Failed to fetch event articles: ${response.status}`)
  }

  return response.json() as Promise<RelatedArticle[]>
}

export async function getEventUpdates(eventId: string): Promise<OfficialUpdate[]> {
  if (mockEvents.some(event => event.event_id === eventId)) {
    return mockOfficialUpdates.filter(update => update.event_id === eventId)
  }

  const response = await fetch(`${API_BASE_URL}/events/${encodeURIComponent(eventId)}/updates`, NO_STORE)

  if (!response.ok) {
    throw new Error(`Failed to fetch event updates: ${response.status}`)
  }

  return response.json() as Promise<OfficialUpdate[]>
}

export async function getEventOrganizations(eventId: string): Promise<OrganizationAction[]> {
  if (mockEvents.some(event => event.event_id === eventId)) {
    return mockOrganizations.filter(organization => organization.event_id === eventId)
  }

  const response = await fetch(`${API_BASE_URL}/events/${encodeURIComponent(eventId)}/orgs`, NO_STORE)

  if (!response.ok) {
    throw new Error(`Failed to fetch event organizations: ${response.status}`)
  }

  return response.json() as Promise<OrganizationAction[]>
}

export async function getOrg(orgId: string): Promise<OrganizationAction> {
  const mockOrganization = mockOrganizations.find(organization => organization.org_id === orgId)
  if (mockOrganization) return mockOrganization

  const response = await fetch(`${API_BASE_URL}/orgs/${encodeURIComponent(orgId)}`, NO_STORE)

  if (response.status === 404) {
    throw new Error('Organization not found')
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch organization: ${response.status}`)
  }

  return response.json() as Promise<OrganizationAction>
}

export async function getOrgHistory(orgId: string): Promise<DonationRecord[]> {
  if (mockOrganizations.some(organization => organization.org_id === orgId)) {
    return mockDonationHistory.filter(record => record.org_id === orgId)
  }

  const response = await fetch(`${API_BASE_URL}/orgs/${encodeURIComponent(orgId)}/history`, NO_STORE)

  if (!response.ok) {
    throw new Error(`Failed to fetch organization history: ${response.status}`)
  }

  return response.json() as Promise<DonationRecord[]>
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
