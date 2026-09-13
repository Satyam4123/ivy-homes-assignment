import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthInput from './AuthInput.jsx'
import { login } from '../../services/authService.js'
import { useAuth } from '../../context/authContext.js'

const initialValues = {
    email: '',
    password: '',
}

function validate(values) {
    const errors = {}

    if (!values.email.trim()) {
        errors.email = 'Enter your email address.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
        errors.email = 'Enter a valid email address.'
    }

    if (!values.password) {
        errors.password = 'Enter your password.'
    }

    return errors
}

function LoginForm() {
    const navigate = useNavigate()
    const { setUser } = useAuth()
    const [values, setValues] = useState(initialValues)
    const [errors, setErrors] = useState({})
    const [formError, setFormError] = useState('')
    const [authenticatedUser, setAuthenticatedUser] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    function handleChange(event) {
        const { name, value } = event.target
        setValues((currentValues) => ({ ...currentValues, [name]: value }))
        setFormError('')
        setAuthenticatedUser(null)

        if (errors[name]) {
            setErrors((currentErrors) => ({ ...currentErrors, [name]: '' }))
        }
    }

    async function handleSubmit(event) {
        event.preventDefault()
        const validationErrors = validate(values)

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors)
            return
        }

        setErrors({})
        setFormError('')
        setIsSubmitting(true)

        try {
            const user = await login(values)
            setUser(user)
            setAuthenticatedUser(true)
            navigate('/listings', { replace: true })
        } catch (error) {
            setFormError(error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <AuthInput
                id="email"
                label="Email address"
                type="email"
                value={values.email}
                onChange={handleChange}
                error={errors.email}
                autoComplete="email"
                disabled={isSubmitting}
            />
            <AuthInput
                id="password"
                label="Password"
                type="password"
                value={values.password}
                onChange={handleChange}
                error={errors.password}
                autoComplete="current-password"
                disabled={isSubmitting}
            />
            {formError && (
                <p role="alert" className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {formError}
                </p>
            )}
            {authenticatedUser && (
                <p role="status" className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    Signed in successfully.
                </p>
            )}
            <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 bg-teal-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-900 focus:outline-none focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-teal-700"
            >
                {isSubmitting && (
                    <span
                        aria-hidden="true"
                        className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                    />
                )}
                <span>{isSubmitting ? 'Signing in...' : 'Sign in'}</span>
            </button>
        </form>
    )
}

export default LoginForm