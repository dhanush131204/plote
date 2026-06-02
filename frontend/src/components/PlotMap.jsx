import PlotMapTile from './PlotMapTile'

export default function PlotMap({ plots }) {
  if (!plots || plots.length === 0) {
    return (
      <div className="plot-map-empty">
        <p>No plots match your filters. Try adjusting the filters.</p>
      </div>
    )
  }

  // Group plots by block
  const blocks = {}
  plots.forEach((plot) => {
    const b = plot.block ?? 0
    if (!blocks[b]) blocks[b] = []
    blocks[b].push(plot)
  })

  const blockOrder = Object.keys(blocks).map(Number).sort((a, b) => a - b)
  const blockLabels = ['Block A', 'Block B', 'Block C']

  return (
    <div className="plot-map-container">
      <div className="plot-map-viewport">
        {/* Main road - top */}
        <div className="plot-map-road plot-map-road-top" />
        <span className="plot-map-road-label">Main Road</span>

        {blockOrder.map((blockIdx, i) => (
          <div key={blockIdx} className="plot-map-block-wrapper">
            <span className="plot-map-block-label">{blockLabels[blockIdx] ?? `Block ${blockIdx + 1}`}</span>
            <div className="plot-map-block">
              {blocks[blockIdx]
                .sort((a, b) => (a.row - b.row) || (a.col - b.col))
                .map((plot) => (
                  <PlotMapTile key={plot.id} plot={plot} />
                ))}
            </div>
            {i < blockOrder.length - 1 && (
              <>
                <div className="plot-map-road plot-map-road-between" />
                <span className="plot-map-road-label">Internal Road</span>
              </>
            )}
          </div>
        ))}

        {/* Main road - bottom */}
        <div className="plot-map-road plot-map-road-bottom" />
        <span className="plot-map-road-label">Main Road</span>
      </div>
    </div>
  )
}
