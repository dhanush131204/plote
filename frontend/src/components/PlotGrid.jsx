import PlotCard from './PlotCard'

export default function PlotGrid({ plots }) {
  if (!plots || plots.length === 0) {
    return (
      <div className="plot-grid-empty">
        <p>No plots match your filters. Try adjusting the filters.</p>
      </div>
    )
  }

  return (
    <div className="plot-grid">
      {plots.map((plot) => (
        <PlotCard key={plot.id} plot={plot} />
      ))}
    </div>
  )
}
