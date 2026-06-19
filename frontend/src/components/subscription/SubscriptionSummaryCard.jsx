import { useNavigate } from 'react-router-dom'
import {
  formatPlanLimit,
  formatSubscriptionDate,
} from '../../hooks/useSubscriptionDashboard'

function UsageLine({ label, used, allowed }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.92rem' }}>
      <span style={{ color: '#475569', fontWeight: 600 }}>{label}</span>
      <span style={{ color: '#0f172a', fontWeight: 700 }}>
        {used} / {formatPlanLimit(allowed)}
      </span>
    </div>
  )
}

export default function SubscriptionSummaryCard({
  subscription,
  title = 'Subscription Overview',
  showUsage = true,
  showButton = true,
  compact = false,
  targetPlan = 'Tier 1',
}) {
  const navigate = useNavigate()

  return (
    <section
      style={{
        background: 'rgba(255, 255, 255, 0.72)',
        backdropFilter: 'blur(14px)',
        border: '1px solid rgba(255, 255, 255, 0.72)',
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.05)',
        borderRadius: '18px',
        padding: compact ? '1.25rem' : '1.5rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#0f766e', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Subscription
          </p>
          <h2 style={{ margin: '0.3rem 0 0 0', fontSize: compact ? '1.15rem' : '1.4rem', fontWeight: 800, color: '#0f172a' }}>
            {title}
          </h2>
        </div>
        {showButton && (
          <button type="button" className="btn-primary" onClick={() => navigate('/subscription', { state: { targetPlan } })}>
            Upgrade Plan
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: compact ? 'repeat(auto-fit, minmax(160px, 1fr))' : 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
        <div>
          <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>Current Plan</div>
          <div style={{ marginTop: '0.25rem', fontSize: compact ? '1.2rem' : '1.35rem', fontWeight: 800, color: '#0f172a' }}>{subscription.plan}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>Plan Status</div>
          <div style={{ marginTop: '0.25rem', fontSize: compact ? '1rem' : '1.15rem', fontWeight: 700, color: '#0f172a' }}>{subscription.statusLabel}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>Activation Date</div>
          <div style={{ marginTop: '0.25rem', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>{formatSubscriptionDate(subscription.activationDate)}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>Expiry Date</div>
          <div style={{ marginTop: '0.25rem', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>{formatSubscriptionDate(subscription.expiryDate)}</div>
        </div>
      </div>

      {showUsage && (
        <div style={{ marginTop: '1.25rem', display: 'grid', gap: '0.7rem' }}>
          <UsageLine label="Layouts Used" used={subscription.layoutsUsed} allowed={subscription.layoutsAllowed} />
          <UsageLine label="Buildings Used" used={subscription.buildingsUsed} allowed={subscription.buildingsAllowed} />
          <UsageLine label="Views Used" used={subscription.viewsUsed} allowed={subscription.viewsAllowed} />
        </div>
      )}
    </section>
  )
}
