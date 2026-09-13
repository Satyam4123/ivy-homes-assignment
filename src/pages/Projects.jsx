import { useEffect, useState } from 'react'
import HomeHeader from '../components/home/HomeHeader.jsx'
import ResourcePagination from '../components/listings/ResourcePagination.jsx'
import ProjectCard from '../components/projects/ProjectCard.jsx'
import { getProjects } from '../services/projectsService.js'

const LIMIT = 20

function Projects() {
    const [results, setResults] = useState(null)
    const [offset, setOffset] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const controller = new AbortController()
        getProjects({ limit: LIMIT, offset }, controller.signal)
            .then((response) => { if (!controller.signal.aborted) setResults(response) })
            .catch((requestError) => { if (requestError.name !== 'AbortError') { setResults(null); setError(requestError.message) } })
            .finally(() => { if (!controller.signal.aborted) setIsLoading(false) })
        return () => controller.abort()
    }, [offset])

    function changePage(nextOffset) {
        setError('')
        setIsLoading(true)
        setOffset(nextOffset)
    }

    return <div className="min-h-screen bg-[#f6f8f7] text-slate-900"><HomeHeader /><main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12 lg:py-14"><div className="mb-8"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-800">New developments</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">Explore projects</h1><p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">Compare project scale, location, area ranges and pricing from the live project catalogue.</p></div>{isLoading && <p className="border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Loading projects...</p>}{!isLoading && error && <div role="alert" className="border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>}{!isLoading && !error && results?.results?.length === 0 && <p className="border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No projects are available.</p>}{!isLoading && !error && results?.results?.length > 0 && <><div className="flex items-end justify-between gap-4"><div><p className="text-sm text-slate-500">Live results</p><h2 className="mt-1 text-2xl font-semibold">Builder projects</h2></div><p className="text-sm text-slate-500">{results.total} total</p></div><div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{results.results.map((project) => <ProjectCard key={project.project_id} project={project} />)}</div><ResourcePagination label="projects" {...results} onPrevious={() => changePage(Math.max(0, offset - LIMIT))} onNext={() => changePage(offset + LIMIT)} isLoading={isLoading} /></>}</main></div>
}

export default Projects