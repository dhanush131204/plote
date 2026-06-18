import React, { useState, useEffect } from 'react';
import { Menu, X, Lock, LogOut, LayoutDashboard } from 'lucide-react';

export default function Navbar({ onOpenModal, onOpenLogin, user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Pricing Plans', href: '#pricing' },
    { name: 'Feature Details', href: '#comparison' },
    { name: 'Terms & Conditions', href: '#terms' },
  ];

  const scrollTo = (e, href) => {
    e.preventDefault();
    setIsOpen(false);
    const el = document.querySelector(href);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const navStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    transition: 'all 0.3s ease',
    background: scrolled ? 'rgba(255,255,255,0.92)' : 'transparent',
    backdropFilter: scrolled ? 'blur(12px)' : 'none',
    boxShadow: scrolled ? '0 1px 12px rgba(0,0,0,0.08)' : 'none',
    padding: scrolled ? '12px 0' : '20px 0',
  };

  const containerStyle = {
    maxWidth: '80rem',
    margin: '0 auto',
    padding: '0 1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const logoStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none',
  };

  const logoIconStyle = {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: '#10b981',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    flexShrink: 0,
    boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
  };

  const logoTextStyle = {
    fontSize: '1.25rem',
    fontWeight: 800,
    color: '#0f172a',
    letterSpacing: '-0.02em',
  };

  const desktopNavStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
  };

  const navLinkStyle = {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#475569',
    textDecoration: 'none',
    transition: 'color 0.2s',
    cursor: 'pointer',
  };

  const loginBtnStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: '#0f172a',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '9px 18px',
    fontSize: '0.875rem',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    transition: 'background 0.2s',
  };

  return (
    <nav style={navStyle}>
      <div style={containerStyle}>
        {/* Logo */}
        <a href="#hero" onClick={(e) => scrollTo(e, '#hero')} style={logoStyle}>
          <div style={logoIconStyle}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ width: 20, height: 20 }}>
              <path d="M3 3h7v7H3z" /><path d="M14 3h7v7h-7z" />
              <path d="M14 14h7v7h-7z" /><path d="M3 14h7v7H3z" />
            </svg>
          </div>
          <span style={logoTextStyle}>
            Plot<span style={{ color: '#10b981' }}>Vision</span>
          </span>
        </a>

        {/* Desktop Nav */}
        <div style={desktopNavStyle} className="sp-desktop-nav">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              onClick={(e) => scrollTo(e, item.href)}
              style={navLinkStyle}
              onMouseEnter={e => e.target.style.color = '#10b981'}
              onMouseLeave={e => e.target.style.color = '#475569'}
            >
              {item.name}
            </a>
          ))}
        </div>

        {/* Login Button OR logged-in user info */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} className="sp-desktop-login">
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
              {user.name || user.email?.split('@')[0]}
            </span>
            <a
              href="/dashboard"
              style={{
                ...loginBtnStyle,
                background: '#ecfdf5', color: '#059669',
                border: '1.5px solid rgba(16,185,129,0.3)',
                boxShadow: 'none', textDecoration: 'none',
              }}
            >
              <LayoutDashboard size={14} />
              Dashboard
            </a>
          </div>
        ) : (
          <button
            onClick={onOpenLogin}
            style={loginBtnStyle}
            className="sp-desktop-login"
            onMouseEnter={e => e.currentTarget.style.background = '#1e293b'}
            onMouseLeave={e => e.currentTarget.style.background = '#0f172a'}
          >
            <Lock size={14} />
            Login
          </button>
        )}

        {/* Mobile Hamburger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="sp-mobile-menu-btn"
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#475569',
            padding: '6px',
          }}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div style={{
          background: 'rgba(255,255,255,0.98)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid #f1f5f9',
          padding: '12px 24px 24px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        }}>
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              onClick={(e) => scrollTo(e, item.href)}
              style={{
                display: 'block',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 600,
                color: '#334155',
                textDecoration: 'none',
                marginBottom: '4px',
              }}
            >
              {item.name}
            </a>
          ))}
          <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '12px', paddingTop: '16px' }}>
            {user ? (
              <a
                href="/dashboard"
                style={{ ...loginBtnStyle, width: '100%', justifyContent: 'center', padding: '12px', fontSize: '1rem', background: '#ecfdf5', color: '#059669', textDecoration: 'none', display: 'flex' }}
              >
                <LayoutDashboard size={16} />
                Go to Dashboard
              </a>
            ) : (
              <button
                onClick={() => { setIsOpen(false); onOpenLogin(); }}
                style={{ ...loginBtnStyle, width: '100%', justifyContent: 'center', padding: '12px', fontSize: '1rem' }}
              >
                <Lock size={16} />
                Login
              </button>
            )}
          </div>
        </div>
      )}

      {/* Inline responsive CSS */}
      <style>{`
        @media (max-width: 768px) {
          .sp-desktop-nav { display: none !important; }
          .sp-desktop-login { display: none !important; }
          .sp-mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
