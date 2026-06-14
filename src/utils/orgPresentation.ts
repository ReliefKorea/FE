import type { DisasterType, OrganizationAction, TrustLevel } from '../types'

export const trustPresentation: Record<TrustLevel, { label: string; description: string }> = {
  strong: { label: '근거 충분', description: '공식 자료와 공개 지표가 함께 확인됩니다.' },
  moderate: { label: '근거 확인', description: '주요 활동과 일부 공개 근거를 확인할 수 있습니다.' },
  limited: { label: '근거 제한', description: '확인 가능한 공개 근거가 제한적입니다.' },
  needs_review: { label: '추가 확인 필요', description: '공식 페이지에서 최신 내용을 함께 확인해 주세요.' },
}

export const categoryPresentation: Record<DisasterType, {
  label: string
  emotionalCopy: string
  fallbackActivities: string[]
  fallbackUseCases: string[]
  fallbackImages: string[]
}> = {
  wildfire: {
    label: '산불',
    emotionalCopy: '오늘 밤 안전하게 머물 곳은 한 가족이 다시 일어서는 첫걸음이 될 수 있습니다.',
    fallbackActivities: ['긴급 대피소 운영', '식수와 생필품 전달', '주거 복구 지원', '심리 회복 지원'],
    fallbackUseCases: ['깨끗한 물', '임시 대피소', '따뜻한 옷', '복구 장비'],
    fallbackImages: [
      'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1200&q=82',
      'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1200&q=82',
      'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1200&q=82',
    ],
  },
  earthquake: {
    label: '지진',
    emotionalCopy: '순식간에 무너진 일상을 다시 세울 수 있도록 지금의 도움이 필요합니다.',
    fallbackActivities: ['긴급 대피 및 구조', '의료·응급 물품 지원', '임시 주거 지원', '지역 재건 지원'],
    fallbackUseCases: ['안전한 대피 공간', '의료 물품', '식료품 키트', '주거 복구 장비'],
    fallbackImages: [
      'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=82',
      'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&w=1200&q=82',
      'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1200&q=82',
    ],
  },
  typhoon: {
    label: '태풍',
    emotionalCopy: '깨끗한 물, 마른 옷, 안전한 쉼터는 긴 밤을 보낸 이들에게 큰 위로가 됩니다.',
    fallbackActivities: ['긴급 대피소 운영', '식수와 위생용품 지원', '침수 주거 복구', '긴급 생계 지원'],
    fallbackUseCases: ['깨끗한 물', '마른 옷', '식료품 키트', '복구 장비'],
    fallbackImages: [
      'https://images.unsplash.com/photo-1428592953211-077101b2021b?auto=format&fit=crop&w=1200&q=82',
      'https://images.unsplash.com/photo-1500674425229-f692875b0ab7?auto=format&fit=crop&w=1200&q=82',
      'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1200&q=82',
    ],
  },
  heavy_rain: {
    label: '호우',
    emotionalCopy: '깨끗한 물, 마른 옷, 안전한 쉼터는 긴 밤을 보낸 이들에게 큰 위로가 됩니다.',
    fallbackActivities: ['긴급 대피소 운영', '식수와 위생용품 지원', '침수 주거 복구', '긴급 생계 지원'],
    fallbackUseCases: ['깨끗한 물', '마른 옷', '식료품 키트', '복구 장비'],
    fallbackImages: [
      'https://images.unsplash.com/photo-1500674425229-f692875b0ab7?auto=format&fit=crop&w=1200&q=82',
      'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1200&q=82',
      'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1200&q=82',
    ],
  },
}

export function orgCategory(org: OrganizationAction): DisasterType {
  return org.category ?? 'wildfire'
}

export function formatOrgDate(value?: string) {
  if (!value) return '확인 중'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function orgLastUpdated(org: OrganizationAction) {
  return org.last_ragged_at ?? org.report_generated_at ?? org.last_checked_at
}

export function isOrgDataStale(org: OrganizationAction) {
  if (!org.expires_at) return false
  const expiresAt = new Date(org.expires_at).getTime()
  return Number.isFinite(expiresAt) && expiresAt < Date.now()
}
