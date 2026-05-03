import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  Ticket, Clock, CheckCircle, AlertTriangle, 
  ArrowUpRight, ArrowDownRight, TrendingUp, Hourglass
} from 'lucide-react';
import { ticketsAPI, dashboardAPI } from '../api';
import { formatDistanceToNow } from 'date-fns';

const StatCard = ({ title, value, icon: Icon, color, change }) => (
  <div className="stat-card">
    <div className="stat-card-header">
      <div>
        <div className="stat-card-title">{title}</div>
        <div className="stat-card-value">{value}</div>
      </div>
      <div className={`stat-card-icon ${color}`}>
        <Icon size={22} />
      </div>
    </div>
    {change !== undefined && (
      <div className={`stat-card-change ${change >= 0 ? 'positive' : 'negative'}`}>
        {change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        <span>{Math.abs(change)}% from last week</span>
      </div>
    )}
  </div>
);

const Dashboard = () => {
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['ticket-dashboard'],
    queryFn: () => ticketsAPI.dashboard().then(r => r.data),
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardAPI.stats().then(r => r.data),
  });

  const priorityLabels = { '1': 'Critical', '2': 'High', '3': 'Medium', '4': 'Low' };
  const typeLabels = { 
    'incident': 'Incident', 
    'service_request': 'Service Request', 
    'problem': 'Problem', 
    'change': 'Change', 
    'task': 'Task' 
  };

  if (dashboardLoading || statsLoading) {
    return <div className="loading"><div className="spinner" /></div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back! Here's what's happening with your tickets.</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard 
          title="Total Tickets" 
          value={dashboardData?.total || 0} 
          icon={Ticket} 
          color="blue" 
        />
        <StatCard 
          title="In Progress" 
          value={dashboardData?.in_progress || 0} 
          icon={Clock} 
          color="yellow" 
        />
        <StatCard 
          title="Resolved" 
          value={dashboardData?.resolved || 0} 
          icon={CheckCircle} 
          color="green" 
        />
        <StatCard 
          title="Overdue" 
          value={dashboardData?.overdue || 0} 
          icon={AlertTriangle} 
          color="red" 
        />
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <StatCard 
          title="Created This Week" 
          value={statsData?.created_this_week || 0} 
          icon={TrendingUp} 
          color="blue" 
        />
        <StatCard 
          title="Resolved This Week" 
          value={statsData?.resolved_this_week || 0} 
          icon={CheckCircle} 
          color="green" 
        />
        <StatCard 
          title="SLA Compliance" 
          value={`${statsData?.sla_compliance_rate || 100}%`} 
          icon={Hourglass} 
          color="yellow" 
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
        <div className="card">
          <div className="card-header">
            <h3>Recent Tickets</h3>
            <Link to="/tickets" className="btn btn-secondary btn-sm">View All</Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData?.recent_tickets?.slice(0, 5).map(ticket => (
                  <tr key={ticket.id}>
                    <td>
                      <Link to={`/tickets/${ticket.id}`} className="ticket-link">
                        {ticket.ticket_number}
                      </Link>
                    </td>
                    <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ticket.title}
                    </td>
                    <td>
                      <span className={`badge badge-${ticket.status}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${priorityLabels[ticket.priority]?.toLowerCase()}`}>
                        {priorityLabels[ticket.priority]}
                      </span>
                    </td>
                    <td style={{ color: 'var(--gray-500)', fontSize: '13px' }}>
                      {formatDistanceToNow(new Date(ticket.created_at))} ago
                    </td>
                  </tr>
                ))}
                {(!dashboardData?.recent_tickets?.length) && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-500)' }}>
                      No tickets yet. Create one to get started!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Tickets by Type</h3>
          </div>
          <div className="card-body">
            {dashboardData?.by_type?.map(item => (
              <div key={item.type} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>
                    {typeLabels[item.type] || item.type}
                  </span>
                  <span style={{ fontSize: '14px', color: 'var(--gray-500)' }}>
                    {item.count}
                  </span>
                </div>
                <div style={{ height: '8px', background: 'var(--gray-100)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      height: '100%', 
                      width: `${dashboardData.total ? (item.count / dashboardData.total * 100) : 0}%`,
                      background: 'var(--primary-500)',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }} 
                  />
                </div>
              </div>
            ))}
            {(!dashboardData?.by_type?.length) && (
              <p style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '20px' }}>
                No data available
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
