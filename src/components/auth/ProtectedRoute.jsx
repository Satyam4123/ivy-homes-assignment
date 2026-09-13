import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/authContext.js'

function ProtectedRoute() {
    const { user, isCheckingSession } = useAuth()
    const location = useLocation()

    if (isCheckingSession) {
        return <div className="flex min-h-screen items-center justify-center bg-[#f4f6f5] text-sm text-slate-500">Checking your session...</div>
    }

    return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />
}

export default ProtectedRoute