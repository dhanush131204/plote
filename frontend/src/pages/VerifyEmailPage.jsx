import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');
  const planFromUrl = searchParams.get('plan');

  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(4);
  const [redirectPath, setRedirectPath] = useState('/');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('No login token found in the link. Please request a new one.');
      return;
    }

    async function verify() {
      try {
        const res = await fetch(`${API_BASE}/api/auth/verify-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Verification failed');

        // Store token in localStorage (same as normal login)
        localStorage.setItem('token', data.token);

        const destination = data.user?.role === 'super_admin'
          ? '/platform/dashboard'
          : data.user?.role === 'admin'
            ? '/dashboard'
            : '/buyer/projects';

        setRedirectPath(destination);
        setStatus('success');

        let count = 4;
        const timer = setInterval(() => {
          count--;
          setCountdown(count);
          if (count <= 0) {
            clearInterval(timer);
            window.location.href = destination;
          }
        }, 1000);
      } catch (err) {
        setStatus('error');
        setErrorMsg(err.message);
      }
    }

    verify();
  }, [token]);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#f8fafc', padding: '24px',
      boxSizing: 'border-box',
    }}>
      <div style={{
        width: '100%', maxWidth: '440px', background: '#fff',
        borderRadius: '20px', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
        textAlign: 'center',
      }}>
        {/* Gradient top bar */}
        <div style={{ height: '4px', background: 'linear-gradient(90deg,#34d399,#10b981,#059669)' }} />

        <div style={{ padding: '48px 36px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '32px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg,#10b981,#059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ width: 16, height: 16 }}>
                <path d="M3 3h7v7H3z" /><path d="M14 3h7v7h-7z" />
                <path d="M14 14h7v7h-7z" /><path d="M3 14h7v7H3z" />
              </svg>
            </div>
            <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
              Plot<span style={{ color: '#10b981' }}>Vizion</span>
            </span>
          </div>

          {/* Verifying state */}
          {status === 'verifying' && (
            <>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: '#ecfdf5', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 20px', color: '#10b981',
                animation: 've-pulse 1.5s ease-in-out infinite',
              }}>
                <Loader size={36} style={{ animation: 've-spin 1s linear infinite' }} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 10px' }}>
                Verifying your link...
              </h2>
              <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>
                Please wait while we log you in.
              </p>
            </>
          )}

          {/* Success state */}
          {status === 'success' && (
            <>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: '#ecfdf5', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 20px', color: '#10b981',
              }}>
                <CheckCircle size={40} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 10px' }}>
                Login Successful! 🎉
              </h2>
              <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '0 0 20px', lineHeight: 1.6 }}>
                You are now logged in to PlotVizion.
                {planFromUrl && (
                  <> Your <strong style={{ color: '#10b981' }}>{planFromUrl}</strong> plan selection has been saved.</>
                )}
              </p>
              <div style={{
                background: '#f8fafc', borderRadius: '12px',
                padding: '14px', border: '1px solid #f1f5f9',
              }}>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                  Redirecting you now in{' '}
                  <strong style={{ color: '#10b981', fontSize: '1.1rem' }}>{countdown}</strong>
                  {' '}seconds...
                </p>
              </div>
              <button
                onClick={() => { window.location.href = redirectPath; }}
                style={{
                  marginTop: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '11px 24px', borderRadius: '10px', border: 'none',
                  background: 'linear-gradient(135deg,#10b981,#059669)',
                  color: '#fff', fontSize: '0.875rem', fontWeight: 700,
                  cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
                }}
              >
                Go Now →
              </button>
            </>
          )}

          {/* Error state */}
          {status === 'error' && (
            <>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: '#fef2f2', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 20px', color: '#ef4444',
              }}>
                <XCircle size={40} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 10px' }}>
                Link Invalid or Expired
              </h2>
              <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '0 0 24px', lineHeight: 1.6 }}>
                {errorMsg}
              </p>
              <button
                onClick={() => navigate('/')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '11px 24px', borderRadius: '10px', border: 'none',
                  background: '#0f172a', color: '#fff',
                  fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
                }}
              >
                Back to Home
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes ve-spin { to { transform: rotate(360deg); } }
        @keyframes ve-pulse { 0%,100% { opacity:1; } 50% { opacity:0.6; } }
      `}</style>
    </div>
  );
}
