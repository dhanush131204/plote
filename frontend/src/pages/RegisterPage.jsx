import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Building2, Phone, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle, AlertCircle, X } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function RegisterPage({ isOpen = true, onClose, onOpenLogin, selectedPlan: selectedPlanProp }) {
  const [form, setForm] = useState({ name: '', companyName: '', phone: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState('');

  const params = new URLSearchParams(window.location.search);
  const selectedPlan = selectedPlanProp?.name || selectedPlanProp || params.get('plan') || '';
  const modalMode = Boolean(onClose);

  if (!isOpen) return null;

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^[0-9]{10}$/.test(form.phone.trim())) {
      setError('Phone number must be exactly 10 digits.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register-builder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, plan: selectedPlan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field, extra = {}) => ({
    display: 'block',
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: '10px',
    border: `1.5px solid ${focusedField === field ? '#10b981' : '#e2e8f0'}`,
    background: focusedField === field ? '#ffffff' : '#f8fafc',
    padding: '10px 12px 10px 36px',
    fontSize: '0.875rem',
    color: '#0f172a',
    outline: 'none',
    boxShadow: focusedField === field ? '0 0 0 3px rgba(16,185,129,0.1)' : 'none',
    transition: 'all 0.18s',
    fontFamily: 'inherit',
    ...extra,
  });

  const iconWrap = {
    position: 'absolute', left: '11px', top: '50%',
    transform: 'translateY(-50%)', color: '#94a3b8',
    pointerEvents: 'none', display: 'flex',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#334155',
    marginBottom: '5px',
  };

  /* ── Success screen ─────────────────────────────────────────────── */
  if (success) {
    return (
      <div style={{
        ...(modalMode
          ? { position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)' }
          : { height: '100vh', background: '#f0fdf4' }),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px', boxSizing: 'border-box',
      }}>
        {modalMode && <div onClick={onClose} style={{ position: 'fixed', inset: 0 }} />}
        <div role={modalMode ? 'dialog' : undefined} aria-modal={modalMode ? 'true' : undefined} style={{ position: 'relative', width: '100%', maxWidth: '400px', background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: modalMode ? '0 25px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.06)' : '0 8px 40px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <div style={{ height: '4px', background: 'linear-gradient(90deg,#34d399,#10b981,#059669)' }} />
          {modalMode && (
            <button
              onClick={onClose}
              aria-label="Close"
              style={{ position: 'absolute', top: '14px', right: '14px', width: '32px', height: '32px', borderRadius: '50%', background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', zIndex: 2 }}
            >
              <X size={15} />
            </button>
          )}
          <div style={{ padding: '36px 32px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#10b981' }}>
              <CheckCircle size={32} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>Check Your Email!</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6, margin: '0 0 6px' }}>We sent a login link to</p>
            <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#10b981', background: '#ecfdf5', borderRadius: '8px', padding: '6px 14px', display: 'inline-block', margin: '0 0 14px' }}>{form.email}</p>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 20px' }}>
              Click the link to log in{selectedPlan ? ` and activate your ${selectedPlan} plan` : ''}. Expires in <strong>24 hours</strong>.
            </p>
            <div style={{ height: '1px', background: '#f1f5f9', margin: '0 0 14px' }} />
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>
              Didn't get it?{' '}
              <span onClick={() => setSuccess(false)} style={{ color: '#10b981', cursor: 'pointer', fontWeight: 600 }}>Try again</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main form ──────────────────────────────────────────────────── */
  return (
    <div style={{
      ...(modalMode
        ? { position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)' }
        : { height: '100vh', background: '#f0fdf4' }),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      boxSizing: 'border-box',
      overflow: modalMode ? 'auto' : 'hidden',
    }}>
      {modalMode && <div onClick={onClose} style={{ position: 'fixed', inset: 0 }} />}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '520px',
        background: '#ffffff',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: modalMode ? '0 25px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.06)' : '0 8px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.04)',
      }} role={modalMode ? 'dialog' : undefined} aria-modal={modalMode ? 'true' : undefined}>
        {/* Top gradient bar */}
        <div style={{ height: '4px', background: 'linear-gradient(90deg,#34d399,#10b981,#059669)' }} />
        {modalMode && (
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ position: 'absolute', top: '16px', right: '16px', width: '32px', height: '32px', borderRadius: '50%', background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', zIndex: 10 }}
            onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
            onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
          >
            <X size={15} />
          </button>
        )}

        <div style={{ padding: '24px 28px 26px' }}>

          {/* Back link */}
          {!modalMode && (
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#64748b', textDecoration: 'none', fontWeight: 500, marginBottom: '14px' }}>
              ? Back to home
            </Link>
          )}

          {/* Heading */}
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 7px', letterSpacing: '-0.02em' }}>
              Create your account
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
              Register as a builder to get started.

            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.8rem', fontWeight: 500, marginBottom: '12px' }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{error}</span>
              <button
                type="button"
                onClick={() => setError('')}
                aria-label="Dismiss"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '0.9rem', lineHeight: 1, padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', width: '20px', height: '20px', flexShrink: 0 }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Row 1: Name + Company — side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={labelStyle}>Your Full Name <span style={{ color: '#10b981' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <div style={iconWrap}><User size={14} /></div>
                  <input
                    type="text" required placeholder="Full name"
                    value={form.name} onChange={handleChange('name')}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField('')}
                    style={inputStyle('name')}
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Company Name <span style={{ color: '#10b981' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <div style={iconWrap}><Building2 size={14} /></div>
                  <input
                    type="text" required placeholder="Company / firm"
                    value={form.companyName} onChange={handleChange('companyName')}
                    onFocus={() => setFocusedField('companyName')}
                    onBlur={() => setFocusedField('')}
                    style={inputStyle('companyName')}
                  />
                </div>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label style={labelStyle}>
                Phone Number <span style={{ color: '#10b981' }}>*</span>
                <span style={{ color: '#94a3b8', fontWeight: 400, marginLeft: '4px', fontSize: '0.73rem' }}></span>
              </label>
              <div style={{ position: 'relative' }}>
                <div style={iconWrap}><Phone size={14} /></div>
                <input
                  type="tel" required placeholder="9876543210" maxLength={10}
                  value={form.phone} onChange={handleChange('phone')}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField('')}
                  style={inputStyle('phone')}
                />
              </div>
              {form.phone && !/^[0-9]{10}$/.test(form.phone) && (
                <p style={{ margin: '3px 0 0', fontSize: '0.7rem', color: '#ef4444' }}>Must be exactly 10 digits</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>Email Address <span style={{ color: '#10b981' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <div style={iconWrap}><Mail size={14} /></div>
                <input
                  type="email" required placeholder="you@company.com"
                  value={form.email} onChange={handleChange('email')}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField('')}
                  style={inputStyle('email')}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={labelStyle}>
                Password <span style={{ color: '#10b981' }}>*</span>
                <span style={{ color: '#94a3b8', fontWeight: 400, marginLeft: '4px', fontSize: '0.73rem' }}>(min 8 chars)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <div style={iconWrap}><Lock size={14} /></div>
                <input
                  type={showPassword ? 'text' : 'password'} required placeholder="Minimum 8 characters"
                  value={form.password} onChange={handleChange('password')}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField('')}
                  style={inputStyle('password', { paddingRight: '38px' })}
                />
                <button
                  type="button" tabIndex={-1}
                  onClick={() => setShowPassword(s => !s)}
                  style={{ position: 'absolute', right: '11px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', padding: 0 }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit" disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                width: '100%', padding: '12px', marginTop: '4px',
                borderRadius: '12px', border: 'none',
                background: loading ? '#6ee7b7' : 'linear-gradient(135deg,#10b981,#059669)',
                color: '#fff', fontSize: '0.9rem', fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 14px rgba(16,185,129,0.35)',
                transition: 'all 0.2s',
                letterSpacing: '0.01em',
              }}
            >
              {loading ? (
                <>
                  <span style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', display: 'inline-block', animation: 'rp-spin 0.7s linear infinite' }} />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account 
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Sign In */}
          <p style={{ marginTop: '14px', fontSize: '0.82rem', color: '#64748b', textAlign: 'center', margin: '14px 0 0' }}>
            Already have an account?{' '}
            {modalMode ? (
              <button type="button" onClick={() => { onClose?.(); onOpenLogin?.(); }} style={{ color: '#10b981', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}>Sign In</button>
            ) : (
              <Link to="/" style={{ color: '#10b981', fontWeight: 700, textDecoration: 'none' }}>Sign In</Link>
            )}
          </p>
        </div>
      </div>

      <style>{`@keyframes rp-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
