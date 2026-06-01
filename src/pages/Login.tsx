import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api'
const DEV_PASSWORD = import.meta.env.VITE_ADMIN_DEV_PASSWORD ?? 'admin1234'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string })?.from ?? '/admin'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (res.ok) {
        const { token } = await res.json()
        localStorage.setItem('admin_token', token)
        navigate(from, { replace: true })
        return
      }

      // 401 = 실제 인증 실패
      if (res.status === 401) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? '아이디 또는 비밀번호가 올바르지 않습니다.')
        return
      }

      // 404 등 = auth API 미구현 → dev 비밀번호 체크
      throw new Error('api_not_ready')
    } catch {
      // 네트워크 오류 또는 auth API 미구현 시 임시 비밀번호로 대체
      if (password === DEV_PASSWORD) {
        const fakeToken = btoa(JSON.stringify({ alg: 'none' })) + '.' +
          btoa(JSON.stringify({ username, exp: Math.floor(Date.now() / 1000) + 86400 })) + '.dev'
        localStorage.setItem('admin_token', fakeToken)
        navigate(from, { replace: true })
      } else {
        setError('비밀번호가 올바르지 않습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.root}>
      <div style={s.card}>
        <div style={s.logoRow}>
          <div style={s.logoIcon}>⊕</div>
          <span style={s.logoText}>Relief Korea</span>
        </div>

        <div style={s.titleBlock}>
          <div style={s.title}>운영자 로그인</div>
          <div style={s.subtitle}>운영 관리 콘솔에 접근하려면 인증이 필요합니다.</div>
        </div>

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>아이디</label>
            <input
              style={s.input}
              type="text"
              placeholder="관리자 아이디"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>비밀번호</label>
            <input
              style={s.input}
              type="password"
              placeholder="비밀번호 입력"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div style={s.error}>{error}</div>}

          <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <button style={s.backBtn} onClick={() => navigate('/')}>← 메인으로 돌아가기</button>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  root: {
    width: '100%',
    height: '100vh',
    background: '#080b14',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  card: {
    width: 400,
    background: '#0d1117',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: '36px 32px',
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    width: 36,
    height: 36,
    background: 'rgba(22,163,74,0.2)',
    border: '1px solid rgba(22,163,74,0.5)',
    borderRadius: 9,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    color: '#4ade80',
  },
  logoText: {
    color: '#4ade80',
    fontWeight: 800,
    fontSize: 20,
  },
  titleBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#f1f5f9',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 7,
  },
  label: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: 600,
  },
  input: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: '11px 14px',
    color: '#e2e8f0',
    fontSize: 14,
    outline: 'none',
  },
  error: {
    fontSize: 12,
    color: '#fca5a5',
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 6,
    padding: '8px 12px',
  },
  btn: {
    background: '#16a34a',
    border: 'none',
    borderRadius: 8,
    padding: '12px',
    color: '#fff',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 4,
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#475569',
    fontSize: 12,
    cursor: 'pointer',
    textAlign: 'center' as const,
    padding: 0,
  },
}
