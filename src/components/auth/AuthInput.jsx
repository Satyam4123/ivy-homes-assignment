function AuthInput({ id, label, type = 'text', value, onChange, error, autoComplete, disabled }) {
    const errorId = `${id}-error`

    return (
        <div className="space-y-2">
            <label htmlFor={id} className="block text-sm font-medium text-slate-700">
                {label}
            </label>
            <input
                id={id}
                name={id}
                type={type}
                value={value}
                onChange={onChange}
                autoComplete={autoComplete}
                disabled={disabled}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
                className={`block w-full border bg-white px-4 py-3 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 ${error
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-100'
                        : 'border-slate-300 focus:border-teal-700 focus:ring-teal-100'
                    }`}
            />
            {error && (
                <p id={errorId} role="alert" className="text-sm text-rose-600">
                    {error}
                </p>
            )}
        </div>
    )
}

export default AuthInput