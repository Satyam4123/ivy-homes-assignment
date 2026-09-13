import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'
import Listings from './pages/Listings.jsx'
import ListingDetail from './pages/ListingDetail.jsx'
import SavedListings from './pages/SavedListings.jsx'
import Rentals from './pages/Rentals.jsx'
import Projects from './pages/Projects.jsx'
import Insights from './pages/Insights.jsx'
import ProtectedRoute from './components/auth/ProtectedRoute.jsx'
import { SavedListingsProvider } from './context/SavedListingsContext.jsx'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/authContext.js'

function LoginRoute() {
  const { user, isCheckingSession } = useAuth()

  if (isCheckingSession) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f4f6f5] text-sm text-slate-500">Checking your session...</div>
  }

  return user ? <Navigate to="/listings" replace /> : <Login />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route element={<SavedListingsProvider><ProtectedRoute /></SavedListingsProvider>}>
        <Route path="/home" element={<Home />} />
        <Route path="/listings" element={<Listings />} />
        <Route path="/listings/:listingId" element={<ListingDetail />} />
        <Route path="/saved-listings" element={<SavedListings />} />
        <Route path="/rentals" element={<Rentals />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/" element={<Navigate to="/listings" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/listings" replace />} />
    </Routes>
  )
}

export default App