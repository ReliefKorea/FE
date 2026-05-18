# 재난 복구 활동 시각화 및 후원 연결 플랫폼

2026-1 OpensourceWebSoftware FE

---

## 주요 기능

- 한국 지도 위에 현재 진행 중인 재난 사건 표시
- 사건별 공식 정보(기상특보, 재난문자)와 관련 기사 요약 제공
- 현장 복구 단체 정보 및 후원·봉사 링크 연결
- 재난 유형, 진행 상태, 도움 가능 여부 필터 기능
- 운영자 등록 화면을 통한 단체 및 사건 정보 수동 관리

---

## 기술 스택

| 구분 | 사용 기술 |
|------|-----------|
| 프레임워크 | React (Vite) |
| 언어 | TypeScript |
| 스타일링 | CSS |
| 라우팅 | React Router DOM |
| 지도 | Leaflet / React-Leaflet |

| 백엔드 | Spring Boot (별도 레포) |

---

## 프로젝트 구조

```
src/
├── pages/
│   ├── Landing.tsx      # 랜딩 화면
│   ├── MapMain.tsx      # 지도 메인 화면
│   ├── EventDetail.tsx  # 사건 상세 화면
│   └── Admin.tsx        # 운영자 관리 화면
├── types/          # 타입 정의
├── data/           # 더미 데이터
└── assets/         # 이미지 등 정적 파일
```

---

## 실행 방법

```bash
# 저장소 클론
git clone https://github.com/2026WebSW/FE

# 패키지 설치
cd FE
npm install

# 개발 서버 실행
npm run dev
```

실행 후 브라우저에서 `http://localhost:5173` 접속

---