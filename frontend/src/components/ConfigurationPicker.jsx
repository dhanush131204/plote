/**
 * 2 BHK / 3 BHK selection: image + video per configuration for the selected floor.
 */
export default function ConfigurationPicker({
  configurations = [],
  floorLabel,
  apiBase,
  onSelectConfig,
  onBack,
}) {
  const list = configurations.length ? configurations : []

  return (
    <div className="configuration-picker">
      <div className="configuration-picker-head">
        <h3 className="configuration-picker-title">Choose configuration</h3>
        {floorLabel && <p className="configuration-picker-floor">{floorLabel}</p>}
        <button type="button" className="btn-secondary configuration-picker-back" onClick={onBack}>
          Back to building
        </button>
      </div>
      {list.length === 0 ? (
        <p className="configuration-picker-empty">No configurations defined for this floor. Continue to unit map.</p>
      ) : (
        <div className="configuration-picker-grid">
          {list.map((cfg) => {
            const area = cfg.areaSqft || cfg.areaSqm
            const price = cfg.pricePerSqft && cfg.areaSqft ? cfg.areaSqft * cfg.pricePerSqft : null
            return (
              <button
                key={cfg.id}
                type="button"
                className="configuration-card"
                onClick={() => onSelectConfig(cfg)}
              >
                {cfg.imagePath ? (
                  <img
                    src={`${apiBase}/uploads/${cfg.imagePath}`}
                    alt=""
                    className="configuration-card-image"
                  />
                ) : (
                  <div className="configuration-card-placeholder">{cfg.label || cfg.id}</div>
                )}
                {cfg.videoPath ? (
                  <video
                    className="configuration-card-video"
                    src={`${apiBase}/uploads/${cfg.videoPath}`}
                    controls
                    playsInline
                    preload="metadata"
                  />
                ) : null}
                <span className="configuration-card-label">{cfg.label || cfg.id}</span>
                {(area || price) && (
                  <span className="configuration-card-meta">
                    {area ? `${cfg.areaSqft || 0} sq ft` : ''}
                    {area && price ? ' · ' : ''}
                    {price
                      ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price)
                      : ''}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
