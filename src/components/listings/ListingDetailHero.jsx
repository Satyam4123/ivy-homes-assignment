import SaveListingButton from './SaveListingButton.jsx'

function formatPrice(price) {
    if (typeof price !== 'number') return 'Price unavailable'
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`
    return `₹${(price / 100000).toFixed(0)} Lakh`
}

function ListingDetailHero({ listing, isSaved, isSaving, onToggleSaved }) {
    return (
        <section className="border-b border-slate-200 bg-white">
            <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
                <div className="flex flex-wrap items-start justify-between gap-6">
                    <div>
                        <p className="text-sm font-medium uppercase tracking-[0.14em] text-teal-800">{listing.property_type || 'Property'}</p>
                        <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.03em] text-slate-900 sm:text-4xl">{listing.apartment_name || 'Property details'}</h1>
                        <p className="mt-3 text-base text-slate-500">{listing.locality || 'Locality unavailable'}</p>
                    </div>
                    <div className="text-left sm:text-right">
                        <p className="text-2xl font-semibold text-slate-900">{formatPrice(listing.price)}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2 sm:justify-end">
                            {listing.is_verified && <p className="border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Verified listing</p>}
                            <SaveListingButton isSaved={isSaved} isSaving={isSaving} onToggle={onToggleSaved} />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default ListingDetailHero