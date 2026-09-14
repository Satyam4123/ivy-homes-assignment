import { useEffect, useState } from 'react'
import HomeHeader from '../components/home/HomeHeader.jsx'
import ListingCard from '../components/listings/ListingCard.jsx'
import LoadMore from '../components/listings/LoadMore.jsx'
import { useSavedListings } from '../context/savedListingsContext.js'

function SavedListings() {
    const { savedListings, isLoading, hasLoaded, hasMore, loadSavedListings, loadMoreSavedListings } = useSavedListings()
    const [error, setError] = useState('')

    useEffect(() => {
        if (hasLoaded) return undefined
        const controller = new AbortController()
        loadSavedListings(controller.signal).catch((requestError) => {
            if (requestError.name !== 'AbortError') setError(requestError.message)
        })
        return () => controller.abort()
    }, [hasLoaded, loadSavedListings])

    return (
        <div className="min-h-screen bg-[#f6f8f7] text-slate-900">
            <HomeHeader />
            <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
                <div className="mb-8"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-800">Your collection</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">Saved listings</h1><p className="mt-3 text-base leading-7 text-slate-500">Properties you want to come back to.</p></div>
                {isLoading && <p className="border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Loading saved listings...</p>}
                {!isLoading && error && <div role="alert" className="border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>}
                {!isLoading && !error && savedListings.length === 0 && <p className="border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">You have no saved listings yet.</p>}
                {!error && savedListings.length > 0 && <><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{savedListings.map((listing) => <ListingCard key={listing.listing_id} listing={listing} isSavedPage />)}</div><LoadMore label="saved listings" isLoading={isLoading} hasMore={hasMore} onLoadMore={loadMoreSavedListings} /></>}
            </main>
        </div>
    )
}

export default SavedListings