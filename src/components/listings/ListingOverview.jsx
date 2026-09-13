function ListingOverview({ listing }) {
    const overview = [
        ['Bedrooms', listing.bedroom == null ? null : `${listing.bedroom} BHK`],
        ['Bathrooms', listing.bathroom],
        ['Carpet area', listing.carpet_area == null ? null : `${listing.carpet_area} sq ft`],
        ['Floor', listing.floor == null || listing.total_floors == null ? null : `${listing.floor} of ${listing.total_floors}`],
        ['Furnishing', listing.furnishing],
        ['Parking', listing.covered_parking],
        ['Balconies', listing.balcony],
        ['Facing', listing.facing_direction],
    ]

    return (
        <section className="border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-slate-900">Property overview</h2>
            <div className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                {overview.map(([label, value]) => value != null && value !== '' && (
                    <div key={label} className="border-b border-slate-100 pb-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                        <p className="mt-1 text-sm font-medium capitalize text-slate-900">{value}</p>
                    </div>
                ))}
            </div>
        </section>
    )
}

export default ListingOverview