import { Link } from 'react-router-dom'

function formatRent(price) {
    if (typeof price !== 'number') return 'Rent unavailable'
    return `₹${price.toLocaleString('en-IN')} / month`
}

function RentalCard({ rental }) {
    return (
        <article className="flex h-full flex-col border border-slate-200 bg-white p-5 transition hover:border-teal-300 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">{rental.property_type || 'Rental home'}</p>
            <h2 className="mt-3 text-lg font-semibold text-slate-900">{rental.title || rental.apartment_name || 'Rental listing'}</h2>
            <p className="mt-1 text-sm text-slate-500">{rental.locality || 'Locality unavailable'}</p>
            <p className="mt-5 text-xl font-semibold text-slate-900">{formatRent(rental.price)}</p>
            <div className="mt-4 grid grid-cols-2 gap-y-3 border-y border-slate-100 py-4 text-sm text-slate-600 sm:grid-cols-3">
                <span><strong className="block text-slate-900">{rental.bedroom} BHK</strong>Bedrooms</span>
                <span><strong className="block text-slate-900">{rental.bathroom}</strong>Bathrooms</span>
                <span><strong className="block text-slate-900">{rental.carpet_area} sq ft</strong>Carpet area</span>
                <span><strong className="block capitalize text-slate-900">{rental.furnishing || 'Not specified'}</strong>Furnishing</span>
                <span><strong className="block text-slate-900">{rental.maintenance == null ? 'Not specified' : `₹${rental.maintenance.toLocaleString('en-IN')}`}</strong>Maintenance</span>
            </div>
            <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-500">{rental.description || 'No description available for this rental.'}</p>
            <div className="mt-auto pt-5"><Link to={`/listings/${encodeURIComponent(rental.listing_id)}`} className="block w-full border border-teal-800 px-4 py-2.5 text-center text-sm font-semibold text-teal-800 transition hover:bg-teal-800 hover:text-white">View property</Link></div>
        </article>
    )
}

export default RentalCard