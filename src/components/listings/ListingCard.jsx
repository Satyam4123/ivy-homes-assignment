import { Link } from 'react-router-dom'
import { useState } from 'react'
import SaveListingButton from './SaveListingButton.jsx'
import { useSavedListings } from '../../context/savedListingsContext.js'

function formatPrice(price) {
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`
    return `₹${(price / 100000).toFixed(0)} Lakh`
}

function ListingCard({ listing, isSavedPage = false }) {
    const { isSaved, isSaving, toggleSaved } = useSavedListings()
    const [saveError, setSaveError] = useState('')

    async function handleToggleSaved() {
        setSaveError('')
        try {
            await toggleSaved(listing)
        } catch (error) {
            setSaveError(error.message)
        }
    }

    return (
        <article className="flex h-full flex-col border border-slate-200 bg-white p-5 transition hover:border-teal-300 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-slate-900" title={listing.apartment_name}>{listing.apartment_name}</h2>
                    <p className="mt-1 text-sm text-slate-500">{listing.locality}</p>
                </div>
                <div className="flex items-start gap-2">
                    {listing.is_verified && <span className="shrink-0 border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">Verified</span>}
                    <SaveListingButton isSaved={isSaved(listing.listing_id)} isSaving={isSaving(listing.listing_id)} onToggle={handleToggleSaved} savedLabel={isSavedPage ? 'Remove' : 'Saved'} savingLabel={isSavedPage ? 'Removing...' : 'Saving...'} />
                </div>
            </div>
            <p className="mt-5 text-xl font-semibold text-slate-900">{formatPrice(listing.price)}</p>
            <div className="mt-4 grid grid-cols-2 gap-y-3 border-y border-slate-100 py-4 text-sm text-slate-600 sm:grid-cols-3">
                <span><strong className="block text-slate-900">{listing.bedroom} BHK</strong>Bedrooms</span>
                <span><strong className="block text-slate-900">{listing.bathroom}</strong>Bathrooms</span>
                <span><strong className="block text-slate-900">{listing.carpet_area} sq ft</strong>Carpet area</span>
                <span><strong className="block text-slate-900">{listing.furnishing}</strong>Furnishing</span>
                <span><strong className="block text-slate-900">{listing.floor}/{listing.total_floors}</strong>Floor</span>
                <span><strong className="block text-slate-900">{listing.covered_parking || 0}</strong>Parking</span>
            </div>
            <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-500">{listing.description || 'No description available for this listing.'}</p>
            {saveError && <p role="alert" className="mt-3 text-sm text-rose-600">{saveError}</p>}
            <div className="mt-auto pt-5">
                <Link to={`/listings/${encodeURIComponent(listing.listing_id)}`} className="block w-full border border-teal-800 px-4 py-2.5 text-center text-sm font-semibold text-teal-800 transition hover:bg-teal-800 hover:text-white focus:outline-none focus:ring-4 focus:ring-teal-100">View listing</Link>
            </div>
        </article>
    )
}

export default ListingCard