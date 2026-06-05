export type DisasterType = 'wildfire' | 'heavy_rain' | 'typhoon' | 'earthquake'
export type Severity = 'low' | 'medium' | 'high' | 'critical'
export type EventStatus = 'active' | 'monitoring' | 'recovery' | 'closed'
export type HelpStatus = 'none' | 'donation_available' | 'volunteer_available' | 'both_available'
export type TrustLevel = 'strong' | 'moderate' | 'limited' | 'needs_review'

export interface EvidenceSource {
  title: string
  url: string
  source_type: string
}

export interface RiskEvent {
  event_id: string
  title: string
  disaster_type: DisasterType
  region_name: string
  center_lat: number
  center_lng: number
  severity: Severity
  status: EventStatus
  started_at: string
  updated_at: string
  official_summary: string
  help_status: HelpStatus
  source_confidence: 'verified' | 'monitoring' | 'unconfirmed'
}

export interface OfficialUpdate {
  update_id: string
  event_id: string
  source_name: string
  source_type: string
  issued_at: string
  title: string
  summary: string
  original_link?: string
}

export interface RelatedArticle {
  article_id: string
  event_id: string
  publisher: string
  title: string
  published_at: string
  summary: string
  url: string
  image_url?: string
}

export interface DonationRecord {
  record_id: string
  org_id: string
  date: string
  title: string
  amount?: string
  beneficiaries?: number
  beneficiaries_label?: string
  region: string
  description: string
  disaster_type?: DisasterType
  evidence_title?: string
  evidence_url?: string
  evidence_source?: string
}

export interface OrgEvidenceSource {
  title: string
  url: string
  source_type: 'official_site' | 'official_report' | 'news' | 'other'
}

export interface OrganizationAction {
  org_id: string
  event_id: string
  org_name: string
  activity_region: string
  activity_type: string
  activity_summary: string
  ai_message?: string
  donation_link?: string
  volunteer_link?: string
  evidence_note: string
  verified_by_admin: boolean
  last_checked_at: string
  ai_report_id?: string
  trust_level?: TrustLevel
  trust_score?: number
  report_summary?: string
  finance_summary?: string
  risk_notes?: string
  evidence_sources?: EvidenceSource[]
  report_generated_at?: string
}
