import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import MapMain from './pages/MapMain'
import EventDetail from './pages/EventDetail'
import OrgHistory from './pages/OrgHistory'
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
        <Route path="/org/:orgId/history" element={<OrgHistory />} />
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

export default App
