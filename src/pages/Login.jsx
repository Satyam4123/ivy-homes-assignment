import LoginForm from '../components/auth/LoginForm.jsx'

function Login() {
    return (
        <main className="min-h-screen bg-[#f4f6f5] text-slate-900">
            <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center px-5 py-8 sm:px-8 lg:px-12">
                <div className="grid w-full overflow-hidden border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)] lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="hidden min-h-[620px] flex-col justify-between bg-teal-900 p-10 text-white lg:flex xl:p-14">
                        <div>
                            <div className="flex items-center gap-3">
                                <span className="flex size-9 items-center justify-center border border-teal-300/50 text-lg font-semibold text-teal-100">
                                    I
                                </span>
                                <span className="text-lg font-semibold tracking-tight">Ivy Homes</span>
                            </div>
                            <div className="mt-28 max-w-sm">
                                <p className="text-sm font-medium uppercase tracking-[0.18em] text-teal-200">
                                    Find your place
                                </p>
                                <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.03em] xl:text-5xl">
                                    Welcome back to a home that feels right.
                                </h1>
                                <p className="mt-6 max-w-xs text-base leading-7 text-teal-100/80">
                                    Keep your favorite homes close and pick up where you left off.
                                </p>
                            </div>
                        </div>
                        <p className="text-sm text-teal-200/70">Thoughtful homes. Clearer decisions.</p>
                    </div>

                    <section className="flex min-h-[620px] items-center justify-center px-6 py-12 sm:px-12 lg:px-14 xl:px-20">
                        <div className="w-full max-w-md">
                            <div className="mb-10 lg:hidden">
                                <div className="flex items-center gap-3">
                                    <span className="flex size-9 items-center justify-center border border-teal-800 text-lg font-semibold text-teal-800">
                                        I
                                    </span>
                                    <span className="text-lg font-semibold tracking-tight text-slate-900">Ivy Homes</span>
                                </div>
                            </div>
                            <div className="mb-8">
                                <p className="text-sm font-medium uppercase tracking-[0.16em] text-teal-800">Sign in</p>
                                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.025em] text-slate-900">Welcome back</h2>
                                <p className="mt-3 text-[15px] leading-6 text-slate-500">
                                    Sign in to continue exploring your saved homes.
                                </p>
                            </div>
                            <LoginForm />
                        </div>
                    </section>
                </div>
            </div>
        </main>
    )
}

export default Login