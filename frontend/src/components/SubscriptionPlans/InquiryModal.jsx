import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, ArrowRight, ClipboardCheck, User, Mail, Phone, Building2, MessageSquare } from 'lucide-react';
// DEMO MODE: using demoActivatePlan — swap back to Razorpay flow before going live
import { useDemoActivatePlanMutation /*, useCreateOrderMutation, useVerifyPaymentMutation */ } from '../../api/apiSlice';
import { useAuth } from '../../contexts/AuthContext';

function loadRazorpayScript(src) {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function InquiryModal({ isOpen, onClose, selectedPlan }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    company: user?.companyName || '',
    message: '',
  });

  useEffect(() => {
    if (isOpen && user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        company: user.companyName || prev.company,
      }));
    }
  }, [isOpen, user]);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // DEMO MODE: Using direct activation — no payment required
  // When going live, replace this with: const [createOrder] = useCreateOrderMutation();
  //                                     const [verifyPayment] = useVerifyPaymentMutation();
  const [demoActivatePlan] = useDemoActivatePlanMutation();

  const isContactSales = selectedPlan?.action === 'Contact Sales';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isContactSales) {
      setIsSubmitted(true);
      return;
    }

    setIsProcessing(true);

    try {
      // ─── DEMO MODE ────────────────────────────────────────────────────────────
      // Directly activates the plan when the form is submitted.
      // Comment out this block and uncomment the Razorpay block below when going live.
      await demoActivatePlan({
        planId: selectedPlan?.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
      }).unwrap();
      setIsSubmitted(true);
      // ─── END DEMO MODE ────────────────────────────────────────────────────────

      /* ─── RAZORPAY LIVE MODE (uncomment when going live) ──────────────────────
      const orderData = await createOrder({ planId: selectedPlan?.id }).unwrap();
      const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID || 'dummy_key';

      const res = await loadRazorpayScript('https://checkout.razorpay.com/v1/checkout.js');
      if (!res) {
        alert('Razorpay SDK failed to load. Are you online?');
        setIsProcessing(false);
        return;
      }

      const options = {
        key: keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'PlotVizion',
        description: `Upgrade to ${selectedPlan?.name}`,
        order_id: orderData.order.id,
        handler: async function (response) {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId: selectedPlan?.id
            }).unwrap();
            setIsSubmitted(true);
          } catch (err) {
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        theme: { color: '#10b981' }
      };
      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
      ─── END RAZORPAY LIVE MODE ─────────────────────────────────────────────── */

    } catch (err) {
      console.error(err);
      alert(err.data?.error || 'Failed to activate plan. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            boxSizing: 'border-box',
            background: 'rgba(15,23,42,0.65)',
            backdropFilter: 'blur(6px)',
          }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0 }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '90vh',
              background: '#ffffff',
              borderRadius: '20px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.06)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
            }}
          >
            {/* Gradient top bar */}
            <div style={{
              height: '4px',
              flexShrink: 0,
              background: 'linear-gradient(90deg, #34d399, #10b981, #059669)',
            }} />

            {/* Close Button */}
            <button
              onClick={onClose}
              aria-label="Close modal"
              style={{
                position: 'absolute', top: '16px', right: '16px', zIndex: 10,
                width: '32px', height: '32px', borderRadius: '50%',
                background: '#f1f5f9', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#64748b',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
              onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
            >
              <X size={16} />
            </button>

            {/* Scrollable Content */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {!isSubmitted ? (
                <div style={{ padding: '24px 28px 28px' }}>

                  {/* Header */}
                  <div style={{ marginBottom: '20px', paddingRight: '32px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center',
                      background: '#ecfdf5', color: '#059669',
                      border: '1px solid rgba(16,185,129,0.25)',
                      borderRadius: '999px', padding: '3px 12px',
                      fontSize: '0.75rem', fontWeight: 700,
                    }}>
                      ✦ Selected: {selectedPlan?.name || 'PlotVizion Plan'}
                    </span>
                    <h3 style={{
                      marginTop: '12px', fontSize: '1.5rem',
                      fontWeight: 800, color: '#0f172a',
                      letterSpacing: '-0.02em', lineHeight: 1.2, margin: '12px 0 0',
                    }}>
                      {isContactSales ? 'Contact Our Sales Team' : 'Complete Your Order'}
                    </h3>
                    <p style={{ marginTop: '6px', fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6 }}>
                      {isContactSales
                        ? 'Interested in our enterprise options? Leave your details and we will reach out shortly.'
                        : 'Fill in your details below to activate your subscription plan.'}
                    </p>
                  </div>

                  {/* Divider */}
                  <div style={{ height: '1px', background: '#f1f5f9', marginBottom: '20px' }} />

                  {/* Form */}
                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Full Name */}
                    <Field label="Full Name" required>
                      <IconInput icon={<User size={15} />}>
                        <input
                          type="text" id="inq-name" required
                          value={formData.name}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g. John Doe"
                        />
                      </IconInput>
                    </Field>

                    {/* Email + Phone */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <Field label="Work Email" required>
                        <IconInput icon={<Mail size={15} />}>
                          <input
                            type="email" id="inq-email" required
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder="john@example.com"
                          />
                        </IconInput>
                      </Field>
                      <Field label="Phone Number" required>
                        <IconInput icon={<Phone size={15} />}>
                          <input
                            type="tel" id="inq-phone" required
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+91 XXXXX XXXXX"
                          />
                        </IconInput>
                      </Field>
                    </div>

                    {/* Company */}
                    <Field label="Organization / Company" optional>
                      <IconInput icon={<Building2 size={15} />}>
                        <input
                          type="text" id="inq-company"
                          value={formData.company}
                          onChange={e => setFormData({ ...formData, company: e.target.value })}
                          placeholder="e.g. Acme Corp"
                        />
                      </IconInput>
                    </Field>

                    {/* Message */}
                    <Field label="Additional Details / Requirements" optional>
                      <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '11px', top: '11px', color: '#94a3b8', pointerEvents: 'none' }}>
                          <MessageSquare size={15} />
                        </div>
                        <textarea
                          id="inq-message" rows={3}
                          value={formData.message}
                          onChange={e => setFormData({ ...formData, message: e.target.value })}
                          placeholder="Specify any custom layouts, views, or integration requirements..."
                          style={{ ...inputBaseStyle, paddingLeft: '34px', resize: 'none', fontFamily: 'inherit' }}
                          onFocus={e => applyFocus(e)}
                          onBlur={e => removeFocus(e)}
                        />
                      </div>
                    </Field>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '4px', flexWrap: 'wrap' }}>
                      <button
                        type="button" onClick={onClose}
                        style={{
                          padding: '10px 20px', borderRadius: '10px',
                          border: '1.5px solid #e2e8f0', background: '#fff',
                          fontSize: '0.875rem', fontWeight: 600, color: '#475569', cursor: 'pointer',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isProcessing}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '7px',
                          padding: '10px 22px', borderRadius: '10px',
                          background: isProcessing ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)',
                          border: 'none', fontSize: '0.875rem', fontWeight: 700,
                          color: '#fff', cursor: isProcessing ? 'not-allowed' : 'pointer',
                          boxShadow: isProcessing ? 'none' : '0 4px 14px rgba(16,185,129,0.35)',
                        }}
                        onMouseEnter={e => !isProcessing && (e.currentTarget.style.opacity = '0.9')}
                        onMouseLeave={e => !isProcessing && (e.currentTarget.style.opacity = '1')}
                      >
                        {isProcessing ? 'Processing...' : (isContactSales ? 'Send Request' : 'Proceed to Checkout')}
                        {!isProcessing && <ArrowRight size={15} />}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 32px', textAlign: 'center' }}
                >
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '50%',
                    background: '#ecfdf5', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', marginBottom: '20px', color: '#10b981',
                  }}>
                    <CheckCircle size={36} />
                  </div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Request Received!</h3>
                  <p style={{ marginTop: '10px', fontSize: '0.875rem', color: '#64748b', maxWidth: '320px', lineHeight: 1.6 }}>
                    Thank you, <strong style={{ color: '#0f172a' }}>{formData.name}</strong>. Your request for the{' '}
                    <strong style={{ color: '#10b981' }}>{selectedPlan?.name}</strong> has been submitted successfully.
                  </p>
                  <div style={{
                    marginTop: '24px', width: '100%', background: '#f8fafc',
                    borderRadius: '12px', padding: '16px', textAlign: 'left', border: '1px solid #f1f5f9',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      <ClipboardCheck size={14} style={{ color: '#10b981' }} /> Submission Summary
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.8125rem', color: '#475569' }}>
                      <p style={{ margin: 0 }}><span style={{ fontWeight: 600, color: '#334155' }}>Plan:</span> {selectedPlan?.name}</p>
                      <p style={{ margin: 0 }}><span style={{ fontWeight: 600, color: '#334155' }}>Email:</span> {formData.email}</p>
                      <p style={{ margin: 0 }}><span style={{ fontWeight: 600, color: '#334155' }}>Phone:</span> {formData.phone}</p>
                      {formData.company && <p style={{ margin: 0 }}><span style={{ fontWeight: 600, color: '#334155' }}>Company:</span> {formData.company}</p>}
                    </div>
                  </div>
                  <button
                    onClick={handleReset}
                    style={{
                      marginTop: '24px', padding: '11px 28px', borderRadius: '10px',
                      background: '#0f172a', border: 'none', color: '#fff',
                      fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#1e293b'}
                    onMouseLeave={e => e.currentTarget.style.background = '#0f172a'}
                  >
                    Close Window
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ─── Shared helpers ─── */

const inputBaseStyle = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  borderRadius: '10px',
  border: '1.5px solid #e2e8f0',
  background: '#f8fafc',
  padding: '10px 14px 10px 34px',
  fontSize: '0.875rem',
  color: '#0f172a',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

function applyFocus(e) {
  e.target.style.borderColor = '#10b981';
  e.target.style.background = '#fff';
  e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.12)';
}
function removeFocus(e) {
  e.target.style.borderColor = '#e2e8f0';
  e.target.style.background = '#f8fafc';
  e.target.style.boxShadow = 'none';
}

function Field({ label, required, optional, children }) {
  return (
    <div style={{ width: '100%', minWidth: 0 }}>
      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
        {label}
        {required && <span style={{ color: '#10b981', marginLeft: '3px' }}>*</span>}
        {optional && <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: '0.75rem', marginLeft: '4px' }}>(Optional)</span>}
      </label>
      {children}
    </div>
  );
}

function IconInput({ icon, children }) {
  const input = React.cloneElement(children, {
    style: inputBaseStyle,
    onFocus: applyFocus,
    onBlur: removeFocus,
  });
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none', display: 'flex' }}>
        {icon}
      </div>
      {input}
    </div>
  );
}
