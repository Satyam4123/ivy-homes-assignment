function InsightCard({ label, value, detail }) {
    return <article className="border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>{detail && <p className="mt-2 text-sm text-slate-500">{detail}</p>}</article>
}

export default InsightCard