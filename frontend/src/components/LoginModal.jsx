import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { X, Lock, Mail, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginModal({ isOpen, onClose }) {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedInUser = await login(email, password);
      onClose();
      if (loggedInUser.role === 'super_admin') navigate('/platform/dashboard');
      else if (loggedInUser.role === 'admin') navigate('/dashboard');
      else navigate('/buyer/projects');
    } catch (err) {
      setError(err.data?.error || err.error || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const inputBase = {
    display: 'block',
    width: '100%',
    borderRadius: '10px',
    border: '1.5px solid #e2e8f0',
    background: '#f8fafc',
    padding: '11px 14px 11px 40px',
    fontSize: '0.9rem',
    color: '#0f172a',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px', boxSizing: 'border-box',
      background: 'rgba(15,23,42,0.6)',
      backdropFilter: 'blur(8px)',
    }}>
      {/* Backdrop click to close */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0 }}
      />

      {/* Modal Card */}
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '420px',
          background: '#fff',
          borderRadius: '20px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.06)',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/* Gradient accent bar */}
        <div style={{
          height: '4px',
          background: 'linear-gradient(90deg, #34d399, #10b981, #059669)',
        }} />

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute', top: '16px', right: '16px',
            width: '32px', height: '32px', borderRadius: '50%',
            background: '#f1f5f9', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#64748b', zIndex: 10,
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
          onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
        >
          <X size={15} />
        </button>

        {/* Header Section */}
        <div style={{ padding: '28px 28px 20px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
              flexShrink: 0,
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ width: 16, height: 16 }}>
                <path d="M3 3h7v7H3z" /><path d="M14 3h7v7h-7z" />
                <path d="M14 14h7v7h-7z" /><path d="M3 14h7v7H3z" />
              </svg>
            </div>
            <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
              Plot<span style={{ color: '#10b981' }}>Vizion</span>
            </span>
          </div>

          <h2 style={{ fontSize: '1.625rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            Welcome back
          </h2>
          <p style={{ marginTop: '6px', fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5 }}>
            Sign in with the account provided by your administrator.
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: '#f1f5f9', margin: '0 28px' }} />

        {/* Form Section */}
        <div style={{ padding: '20px 28px 28px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Error */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                padding: '12px 14px', borderRadius: '10px',
                background: '#fef2f2', border: '1px solid #fecaca',
                color: '#dc2626', fontSize: '0.875rem', fontWeight: 500,
              }}>
                <AlertCircle size={16} style={{ marginTop: 1, flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="modal-email" style={{
                display: 'block', fontSize: '0.8125rem',
                fontWeight: 600, color: '#334155', marginBottom: '6px',
              }}>
                Email or Username
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: '12px', top: '50%',
                  transform: 'translateY(-50%)', color: '#94a3b8',
                  pointerEvents: 'none', display: 'flex',
                }}>
                  <Mail size={16} />
                </div>
                <input
                  id="modal-email"
                  type="text"
                  autoComplete="username"
                  placeholder="you@example.com or admin"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  required
                  style={{
                    ...inputBase,
                    borderColor: emailFocused ? '#10b981' : '#e2e8f0',
                    background: emailFocused ? '#fff' : '#f8fafc',
                    boxShadow: emailFocused ? '0 0 0 3px rgba(16,185,129,0.12)' : 'none',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="modal-password" style={{
                display: 'block', fontSize: '0.8125rem',
                fontWeight: 600, color: '#334155', marginBottom: '6px',
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: '12px', top: '50%',
                  transform: 'translateY(-50%)', color: '#94a3b8',
                  pointerEvents: 'none', display: 'flex',
                }}>
                  <Lock size={16} />
                </div>
                <input
                  id="modal-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  required
                  style={{
                    ...inputBase,
                    paddingRight: '42px',
                    borderColor: passwordFocused ? '#10b981' : '#e2e8f0',
                    background: passwordFocused ? '#fff' : '#f8fafc',
                    boxShadow: passwordFocused ? '0 0 0 3px rgba(16,185,129,0.12)' : 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  style={{
                    position: 'absolute', right: '12px', top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#94a3b8', display: 'flex', alignItems: 'center',
                    padding: 0,
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#475569'}
                  onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                width: '100%', padding: '13px',
                borderRadius: '12px', border: 'none',
                background: loading ? '#6ee7b7' : 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff', fontSize: '0.9375rem', fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 14px rgba(16,185,129,0.4)',
                transition: 'all 0.2s',
                marginTop: '4px',
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(16,185,129,0.45)'; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = loading ? 'none' : '0 4px 14px rgba(16,185,129,0.4)'; }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: '16px', height: '16px', borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.35)',
                    borderTopColor: '#fff',
                    display: 'inline-block',
                    animation: 'lm-spin 0.7s linear infinite',
                  }} />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p style={{
            marginTop: '20px', fontSize: '0.75rem',
            color: '#94a3b8', lineHeight: 1.6, textAlign: 'center',
          }}>
            New accounts are created by your administrator.{' '}
            <span style={{ color: '#64748b' }}>Buyers can open public project links shared by the sales team.</span>
          </p>
        </div>
      </div>

      {/* Spinner keyframe */}
      <style>{`@keyframes lm-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
