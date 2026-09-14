import { useEffect, useState } from 'react'
import HomeHeader from '../components/home/HomeHeader.jsx'
import ListingCard from '../components/listings/ListingCard.jsx'
import ListingFilters from '../components/listings/ListingFilters.jsx'
import ListingPagination from '../components/listings/ListingPagination.jsx'
import { getListings } from '../services/listingsService.js'

const LIMIT = 20
const emptyFilters = { locality: '', bhk: '', minPrice: '', maxPrice: '', furnishing: '', sortBy: '' }

function Listings() {
    const [filters, setFilters] = useState(emptyFilters)
    const [appliedFilters, setAppliedFilters] = useState(emptyFilters)
    const [results, setResults] = useState(null)
    const [offset, setOffset] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const controller = new AbortController()
        getListings({ ...appliedFilters, limit: LIMIT, offset }, controller.signal)
            .then((response) => {
                if (!controller.signal.aborted) setResults(response)
            })
            .catch((requestError) => {
                if (requestError.name !== 'AbortError') {
                    setResults(null)
                    setError(requestError.message)
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) setIsLoading(false)
            })

        return () => controller.abort()
    }, [appliedFilters, offset])

    function handleFilterChange(name, value) {
        setFilters((currentFilters) => ({ ...currentFilters, [name]: value }))
    }

    function handleSubmit(event) {
        event.preventDefault()
        setError('')
        setIsLoading(true)
        setOffset(0)
        setAppliedFilters(filters)
    }

    function handleClear() {
        setError('')
        setIsLoading(true)
        setFilters(emptyFilters)
        setOffset(0)
        setAppliedFilters(emptyFilters)
    }

    return (
        <div className="min-h-screen bg-[#f6f8f7] text-slate-900">
            <HomeHeader />
            <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
                <div className="mb-8">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-800">Property search</p>
                    <h1 className="mt-3 text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">Browse available homes</h1>
                    <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">Search live property listings by location, size, price and furnishing.</p>
                </div>
                <ListingFilters filters={filters} onChange={handleFilterChange} onSubmit={handleSubmit} onClear={handleClear} isLoading={isLoading} />
                <section className="mt-10" aria-live="polite">
                    {isLoading && <p className="border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Loading listings...</p>}
                    {!isLoading && error && <div role="alert" className="border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>}
                    {!isLoading && !error && results?.results?.length === 0 && <p className="border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No listings match these filters.</p>}
                    {!isLoading && !error && results?.results?.length > 0 && <>
                        <div className="flex items-end justify-between gap-4"><div><p className="text-sm text-slate-500">Live results</p><h2 className="mt-1 text-2xl font-semibold">Available properties</h2></div><p className="text-sm text-slate-500">{results.total} total</p></div>
                        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{results.results.map((listing) => <ListingCard key={listing.listing_id} listing={listing} />)}</div>
                        <ListingPagination {...results} onPrevious={() => { setIsLoading(true); setOffset(Math.max(0, offset - LIMIT)) }} onNext={() => { setIsLoading(true); setOffset(offset + LIMIT) }} isLoading={isLoading} />
                    </>}
                </section>
            </main>
        </div>
    )
}

export default Listings