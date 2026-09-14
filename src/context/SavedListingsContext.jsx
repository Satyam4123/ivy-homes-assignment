import { useCallback, useMemo, useRef, useState } from 'react'
import { getSavedListings, saveListing, unsaveListing } from '../services/listingsService.js'
import { SavedListingsContext } from './savedListingsContext.js'

const LIMIT = 50

export function SavedListingsProvider({ children }) {
    const [savedListings, setSavedListings] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [hasLoaded, setHasLoaded] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [savingIds, setSavingIds] = useState({})
    const offsetRef = useRef(0)
    const hasMoreRef = useRef(true)
    const activeRequestRef = useRef(null)

    const loadSavedPage = useCallback(async (offset, signal, append) => {
        const activeRequest = activeRequestRef.current
        if (activeRequest && !activeRequest.signal?.aborted) return
        if (append && !hasMoreRef.current) return

        const request = { signal }
        activeRequestRef.current = request
        setIsLoading(true)
        try {
            const response = await getSavedListings({ limit: LIMIT, offset }, signal)
            const batch = Array.isArray(response?.results) ? response.results : []
            const nextOffset = offset + batch.length
            const responseHasMore = response?.has_more ?? response?.hasMore
            const nextHasMore = responseHasMore === undefined ? batch.length > 0 : Boolean(responseHasMore)

            setSavedListings((current) => {
                const existingIds = new Set(append ? current.map((listing) => listing.listing_id) : [])
                const uniqueBatch = batch.filter((listing) => {
                    if (existingIds.has(listing.listing_id)) return false
                    existingIds.add(listing.listing_id)
                    return true
                })
                return append ? [...current, ...uniqueBatch] : uniqueBatch
            })
            offsetRef.current = nextOffset
            hasMoreRef.current = nextHasMore && batch.length > 0
            setHasMore(hasMoreRef.current)
            setHasLoaded(true)
        } finally {
            if (activeRequestRef.current === request) {
                activeRequestRef.current = null
                if (!signal?.aborted) setIsLoading(false)
            }
        }
    }, [])

    const loadSavedListings = useCallback(async (signal) => {
        offsetRef.current = 0
        hasMoreRef.current = true
        setHasMore(true)
        setSavedListings([])
        await loadSavedPage(0, signal, false)
    }, [loadSavedPage])

    const loadMoreSavedListings = useCallback(() => loadSavedPage(offsetRef.current, undefined, true), [loadSavedPage])

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
        hasMore,
        loadSavedListings,
        loadMoreSavedListings,
        toggleSaved,
        isSaved: (listingId) => savedListings.some((listing) => listing.listing_id === listingId),
        isSaving: (listingId) => Boolean(savingIds[listingId]),
    }), [hasLoaded, hasMore, isLoading, loadMoreSavedListings, loadSavedListings, savedListings, savingIds, toggleSaved])

    return <SavedListingsContext.Provider value={value}>{children}</SavedListingsContext.Provider>
}