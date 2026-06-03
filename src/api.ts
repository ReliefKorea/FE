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
const ENABLE_MOCK_FALLBACK = import.meta.env.VITE_ENABLE_MOCK_FALLBACK !== 'false'

function warnFallback(resource: string, error: unknown) {
  if (!ENABLE_MOCK_FALLBACK) return

  const message = error instanceof Error ? error.message : String(error)
  console.warn(`[Relief Korea] ${resource} API unavailable. Using mock data.`, message)
}

async function fetchJson<T>(path: string, resource: string, fallback: () => T): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, NO_STORE)

    if (!response.ok) {
      throw new Error(`Failed to fetch ${resource}: ${response.status}`)
    }

    return response.json() as Promise<T>
  } catch (error) {
    if (!ENABLE_MOCK_FALLBACK) {
      throw error
    }

    warnFallback(resource, error)
    return fallback()
  }
}

function mockEventById(eventId: string): RiskEvent {
  const event = mockEvents.find(item => item.event_id === eventId)

  if (!event) {
    throw new Error('Event not found')
  }

  return event
}

function mockOrgById(orgId: string): OrganizationAction {
  const organization = mockOrganizations.find(item => item.org_id === orgId)

  if (!organization) {
    throw new Error('Organization not found')
  }

  return organization
}

export async function getEvents(): Promise<RiskEvent[]> {
  return fetchJson('/events', 'events', () => mockEvents)
}

export async function getEvent(eventId: string): Promise<RiskEvent> {
  return fetchJson(
    `/events/${encodeURIComponent(eventId)}`,
    'event',
    () => mockEventById(eventId),
  )
}

export async function getEventArticles(eventId: string): Promise<RelatedArticle[]> {
  return fetchJson(
    `/events/${encodeURIComponent(eventId)}/articles`,
    'event articles',
    () => mockArticles.filter(item => item.event_id === eventId),
  )
}

export async function getEventUpdates(eventId: string): Promise<OfficialUpdate[]> {
  return fetchJson(
    `/events/${encodeURIComponent(eventId)}/updates`,
    'event updates',
    () => mockOfficialUpdates.filter(item => item.event_id === eventId),
  )
}

export async function getEventOrganizations(eventId: string): Promise<OrganizationAction[]> {
  return fetchJson(
    `/events/${encodeURIComponent(eventId)}/orgs`,
    'event organizations',
    () => mockOrganizations.filter(item => item.event_id === eventId),
  )
}

export async function getOrg(orgId: string): Promise<OrganizationAction> {
  return fetchJson(
    `/orgs/${encodeURIComponent(orgId)}`,
    'organization',
    () => mockOrgById(orgId),
  )
}

export async function getOrgHistory(orgId: string): Promise<DonationRecord[]> {
  return fetchJson(
    `/orgs/${encodeURIComponent(orgId)}/history`,
    'organization history',
    () => mockDonationHistory.filter(item => item.org_id === orgId),
  )
}
