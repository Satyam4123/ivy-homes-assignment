function formatPrice(price) {
    return `₹${(price / 10000000).toFixed(2)} Cr`
}

function PropertyCard({ listing }) {
    return (
        <article className="flex h-full flex-col border border-slate-200 bg-white transition hover:border-teal-300 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
            <div className="relative flex h-48 items-end bg-slate-200 p-5 sm:h-56">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,#dbe6e4,#b9cbc7_52%,#8fa9a4)]" aria-hidden="true" />
                <div className="relative flex w-full items-end justify-between">
                    <span className="bg-white/95 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">{listing.property_type}</span>
                    <span className="bg-slate-900/80 px-2.5 py-1 text-xs text-white">{listing.furnishing}</span>
                </div>
            </div>
            <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">{listing.apartment_name}</h3>
                        <p className="mt-1 text-sm text-slate-500">{listing.locality}</p>
                    </div>
                    {listing.is_verified && <span className="shrink-0 border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">Verified</span>}
                </div>
                <p className="mt-5 text-xl font-semibold text-slate-900">{formatPrice(listing.price)}</p>
                <div className="mt-4 grid grid-cols-3 border-y border-slate-100 py-3 text-sm text-slate-600">
                    <span><strong className="block text-slate-900">{listing.bedroom}</strong> Beds</span>
                    <span><strong className="block text-slate-900">{listing.bathroom}</strong> Baths</span>
                    <span><strong className="block text-slate-900">{listing.carpet_area}</strong> sq ft</span>
                </div>
                <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-500">{listing.description}</p>
                <button type="button" className="mt-5 w-full border border-teal-800 px-4 py-2.5 text-sm font-semibold text-teal-800 transition hover:bg-teal-800 hover:text-white focus:outline-none focus:ring-4 focus:ring-teal-100">View property</button>
            </div>
        </article>
    )
}

export default PropertyCard