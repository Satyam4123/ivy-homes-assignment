function SaveListingButton({ isSaved, isSaving, onToggle, savedLabel = 'Saved', savingLabel = 'Saving...' }) {
    return (
        <button
            type="button"
            onClick={onToggle}
            disabled={isSaving}
            aria-pressed={isSaved}
            aria-label={isSaved ? 'Remove from saved listings' : 'Save listing'}
            className="shrink-0 border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-700 hover:text-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
            {isSaving ? savingLabel : isSaved ? savedLabel : 'Save'}
        </button>
    )
}

export default SaveListingButton