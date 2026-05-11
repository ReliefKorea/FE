import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockEvents, severityConfig, statusConfig, disasterTypeLabels, timeAgo } from '../data/mockData'

type TabKey = 'list' | 'create'

export default function Admin() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabKey>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [newEvent, setNewEvent] = useState({
    title: '', region: '', disasterType: '', severity: 'medium', summary: '',
    newsLinks: [''], orgName: '', orgLink: '', publishNow: false,
  })

  const filteredEvents = mockEvents.filter(e =>
    searchQuery === '' ||
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.region_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = {
    active: mockEvents.filter(e => e.status === 'active').length,
    highRisk: mockEvents.filter(e => e.severity === 'critical' || e.severity === 'high').length,
    orgs: 28,
    updated: 86,
  }

  return (
    <div style={s.root}>
      {/* 헤더 */}
      <header style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.logo} onClick={() => navigate('/')}>
            <span style={s.logoIcon}>⊕</span>
            <span style={s.logoText}>재난지도</span>
          </div>
          <nav style={s.navTabs}>
            <button style={s.navTab} onClick={() => navigate('/map')}>🗺️ Live Map</button>
            <button style={{ ...s.navTab, ...s.navTabActive }}>⚙️ Operator Console</button>
          </nav>
        </div>
        <div style={s.headerRight}>
          <button style={s.viewMapBtn} onClick={() => navigate('/map')}>↗ 공개용 지도 보기</button>
          <button style={s.createBtn} onClick={() => setTab('create')}>+ 새 경보 생성</button>
        </div>
      </header>

      {/* 페이지 타이틀 */}
      <div style={s.titleArea}>
        <h1 style={s.pageTitle}>운영 관리 콘솔</h1>
        <p style={s.pageSubtitle}>전 세계 실시간 재난 인시던트를 모니터링하고 데이터를 업데이트합니다.</p>
      </div>

      {/* 통계 카드 */}
      <div style={s.statsRow}>
        {[
          { icon: '⚡', label: '활성 사건', value: stats.active },
          { icon: '⚠️', label: '고위험 지역', value: `0${stats.highRisk}` },
          { icon: '👥', label: '구호 참여 단체', value: stats.orgs },
          { icon: '🕐', label: '최근 24시간 업데이트', value: stats.updated },
        ].map((stat, i) => (
          <div key={i} style={s.statCard}>
            <span style={s.statIcon}>{stat.icon}</span>
            <div>
              <div style={s.statValue}>{stat.value}</div>
              <div style={s.statLabel}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={s.body}>
        {/* 좌측: 사건 목록 */}
        <div style={s.mainCol}>
          <div style={s.listHeader}>
            <div>
              <div style={s.listTitle}>관리 중인 사건 리스트</div>
              <div style={s.listSubtitle}>현재 시스템에 등록된 모든 재난 상황을 관리합니다.</div>
            </div>
            <div style={s.listControls}>
              <input
                style={s.searchInput}
                placeholder="🔍 사건 이름 검색..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <button style={s.filterBtn}>필터</button>
            </div>
          </div>

          {/* 테이블 헤더 */}
          <div style={s.tableHeader}>
            <div style={{ flex: 3 }}>사건 이름 / 지역</div>
            <div style={{ flex: 1 }}>유형</div>
            <div style={{ flex: 1 }}>위험도</div>
            <div style={{ flex: 1 }}>공개 여부</div>
            <div style={{ flex: 1 }}>마지막 업데이트</div>
            <div style={{ flex: 1 }}>관리</div>
          </div>

          {/* 테이블 rows */}
          {filteredEvents.map(event => {
            const cfg = severityConfig[event.severity]
            return (
              <div key={event.event_id} style={s.tableRow}>
                <div style={{ flex: 3 }}>
                  <div style={s.rowTitle}>{event.title}</div>
                  <div style={s.rowSub}>{event.region_name}</div>
                </div>
                <div style={{ flex: 1, fontSize: 12, color: '#64748b' }}>{disasterTypeLabels[event.disaster_type]}</div>
                <div style={{ flex: 1 }}>
                  <span style={{ ...s.riskChip, background: cfg.bgColor, color: cfg.color, border: `1px solid ${cfg.color}44` }}>
                    {cfg.label.toUpperCase()} RISK
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <span style={s.publicChip}>
                    👁 Public
                  </span>
                </div>
                <div style={{ flex: 1, fontSize: 12, color: '#475569' }}>{timeAgo(event.updated_at)}</div>
                <div style={{ flex: 1 }}>
                  <button style={s.editBtn} onClick={() => navigate(`/event/${event.event_id}`)}>수정</button>
                </div>
              </div>
            )
          })}
        </div>

        {/* 우측 패널 */}
        <div style={s.sideCol}>
          {/* 최근 활동 로그 */}
          <div style={s.sideCard}>
            <div style={s.sideCardHeader}>
              <span style={s.sideCardTitle}>🕐 최근 활동 로그</span>
              <span style={s.sideCardLink}>전체보기</span>
            </div>
            {[
              { user: '김철수', action: '사건 생성: 중부 지방 집중 호우', time: '오전 10:45', avatar: '김' },
              { user: 'Jane Doe', action: '상태 변경: 그리스 열파 (Closed)', time: '오전 09:20', avatar: 'J' },
              { user: '이영희', action: '뉴스 추가: 칠레 중부 산불', time: '어제 22:15', avatar: '이' },
            ].map((log, i) => (
              <div key={i} style={s.logRow}>
                <div style={s.logAvatar}>{log.avatar}</div>
                <div>
                  <div style={s.logUser}>{log.user} <span style={{ color: '#475569', fontWeight: 400 }}>{log.time}</span></div>
                  <div style={s.logAction}>{log.action}</div>
                </div>
              </div>
            ))}
          </div>

          {/* 보안 수칙 */}
          <div style={s.sideCard}>
            <div style={s.sideCardHeader}>
              <span style={s.sideCardTitle}>🛡️ 운영자 보안 수칙</span>
            </div>
            <ul style={s.ruleList}>
              <li style={s.ruleItem}>모든 정보는 공식 채널을 통해 확인된 내용만 기재하십시오.</li>
              <li style={s.ruleItem}>뉴스 링크는 신뢰할 수 있는 언론사의 URL만 허용됩니다.</li>
              <li style={s.ruleItem}>후원 단계의 경우 공식 등록 번호가 확인된 곳 위주로 생성합니다.</li>
            </ul>
            <button style={s.guideBtn}>상세 가이드라인 확인</button>
          </div>
        </div>
      </div>

      {/* 새 사건 생성 폼 */}
      {tab === 'create' && (
        <div style={s.createForm}>
          <div style={s.formHeader}>
            <div>
              <div style={s.formTitle}>새 인시던트 생성</div>
              <div style={s.formSubtitle}>새로운 재난 정보를 입력하고 관련 리소스를 연결합니다.</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={s.draftBadge}>Draft Mode</span>
              <button onClick={() => setTab('list')} style={s.closeFormBtn}>✕</button>
            </div>
          </div>

          {/* 기본 정보 */}
          <div style={s.formSection}>
            <div style={s.formSectionTitle}>1. 기본 정보 및 지역 설정</div>
            <div style={s.formGrid}>
              <div style={s.formField}>
                <label style={s.formLabel}>사건 제목</label>
                <input style={s.formInput} placeholder="사건 명칭을 입력하세요" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} />
              </div>
              <div style={s.formField}>
                <label style={s.formLabel}>지역 / 위치</label>
                <input style={s.formInput} placeholder="도시, 국가 또는 좌표" value={newEvent.region} onChange={e => setNewEvent({ ...newEvent, region: e.target.value })} />
              </div>
              <div style={s.formField}>
                <label style={s.formLabel}>재난 유형</label>
                <input style={s.formInput} placeholder="산불, 홍수, 지진 등" value={newEvent.disasterType} onChange={e => setNewEvent({ ...newEvent, disasterType: e.target.value })} />
              </div>
              <div style={s.formField}>
                <label style={s.formLabel}>위험도 수준</label>
                <div style={s.severityBtns}>
                  {['low', 'medium', 'high', 'critical'].map(sev => (
                    <button
                      key={sev}
                      style={{ ...s.sevBtn, ...(newEvent.severity === sev ? { background: severityConfig[sev].bgColor, color: severityConfig[sev].color, border: `1px solid ${severityConfig[sev].color}` } : {}) }}
                      onClick={() => setNewEvent({ ...newEvent, severity: sev })}
                    >
                      {severityConfig[sev].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={s.formField}>
              <label style={s.formLabel}>공식 요약문 (1줄)</label>
              <textarea style={s.formTextarea} placeholder="지도 마커 호버 시 노출될 요약 정보를 작성하세요." value={newEvent.summary} onChange={e => setNewEvent({ ...newEvent, summary: e.target.value })} />
            </div>
          </div>

          {/* 뉴스 링크 */}
          <div style={s.formSection}>
            <div style={s.formSectionTitle}>2. 관련 뉴스 및 미디어 링크</div>
            {newEvent.newsLinks.map((link, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input style={{ ...s.formInput, flex: 1 }} placeholder="https://news.example.com/..." value={link} onChange={e => {
                  const updated = [...newEvent.newsLinks]; updated[i] = e.target.value
                  setNewEvent({ ...newEvent, newsLinks: updated })
                }} />
                <button style={s.removeBtn} onClick={() => setNewEvent({ ...newEvent, newsLinks: newEvent.newsLinks.filter((_, j) => j !== i) })}>🗑</button>
              </div>
            ))}
            <button style={s.addBtn} onClick={() => setNewEvent({ ...newEvent, newsLinks: [...newEvent.newsLinks, ''] })}>+ 뉴스 기사 추가</button>
          </div>

          {/* 구호 단체 */}
          <div style={s.formSection}>
            <div style={s.formSectionTitle}>3. 구호 단체 및 지원 정보</div>
            <div style={s.formGrid}>
              <div style={s.formField}>
                <label style={s.formLabel}>단체명</label>
                <input style={s.formInput} placeholder="국제적십자사" value={newEvent.orgName} onChange={e => setNewEvent({ ...newEvent, orgName: e.target.value })} />
              </div>
              <div style={s.formField}>
                <label style={s.formLabel}>후원 링크</label>
                <input style={s.formInput} placeholder="https://redcross.org" value={newEvent.orgLink} onChange={e => setNewEvent({ ...newEvent, orgLink: e.target.value })} />
              </div>
            </div>
            <button style={s.addBtn}>+ 구호 단체 등록</button>
          </div>

          {/* 제출 */}
          <div style={s.formFooter}>
            <label style={s.checkLabel}>
              <input type="checkbox" checked={newEvent.publishNow} onChange={e => setNewEvent({ ...newEvent, publishNow: e.target.checked })} />
              &nbsp; 즉시 공개 처리 – 체크 시 저장과 동시에 퍼블릭 지도에 노출됩니다.
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={s.saveDraftBtn}>임시 저장</button>
              <button style={s.publishBtn}>🚀 사건 배포하기</button>
            </div>
          </div>
        </div>
      )}

      <footer style={s.footer}>
        <span style={{ color: '#334155', fontSize: 11 }}>© 2024 재난지도. Real-time KMA Integration active.</span>
        <span style={s.footerLink}>상세 가이드라인 확인</span>
      </footer>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  root: { display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#080b14', color: '#e2e8f0', fontFamily: "'Segoe UI', system-ui, sans-serif" },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 56, background: '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 24 },
  logo: { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' },
  logoIcon: { width: 28, height: 28, background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#818cf8' },
  logoText: { color: '#818cf8', fontWeight: 700, fontSize: 15 },
  navTabs: { display: 'flex', gap: 4 },
  navTab: { background: 'none', border: 'none', color: '#64748b', fontSize: 13, padding: '6px 14px', borderRadius: 6, cursor: 'pointer' },
  navTabActive: { background: 'rgba(99,102,241,0.12)', color: '#818cf8' },
  headerRight: { display: 'flex', gap: 10 },
  viewMapBtn: { background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '6px 14px', color: '#94a3b8', fontSize: 12, cursor: 'pointer' },
  createBtn: { background: '#4f46e5', border: 'none', borderRadius: 6, padding: '6px 16px', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  titleArea: { padding: '24px 28px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  pageTitle: { fontSize: 24, fontWeight: 700, color: '#f1f5f9', margin: '0 0 6px' },
  pageSubtitle: { fontSize: 13, color: '#64748b', margin: 0 },
  statsRow: { display: 'flex', gap: 16, padding: '16px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  statCard: { flex: 1, background: '#0d1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: 22, fontWeight: 700, color: '#e2e8f0', lineHeight: 1 },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 4 },
  body: { display: 'flex', flex: 1, gap: 20, padding: '20px 28px', overflow: 'auto' },
  mainCol: { flex: 1, background: '#0d1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' },
  listHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' },
  listTitle: { fontSize: 15, fontWeight: 600, color: '#e2e8f0' },
  listSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  listControls: { display: 'flex', gap: 8 },
  searchInput: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '7px 12px', color: '#e2e8f0', fontSize: 12, outline: 'none', width: 200 },
  filterBtn: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '7px 14px', color: '#94a3b8', fontSize: 12, cursor: 'pointer' },
  tableHeader: { display: 'flex', padding: '10px 20px', fontSize: 11, color: '#475569', letterSpacing: 0.5, borderBottom: '1px solid rgba(255,255,255,0.06)', fontWeight: 600 },
  tableRow: { display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.15s' },
  rowTitle: { fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 2 },
  rowSub: { fontSize: 11, color: '#64748b' },
  riskChip: { fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 700, letterSpacing: 0.5 },
  publicChip: { fontSize: 11, color: '#64748b' },
  editBtn: { background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, padding: '4px 12px', color: '#94a3b8', fontSize: 11, cursor: 'pointer' },
  sideCol: { width: 280, display: 'flex', flexDirection: 'column', gap: 16, flexShrink: 0 },
  sideCard: { background: '#0d1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16 },
  sideCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sideCardTitle: { fontSize: 13, fontWeight: 600, color: '#e2e8f0' },
  sideCardLink: { fontSize: 11, color: '#64748b', cursor: 'pointer' },
  logRow: { display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start' },
  logAvatar: { width: 28, height: 28, borderRadius: '50%', background: '#1e293b', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#94a3b8', flexShrink: 0 },
  logUser: { fontSize: 12, fontWeight: 600, color: '#e2e8f0' },
  logAction: { fontSize: 11, color: '#64748b', marginTop: 2 },
  ruleList: { paddingLeft: 16, margin: '0 0 12px' },
  ruleItem: { fontSize: 12, color: '#64748b', lineHeight: 1.6, marginBottom: 6 },
  guideBtn: { width: '100%', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '8px', color: '#64748b', fontSize: 12, cursor: 'pointer' },
  createForm: { margin: '0 28px 20px', background: '#0d1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' },
  formHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' },
  formTitle: { fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 },
  formSubtitle: { fontSize: 12, color: '#64748b' },
  draftBadge: { fontSize: 11, color: '#818cf8', background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.3)', borderRadius: 4, padding: '3px 8px' },
  closeFormBtn: { background: 'none', border: 'none', color: '#64748b', fontSize: 16, cursor: 'pointer', padding: 4 },
  formSection: { padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  formSectionTitle: { fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 14 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 },
  formField: { display: 'flex', flexDirection: 'column', gap: 6 },
  formLabel: { fontSize: 11, color: '#64748b', fontWeight: 600 },
  formInput: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '9px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none' },
  formTextarea: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '9px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none', resize: 'vertical' as const, minHeight: 72 },
  severityBtns: { display: 'flex', gap: 6 },
  sevBtn: { flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '7px', color: '#64748b', fontSize: 12, cursor: 'pointer' },
  addBtn: { background: 'none', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 6, padding: '8px', color: '#64748b', fontSize: 12, cursor: 'pointer', width: '100%', marginTop: 4 },
  removeBtn: { background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '7px 10px', color: '#64748b', fontSize: 13, cursor: 'pointer' },
  formFooter: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' },
  checkLabel: { display: 'flex', alignItems: 'center', fontSize: 12, color: '#64748b', cursor: 'pointer' },
  saveDraftBtn: { background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '9px 18px', color: '#94a3b8', fontSize: 13, cursor: 'pointer' },
  publishBtn: { background: '#4f46e5', border: 'none', borderRadius: 6, padding: '9px 20px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  footer: { padding: '12px 28px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', background: '#0d1117', flexShrink: 0, marginTop: 'auto' },
  footerLink: { fontSize: 11, color: '#334155', cursor: 'pointer' },
}
