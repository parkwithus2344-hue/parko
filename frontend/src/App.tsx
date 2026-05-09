import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import SearchPage from './pages/SearchPage'
import ParkingDetailPage from './pages/ParkingDetailPage'
import BookingsPage from './pages/BookingsPage'
import OwnerDashboardPage from './pages/OwnerDashboardPage'
import WalletPage from './pages/WalletPage'
import SettingsPage from './pages/SettingsPage'
import AddParkingPage from './pages/AddParkingPage'

const HIDE_NAV = ['/login', '/register']

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  )
}

function AppInner() {
  return (
    <>
      <NavbarWrapper />
      <Routes>
        <Route path="/"                  element={<Navigate to="/login" replace />} />
        <Route path="/login"             element={<LoginPage />} />
        <Route path="/register"          element={<RegisterPage />} />
        <Route path="/search-parking"    element={<SearchPage />} />
        <Route path="/parking/:id"       element={<ParkingDetailPage />} />
        <Route path="/bookings"          element={<BookingsPage />} />
        <Route path="/owner/dashboard"   element={<OwnerDashboardPage />} />
        <Route path="/wallet"            element={<WalletPage />} />
        <Route path="/settings"          element={<SettingsPage />} />
        <Route path="/add-parking"       element={<AddParkingPage />} />
        <Route path="*"                  element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  )
}

function NavbarWrapper() {
  const { pathname } = useLocation()
  if (HIDE_NAV.includes(pathname)) return null
  return <Navbar />
}
