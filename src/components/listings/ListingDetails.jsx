function ListingDetails({ listing }) {
    return (
        <section className="border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-slate-900">About this property</h2>
            <p className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-600">{listing.description || 'No description was provided for this listing.'}</p>
            <div className="mt-7 grid gap-4 border-t border-slate-100 pt-5 text-sm text-slate-500 sm:grid-cols-2">
                {listing.is_live != null && <p>Status: <strong className="font-medium text-slate-900">{listing.is_live ? 'Live' : 'Unavailable'}</strong></p>}
                {listing.posted_at && <p>Posted: <strong className="font-medium text-slate-900">{new Date(listing.posted_at).toLocaleDateString()}</strong></p>}
            </div>
        </section>
    )
}

export default ListingDetails