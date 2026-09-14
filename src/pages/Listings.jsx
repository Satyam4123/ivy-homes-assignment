import { useCallback, useEffect, useState } from 'react'
import HomeHeader from '../components/home/HomeHeader.jsx'
import ListingCard from '../components/listings/ListingCard.jsx'
import ListingFilters from '../components/listings/ListingFilters.jsx'
import LoadMore from '../components/listings/LoadMore.jsx'
import { useSavedListings } from '../context/savedListingsContext.js'
import { useInfiniteResource } from '../hooks/useInfiniteResource.js'
import { getListings } from '../services/listingsService.js'

const LIMIT = 50
const emptyFilters = { locality: '', bhk: '', minPrice: '', maxPrice: '', furnishing: '', sortBy: '' }

function Listings() {
    const [filters, setFilters] = useState(emptyFilters)
    const [appliedFilters, setAppliedFilters] = useState(emptyFilters)
    const { hasLoaded, loadSavedListings } = useSavedListings()
    const loadPage = useCallback((offset, signal) => getListings({ ...appliedFilters, limit: LIMIT, offset }, signal), [appliedFilters])
    const getItemKey = useCallback((listing) => listing.listing_id, [])
    const { items, isLoading, hasMore, error, loadMore } = useInfiniteResource({
        loadPage,
        getItemKey,
        resetKey: JSON.stringify(appliedFilters),
    })

    useEffect(() => {
        if (hasLoaded) return undefined

        const controller = new AbortController()
        loadSavedListings(controller.signal).catch(() => { })

        return () => controller.abort()
    }, [hasLoaded, loadSavedListings])

    function handleFilterChange(name, value) {
        setFilters((currentFilters) => ({ ...currentFilters, [name]: value }))
    }

    function handleSubmit(event) {
        event.preventDefault()
        setAppliedFilters(filters)
    }

    function handleClear() {
        setFilters(emptyFilters)
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
                    {!isLoading && !error && items.length === 0 && <p className="border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No listings match these filters.</p>}
                    {!error && items.length > 0 && <>
                        <div><p className="text-sm text-slate-500">Live results</p><h2 className="mt-1 text-2xl font-semibold">Available properties</h2></div>
                        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{items.map((listing) => <ListingCard key={listing.listing_id} listing={listing} />)}</div>
                        <LoadMore label="listings" isLoading={isLoading} hasMore={hasMore} onLoadMore={loadMore} />
                    </>}
                </section>
            </main>
        </div>
    )
}

export default Listings