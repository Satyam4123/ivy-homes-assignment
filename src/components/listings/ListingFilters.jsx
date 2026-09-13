function ListingFilters({ filters, onChange, onSubmit, onClear, isLoading }) {
    return (
        <form onSubmit={onSubmit} className="border border-slate-200 bg-white p-5">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <div className="lg:col-span-1">
                    <label htmlFor="locality" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Locality</label>
                    <input id="locality" value={filters.locality} onChange={(event) => onChange('locality', event.target.value)} placeholder="e.g. Whitefield" className="w-full border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-100" />
                </div>
                <div>
                    <label htmlFor="bhk" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Bedrooms</label>
                    <select id="bhk" value={filters.bhk} onChange={(event) => onChange('bhk', event.target.value)} className="w-full border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-100">
                        <option value="">Any BHK</option><option value="1">1 BHK</option><option value="2">2 BHK</option><option value="3">3 BHK</option><option value="4">4 BHK</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="min-price" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Minimum price</label>
                    <input id="min-price" type="number" min="0" value={filters.minPrice} onChange={(event) => onChange('minPrice', event.target.value)} placeholder="₹ Minimum" className="w-full border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-100" />
                </div>
                <div>
                    <label htmlFor="max-price" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Maximum price</label>
                    <input id="max-price" type="number" min="0" value={filters.maxPrice} onChange={(event) => onChange('maxPrice', event.target.value)} placeholder="₹ Maximum" className="w-full border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-100" />
                </div>
                <div>
                    <label htmlFor="furnishing" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Furnishing</label>
                    <select id="furnishing" value={filters.furnishing} onChange={(event) => onChange('furnishing', event.target.value)} className="w-full border border-slate-300 bg-white px-3 py-2.5 text-sm capitalize outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-100">
                        <option value="">Any furnishing</option><option value="unfurnished">Unfurnished</option><option value="semi-furnished">Semi-furnished</option><option value="fully-furnished">Fully-furnished</option>
                    </select>
                </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-end gap-4 border-t border-slate-100 pt-4">
                <button type="button" onClick={onClear} className="text-sm font-semibold text-slate-500 hover:text-slate-900">Clear filters</button>
                <button type="submit" disabled={isLoading} className="bg-teal-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-900 focus:outline-none focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:opacity-60">{isLoading ? 'Searching...' : 'Search homes'}</button>
            </div>
        </form>
    )
}

export default ListingFilters