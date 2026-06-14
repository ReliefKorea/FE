import type { DisasterType, RiskEvent } from '../types'

const IMAGE_PARAMS = '?auto=format&fit=crop&w=1800&q=84'

export const DISASTER_IMAGE_POOLS: Record<DisasterType, readonly string[]> = {
  wildfire: [
    `https://images.unsplash.com/photo-1615092296061-e2ccfeb2f3d6${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1507680465142-ef2223e23308${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1619461129861-d0c1479c48b4${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1634009653379-a97409ee15de${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1511027643875-5cbb0439c8f1${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1692364221415-654b20e6d1d2${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1505017791108-7b40f307cdc5${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1473260079709-83c808703435${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1602980085374-7e743fff3cc6${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1536245344390-dbf1df63c30a${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1611174797136-5e167ea90d6c${IMAGE_PARAMS}`,
  ],
  earthquake: [
    `https://images.unsplash.com/photo-1677233860259-ce1a8e0f8498${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1621077742331-2df96a07cca7${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1603869311144-66b03d340b32${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1617252820855-a829ba1babe7${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1641213131995-06e2cf0790d8${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1617585411149-54e9fdf60348${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1677233861443-4aac86420db2${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1686620225824-d4120ed3a81e${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1702024249908-3d04f2c22d71${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1677233859838-be47b0ab6c4a${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1647125849914-5238985ab21a${IMAGE_PARAMS}`,
  ],
  typhoon: [
    `https://images.unsplash.com/photo-1454789476662-53eb23ba5907${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1641648543997-8244afb0eb86${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1600672202669-3521432b6302${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1601110958456-0bee398ce406${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1641648542860-4937848433cf${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1641648542375-ed3f5c6dd052${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1676900894925-d39174ba74db${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1656495782911-06e6a5f9bef5${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1533922115281-16a28dffcc2e${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1641648542179-5fe991ff96e9${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1641648542473-0b4e73fe2e2b${IMAGE_PARAMS}`,
  ],
  heavy_rain: [
    `https://images.unsplash.com/photo-1547683905-f686c993aae5${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1600336153113-d66c79de3e91${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1485617359743-4dc5d2e53c89${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1604275689235-fdc521556c16${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1558448495-5ef3fce92344${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1657069345471-c54f2432b79c${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1612038385745-53cfb4fbd19b${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1541710005980-7ea80ff232d6${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1581059686229-de26e6ae5dc4${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1657069342866-2d11c2509b02${IMAGE_PARAMS}`,
    `https://images.unsplash.com/photo-1617494532490-297fc0eb515e${IMAGE_PARAMS}`,
  ],
}

function stableImageIndex(value: string, length: number) {
  let hash = 2166136261
  for (const character of value) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) % length
}

export function disasterImageFor(event: Pick<RiskEvent, 'event_id' | 'disaster_type' | 'region_name'>) {
  const images = DISASTER_IMAGE_POOLS[event.disaster_type]
  return images[stableImageIndex(`${event.event_id}:${event.region_name}`, images.length)]
}
