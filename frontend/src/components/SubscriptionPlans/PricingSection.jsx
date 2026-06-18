import React from 'react';
import { Check, ArrowRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PricingSection({ onOpenModal }) {
  const plans = [
    {
      name: 'Free Tier', price: '₹0', description: 'Ideal for trying out PlotVision capabilities and layout testing.',
      badge: 'Starter', action: 'Get Started',
      features: ['1 Layout','50 Views/Layout','Basic Lead Gen (Name + Contact)','Web App Notifications','No Analytics / API'],
      popular: false, dark: false,
    },
    {
      name: 'Tier 1', price: '₹599', priceSuffix: '/User',
      description: 'Great for individual planners and small regional operations.',
      badge: 'Growth', action: 'Buy Now',
      features: ['5 Layouts','200 Views/Layout','Verified Phone Number Leads','Basic Site Analytics','WhatsApp Integration (Number)','Base Control + 2 Roles'],
      popular: false, dark: false,
    },
    {
      name: 'Tier 2', price: '₹1129', priceSuffix: '/User',
      description: 'Perfect for active agencies and expanding builder networks.',
      badge: 'Most Popular', action: 'Buy Now',
      features: ['20 Layouts','1000 Views/Layout','Advanced Buying Intent Leads','Advanced Analytics Dashboard','Automated WhatsApp Business Alerts','CRM Webhooks Integration','White Labeling (Included)'],
      popular: true, dark: false,
    },
    {
      name: 'Tier 3', price: 'Contact Sales', priceSuffix: '',
      description: 'Tailored solutions for builders, land developers & enterprises.',
      badge: 'Enterprise', action: 'Contact Sales',
      features: ['Unlimited Layouts & Views','Advanced Buying Intent Leads','AI Summarized Analytics','Customer Intent Notification System','Advanced Automation with n8n','Data API & Marketing Banner Included','Unlimited Controls & Roles'],
      popular: false, dark: true,
    },
  ];

  const cardStyle = (plan) => ({
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    borderRadius: '16px',
    padding: '26px',
    transition: 'all 0.3s ease',
    background: plan.dark ? '#0f172a' : '#fff',
    color: plan.dark ? '#fff' : '#0f172a',
    border: plan.popular ? '2px solid #10b981' : plan.dark ? '1px solid #1e293b' : '1px solid #e2e8f0',
    boxShadow: plan.popular ? '0 20px 60px rgba(16,185,129,0.15)' : '0 1px 3px rgba(0,0,0,0.06)',
    transform: plan.popular ? 'scale(1.03)' : 'none',
    zIndex: plan.popular ? 10 : 1,
  });

  const badgeStyle = (plan) => ({
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: '999px',
    padding: '2px 10px',
    fontSize: '0.7rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    background: plan.popular ? '#d1fae5' : plan.dark ? 'rgba(16,185,129,0.1)' : '#f1f5f9',
    color: plan.popular ? '#065f46' : plan.dark ? '#34d399' : '#334155',
    border: plan.dark ? '1px solid rgba(16,185,129,0.2)' : 'none',
  });

  const btnStyle = (plan) => ({
    width: '100%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '12px',
    padding: '12px 16px',
    fontSize: '0.875rem',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: plan.popular || plan.dark ? '#10b981' : '#0f172a',
    color: '#fff',
    boxShadow: plan.popular ? '0 4px 14px rgba(16,185,129,0.2)' : '0 2px 4px rgba(0,0,0,0.1)',
  });

  return (
    <section id="pricing" style={{ background: '#fafbfc', padding: '5rem 0', position: 'relative' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem' }}>
        {/* Section Header */}
        <div style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#10b981', margin: 0 }}>
            Subscription Pricing
          </h2>
          <p style={{ marginTop: '12px', fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a', lineHeight: 1.2 }}>
            Flexible plans for teams of any size
          </p>
          <p style={{ marginTop: '16px', fontSize: '1.1rem', color: '#64748b', maxWidth: '36rem', margin: '16px auto 0' }}>
            Choose a plan that fits your layout pipeline. Upgrade, downgrade, or add modules on demand.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="sp-pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', alignItems: 'stretch' }}>
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              style={cardStyle(plan)}
            >
              {/* Badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={badgeStyle(plan)}>{plan.badge}</span>
                {plan.popular && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 700, color: '#059669' }}>
                    <Zap size={14} style={{ fill: '#10b981', color: '#10b981' }} /> Best Value
                  </span>
                )}
              </div>

              {/* Plan info */}
              <div style={{ marginTop: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: plan.dark ? '#fff' : '#0f172a', margin: 0 }}>{plan.name}</h3>
                <p style={{ marginTop: '8px', fontSize: '0.875rem', color: plan.dark ? '#94a3b8' : '#64748b' }}>{plan.description}</p>
                <div style={{ marginTop: '20px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: plan.price.includes('Contact') ? '1.5rem' : '2rem', fontWeight: 800, color: plan.dark ? '#fff' : '#0f172a' }}>
                    {plan.price}
                  </span>
                  {plan.priceSuffix && (
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: plan.dark ? '#94a3b8' : '#64748b' }}>{plan.priceSuffix}</span>
                  )}
                </div>
              </div>

              {/* Button */}
              <div style={{ marginTop: '24px' }}>
                <button onClick={() => onOpenModal(plan)} style={btnStyle(plan)}>
                  {plan.action}
                  <ArrowRight size={16} style={{ marginLeft: 6 }} />
                </button>
              </div>

              {/* Features */}
              <div style={{ marginTop: '2rem', borderTop: `1px solid ${plan.dark ? 'rgba(255,255,255,0.1)' : '#f1f5f9'}`, paddingTop: '1.5rem' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', margin: 0 }}>Key Features</p>
                <ul style={{ listStyle: 'none', padding: 0, marginTop: '16px' }}>
                  {plan.features.map((feature) => (
                    <li key={feature} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.875rem', marginBottom: '14px' }}>
                      <Check size={18} style={{ flexShrink: 0, marginTop: 2, color: plan.dark ? '#34d399' : '#10b981' }} />
                      <span style={{ color: plan.dark ? '#cbd5e1' : '#475569' }}>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) { .sp-pricing-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 640px) { .sp-pricing-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}
