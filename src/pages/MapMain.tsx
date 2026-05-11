import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    kakao: any
  }
}

function MapMain() {
  const mapContainer = useRef<HTMLDivElement>(null)

  useEffect(() => {
    console.log('kakao:', window.kakao)
    const initMap = () => {
      window.kakao.maps.load(() => {
        const options = {
          center: new window.kakao.maps.LatLng(36.5, 127.5),
          level: 7,
        }
        new window.kakao.maps.Map(mapContainer.current, options)
      })
    }

    if (window.kakao) {
      initMap()
    } else {
      const script = document.querySelector(
        'script[src*="dapi.kakao.com"]'
      ) as HTMLScriptElement
      script.addEventListener('load', initMap)
    }
  }, [])

  return (
    
    <div style={{ width: '100%', height: '100vh', background: '#0a0a0f' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

export default MapMain