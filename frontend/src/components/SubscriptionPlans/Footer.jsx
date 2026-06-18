import React from 'react';

export default function Footer() {
  const scrollTo = (e, id) => {
    e.preventDefault();
    const el = document.querySelector(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const linkStyle = {
    fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textDecoration: 'none',
    transition: 'color 0.2s', cursor: 'pointer',
  };

  return (
    <footer style={{ background: '#0f172a', color: '#94a3b8', borderTop: '1px solid #1e293b' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div className="sp-footer-grid" style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: '2rem', alignItems: 'center', paddingBottom: '2rem', borderBottom: '1px solid #1e293b' }}>
          {/* Logo */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '8px', background: '#10b981',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                boxShadow: '0 4px 14px rgba(16,185,129,0.15)',
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ width: 18, height: 18 }}>
                  <path d="M3 3h7v7H3z" /><path d="M14 3h7v7h-7z" />
                  <path d="M14 14h7v7h-7z" /><path d="M3 14h7v7H3z" />
                </svg>
              </div>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                Plot<span style={{ color: '#34d399' }}>Vision</span>
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#64748b', maxWidth: '300px', lineHeight: 1.6, margin: 0 }}>
              Advanced layout planning and client conversion infrastructure for enterprise-grade real estate builders and planning agencies.
            </p>
          </div>

          {/* Links */}
          <div className="sp-footer-links" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: '2rem' }}>
            {[
              { label: 'Top', href: '#hero' },
              { label: 'Subscription Plans', href: '#pricing' },
              { label: 'Feature Matrix', href: '#comparison' },
              { label: 'Terms & Conditions', href: '#terms' },
              { label: 'Contact Support', href: 'mailto:support@plotvision.com', isExternal: true },
            ].map(item => (
              <a
                key={item.label}
                href={item.isExternal ? item.href : item.href}
                onClick={item.isExternal ? undefined : (e) => scrollTo(e, item.href)}
                style={linkStyle}
                onMouseEnter={e => e.target.style.color = '#34d399'}
                onMouseLeave={e => e.target.style.color = '#94a3b8'}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="sp-footer-bottom" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', paddingTop: '2rem', fontSize: '0.7rem', color: '#64748b' }}>
          <p style={{ margin: 0 }}>© {new Date().getFullYear()} PlotVision, ThirdVizion Company. All rights reserved.</p>
          <p style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
            Designed for high performance.
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sp-footer-grid { grid-template-columns: 1fr !important; }
          .sp-footer-links { justify-content: flex-start !important; }
          .sp-footer-bottom { flex-direction: column !important; align-items: flex-start !important; }
        }
      `}</style>
    </footer>
  );
}
