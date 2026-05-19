import type { RiskEvent, OfficialUpdate, RelatedArticle, OrganizationAction, DonationRecord } from '../types'

export const mockEvents: RiskEvent[] = [
  {
    event_id: 'evt-001',
    title: '강원도 대형 산불 확산',
    disaster_type: 'wildfire',
    region_name: '강원도',
    center_lat: 37.8228,
    center_lng: 128.1555,
    severity: 'critical',
    status: 'active',
    started_at: '2026-05-10T06:30:00',
    updated_at: '2026-05-12T02:00:00',
    official_summary: '강풍으로 인해 화재 진압에 난항. 인근 주민들은 지정된 대피소로 즉시 이동 바랍니다.',
    help_status: 'both_available',
    source_confidence: 'verified',
  },
  {
    event_id: 'evt-002',
    title: '부산 집중 호우 특보',
    disaster_type: 'heavy_rain',
    region_name: '부산',
    center_lat: 35.1796,
    center_lng: 129.0756,
    severity: 'high',
    status: 'active',
    started_at: '2026-05-11T18:00:00',
    updated_at: '2026-05-12T01:30:00',
    official_summary: '시간당 80mm 이상 강우 예상. 저지대 침수 및 산사태 위험 지역 주민 대피 권고.',
    help_status: 'donation_available',
    source_confidence: 'verified',
  },
  {
    event_id: 'evt-003',
    title: '경북 산사태 위험',
    disaster_type: 'landslide',
    region_name: '경상북도',
    center_lat: 36.4919,
    center_lng: 128.8889,
    severity: 'high',
    status: 'monitoring',
    started_at: '2026-05-11T12:00:00',
    updated_at: '2026-05-12T00:00:00',
    official_summary: '연속된 강우로 토양 포화 상태. 취약 지역 주민 사전 대피 권고.',
    help_status: 'none',
    source_confidence: 'verified',
  },
  {
    event_id: 'evt-004',
    title: '제주 태풍 영향권',
    disaster_type: 'typhoon',
    region_name: '제주도',
    center_lat: 33.4996,
    center_lng: 126.5312,
    severity: 'medium',
    status: 'monitoring',
    started_at: '2026-05-11T08:00:00',
    updated_at: '2026-05-11T22:00:00',
    official_summary: '태풍 북상으로 강풍 및 높은 파도 예상. 해안가 접근 금지.',
    help_status: 'none',
    source_confidence: 'monitoring',
  },
  {
    event_id: 'evt-005',
    title: '충남 가뭄 위기',
    disaster_type: 'drought',
    region_name: '충청남도',
    center_lat: 36.5184,
    center_lng: 126.8000,
    severity: 'medium',
    status: 'recovery',
    started_at: '2026-04-01T00:00:00',
    updated_at: '2026-05-10T10:00:00',
    official_summary: '지속적인 가뭄으로 농업 피해 심각. 용수 공급 지원 중.',
    help_status: 'volunteer_available',
    source_confidence: 'verified',
  },
  {
    event_id: 'evt-006',
    title: '인천 강풍 경보',
    disaster_type: 'strong_wind',
    region_name: '인천',
    center_lat: 37.4563,
    center_lng: 126.7052,
    severity: 'low',
    status: 'monitoring',
    started_at: '2026-05-12T00:00:00',
    updated_at: '2026-05-12T02:00:00',
    official_summary: '최대 순간풍속 25m/s 예상. 시설물 관리 및 야외활동 자제 권고.',
    help_status: 'none',
    source_confidence: 'verified',
  },
]

