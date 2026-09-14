import { Link } from 'react-router-dom'

function formatProjectPrice(value) {
    if (typeof value !== 'number') return 'Price unavailable'
    return value < 10 ? `₹${value.toFixed(2)} Cr` : `₹${value.toFixed(2)} Lakh`
}

function formatArea(value) {
    return typeof value === 'number' ? `${value.toLocaleString('en-IN')} sq ft` : 'Area unavailable'
}

function ProjectCard({ project }) {
    return (
        <article className="flex h-full flex-col border border-slate-200 bg-white p-5 transition hover:border-teal-300 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-teal-800">Project</p><h2 className="mt-3 text-lg font-semibold text-slate-900">{project.apartment_name}</h2></div><span className="shrink-0 border border-slate-200 px-2 py-1 text-xs capitalize text-slate-600">{project.project_status || 'Status unavailable'}</span></div>
            <p className="mt-2 text-sm text-slate-500">{project.developer_name || 'Developer unavailable'} · {project.locality || 'Locality unavailable'}</p>
            <div className="mt-5 grid grid-cols-2 gap-y-4 border-y border-slate-100 py-4 text-sm text-slate-600"><span><strong className="block text-slate-900">{formatArea(project.min_area_sqft)} - {formatArea(project.max_area_sqft)}</strong>Area range</span><span><strong className="block text-slate-900">{formatProjectPrice(project.price_min)} - {formatProjectPrice(project.price_max)}</strong>Price range</span><span><strong className="block text-slate-900">{project.total_units ?? 'Not specified'}</strong>Total units</span><span><strong className="block text-slate-900">{project.total_listings ?? 'Not specified'}</strong>Listings</span></div>
            {Array.isArray(project.amenities) && project.amenities.length > 0 && <div className="mt-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Amenities</p><div className="mt-2 flex flex-wrap gap-2">{project.amenities.slice(0, 5).map((amenity) => <span key={amenity} className="border border-slate-200 px-2 py-1 text-xs capitalize text-slate-600">{amenity}</span>)}{project.amenities.length > 5 && <span className="px-2 py-1 text-xs text-slate-500">+{project.amenities.length - 5} more</span>}</div></div>}
            <div className="mt-auto pt-5"><Link to={`/projects/${encodeURIComponent(project.project_id)}`} className="block w-full cursor-pointer border border-teal-800 px-4 py-2.5 text-center text-sm font-semibold text-teal-800 transition hover:bg-teal-800 hover:text-white">View project</Link></div>
        </article>
    )
}

export default ProjectCard