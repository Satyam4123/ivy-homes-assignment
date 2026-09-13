function ListingContactCard({ listing }) {
    return (
        <aside className="border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-slate-900">Listing contact</h2>
            <dl className="mt-5 space-y-4 text-sm">
                {listing.posted_by_name && <div><dt className="text-slate-500">Posted by</dt><dd className="mt-1 font-medium text-slate-900">{listing.posted_by_name}</dd></div>}
                {listing.posted_by && <div><dt className="text-slate-500">Role</dt><dd className="mt-1 capitalize font-medium text-slate-900">{listing.posted_by}</dd></div>}
                {listing.posted_by_contact && <div><dt className="text-slate-500">Contact</dt><dd className="mt-1 font-medium text-slate-900">{listing.posted_by_contact}</dd></div>}
            </dl>
        </aside>
    )
}

export default ListingContactCard