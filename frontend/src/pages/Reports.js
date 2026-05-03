import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ticketsAPI, dashboardAPI } from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const Reports = () => {
  const { data: dashboard } = useQuery({
    queryKey: ['ticket-dashboard'],
    queryFn: () => ticketsAPI.dashboard().then(r => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardAPI.stats().then(r => r.data),
  });

  const priorityLabels = { '1': 'Critical', '2': 'High', '3': 'Medium', '4': 'Low' };
  const typeLabels = { 'incident': 'Incident', 'service_request': 'Service Request', 'problem': 'Problem', 'change': 'Change', 'task': 'Task' };
  const statusLabels = { 'new': 'New', 'in_progress': 'In Progress', 'on_hold': 'On Hold', 'resolved': 'Resolved', 'closed': 'Closed' };

  const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const byTypeData = dashboard?.by_type?.map(item => ({
    name: typeLabels[item.type] || item.type,
    value: item.count,
  })) || [];

  const byPriorityData = dashboard?.by_priority?.map(item => ({
    name: priorityLabels[item.priority] || item.priority,
    value: item.count,
  })) || [];

  const byStatusData = dashboard?.by_status?.map(item => ({
    name: statusLabels[item.status] || item.status,
    value: item.count,
  })) || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p>Analytics and insights for your ticketing system</p>
        </div>
      </div>

      {stats && (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="stat-card">
            <div className="stat-card-title">Open Tickets</div>
            <div className="stat-card-value">{stats.open_tickets}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-title">Created This Month</div>
            <div className="stat-card-value">{stats.created_this_month}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-title">Resolved This Month</div>
            <div className="stat-card-value">{stats.resolved_this_month}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-title">SLA Breached</div>
            <div className="stat-card-value" style={{ color: 'var(--danger-500)' }}>{stats.sla_breached}</div>
          </div>
        </div>
      )}

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Tickets by Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={byTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {byTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Tickets by Priority</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byPriorityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Tickets by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byStatusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>SLA Performance</h3>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', fontWeight: '700', color: stats?.sla_compliance_rate >= 90 ? 'var(--success-500)' : 'var(--warning-500)' }}>
              {stats?.sla_compliance_rate || 100}%
            </div>
            <div style={{ fontSize: '14px', color: 'var(--gray-500)', marginTop: '8px' }}>
              SLA Compliance Rate
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '24px' }}>
              <div>
                <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--success-500)' }}>
                  {stats ? (stats.created_this_month - stats.sla_breached) : 0}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>Met SLA</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--danger-500)' }}>
                  {stats?.sla_breached || 0}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>Breached</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
