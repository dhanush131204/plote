import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ComparisonTable({ onOpenModal }) {
  const [activeMobilePlan, setActiveMobilePlan] = useState('Tier 2');

  const plans = [
    { name: 'Free Tier', action: 'Get Started' },
    { name: 'Tier 1', action: 'Buy Now' },
    { name: 'Tier 2', action: 'Buy Now' },
    { name: 'Tier 3', action: 'Contact Sales' },
  ];

  const featureGroups = [
    {
      groupName: 'Core Layout Specs',
      features: [
        { name: 'Layouts', free: '1', tier1: '5', tier2: '20', tier3: 'Unlimited' },
        { name: 'Views', free: '50/Layout', tier1: '200/Layout', tier2: '1000/Layout', tier3: 'Unlimited' },
      ],
    },
    {
      groupName: 'Advanced Features & Analytics',
      features: [
        { name: 'Lead Generation', free: 'Basic (Name + Contact Number)', tier1: 'Basic + Verified Phone Number', tier2: 'Advanced Buying Intent', tier3: 'Advanced Buying Intent' },
        { name: 'Analytics', free: 'Not Included', tier1: 'Basic Analytics', tier2: 'Advanced Analytics', tier3: 'AI Summarized Analytics' },
        { name: 'Notifications', free: 'Web App', tier1: 'WhatsApp Number Integration', tier2: 'Automated WhatsApp Business Notifications', tier3: 'Customer Intent Notification System' },
        { name: 'Automation', free: 'Not Included', tier1: 'Not Included', tier2: 'CRM Webhooks', tier3: 'Advanced Automation with n8n' },
      ],
    },
    {
      groupName: 'Add-ons & Integrations',
      features: [
        { name: 'Data API', free: 'Not Included', tier1: 'Add-on (₹75/User)', tier2: 'Add-on (₹75/User)', tier3: 'Included' },
        { name: 'Marketing', free: 'Not Included', tier1: 'Not Included', tier2: 'Add-on (₹100/Layout)', tier3: 'Banner Included' },
      ],
    },
    {
      groupName: 'Admin & Customization',
      features: [
        { name: 'Controls', free: 'Not Included', tier1: 'Base Control + 2 Roles', tier2: 'Advanced Controls + Up to 5 Roles', tier3: 'Unlimited' },
        { name: 'White Label', free: 'Not Included', tier1: 'Add-on', tier2: 'Included', tier3: 'Included' },
      ],
    },
  ];

  const getVal = (f, p) => {
    if (p === 'Free Tier') return f.free;
    if (p === 'Tier 1') return f.tier1;
    if (p === 'Tier 2') return f.tier2;
    if (p === 'Tier 3') return f.tier3;
    return '';
  };

  const renderVal = (val) => {
    if (val === 'Not Included') {
      return (
        <span style={{ color: '#94a3b8', fontWeight: 500, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
          <X size={16} color="#cbd5e1" /> Not Included
        </span>
      );
    }
    if (val === 'Included' || val === 'Unlimited') {
      return (
        <span style={{ color: '#059669', fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
          <Check size={18} color="#10b981" /> {val}
        </span>
      );
    }
    return <span style={{ color: '#334155', fontWeight: 600, fontSize: '0.875rem' }}>{val}</span>;
  };

  const thStyle = { padding: '24px', textAlign: 'center', fontSize: '0.875rem', fontWeight: 700, width: '20%' };
  const tdStyle = { padding: '18px 24px', textAlign: 'center', borderBottom: '1px solid #f1f5f9' };
  const tdNameStyle = { padding: '18px 24px', fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', borderBottom: '1px solid #f1f5f9' };

  return (
    <section id="comparison" style={{ background: '#fff', padding: '5rem 0', borderTop: '1px solid #f1f5f9' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem' }}>
        {/* Header */}
        <div style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#10b981', margin: 0 }}>Compare Features</h2>
          <p style={{ marginTop: '12px', fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a', lineHeight: 1.2 }}>Detailed plan specifications</p>
          <p style={{ marginTop: '16px', fontSize: '1.1rem', color: '#64748b', maxWidth: '36rem', margin: '16px auto 0' }}>Review the complete matrix of features, layout allocations, API access, and automation integrations.</p>
        </div>

        {/* DESKTOP TABLE */}
        <div className="sp-table-desktop" style={{ overflow: 'hidden', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#fafbfc' }}>
                <th style={{ ...thStyle, textAlign: 'left', color: '#0f172a' }}>Plans & Features</th>
                {plans.map(p => (
                  <th key={p.name} style={{ ...thStyle, background: p.name === 'Tier 2' ? 'rgba(16,185,129,0.04)' : 'transparent' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ color: '#0f172a', fontSize: '1rem', fontWeight: 800 }}>{p.name}</span>
                      <button
                        onClick={() => onOpenModal({ name: p.name, action: p.action })}
                        style={{
                          marginTop: '12px', display: 'inline-flex', alignItems: 'center',
                          borderRadius: '8px', padding: '6px 16px', fontSize: '0.75rem',
                          fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                          background: p.name === 'Tier 2' ? '#10b981' : '#0f172a', color: '#fff',
                        }}
                      >
                        {p.action}
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {featureGroups.map(group => (
                <React.Fragment key={group.groupName}>
                  <tr style={{ background: '#fafbfc' }}>
                    <td colSpan={5} style={{ padding: '18px 24px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', borderBottom: '1px solid #f1f5f9' }}>
                      {group.groupName}
                    </td>
                  </tr>
                  {group.features.map(feature => (
                    <tr key={feature.name}>
                      <td style={tdNameStyle}>{feature.name}</td>
                      {plans.map(p => (
                        <td key={p.name} style={{ ...tdStyle, background: p.name === 'Tier 2' ? 'rgba(16,185,129,0.03)' : 'transparent' }}>
                          {renderVal(getVal(feature, p.name))}
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* MOBILE VIEW */}
        <div className="sp-table-mobile" style={{ display: 'none' }}>
          {/* Tab buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '6px', padding: '4px', background: '#f1f5f9', borderRadius: '12px', marginBottom: '24px' }}>
            {plans.map(p => (
              <button
                key={p.name}
                onClick={() => setActiveMobilePlan(p.name)}
                style={{
                  padding: '8px 4px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700,
                  borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: activeMobilePlan === p.name ? '#fff' : 'transparent',
                  color: activeMobilePlan === p.name ? '#059669' : '#64748b',
                  boxShadow: activeMobilePlan === p.name ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {p.name.replace(' Tier', '')}
              </button>
            ))}
          </div>

          {/* Plan details */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '24px' }}>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>{activeMobilePlan} Details</h4>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>Full specification breakdown</p>
              </div>
              <button
                onClick={() => onOpenModal({ name: activeMobilePlan, action: plans.find(p => p.name === activeMobilePlan)?.action || 'Proceed' })}
                style={{ borderRadius: '8px', background: '#10b981', padding: '8px 12px', fontSize: '0.75rem', fontWeight: 700, color: '#fff', border: 'none', cursor: 'pointer' }}
              >
                {plans.find(p => p.name === activeMobilePlan)?.action || 'Buy Now'}
              </button>
            </div>

            {featureGroups.map(group => (
              <div key={group.groupName} style={{ marginBottom: '24px' }}>
                <h5 style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>{group.groupName}</h5>
                {group.features.map(feature => {
                  const val = getVal(feature, activeMobilePlan);
                  return (
                    <div key={feature.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>{feature.name}</span>
                      <span style={{ fontSize: '0.75rem', textAlign: 'right' }}>{renderVal(val)}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .sp-table-desktop { display: none !important; }
          .sp-table-mobile { display: block !important; }
        }
      `}</style>
    </section>
  );
}
