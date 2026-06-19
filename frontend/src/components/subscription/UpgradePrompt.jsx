import { useNavigate } from 'react-router-dom'

export default function UpgradePrompt({
  title = 'Upgrade required',
  message,
  cta = 'Upgrade Plan',
  compact = false,
  targetPlan = 'Tier 1',
}) {
  const navigate = useNavigate()

  return (
    <section
      style={{
        background: 'linear-gradient(135deg, rgba(15,23,42,0.96) 0%, rgba(14,116,144,0.9) 100%)',
        borderRadius: '20px',
        padding: compact ? '1.25rem 1.5rem' : '2rem',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 16px 44px rgba(15, 23, 42, 0.18)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: compact ? 'center' : 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ maxWidth: compact ? '40rem' : '46rem' }}>
          <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#99f6e4' }}>
            Subscription Access
          </p>
          <h2 style={{ margin: '0.45rem 0 0.35rem 0', fontSize: compact ? '1.15rem' : '1.6rem', fontWeight: 800 }}>
            {title}
          </h2>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.82)', lineHeight: 1.55 }}>
            {message || 'This feature is available in a higher subscription tier. Upgrade your plan to unlock it.'}
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => navigate('/subscription', { state: { targetPlan } })}
          style={{
            whiteSpace: 'nowrap',
            background: '#f59e0b',
            color: '#111827',
            border: 'none',
            boxShadow: '0 10px 24px rgba(245, 158, 11, 0.28)',
          }}
        >
          {cta}
        </button>
      </div>
    </section>
  )
}
