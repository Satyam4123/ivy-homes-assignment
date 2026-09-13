import { useEffect, useMemo, useState } from 'react'
import HomeHeader from '../components/home/HomeHeader.jsx'
import PropertyCard from '../components/home/PropertyCard.jsx'
import { getListings } from '../services/listingsService.js'

function Home() {
    const [listings, setListings] = useState([])
    const [query, setQuery] = useState('')
    const [bedrooms, setBedrooms] = useState('')
    const [propertyType, setPropertyType] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const controller = new AbortController()

        getListings({ limit: 50, offset: 0, locality: '', bhk: '', minPrice: '', maxPrice: '', furnishing: '' }, controller.signal)
            .then((response) => setListings(response.results || []))
            .catch((requestError) => {
                if (requestError.name !== 'AbortError') setError(requestError.message)
            })
            .finally(() => setIsLoading(false))

        return () => controller.abort()
    }, [])

    const filteredListings = useMemo(() => listings.filter((listing) => {
        const matchesQuery = `${listing.apartment_name} ${listing.locality}`.toLowerCase().includes(query.toLowerCase())
        const matchesBedrooms = !bedrooms || listing.bedroom === Number(bedrooms)
        const matchesType = !propertyType || listing.property_type === propertyType
        return matchesQuery && matchesBedrooms && matchesType
    }), [bedrooms, listings, propertyType, query])

    return (
        <div className="min-h-screen bg-[#f6f8f7] text-slate-900">
            <HomeHeader />
            <main>
                <section className="border-b border-slate-200 bg-white">
                    <div className="mx-auto max-w-7xl px-5 pb-12 pt-14 sm:px-8 lg:px-12 lg:pb-16 lg:pt-20">
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-800">Find your next address</p>
                        <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.03em] text-slate-900 sm:text-5xl">Homes chosen for how you want to live.</h1>
                        <p className="mt-5 max-w-xl text-base leading-7 text-slate-500">Explore considered spaces in Bengaluru, with the details you need to make a confident choice.</p>
                        <div className="mt-9 grid gap-3 border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1.6fr_1fr_1fr_auto] sm:items-center">
                            <label className="sr-only" htmlFor="home-search">Search by locality or property</label>
                            <input id="home-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search locality or property" className="min-w-0 border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-100" />
                            <label className="sr-only" htmlFor="bedrooms">Bedrooms</label>
                            <select id="bedrooms" value={bedrooms} onChange={(event) => setBedrooms(event.target.value)} className="border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-100">
                                <option value="">Any bedrooms</option><option value="2">2 bedrooms</option><option value="3">3 bedrooms</option><option value="4">4 bedrooms</option>
                            </select>
                            <label className="sr-only" htmlFor="property-type">Property type</label>
                            <select id="property-type" value={propertyType} onChange={(event) => setPropertyType(event.target.value)} className="border border-slate-300 bg-white px-4 py-3 text-sm capitalize text-slate-700 outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-100">
                                <option value="">Any property type</option><option value="apartment">Apartment</option><option value="villa">Villa</option>
                            </select>
                            <button type="button" onClick={() => { setQuery(''); setBedrooms(''); setPropertyType('') }} className="px-4 py-3 text-sm font-semibold text-teal-800 hover:text-teal-950">Clear</button>
                        </div>
                    </div>
                </section>
                <section id="listings" className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
                    <div className="flex items-end justify-between gap-4">
                        <div><p className="text-sm font-medium text-slate-500">Curated for you</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">Featured homes</h2></div>
                        <p className="text-sm text-slate-500">{filteredListings.length} homes</p>
                    </div>
                    {isLoading ? <p className="mt-7 border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading homes...</p> : error ? <p role="alert" className="mt-7 border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">Unable to load homes: {error}</p> : filteredListings.length > 0 ? <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-4">{filteredListings.map((listing) => <PropertyCard key={listing.listing_id} listing={listing} />)}</div> : <p className="mt-7 border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">No homes match those filters.</p>}
                </section>
            </main>
        </div>
    )
}

export default Home