export const mockOfficialUpdates: OfficialUpdate[] = [
  {
    update_id: 'upd-001',
    event_id: 'evt-001',
    source_name: '강원소방본부',
    source_type: '긴급재난문자',
    issued_at: '2026-05-12T01:55:00',
    title: '소방령 제3단계 발령. 가용 인력 100% 동원',
    summary: '소방령 제3단계 발령. 가용 인력 100% 동원 및 전국 소방력 지원 요청 중.',
    original_link: 'https://www.nfa.go.kr',
  },
  {
    update_id: 'upd-002',
    event_id: 'evt-001',
    source_name: '기상청',
    source_type: '기상특보',
    issued_at: '2026-05-12T00:30:00',
    title: '해당 지역 건조경보 및 강풍주의보 유지',
    summary: '해당 지역 건조경보 및 강풍주의보 유지. 최대 풍속 초속 15m 내외 예상.',
    original_link: 'https://www.kma.go.kr',
  },
  {
    update_id: 'upd-003',
    event_id: 'evt-001',
    source_name: '국가재난관리본부',
    source_type: '긴급재난문자',
    issued_at: '2026-05-11T14:20:00',
    title: '고성군 토성면 주민 전원 대피령 발령',
    summary: '고성군 토성면 주민 전원 대피령 발령. 고성생활체육관 및 인근 학교 대피소 운영.',
  },
  {
    update_id: 'upd-004',
    event_id: 'evt-002',
    source_name: '기상청',
    source_type: '기상특보',
    issued_at: '2026-05-11T17:00:00',
    title: '부산·경남 호우경보 발령',
    summary: '부산·경남 전역 호우경보. 시간당 80mm 이상 강우로 저지대 침수 위험.',
    original_link: 'https://www.kma.go.kr',
  },
]

export const mockArticles: RelatedArticle[] = [
  {
    article_id: 'art-001',
    event_id: 'evt-001',
    publisher: 'KBS 뉴스',
    title: '강원 산불 사흘째 확산…헬기 20대 투입',
    published_at: '2026-05-12T02:00:00',
    summary: '강원도 고성·속초 일대에서 발생한 대형 산불이 사흘째 이어지고 있다. 소방당국은 헬기 20대를 추가 투입했다.',
    url: '#',
  },
  {
    article_id: 'art-002',
    event_id: 'evt-001',
    publisher: '연합뉴스',
    title: '내무부, 산불 피해 지역 특별재난지역 선포 검토',
    published_at: '2026-05-12T00:10:00',
    summary: '행정안전부가 강원 산불 피해 지역에 대한 특별재난지역 선포를 검토 중이라고 밝혔다.',
    url: '#',
  },
  {
    article_id: 'art-003',
    event_id: 'evt-001',
    publisher: '조선일보',
    title: '대형 산불로 주민 3천여 명 대피',
    published_at: '2026-05-11T22:00:00',
    summary: '강원도 일대 산불로 인해 인근 주민 3천여 명이 대피소로 이동했다.',
    url: '#',
  },
  {
    article_id: 'art-004',
    event_id: 'evt-002',
    publisher: '부산일보',
    title: '부산 집중호우로 지하차도 침수',
    published_at: '2026-05-11T20:30:00',
    summary: '부산 일부 지역에 집중호우가 쏟아지며 지하차도가 침수됐다.',
    url: '#',
  },
]

export const mockOrganizations: OrganizationAction[] = [
  {
    org_id: 'org-001',
    event_id: 'evt-001',
    org_name: '대한적십자사',
    activity_region: '강원도 고성·속초',
    activity_type: '이재민 지원',
    activity_summary: '이재민 임시 대피소 운영 및 긴급 식량·물품 지원 중. 현재 3개 대피소에서 약 800명 지원.',
    donation_link: 'https://www.redcross.or.kr',
    volunteer_link: 'https://www.redcross.or.kr/volunteer',
    evidence_note: '강원도청 협력 공문 확인',
    verified_by_admin: true,
    last_checked_at: '2026-05-12T01:00:00',
  },
  {
    org_id: 'org-002',
    event_id: 'evt-001',
    org_name: '강원사랑기금',
    activity_region: '강원도',
    activity_type: '복구 지원',
    activity_summary: '산불 피해 주택 복구 및 생활용품 지원. 피해 가구 직접 방문 지원 중.',
    donation_link: 'https://fund.gw.go.kr',
    evidence_note: '강원도 공식 기금 확인',
    verified_by_admin: true,
    last_checked_at: '2026-05-11T18:00:00',
  },
  {
    org_id: 'org-003',
    event_id: 'evt-002',
    org_name: '부산사회복지공동모금회',
    activity_region: '부산',
    activity_type: '수해 지원',
    activity_summary: '침수 피해 가정 긴급 생계비 및 주거 복구 지원.',
    donation_link: 'https://www.chest.or.kr/busan',
    evidence_note: '부산시 협력 단체 명단 확인',
    verified_by_admin: true,
    last_checked_at: '2026-05-12T00:30:00',
  },
]

