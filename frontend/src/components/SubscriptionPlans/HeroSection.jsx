import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Layout, Users, Shield } from 'lucide-react';
import landingBg from '../../assets/landing_bg.png';

export default function HeroSection({ onOpenModal, onOpenLogin, user }) {
  const scrollToPricing = (e) => {
    e.preventDefault();
    const el = document.querySelector('#pricing');
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <section
      id="hero"
      style={{
        position: 'relative',
        overflow: 'hidden',
        backgroundImage: `
          linear-gradient(90deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.94) 42%, rgba(255,255,255,0.86) 68%, rgba(255,255,255,0.9) 100%),
          radial-gradient(circle at 18% 55%, rgba(16,185,129,0.14), transparent 34%),
          url(${landingBg})
        `,
        backgroundSize: 'cover, cover, cover',
        backgroundPosition: 'center, center, center',
        backgroundRepeat: 'no-repeat',
        paddingTop: '10rem',
        paddingBottom: '5rem',
      }}
    >
      {/* Background Decorative Blobs */}
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0,
        width: '60%', zIndex: 0, opacity: 0.5, filter: 'blur(80px)',
        background: 'radial-gradient(ellipse at center, rgba(16,185,129,0.08), transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', top: '25%', left: '40px',
        width: '300px', height: '300px', borderRadius: '50%',
        background: '#f8fafc', opacity: 0.5, filter: 'blur(80px)', zIndex: 0,
      }} />

      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem', position: 'relative', zIndex: 1 }}>
        <div className="sp-hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center' }}>

          {/* Hero Content - Left Side */}
          <div className="sp-hero-content">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{ marginBottom: '1rem' }}
            >
              <span style={{
                fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em',
                color: '#10b981', textTransform: 'uppercase',
              }}>
                DIGITAL REAL ESTATE SHOWROOM
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              style={{
                fontSize: '4.5rem', fontWeight: 800, letterSpacing: '-0.02em',
                color: '#0f172a', lineHeight: 1.1, margin: 0,
              }}
            >
              PlotVizion
            </motion.h1>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{
                marginTop: '1.5rem', fontSize: '1.1rem', lineHeight: 1.7,
                color: '#475569', maxWidth: '32rem',
              }}
            >
              Create interactive plot and building experiences with live inventory, buyer enquiries, and CRM-ready leads.
            </motion.p>

            {/* Feature Highlights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              style={{ marginTop: '2rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem' }}
            >
              {['Interactive maps', 'Public project links', 'Lead capture'].map((f) => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                  <span style={{ fontSize: '1rem', color: '#475569' }}>{f}</span>
                </div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              style={{ marginTop: '2.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}
            >
              <a
                href="#pricing"
                onClick={scrollToPricing}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '12px', background: '#10b981', padding: '14px 24px',
                  fontSize: '0.9rem', fontWeight: 700, color: '#fff', textDecoration: 'none',
                  boxShadow: '0 8px 24px rgba(16,185,129,0.25)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#059669'}
                onMouseLeave={e => e.currentTarget.style.background = '#10b981'}
              >
                View Plans & Pricing
                <ArrowRight size={16} style={{ marginLeft: 8 }} />
              </a>
              {/* Only show Sign In button if NOT logged in */}
              {!user && (
                <button
                  onClick={onOpenLogin}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff',
                    padding: '14px 24px', fontSize: '0.9rem', fontWeight: 700, color: '#334155',
                    cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                >
                  Sign In
                </button>
              )}
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              style={{
                marginTop: '3rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '2rem',
              }}
            >
              <div>
                <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>4 Tiers</p>
                <p style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>Flexible Options</p>
              </div>
              <div>
                <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>₹599/mo</p>
                <p style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>Starting Price</p>
              </div>
              <div>
                <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>100% Secure</p>
                <p style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>Enterprise Grade</p>
              </div>
            </motion.div>
          </div>

          {/* Interactive Plot Preview Screen - Right Side */}
          <div className="sp-hero-preview" style={{ display: 'flex', justifyContent: 'center' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              style={{
                position: 'relative', width: '100%', maxWidth: '480px', height: '450px',
                borderRadius: '24px', background: '#020617', padding: '24px',
                boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
                border: '1px solid #1e293b',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                overflow: 'hidden',
              }}
            >
              {/* Grid backdrop */}
              <div style={{
                position: 'absolute', inset: 0, opacity: 0.2,
                backgroundImage: 'linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)',
                backgroundSize: '24px 24px',
                maskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, #000 70%, transparent 100%)',
                WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, #000 70%, transparent 100%)',
              }} />

              {/* Interface Header */}
              <div style={{
                position: 'relative', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', borderBottom: '1px solid rgba(30,41,59,0.8)', paddingBottom: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#f43f5e' }} />
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }} />
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }} />
                  <span style={{ marginLeft: 8, fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>PlotVizion Workspace</span>
                </div>
                <span style={{
                  borderRadius: '999px', background: 'rgba(16,185,129,0.1)', padding: '2px 8px',
                  fontSize: '10px', fontWeight: 500, color: '#34d399', border: '1px solid rgba(16,185,129,0.2)',
                }}>
                  Live Preview
                </span>
              </div>

              {/* Blocks Grid */}
              <div style={{ position: 'relative', flex: 1, padding: '24px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', width: '100%', maxWidth: '320px' }}>
                  {/* Block A */}
                  <motion.div whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(52, 211, 153, 0.4)' }} style={{
                    gridColumn: 'span 2', height: '96px', borderRadius: '12px',
                    border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.1)',
                    padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer',
                    transition: 'box-shadow 0.2s ease',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Layout size={18} color="#34d399" />
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>A-12</span>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500, margin: 0 }}>Layout Block A</p>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', margin: 0 }}>Premium Lot</p>
                    </div>
                  </motion.div>

                  {/* Block B */}
                  <motion.div whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(245, 158, 11, 0.4)' }} style={{
                    gridColumn: 'span 1', height: '96px', borderRadius: '12px',
                    border: '1px solid rgba(245, 158, 11, 0.3)', background: 'rgba(245, 158, 11, 0.08)',
                    padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer',
                    transition: 'box-shadow 0.2s ease',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Users size={18} color="#f59e0b" />
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>B-04</span>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500, margin: 0 }}>Plot B-04</p>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', margin: 0 }}>Booked</p>
                    </div>
                  </motion.div>

                  {/* Block C */}
                  <motion.div whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(52, 211, 153, 0.4)' }} style={{
                    gridColumn: 'span 1', height: '112px', borderRadius: '12px',
                    border: '1px solid rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.08)',
                    padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer',
                    transition: 'box-shadow 0.2s ease',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Shield size={18} color="#34d399" />
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>C-09</span>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500, margin: 0 }}>Plot C-09</p>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', margin: 0 }}>Available</p>
                    </div>
                  </motion.div>

                  {/* Block D */}
                  <motion.div whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(244, 63, 94, 0.4)' }} style={{
                    gridColumn: 'span 2', height: '112px', borderRadius: '12px',
                    border: '1px solid rgba(244, 63, 94, 0.3)', background: 'rgba(244, 63, 94, 0.08)',
                    padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer',
                    transition: 'box-shadow 0.2s ease',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex' }}>
                        <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#334155', border: '2px solid #020617' }} />
                        <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#f43f5e', border: '2px solid #020617', marginLeft: -6 }} />
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>D-21</span>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500, margin: 0 }}>Unit D-21</p>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f43f5e', margin: 0 }}>Sold Out</p>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Interface Footer */}
              <div style={{
                position: 'relative', borderTop: '1px solid rgba(30,41,59,0.8)', paddingTop: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                fontSize: '0.75rem', color: '#64748b',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="sp-pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                  Active Users: 1,420
                </span>
                <span>Tier 2 Performance</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @keyframes sp-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .sp-pulse-dot { animation: sp-pulse 2s ease-in-out infinite; }
        @media (max-width: 1024px) {
          .sp-hero-grid { grid-template-columns: 1fr !important; }
          .sp-hero-preview { margin-top: 3rem; }
          #hero { padding-top: 7rem !important; }
        }
        @media (max-width: 640px) {
          #hero h1 { font-size: 2.5rem !important; }
        }
      `}</style>
    </section>
  );
}
