import React, { useMemo } from 'react';
import { useGetAdminPaymentsQuery, useGetAdminSubscriptionsQuery } from '../api/apiSlice';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import { IndianRupee, TrendingUp, Users, CreditCard } from 'lucide-react';

export default function SuperAdminRevenue() {
  const { data: payments = [], isLoading: isLoadingPayments } = useGetAdminPaymentsQuery();
  const { data: users = [], isLoading: isLoadingUsers } = useGetAdminSubscriptionsQuery();

  const metrics = useMemo(() => {
    const completedPayments = payments.filter(p => p.status === 'completed' || p.status === 'ACTIVE' || p.status === 'pending'); // Temporarily including pending/ACTIVE for demo if real payments aren't marked completed yet
    const totalRevenue = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    
    // For MRR, just count active non-free users' implied MRR based on tier
    const activeSubscribers = users.filter(u => u.plan !== 'FREE' && u.planStatus === 'ACTIVE');
    const mrr = activeSubscribers.reduce((sum, u) => {
      if (u.plan === 'TIER1') return sum + 599;
      if (u.plan === 'TIER2') return sum + 1499;
      if (u.plan === 'TIER3') return sum + 2999;
      return sum;
    }, 0);

    return { totalRevenue, mrr, activeCount: activeSubscribers.length };
  }, [payments, users]);

  const chartData = useMemo(() => {
    // Group payments by month-year
    const monthlyData = {};
    payments.forEach(p => {
      // Basic grouping assuming 'createdAt' exists
      const date = p.createdAt ? new Date(p.createdAt) : new Date();
      const month = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      if (!monthlyData[month]) {
        monthlyData[month] = { name: month, Revenue: 0, Transactions: 0 };
      }
      monthlyData[month].Revenue += (p.amount || 0);
      monthlyData[month].Transactions += 1;
    });

    // If empty, return dummy data so the chart isn't totally blank on fresh db
    if (Object.keys(monthlyData).length === 0) {
      return [
        { name: 'Jan 2026', Revenue: 0, Transactions: 0 },
        { name: 'Feb 2026', Revenue: 0, Transactions: 0 },
        { name: 'Mar 2026', Revenue: 0, Transactions: 0 },
        { name: 'Apr 2026', Revenue: 0, Transactions: 0 },
      ];
    }

    return Object.values(monthlyData).reverse(); // Oldest first
  }, [payments]);

  if (isLoadingPayments || isLoadingUsers) return <div className="app-loading">Loading Analytics...</div>;

  return (
    <div className="dashboard-container" style={{ padding: '1.5rem 2rem', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header */}
      <div className="section-header" style={{ marginBottom: '2rem' }}>
        <h1 className="welcome-title" style={{ fontSize: '2.5rem', fontWeight: '800', color: '#0f172a' }}>Revenue Analytics</h1>
        <p className="welcome-subtitle" style={{ fontSize: '1rem', color: '#64748b' }}>Track MRR and growth over time.</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        
        {/* Total Revenue */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Revenue</p>
              <h3 style={{ margin: '8px 0 0', fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>₹{metrics.totalRevenue.toLocaleString()}</h3>
            </div>
            <div style={{ background: '#ecfdf5', padding: '14px', borderRadius: '14px', color: '#10b981' }}>
              <IndianRupee size={28} />
            </div>
          </div>
        </div>

        {/* MRR */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monthly Recurring (MRR)</p>
              <h3 style={{ margin: '8px 0 0', fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>₹{metrics.mrr.toLocaleString()}</h3>
            </div>
            <div style={{ background: '#eff6ff', padding: '14px', borderRadius: '14px', color: '#3b82f6' }}>
              <TrendingUp size={28} />
            </div>
          </div>
        </div>

        {/* Active Paid Subscribers */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Paid Subscribers</p>
              <h3 style={{ margin: '8px 0 0', fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>{metrics.activeCount}</h3>
            </div>
            <div style={{ background: '#fef2f2', padding: '14px', borderRadius: '14px', color: '#ef4444' }}>
              <Users size={28} />
            </div>
          </div>
        </div>

      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* Revenue Trend Area Chart */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Revenue Growth</h3>
          <div style={{ width: '100%', height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `₹${value}`} dx={-10} />
                <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [`₹${value}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transactions Bar Chart */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Transactions</h3>
          <div style={{ width: '100%', height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} allowDecimals={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="Transactions" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
