import { useCallback, useMemo, useState } from 'react'
import { getSavedListings, saveListing, unsaveListing } from '../services/listingsService.js'
import { SavedListingsContext } from './savedListingsContext.js'

export function SavedListingsProvider({ children }) {
    const [savedListings, setSavedListings] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [hasLoaded, setHasLoaded] = useState(false)
    const [savingIds, setSavingIds] = useState({})

    const loadSavedListings = useCallback(async (signal) => {
        setIsLoading(true)
        try {
            const response = await getSavedListings(signal)
            setSavedListings(Array.isArray(response?.results) ? response.results : [])
            setHasLoaded(true)
        } finally {
            if (!signal?.aborted) setIsLoading(false)
        }
    }, [])

    const toggleSaved = useCallback(async (listing) => {
        const listingId = listing.listing_id
        const isSaved = savedListings.some((savedListing) => savedListing.listing_id === listingId)
        setSavingIds((current) => ({ ...current, [listingId]: true }))

        try {
            if (isSaved) {
                await unsaveListing(listingId)
                setSavedListings((current) => current.filter((savedListing) => savedListing.listing_id !== listingId))
            } else {
                await saveListing(listingId)
                setSavedListings((current) => current.some((savedListing) => savedListing.listing_id === listingId) ? current : [...current, listing])
            }
        } finally {
            setSavingIds((current) => ({ ...current, [listingId]: false }))
        }
    }, [savedListings])

    const value = useMemo(() => ({
        savedListings,
        isLoading,
        hasLoaded,
        loadSavedListings,
        toggleSaved,
        isSaved: (listingId) => savedListings.some((listing) => listing.listing_id === listingId),
        isSaving: (listingId) => Boolean(savingIds[listingId]),
    }), [hasLoaded, isLoading, loadSavedListings, savedListings, savingIds, toggleSaved])

    return <SavedListingsContext.Provider value={value}>{children}</SavedListingsContext.Provider>
}