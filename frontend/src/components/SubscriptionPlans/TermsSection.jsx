import React, { useState } from 'react';
import { FileText, Search, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TermsSection() {
  const [searchQuery, setSearchQuery] = useState('');

  const terms = [
    "Payment structure: 50% upfront and 50% upon final delivery and approval.",
    "Payment invoices must be paid within 10 days of issue.",
    "User licenses, application licenses, domains, third-party tools, hosting, cloud services, and related resources are not included in project pricing and will be paid by the client.",
    "New requirements outside the agreed scope will be estimated separately.",
    "Development timelines start only after all required resources are provided by the client.",
    "Delivery schedules may change depending on client feedback and approval timelines.",
    "Additional revisions beyond the agreed scope may incur additional charges.",
    "After full payment, the client owns the final delivered product and setup.",
    "The client is responsible for purchasing any additional software, APIs, plugins, licenses, or external tools.",
    "If the project is cancelled after work has started, payment must be made for completed work.",
    "Official email communication will serve as confirmation of project agreements and approvals."
  ];

  const filteredTerms = terms
    .map((text, idx) => ({ text, originalNum: idx + 1 }))
    .filter(t => t.text.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <section id="terms" style={{ background: '#fafbfc', padding: '5rem 0', borderTop: '1px solid #f1f5f9' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem' }}>
        {/* Header */}
        <div style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#10b981', margin: 0 }}>
            PlotVizion Terms & Agreements
          </h2>
          <p style={{ marginTop: '12px', fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a', lineHeight: 1.2 }}>
            Terms & Conditions
          </p>
          <p style={{ marginTop: '16px', fontSize: '1.1rem', color: '#64748b', maxWidth: '36rem', margin: '16px auto 0' }}>
            Please read our standard engagement terms and subscription policies carefully.
          </p>
        </div>

        {/* Search */}
        <div style={{ maxWidth: '28rem', margin: '0 auto 3rem' }}>
          <div style={{ position: 'relative', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, display: 'flex', alignItems: 'center', paddingLeft: '16px', pointerEvents: 'none' }}>
              <Search size={18} color="#94a3b8" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff',
                paddingLeft: '44px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px',
                fontSize: '0.875rem', color: '#0f172a', outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              placeholder="Search terms (e.g. payment, licenses)..."
              onFocus={e => e.target.style.borderColor = '#10b981'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
        </div>

        {/* Terms Grid */}
        <div className="sp-terms-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', alignItems: 'stretch' }}>
          {filteredTerms.length > 0 ? (
            filteredTerms.map((term, index) => (
              <motion.div
                key={term.originalNum}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                style={{
                  background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px',
                  padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'all 0.2s',
                  display: 'flex', gap: '20px',
                }}
              >
                <div style={{
                  width: '48px', height: '48px', flexShrink: 0, borderRadius: '12px',
                  background: '#ecfdf5', color: '#059669', fontWeight: 800, fontSize: '1.1rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {String(term.originalNum).padStart(2, '0')}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#334155', fontWeight: 500, margin: 0 }}>
                    {term.text}
                  </p>
                </div>
              </motion.div>
            ))
          ) : (
            <div style={{
              gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: '#64748b',
              background: '#fff', border: '2px dashed #e2e8f0', borderRadius: '16px',
            }}>
              <FileText size={40} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>No matching terms found</p>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>Try searching another keyword</p>
            </div>
          )}
        </div>

        {/* Badge */}
        <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '999px',
            background: '#0f172a', padding: '8px 16px', fontSize: '0.75rem', fontWeight: 600,
            color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}>
            <ShieldCheck size={18} color="#34d399" />
            <span>Official Communications Confirm Agreement Details</span>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) { .sp-terms-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}
