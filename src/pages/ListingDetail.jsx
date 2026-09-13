import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import HomeHeader from '../components/home/HomeHeader.jsx'
import ListingContactCard from '../components/listings/ListingContactCard.jsx'
import ListingDetails from '../components/listings/ListingDetails.jsx'
import ListingDetailHero from '../components/listings/ListingDetailHero.jsx'
import ListingOverview from '../components/listings/ListingOverview.jsx'
import { getListingById } from '../services/listingsService.js'
import { useSavedListings } from '../context/savedListingsContext.js'

function ListingDetailContent({ listingId }) {
    const [listing, setListing] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [saveError, setSaveError] = useState('')
    const { hasLoaded, loadSavedListings, isSaved, isSaving, toggleSaved } = useSavedListings()

    useEffect(() => {
        const controller = new AbortController()

        getListingById(listingId, controller.signal)
            .then((response) => {
                if (!response || typeof response !== 'object' || Array.isArray(response) || !response.listing_id) {
                    throw new Error('This listing could not be loaded.')
                }
                if (!controller.signal.aborted) setListing(response)
            })
            .catch((requestError) => {
                if (requestError.name !== 'AbortError') {
                    setError(requestError.status === 404 ? 'This listing was not found.' : requestError.message)
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) setIsLoading(false)
            })

        return () => controller.abort()
    }, [listingId])

    useEffect(() => {
        if (hasLoaded) return undefined
        const controller = new AbortController()
        loadSavedListings(controller.signal).catch(() => { })
        return () => controller.abort()
    }, [hasLoaded, loadSavedListings])

    async function handleToggleSaved() {
        setSaveError('')
        try {
            await toggleSaved(listing)
        } catch (requestError) {
            setSaveError(requestError.message)
        }
    }

    return <>
        {isLoading && <p className="mx-auto mt-8 max-w-7xl px-5 py-16 text-center text-sm text-slate-500 sm:px-8 lg:px-12">Loading property details...</p>}
        {!isLoading && error && <div role="alert" className="mx-auto mt-8 max-w-7xl border border-rose-200 bg-rose-50 px-5 py-6 text-sm text-rose-700 sm:px-8 lg:px-12">{error}</div>}
        {!isLoading && !error && listing && <>
            <ListingDetailHero listing={listing} isSaved={isSaved(listing.listing_id)} isSaving={isSaving(listing.listing_id)} onToggleSaved={handleToggleSaved} />
            {saveError && <p role="alert" className="mx-auto max-w-7xl px-5 pt-5 text-sm text-rose-600 sm:px-8 lg:px-12">{saveError}</p>}
            <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[1.5fr_1fr] lg:px-12 lg:py-12">
                <div className="space-y-6"><ListingOverview listing={listing} /><ListingDetails listing={listing} /></div>
                <ListingContactCard listing={listing} />
            </div>
        </>}
    </>
}

function ListingDetail() {
    const { listingId } = useParams()

    return (
        <div className="min-h-screen bg-[#f6f8f7] text-slate-900">
            <HomeHeader />
            <main>
                <div className="mx-auto max-w-7xl px-5 pt-6 sm:px-8 lg:px-12">
                    <Link to="/listings" className="text-sm font-semibold text-teal-800 hover:text-teal-950">← Back to listings</Link>
                </div>
                <ListingDetailContent key={listingId} listingId={listingId} />
            </main>
        </div>
    )
}

export default ListingDetail