import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import PricingSection from '../components/SubscriptionPlans/PricingSection'
import ComparisonTable from '../components/SubscriptionPlans/ComparisonTable'
import InquiryModal from '../components/SubscriptionPlans/InquiryModal'
import SubscriptionSummaryCard from '../components/subscription/SubscriptionSummaryCard'
import useSubscriptionDashboard, { formatPlanLimit } from '../hooks/useSubscriptionDashboard'

const FEATURE_LIST = [
  { label: 'Basic Leads', enabled: (s) => ['basic', 'verified', 'advanced', 'full'].includes(s.features.leadFeatures) },
  { label: 'Web Notifications', enabled: () => true },
  { label: 'Analytics', enabled: (s) => Boolean(s.features.analytics) },
  { label: 'CRM Webhooks', enabled: (s) => Boolean(s.features.webhooks) },
  { label: 'WhatsApp Automation', enabled: (s) => Boolean(s.features.whatsappAutomation) },
]

export default function SubscriptionPage() {
  const location = useLocation()
  const { subscription, isLoading, isError } = useSubscriptionDashboard()
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [isInquiryOpen, setIsInquiryOpen] = useState(false)
  const pricingRef = useRef(null)
  const highlightedPlan = location.state?.targetPlan || null

  useEffect(() => {
    if (!isLoading && highlightedPlan) {
      window.setTimeout(() => {
        pricingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [highlightedPlan, isLoading])

  const openInquiry = (plan) => {
    setSelectedPlan(plan)
    setIsInquiryOpen(true)
  }

  const closeInquiry = () => {
    setIsInquiryOpen(false)
    setSelectedPlan(null)
  }

  if (isLoading) {
    return <div className="app-loading">Loading subscription details...</div>
  }

  return (
    <div className="dashboard-container" style={{ gap: '1.5rem' }}>
      <section
        style={{
          background: 'rgba(255, 255, 255, 0.62)',
          backdropFilter: 'blur(14px)',
          border: '1px solid rgba(255, 255, 255, 0.72)',
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.05)',
          borderRadius: '20px',
          padding: '1.5rem 1.75rem',
        }}
      >
        <p style={{ margin: 0, color: '#0f766e', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Builder Subscription
        </p>
        <h1 style={{ margin: '0.35rem 0 0.3rem 0', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.9rem', color: '#0f172a' }}>
          Subscription and Usage
        </h1>
        <p style={{ margin: 0, color: '#475569', fontWeight: 500 }}>
          Review your current plan, monitor usage, and upgrade with the existing pricing components.
        </p>
      </section>

      {isError && (
        <div className="dashboard-error">
          Subscription data could not be loaded. The page is showing safe defaults until the API responds again.
        </div>
      )}

      <SubscriptionSummaryCard subscription={subscription} title="Current Plan" />

      <section
        style={{
          background: 'rgba(255, 255, 255, 0.72)',
          backdropFilter: 'blur(14px)',
          border: '1px solid rgba(255, 255, 255, 0.72)',
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.05)',
          borderRadius: '18px',
          padding: '1.5rem',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Plan Benefits</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ padding: '1rem', borderRadius: '14px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Layouts</div>
            <div style={{ marginTop: '0.35rem', fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
              {subscription.layoutsUsed} / {formatPlanLimit(subscription.layoutsAllowed)}
            </div>
          </div>
          <div style={{ padding: '1rem', borderRadius: '14px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Buildings</div>
            <div style={{ marginTop: '0.35rem', fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
              {subscription.buildingsUsed} / {formatPlanLimit(subscription.buildingsAllowed)}
            </div>
          </div>
          <div style={{ padding: '1rem', borderRadius: '14px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Views</div>
            <div style={{ marginTop: '0.35rem', fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
              {subscription.viewsUsed} / {formatPlanLimit(subscription.viewsAllowed)}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '1.25rem', display: 'grid', gap: '0.75rem' }}>
          {FEATURE_LIST.map((feature) => {
            const enabled = feature.enabled(subscription)
            return (
              <div
                key={feature.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  alignItems: 'center',
                  padding: '0.95rem 1rem',
                  borderRadius: '12px',
                  background: enabled ? 'rgba(16,185,129,0.08)' : '#f8fafc',
                  border: enabled ? '1px solid rgba(16,185,129,0.16)' : '1px solid #e2e8f0',
                }}
              >
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{feature.label}</span>
                <span style={{ fontWeight: 700, color: enabled ? '#047857' : '#94a3b8' }}>
                  {enabled ? 'Enabled' : 'Locked'}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      <section ref={pricingRef} style={{ marginTop: '0.25rem' }}>
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.62)',
            backdropFilter: 'blur(14px)',
            border: '1px solid rgba(255, 255, 255, 0.72)',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.05)',
            borderRadius: '18px',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.25rem',
          }}
        >
          <p style={{ margin: 0, color: '#0f766e', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Available Upgrades
          </p>
          <h2 style={{ margin: '0.3rem 0 0.2rem 0', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.45rem', color: '#0f172a' }}>
            Compare Plans and Upgrade
          </h2>
          <p style={{ margin: 0, color: '#475569' }}>
            Use the existing pricing table and inquiry flow to request your next plan.
          </p>
        </div>

        <PricingSection onOpenModal={openInquiry} highlightedPlan={highlightedPlan} />
        <ComparisonTable onOpenModal={openInquiry} />
      </section>

      <InquiryModal isOpen={isInquiryOpen} onClose={closeInquiry} selectedPlan={selectedPlan} />
    </div>
  )
}
