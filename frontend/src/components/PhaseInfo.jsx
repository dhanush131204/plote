export default function PhaseInfo({ layoutName = 'Bhuvaneshwari Nagar', description = '' }) {
  const lines = description
    ? description.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
    : ['Phase-I: 200/2024', 'PHASE-II: 201/2024']

  return (
    <div className="phase-info">
      <h2 className="phase-title">{layoutName}</h2>
      <div className="phase-badges">
        {lines.map((line, i) => (
          <span key={i} className="phase-badge">
            {line}
          </span>
        ))}
      </div>
      <div className="phase-legend">
        <span className="legend-item available">Available</span>
        <span className="legend-item booked">Booked</span>
        <span className="legend-item sold">Sold</span>
      </div>
    </div>
  )
}
