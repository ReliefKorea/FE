import { BrowserRouter, Navigate, Routes, Route, useParams } from 'react-router-dom'
import Landing from './pages/Landing'
import MapMain from './pages/MapMain'
import EventDetail from './pages/EventDetail'
import ReliefInfoPage from './pages/ReliefInfoPage'
import Admin from './pages/Admin'
import Login from './pages/Login'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/map" element={<MapMain />} />
        <Route path="/event/:eventId" element={<EventDetail />} />
        <Route path="/org/:orgId/info" element={<ReliefInfoPage />} />
        <Route path="/org/:orgId/activity" element={<LegacyOrgInfoRedirect />} />
        <Route path="/org/:orgId/evidence" element={<LegacyOrgInfoRedirect />} />
        <Route path="/org/:orgId/history" element={<LegacyOrgInfoRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={
          <ProtectedRoute>
            <Admin />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}

function LegacyOrgInfoRedirect() {
  const { orgId } = useParams()
  return <Navigate to={`/org/${orgId}/info`} replace />
}

export default App
