import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/authContext.js'

function HomeHeader() {
    const navigate = useNavigate()
    const { logout } = useAuth()
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    async function handleLogout() {
        setIsLoggingOut(true)
        try {
            await logout()
            navigate('/login', { replace: true })
        } catch {
            navigate('/login', { replace: true })
        } finally {
            setIsLoggingOut(false)
        }
    }

    return (
        <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
                <a href="/" className="flex items-center gap-3" aria-label="Ivy Homes home">
                    <img src="/ivy-homes-icon.png" alt="" className="size-9 object-contain" />
                    <span className="text-lg font-semibold tracking-tight text-slate-900">Ivy Homes</span>
                </a>
                <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 sm:flex" aria-label="Primary navigation">
                    <NavLink to="/listings" className={({ isActive }) => isActive ? 'text-teal-800' : 'transition hover:text-teal-800'}>Listings</NavLink>
                    <NavLink to="/rentals" className={({ isActive }) => isActive ? 'text-teal-800' : 'transition hover:text-teal-800'}>Rent</NavLink>
                    <NavLink to="/projects" className={({ isActive }) => isActive ? 'text-teal-800' : 'transition hover:text-teal-800'}>Projects</NavLink>
                    <NavLink to="/saved" className={({ isActive }) => isActive ? 'text-teal-800' : 'transition hover:text-teal-800'}>Saved listings</NavLink>
                    <NavLink to="/insights" className={({ isActive }) => isActive ? 'text-teal-800' : 'transition hover:text-teal-800'}>Insights</NavLink>
                </nav>
                <button type="button" onClick={handleLogout} disabled={isLoggingOut} className="text-sm font-semibold text-teal-800 hover:text-teal-950 disabled:cursor-not-allowed disabled:opacity-60">
                    {isLoggingOut ? 'Signing out...' : 'Log out'}
                </button>
            </div>
        </header>
    )
}

export default HomeHeader