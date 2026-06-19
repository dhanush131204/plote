import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/SubscriptionPlans/Navbar';
import HeroSection from '../components/SubscriptionPlans/HeroSection';
import PricingSection from '../components/SubscriptionPlans/PricingSection';
import ComparisonTable from '../components/SubscriptionPlans/ComparisonTable';
import TermsSection from '../components/SubscriptionPlans/TermsSection';
import Footer from '../components/SubscriptionPlans/Footer';
import InquiryModal from '../components/SubscriptionPlans/InquiryModal';
import LoginModal from '../components/LoginModal';
import RegisterPage from './RegisterPage';

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Only redirect super_admin and buyer — builders (admin) stay on this page to pick a plan
  useEffect(() => {
    if (user) {
      if (user.role === 'super_admin') navigate('/platform/dashboard', { replace: true });
      else if (user.role === 'admin') navigate('/dashboard', { replace: true });
      else if (user.role === 'user') navigate('/buyer/projects', { replace: true });
      // admin (builder) stays here to choose a subscription plan
    }
  }, [user, navigate]);

  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('register') === 'true') {
      setRegisterModalOpen(true);
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleOpenInquiryModal = (plan) => {
    // If not logged in — redirect to register page with plan in URL
    if (!user) {
      setSelectedPlan(plan);
      setRegisterModalOpen(true);
      return;
    }
    // If logged in as builder — open the inquiry/checkout modal
    setSelectedPlan(plan);
    setInquiryModalOpen(true);
  };

  const handleCloseInquiryModal = () => {
    setInquiryModalOpen(false);
    setSelectedPlan(null);
  };

  const handleOpenLoginModal = () => setLoginModalOpen(true);
  const handleCloseLoginModal = () => setLoginModalOpen(false);
  const handleCloseRegisterModal = () => {
    setRegisterModalOpen(false);
    setSelectedPlan(null);
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Pass user so Navbar can hide Login when logged in */}
      <Navbar
        onOpenModal={handleOpenInquiryModal}
        onOpenLogin={handleOpenLoginModal}
        onOpenRegister={() => setRegisterModalOpen(true)}
        user={user}
      />

      <main className="flex-grow">
        {/* Pass user so HeroSection can hide Sign In when logged in */}
        <HeroSection onOpenModal={handleOpenInquiryModal} onOpenLogin={handleOpenLoginModal} user={user} />
        <PricingSection onOpenModal={handleOpenInquiryModal} />
        <ComparisonTable onOpenModal={handleOpenInquiryModal} />
        <TermsSection />
      </main>

      <Footer />

      <InquiryModal
        isOpen={inquiryModalOpen}
        onClose={handleCloseInquiryModal}
        selectedPlan={selectedPlan}
      />

      <LoginModal
        isOpen={loginModalOpen}
        onClose={handleCloseLoginModal}
      />

      <RegisterPage
        isOpen={registerModalOpen}
        onClose={handleCloseRegisterModal}
        onOpenLogin={handleOpenLoginModal}
        selectedPlan={selectedPlan}
      />
    </div>
  );
}
