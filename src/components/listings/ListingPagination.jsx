function ListingPagination({ limit, offset, count, total, hasMore, onPrevious, onNext, isLoading }) {
    const firstResult = total === 0 ? 0 : offset + 1
    const lastResult = offset + count

    return (
        <div className="mt-8 flex flex-col gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">Showing {firstResult}-{lastResult} of {total} listings</p>
            <div className="flex gap-2">
                <button type="button" onClick={onPrevious} disabled={offset === 0 || isLoading} className="border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-teal-700 hover:text-teal-800 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
                <button type="button" onClick={onNext} disabled={!hasMore || count < limit || isLoading} className="border border-teal-800 px-4 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40">Next</button>
            </div>
        </div>
    )
}

export default ListingPagination