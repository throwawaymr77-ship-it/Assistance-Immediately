import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Filter } from 'lucide-react';
import { ticketsAPI, usersAPI } from '../api';
import { formatDistanceToNow } from 'date-fns';

const priorityLabels = { '1': 'Critical', '2': 'High', '3': 'Medium', '4': 'Low' };
const typeLabels = { 'incident': 'Incident', 'service_request': 'Service Request', 'problem': 'Problem', 'change': 'Change', 'task': 'Task' };

const TicketList = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({});
  const [myTickets, setMyTickets] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', filters, myTickets],
    queryFn: () => ticketsAPI.list({ ...filters, my_tickets: myTickets || undefined }).then(r => r.data),
  });

  const { data: technicians } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => usersAPI.technicians().then(r => r.data),
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Tickets</h1>
          <p>Manage and track all service tickets</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/tickets/new')}>
          <Plus size={18} />
          New Ticket
        </button>
      </div>

      <div className="filters-bar">
        <button 
          className={`btn ${myTickets ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setMyTickets(!myTickets)}
        >
          My Tickets
        </button>
        <select 
          className="filter-select"
          value={filters.status || ''}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value || undefined }))}
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="in_progress">In Progress</option>
          <option value="on_hold">On Hold</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select 
          className="filter-select"
          value={filters.priority || ''}
          onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value || undefined }))}
        >
          <option value="">All Priorities</option>
          <option value="1">Critical</option>
          <option value="2">High</option>
          <option value="3">Medium</option>
          <option value="4">Low</option>
        </select>
        <select 
          className="filter-select"
          value={filters.type || ''}
          onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value || undefined }))}
        >
          <option value="">All Types</option>
          <option value="incident">Incident</option>
          <option value="service_request">Service Request</option>
          <option value="problem">Problem</option>
          <option value="change">Change Request</option>
          <option value="task">Task</option>
        </select>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Ticket #</th>
                <th>Title</th>
                <th>Type</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assignee</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {data?.results?.map(ticket => (
                <tr key={ticket.id}>
                  <td>
                    <Link to={`/tickets/${ticket.id}`} className="ticket-link">
                      {ticket.ticket_number}
                    </Link>
                  </td>
                  <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ticket.title}
                  </td>
                  <td>
                    <span className={`badge badge-${ticket.type}`}>
                      {typeLabels[ticket.type]}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${priorityLabels[ticket.priority]?.toLowerCase()}`}>
                      {priorityLabels[ticket.priority]}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${ticket.status}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    {ticket.assigned_to ? (
                      <span style={{ fontSize: '13px' }}>{ticket.assigned_to.full_name}</span>
                    ) : (
                      <span style={{ fontSize: '13px', color: 'var(--gray-400)' }}>Unassigned</span>
                    )}
                  </td>
                  <td style={{ color: 'var(--gray-500)', fontSize: '13px' }}>
                    {formatDistanceToNow(new Date(ticket.created_at))} ago
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {(!data?.results?.length) && !isLoading && (
          <div className="empty-state">
            <Plus size={64} />
            <h3>No tickets found</h3>
            <p>Create your first ticket or adjust your filters</p>
            <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => navigate('/tickets/new')}>
              Create Ticket
            </button>
          </div>
        )}
      </div>

      {data?.count > 20 && (
        <div className="pagination">
          <span style={{ fontSize: '13px', color: 'var(--gray-500)' }}>
            Showing {data.results?.length || 0} of {data.count} tickets
          </span>
        </div>
      )}
    </div>
  );
};

export default TicketList;
