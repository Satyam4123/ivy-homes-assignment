import { useEffect, useState } from 'react'
import HomeHeader from '../components/home/HomeHeader.jsx'
import InsightCard from '../components/insights/InsightCard.jsx'
import q4Results from '../../data/q4-results.json'
import q9Results from '../../data/q9-results.json'
import { getListings } from '../services/listingsService.js'
import { getProjects } from '../services/projectsService.js'
import { getRentals } from '../services/rentalsService.js'

const LIMIT = 200
const RECENT_START = new Date('2026-09-03T00:00:00+05:30')
const RECENT_END = new Date('2026-09-10T00:00:00+05:30')
const excludedListingIds = new Set([...(q4Results.potentially_impossible_listing_ids || []), ...(q9Results.fake_listing_ids || [])])

async function fetchAllPages(fetchPage, signal, label) {
    const records = []
    let offset = 0

    while (true) {
        const response = await fetchPage(offset, signal)
        const batch = Array.isArray(response?.results) ? response.results : []
        records.push(...batch)

        const hasMore = response?.has_more ?? response?.hasMore
        if (hasMore === false || (hasMore === undefined && batch.length < LIMIT)) break
        if (batch.length === 0) throw new Error(`Unable to load complete ${label} data.`)
        offset += batch.length
    }

    return records
}

function formatNumber(value, maximumFractionDigits = 0) {
    return value.toLocaleString('en-IN', { maximumFractionDigits })
}

function formatCurrency(value, maximumFractionDigits = 0) {
    return `₹${formatNumber(value, maximumFractionDigits)}`
}

function BreakdownList({ items, emptyLabel }) {
    if (!items.length) return <p className="mt-5 text-sm text-slate-500">{emptyLabel}</p>

    return <div className="mt-5 space-y-4">{items.map((item) => <div key={item.label}><div className="flex items-center justify-between gap-4 text-sm"><span className="capitalize text-slate-600">{item.label}</span><strong className="text-slate-900">{formatNumber(item.value)}</strong></div><div className="mt-2 h-2 bg-slate-100"><div className="h-2 bg-teal-700" style={{ width: `${item.width}%` }} /></div></div>)}</div>
}

