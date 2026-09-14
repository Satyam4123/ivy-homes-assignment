function LoadMore({ label, isLoading, hasMore, onLoadMore }) {
    return (
        <div className="mt-8 flex flex-col items-center gap-3 border-t border-slate-200 pt-5">
            {isLoading && <p className="text-sm text-slate-500">Loading more {label}...</p>}
            {!isLoading && hasMore && <button type="button" onClick={onLoadMore} className="border border-teal-800 px-4 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-800 hover:text-white">Load more {label}</button>}
            {!isLoading && !hasMore && <p className="text-sm text-slate-500">You have reached the end of the {label}.</p>}
        </div>
    )
}

export default LoadMore
