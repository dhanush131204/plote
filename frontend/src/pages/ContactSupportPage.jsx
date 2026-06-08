import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function ContactSupportPage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.email?.split('@')[0] || '',
    email: user?.email || '',
    phone: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitSuccess(false);
    setIsSubmitting(true);

    // Simulate API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate network delay
      console.log('Support request submitted:', formData);
      setSubmitSuccess(true);
      setFormData({
        name: user?.email?.split('@')[0] || '',
        email: user?.email || '',
        phone: '',
        subject: '',
        message: '',
      });
    } catch (err) {
      setError('Failed to submit support request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard-container">
      <section className="welcome-banner" style={{ marginBottom: '2rem' }}>
        <div className="welcome-content">
          <h1 className="welcome-title">Contact Support</h1>
          <p className="welcome-subtitle">We're here to help you with any questions or issues.</p>
        </div>
      </section>

      {error && <div className="dashboard-error">{error}</div>}
      {submitSuccess && (
        <div className="dashboard-success" style={{ marginBottom: '1rem' }}>
          Your support request has been submitted successfully! We will get back to you shortly.
        </div>
      )}

      <div className="contact-support-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', '@media (min-width: 768px)': { gridTemplateColumns: '2fr 1fr' } }}>
        <div className="contact-form-card" style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border)' }}>
          <h3 className="section-title" style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.5rem' }}>Submit a Request</h3>
          <form onSubmit={handleSubmit} className="support-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label className="builder-field" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>Name</span>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="builder-input-block"
                style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
              />
            </label>
            <label className="builder-field" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>Email</span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="builder-input-block"
                style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
              />
            </label>
            <label className="builder-field" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>Phone</span>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="builder-input-block"
                style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
              />
            </label>
            <label className="builder-field" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>Subject</span>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="builder-input-block"
                style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
              />
            </label>
            <label className="builder-field" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>Message</span>
              <textarea
                name="message"
                rows="5"
                value={formData.message}
                onChange={handleChange}
                required
                className="builder-textarea"
                style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', resize: 'vertical' }}
              />
            </label>
            <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: '600' }}>
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>

        <div className="contact-info-card" style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border)' }}>
          <h3 className="section-title" style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.5rem' }}>Contact Information</h3>
          <div className="contact-detail" style={{ marginBottom: '1rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: 'var(--color-text-muted)' }}>Phone</h4>
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: '500' }}>+91 98765 43210</p> {/* Placeholder */}
          </div>
          <div className="contact-detail" style={{ marginBottom: '1rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: 'var(--color-text-muted)' }}>Email</h4>
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: '500' }}>support@example.com</p> {/* Placeholder */}
          </div>
          <div className="contact-detail" style={{ marginBottom: '1rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: 'var(--color-text-muted)' }}>WhatsApp</h4>
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: '500' }}>+91 98765 43210</p> {/* Placeholder */}
          </div>
        </div>
      </div>
    </div>
  );
}