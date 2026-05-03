import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { 
  LayoutDashboard, Ticket, BookOpen, HardDrive, RefreshCw, 
  Settings, Users, FileText, BarChart3, Menu, X, Search
} from 'lucide-react';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TicketList from './pages/TicketList';
import TicketDetail from './pages/TicketDetail';
import TicketForm from './pages/TicketForm';
import KnowledgeBase from './pages/KnowledgeBase';
import KnowledgeBaseDetail from './pages/KnowledgeBaseDetail';
import Assets from './pages/Assets';
import ChangeRequests from './pages/ChangeRequests';
import UsersPage from './pages/Users';
import Reports from './pages/Reports';
import SLAManagement from './pages/SLAManagement';
import AuditLogs from './pages/AuditLogs';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/tickets', icon: Ticket, label: 'Tickets', badge: 'All' },
    { path: '/tickets/new', icon: FileText, label: 'Create Ticket' },
    { path: '/knowledge-base', icon: BookOpen, label: 'Knowledge Base' },
    { path: '/assets', icon: HardDrive, label: 'Assets' },
    { path: '/change-requests', icon: RefreshCw, label: 'Changes' },
  ];

  const adminItems = [
    { path: '/users', icon: Users, label: 'Users' },
    { path: '/sla-management', icon: BarChart3, label: 'SLA Policies' },
    { path: '/audit-logs', icon: FileText, label: 'Audit Logs' },
    { path: '/reports', icon: BarChart3, label: 'Reports' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {isOpen && (
        <div 
          className="sidebar-overlay"
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 99,
          }}
        />
      )}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <Ticket size={20} color="white" />
            </div>
            <span>Assistance Immediately</span>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <div className="nav-section-title">Main</div>
          {navItems.map(item => (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={onClose}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </Link>
          ))}
          
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <>
              <div className="nav-section-title">Administration</div>
              {adminItems.map(item => (
                <Link 
                  key={item.path} 
                  to={item.path} 
                  className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </>
          )}
        </nav>
      </aside>
    </>
  );
};

const Header = ({ onMenuClick, title }) => {
  const { user, logout } = useAuth();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <header className="header">
      <div className="header-left">
        <button className="btn-icon" onClick={onMenuClick} style={{ display: 'none' }}>
          <Menu size={20} />
        </button>
        <h2 className="header-title">{title}</h2>
      </div>
      
      <div className="header-right">
        <div className="header-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search tickets, KB articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="user-menu">
          <div className="user-info">
            <div className="user-name">{user?.full_name || user?.email}</div>
            <div className="user-role">{user?.role}</div>
          </div>
          <div className="user-avatar">
            {user ? getInitials(user.full_name || user.email) : '?'}
          </div>
        </div>
      </div>
    </header>
  );
};

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/tickets/new')) return 'Create Ticket';
    if (path.startsWith('/tickets')) return 'Tickets';
    if (path.startsWith('/knowledge-base')) return 'Knowledge Base';
    if (path.startsWith('/assets')) return 'Assets';
    if (path.startsWith('/change-requests')) return 'Change Requests';
    if (path.startsWith('/users')) return 'Users';
    if (path.startsWith('/sla-management')) return 'SLA Management';
    if (path.startsWith('/audit-logs')) return 'Audit Logs';
    if (path.startsWith('/reports')) return 'Reports';
    return 'Assistance Immediately';
  };

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} title={getTitle()} />
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
};

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="loading"><div className="spinner" /></div>;
  }
  
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading"><div className="spinner" /></div>;
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/tickets" element={<PrivateRoute><TicketList /></PrivateRoute>} />
      <Route path="/tickets/new" element={<PrivateRoute><TicketForm /></PrivateRoute>} />
      <Route path="/tickets/:id" element={<PrivateRoute><TicketDetail /></PrivateRoute>} />
      <Route path="/knowledge-base" element={<PrivateRoute><KnowledgeBase /></PrivateRoute>} />
      <Route path="/knowledge-base/:id" element={<PrivateRoute><KnowledgeBaseDetail /></PrivateRoute>} />
      <Route path="/assets" element={<PrivateRoute><Assets /></PrivateRoute>} />
      <Route path="/change-requests" element={<PrivateRoute><ChangeRequests /></PrivateRoute>} />
      <Route path="/users" element={<PrivateRoute><UsersPage /></PrivateRoute>} />
      <Route path="/sla-management" element={<PrivateRoute><SLAManagement /></PrivateRoute>} />
      <Route path="/audit-logs" element={<PrivateRoute><AuditLogs /></PrivateRoute>} />
      <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
