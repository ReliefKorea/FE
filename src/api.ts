import type { DonationRecord, OfficialUpdate, OrganizationAction, RelatedArticle, RiskEvent } from './types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api'
const NO_STORE: RequestInit = { cache: 'no-store' }

export async function getEvents(): Promise<RiskEvent[]> {
  const response = await fetch(`${API_BASE_URL}/events`, NO_STORE)

  if (!response.ok) {
    throw new Error(`Failed to fetch events: ${response.status}`)
  }

  return response.json() as Promise<RiskEvent[]>
}

export async function getEvent(eventId: string): Promise<RiskEvent> {
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
  const response = await fetch(`${API_BASE_URL}/events/${encodeURIComponent(eventId)}/articles`, NO_STORE)

  if (!response.ok) {
    throw new Error(`Failed to fetch event articles: ${response.status}`)
  }

  return response.json() as Promise<RelatedArticle[]>
}

export async function getEventUpdates(eventId: string): Promise<OfficialUpdate[]> {
  const response = await fetch(`${API_BASE_URL}/events/${encodeURIComponent(eventId)}/updates`, NO_STORE)

  if (!response.ok) {
    throw new Error(`Failed to fetch event updates: ${response.status}`)
  }

  return response.json() as Promise<OfficialUpdate[]>
}

export async function getEventOrganizations(eventId: string): Promise<OrganizationAction[]> {
  const response = await fetch(`${API_BASE_URL}/events/${encodeURIComponent(eventId)}/orgs`, NO_STORE)

  if (!response.ok) {
    throw new Error(`Failed to fetch event organizations: ${response.status}`)
  }

  return response.json() as Promise<OrganizationAction[]>
}

export async function getOrg(orgId: string): Promise<OrganizationAction> {
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