function Insights() {
    const [data, setData] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [estimatedSeconds, setEstimatedSeconds] = useState(10)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!isLoading) return undefined

        const timer = window.setInterval(() => {
            setEstimatedSeconds((seconds) => Math.max(0, seconds - 1))
        }, 1000)

        return () => window.clearInterval(timer)
    }, [isLoading])

    useEffect(() => {
        const controller = new AbortController()
        const load = async () => {
            const [listings, rentals, projects] = await Promise.all([
                fetchAllPages((offset, signal) => getListings({ limit: LIMIT, offset, locality: '', bhk: '', minPrice: '', maxPrice: '', furnishing: '' }, signal), controller.signal, 'listing'),
                fetchAllPages((offset, signal) => getRentals({ limit: LIMIT, offset }, signal), controller.signal, 'rental'),
                fetchAllPages((offset, signal) => getProjects({ limit: LIMIT, offset }, signal), controller.signal, 'project'),
            ])
            if (!controller.signal.aborted) setData({ listings, rentals, projects })
        }

        load().catch((requestError) => {
            if (requestError.name !== 'AbortError' && !controller.signal.aborted) setError(requestError.message)
        }).finally(() => {
            if (!controller.signal.aborted) setIsLoading(false)
        })

        return () => controller.abort()
    }, [])

    const listings = data?.listings || []
    const rentals = data?.rentals || []
    const projects = data?.projects || []
    const activeListings = listings.filter((listing) => listing.is_live === true)
    const eligibleTwoBhk = activeListings.filter((listing) => listing.bedroom === 2 && !excludedListingIds.has(listing.listing_id) && Number.isFinite(listing.price) && Number.isFinite(listing.carpet_area) && listing.carpet_area > 0)
    const averageTwoBhkPrice = eligibleTwoBhk.length ? eligibleTwoBhk.reduce((total, listing) => total + listing.price / listing.carpet_area, 0) / eligibleTwoBhk.length : 0
    const recentListings = listings.filter((listing) => {
        const postedAt = new Date(listing.posted_at)
        return !Number.isNaN(postedAt.valueOf()) && postedAt >= RECENT_START && postedAt < RECENT_END
    }).length
    const totalMonthlyRent = rentals.reduce((total, rental) => total + (Number.isFinite(rental.price) ? rental.price : 0), 0)
    const highestProject = projects.reduce((highest, project) => project.price_max > (highest?.price_max ?? -Infinity) ? project : highest, null)
    const makeBreakdown = (values, limit = values.length) => Object.entries(values).sort(([, first], [, second]) => second - first).slice(0, limit).map(([label, value], index, items) => ({ label, value, width: (value / items[0][1]) * 100 }))
    const bhkBreakdown = makeBreakdown(Object.entries(activeListings.reduce((counts, listing) => {
        const label = listing.bedroom ? `${listing.bedroom} BHK` : 'Other'
        counts[label] = (counts[label] || 0) + 1
        return counts
    }, {})))
    const furnishingBreakdown = makeBreakdown(Object.entries(activeListings.reduce((counts, listing) => {
        const label = listing.furnishing || 'Unspecified'
        counts[label] = (counts[label] || 0) + 1
        return counts
    }, {})))
    const localityBreakdown = makeBreakdown(Object.entries(activeListings.reduce((counts, listing) => {
        const label = listing.locality || 'Unspecified'
        counts[label] = (counts[label] || 0) + 1
        return counts
    }, {})), 5)

    return <div className="min-h-screen bg-[#f6f8f7] text-slate-900"><HomeHeader /><main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12 lg:py-14"><div className="mb-8"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-800">Market snapshot</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">Market &amp; Data Insights</h1><p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">A clear view of the Ivy Homes property market, calculated from complete listings, rental and project data.</p></div>{isLoading && <p className="border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Please wait while we calculate the market insights. Estimated time remaining: {estimatedSeconds} seconds.</p>}{!isLoading && error && <div role="alert" className="border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">Unable to load market insights: {error}</div>}{!isLoading && !error && data && <><section><h2 className="text-xl font-semibold">Market overview</h2><div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"><InsightCard label="Active listings" value={formatNumber(activeListings.length)} detail="Currently available homes" /><InsightCard label="Rental listings" value={formatNumber(rentals.length)} detail="Homes available to rent" /><InsightCard label="Projects" value={formatNumber(projects.length)} detail="Projects in the market" /><InsightCard label="Average 2 BHK price / sq.ft" value={formatCurrency(averageTwoBhkPrice, 2)} detail="Eligible active 2 BHK listings" /></div></section><section className="mt-10"><h2 className="text-xl font-semibold">Market highlights</h2><div className="mt-5 grid gap-5 md:grid-cols-3"><InsightCard label="Total monthly rent" value={formatCurrency(totalMonthlyRent)} detail="Across the rental inventory" /><InsightCard label="Listings posted recently" value={formatNumber(recentListings)} detail="Posted during the latest seven-day window" /><InsightCard label="Highest project price" value={highestProject ? `₹${formatNumber(highestProject.price_max, 1)} Cr` : 'No price data'} detail={highestProject ? highestProject.project_id : 'No project data'} /></div></section><section className="mt-10"><h2 className="text-xl font-semibold">Market breakdowns</h2><div className="mt-5 grid gap-6 lg:grid-cols-3"><div className="border border-slate-200 bg-white p-6"><h3 className="text-lg font-semibold">Listings by BHK</h3><BreakdownList items={bhkBreakdown} emptyLabel="No bedroom data available." /></div><div className="border border-slate-200 bg-white p-6"><h3 className="text-lg font-semibold">Furnishing mix</h3><BreakdownList items={furnishingBreakdown} emptyLabel="No furnishing data available." /></div><div className="border border-slate-200 bg-white p-6"><h3 className="text-lg font-semibold">Top localities</h3><p className="mt-2 text-sm text-slate-500">Active listing count</p><BreakdownList items={localityBreakdown} emptyLabel="No locality data available." /></div></div></section><p className="mt-10 border border-teal-100 bg-teal-50 px-5 py-4 text-sm leading-6 text-teal-900">Backend analytics are currently unavailable. These insights are calculated from the supported listings, rentals and projects endpoints.</p></>}</main></div>
}

export default Insights
