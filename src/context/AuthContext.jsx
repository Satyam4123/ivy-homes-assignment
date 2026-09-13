import { useEffect, useState } from 'react'
import { getCurrentUser, logout as logoutUser } from '../services/authService.js'
import { AuthContext } from './authContext.js'

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [isCheckingSession, setIsCheckingSession] = useState(true)

    useEffect(() => {
        let isMounted = true

        async function restoreSession() {
            try {
                const currentUser = await getCurrentUser()

                if (isMounted && currentUser) {
                    setUser(currentUser)
                }
            } catch {
                if (isMounted) {
                    setUser(null)
                }
            } finally {
                if (isMounted) {
                    setIsCheckingSession(false)
                }
            }
        }

        restoreSession()

        return () => {
            isMounted = false
        }
    }, [])

    async function logout() {
        try {
            await logoutUser()
        } finally {
            setUser(null)
        }
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                setUser,
                isCheckingSession,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}