export const mockDonationHistory: DonationRecord[] = [
  {
    record_id: 'rec-001', org_id: 'org-001', date: '2026-05-12', disaster_type: 'wildfire',
    title: '강원 산불 이재민 긴급 구호', region: '강원도 고성·속초',
    amount: '₩48,200,000', beneficiaries: 820,
    description: '대피소 3곳 운영, 이재민 820명에게 식료품·생활용품·의류 긴급 지원. 심리 상담 서비스 병행 제공.',
  },
  {
    record_id: 'rec-002', org_id: 'org-001', date: '2025-09-03', disaster_type: 'typhoon',
    title: '태풍 힌남노 피해 복구 지원', region: '경상북도 포항',
    amount: '₩120,500,000', beneficiaries: 3400,
    description: '포항 일대 침수 피해 가구 복구 지원. 이재민 임시 거처 마련 및 생계비 지원.',
  },
  {
    record_id: 'rec-003', org_id: 'org-001', date: '2025-02-14', disaster_type: 'earthquake',
    title: '동해 지진 피해 주민 지원', region: '강원도 동해',
    amount: '₩32,000,000', beneficiaries: 540,
    description: '지진 피해 주민 540명에게 임시 대피소 운영 및 긴급 생활 물자 배급.',
  },
  {
    record_id: 'rec-004', org_id: 'org-001', date: '2024-07-22', disaster_type: 'heavy_rain',
    title: '충청 수해 복구 봉사', region: '충청남도 청양',
    amount: '₩61,000,000', beneficiaries: 1200,
    description: '수해 피해 농가 복구 봉사 2,000인시 투입. 농작물 피해 가구 생계비 지원.',
  },

  {
    record_id: 'rec-005', org_id: 'org-002', date: '2026-05-11', disaster_type: 'wildfire',
    title: '산불 피해 주택 복구 착수', region: '강원도',
    amount: '₩25,000,000', beneficiaries: 180,
    description: '피해 가구 직접 방문 생활용품 지원. 주택 복구 자재비 지원 시작.',
  },
  {
    record_id: 'rec-006', org_id: 'org-002', date: '2024-11-05', disaster_type: 'heavy_rain',
    title: '강원 폭우 피해 지원', region: '강원도 춘천',
    amount: '₩18,700,000', beneficiaries: 390,
    description: '춘천 일대 침수 피해 주민 390명 지원. 가구·가전 교체비 지원.',
  },
  {
    record_id: 'rec-007', org_id: 'org-003', date: '2026-05-12', disaster_type: 'heavy_rain',
    title: '부산 집중호우 수해 지원', region: '부산',
    amount: '₩15,300,000', beneficiaries: 270,
    description: '침수 피해 가정 긴급 생계비 및 주거 복구 지원 착수. 취약계층 우선 배정.',
  },
  {
    record_id: 'rec-008', org_id: 'org-003', date: '2025-08-18', disaster_type: 'typhoon',
    title: '태풍 카눈 부산 피해 복구', region: '부산 사하구·강서구',
    amount: '₩43,600,000', beneficiaries: 950,
    description: '태풍 피해 저소득 가구 950명 대상 복구비·생활물품 지원.',
  },
]

export const disasterTypeLabels: Record<string, string> = {
  wildfire: '산불', heavy_rain: '호우', typhoon: '태풍', earthquake: '지진',
}

export const disasterTypeIcons: Record<string, string> = {
  wildfire: '🔥', heavy_rain: '🌧️', typhoon: '🌀', earthquake: '⚡',
}

export const severityConfig: Record<string, { label: string; color: string; bgColor: string; dotColor: string }> = {
  low:      { label: '낮음', color: '#facc15', bgColor: 'rgba(250,204,21,0.15)',  dotColor: '#facc15' },
  medium:   { label: '보통', color: '#fb923c', bgColor: 'rgba(251,146,60,0.15)',  dotColor: '#fb923c' },
  high:     { label: '높음', color: '#f87171', bgColor: 'rgba(248,113,113,0.15)', dotColor: '#f87171' },
  critical: { label: '심각', color: '#c084fc', bgColor: 'rgba(192,132,252,0.15)', dotColor: '#c084fc' },
}

export const statusConfig: Record<string, { label: string; color: string }> = {
  active:     { label: '진행중', color: '#f87171' },
  monitoring: { label: '모니터링', color: '#fb923c' },
  recovery:   { label: '복구중', color: '#4ade80' },
  closed:     { label: '종료', color: '#94a3b8' },
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}분 전`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}시간 전`
  return `${Math.floor(hrs / 24)}일 전`
}
