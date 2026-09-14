import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import HomeHeader from '../components/home/HomeHeader.jsx'
import { getProjects } from '../services/projectsService.js'

const LIMIT = 50

async function findProject(projectId, signal) {
    let offset = 0

    while (true) {
        const response = await getProjects({ limit: LIMIT, offset }, signal)
        const projects = Array.isArray(response?.results) ? response.results : []
        const project = projects.find((item) => String(item.project_id) === String(projectId))
        if (project) return project

        const hasMore = response?.has_more ?? response?.hasMore
        if (hasMore === false || projects.length === 0) return null
        offset += projects.length
    }
}

function formatPrice(value) {
    if (typeof value !== 'number') return 'Price unavailable'
    return `₹${value.toFixed(2)} Cr`
}

function formatArea(value) {
    return typeof value === 'number' ? `${value.toLocaleString('en-IN')} sq ft` : 'Not specified'
}

function ProjectDetail() {
    const { projectId } = useParams()
    const [project, setProject] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const controller = new AbortController()
        findProject(projectId, controller.signal)
            .then((result) => {
                if (!result) throw new Error('This project was not found.')
                if (!controller.signal.aborted) setProject(result)
            })
            .catch((requestError) => {
                if (requestError.name !== 'AbortError' && !controller.signal.aborted) setError(requestError.message)
            })
            .finally(() => {
                if (!controller.signal.aborted) setIsLoading(false)
            })

        return () => controller.abort()
    }, [projectId])

    return <div className="min-h-screen bg-[#f6f8f7] text-slate-900"><HomeHeader /><main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-12 lg:py-12"><Link to="/projects" className="cursor-pointer text-sm font-semibold text-teal-800 hover:text-teal-950">← Back to Projects</Link>{isLoading && <p className="mt-8 border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Loading project details...</p>}{!isLoading && error && <div role="alert" className="mt-8 border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>}{!isLoading && !error && project && <><section className="mt-8 border-b border-slate-200 bg-white p-6 sm:p-8"><div className="flex flex-wrap items-start justify-between gap-6"><div><p className="text-sm font-medium uppercase tracking-[0.14em] text-teal-800">Project</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-900 sm:text-4xl">{project.apartment_name || 'Project details'}</h1><p className="mt-3 text-base text-slate-500">{project.developer_name || 'Developer unavailable'} · {project.locality || 'Locality unavailable'}</p></div>{project.project_status && <p className="border border-slate-200 px-3 py-2 text-sm capitalize text-slate-600">{project.project_status}</p>}</div></section><section className="mt-6 border border-slate-200 bg-white p-6 sm:p-8"><h2 className="text-xl font-semibold">Project overview</h2><div className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">{[['Price range', `${formatPrice(project.price_min)} - ${formatPrice(project.price_max)}`], ['Area range', `${formatArea(project.min_area_sqft)} - ${formatArea(project.max_area_sqft)}`], ['Total units', project.total_units], ['Available listings', project.total_listings], ['Total towers', project.total_towers], ['Total floors', project.total_floors], ['Launch date', project.launch_date], ['Possession date', project.possession_date], ['RERA number', project.rera_number]].map(([label, value]) => value != null && value !== '' && <div key={label} className="border-b border-slate-100 pb-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-sm font-medium text-slate-900">{value}</p></div>)}</div>{Array.isArray(project.amenities) && project.amenities.length > 0 && <div className="mt-8"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Amenities</p><div className="mt-3 flex flex-wrap gap-2">{project.amenities.map((amenity) => <span key={amenity} className="border border-slate-200 px-2 py-1 text-xs capitalize text-slate-600">{amenity}</span>)}</div></div>}{project.project_url && <a href={project.project_url} target="_blank" rel="noreferrer" className="mt-8 inline-block cursor-pointer border border-teal-800 px-4 py-2.5 text-sm font-semibold text-teal-800 transition hover:bg-teal-800 hover:text-white">View Original Project</a>}</section></>}</main></div>
}

export default ProjectDetail
