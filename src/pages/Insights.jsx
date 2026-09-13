import { useEffect, useState } from 'react'
import InsightCard from '../components/insights/InsightCard.jsx'
import HomeHeader from '../components/home/HomeHeader.jsx'
import { getListings } from '../services/listingsService.js'
import { getProjects } from '../services/projectsService.js'
import { getRentals } from '../services/rentalsService.js'

const LIMIT = 20

function Insights() {
    const [data, setData] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const controller = new AbortController()
        Promise.all([
            getListings({ limit: LIMIT, offset: 0, locality: '', bhk: '', minPrice: '', maxPrice: '', furnishing: '' }, controller.signal),
            getRentals({ limit: LIMIT, offset: 0 }, controller.signal),
            getProjects({ limit: LIMIT, offset: 0 }, controller.signal),
        ])
            .then(([listings, rentals, projects]) => { if (!controller.signal.aborted) setData({ listings, rentals, projects }) })
            .catch((requestError) => { if (requestError.name !== 'AbortError') setError(requestError.message) })
            .finally(() => { if (!controller.signal.aborted) setIsLoading(false) })
        return () => controller.abort()
    }, [])

    const listings = data?.listings?.results || []
    const rentals = data?.rentals?.results || []
    const projects = data?.projects?.results || []
    const furnishedRentals = rentals.filter((rental) => rental.furnishing === 'fully-furnished').length
    const projectStatuses = [...new Set(projects.map((project) => project.project_status).filter(Boolean))]
    const listingPrices = listings.map((listing) => listing.price).filter((price) => typeof price === 'number')

    return <div className="min-h-screen bg-[#f6f8f7] text-slate-900"><HomeHeader /><main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12 lg:py-14"><div className="mb-8"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-800">Market snapshot</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">Insights</h1><p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">A frontend summary calculated from the current responses of supported API endpoints. Backend analytics are currently unavailable.</p></div>{isLoading && <p className="border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Loading market data...</p>}{!isLoading && error && <div role="alert" className="border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>}{!isLoading && !error && data && <><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"><InsightCard label="Listings available" value={data.listings.total ?? listings.length} detail="Total reported by /v1/listings" /><InsightCard label="Rental listings" value={data.rentals.total ?? rentals.length} detail="Total reported by /v1/rentals" /><InsightCard label="Projects" value={data.projects.total ?? projects.length} detail="Total reported by /v1/projects" /><InsightCard label="Fully furnished rentals" value={furnishedRentals} detail={`From the first ${rentals.length} rental results`} /></div><section className="mt-8 grid gap-6 lg:grid-cols-2"><div className="border border-slate-200 bg-white p-6"><h2 className="text-xl font-semibold">Current listing sample</h2><dl className="mt-5 space-y-4 text-sm"><div className="flex justify-between gap-4 border-b border-slate-100 pb-3"><dt className="text-slate-500">Lowest listed price</dt><dd className="font-medium text-slate-900">{listingPrices.length ? `₹${Math.min(...listingPrices).toLocaleString('en-IN')}` : 'No price data'}</dd></div><div className="flex justify-between gap-4 border-b border-slate-100 pb-3"><dt className="text-slate-500">Highest listed price</dt><dd className="font-medium text-slate-900">{listingPrices.length ? `₹${Math.max(...listingPrices).toLocaleString('en-IN')}` : 'No price data'}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Sample size</dt><dd className="font-medium text-slate-900">{listings.length} listings</dd></div></dl></div><div className="border border-slate-200 bg-white p-6"><h2 className="text-xl font-semibold">Project status sample</h2><p className="mt-3 text-sm leading-6 text-slate-500">Statuses present in the first {projects.length} project results.</p><div className="mt-5 flex flex-wrap gap-2">{projectStatuses.length ? projectStatuses.map((status) => <span key={status} className="border border-slate-200 px-3 py-1.5 text-sm capitalize text-slate-700">{status}</span>) : <span className="text-sm text-slate-500">No status data returned.</span>}</div></div></section></>}</main></div>
}

export default Insights