import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Plus } from 'lucide-react';
import { changeRequestsAPI, ticketsAPI } from '../api';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const ChangeRequests = () => {
  const queryClient = useQueryClient();
  const { user, isAdmin, isManager } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChange, setNewChange] = useState({
    title: '', description: '', type: 'normal', risk: 'medium', reason: '', implementation_plan: '', rollback_plan: ''
  });

  const { data, isLoading } = useQuery({
    queryKey: ['change-requests'],
    queryFn: () => changeRequestsAPI.list().then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => changeRequestsAPI.create(data),
    onSuccess: async () => {
      await ticketsAPI.create({
        title: newChange.title,
        description: newChange.description,
        type: 'change',
        priority: newChange.risk === 'high' ? '1' : newChange.risk === 'medium' ? '2' : '3',
      });
      queryClient.invalidateQueries(['change-requests']);
      setShowCreateModal(false);
      setNewChange({ title: '', description: '', type: 'normal', risk: 'medium', reason: '', implementation_plan: '', rollback_plan: '' });
      toast.success('Change request created');
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id) => changeRequestsAPI.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['change-requests']);
      toast.success('Change approved');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => changeRequestsAPI.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['change-requests']);
      toast.success('Change rejected');
    },
  });

  const handleCreate = (e) => {
    e.preventDefault();
    createMutation.mutate(newChange);
  };

  const statusLabels = { new: 'New', assessing: 'Assessing', authorized: 'Authorized', scheduled: 'Scheduled', implementing: 'Implementing', reviewing: 'Reviewing', completed: 'Completed', cancelled: 'Cancelled' };
  const typeLabels = { standard: 'Standard', normal: 'Normal', emergency: 'Emergency' };
  const riskColors = { low: 'resolved', medium: 'on_hold', high: 'cancelled' };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Change Requests</h1>
          <p>Manage and track infrastructure changes</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={18} />
          New Change
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Change #</th>
                <th>Title</th>
                <th>Type</th>
                <th>Risk</th>
                <th>Status</th>
                <th>Requested By</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.results?.map(change => (
                <tr key={change.id}>
                  <td><span className="ticket-link">{change.change_number}</span></td>
                  <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{change.title}</td>
                  <td><span className={`badge badge-${change.type === 'emergency' ? 'cancelled' : 'new'}`}>{typeLabels[change.type]}</span></td>
                  <td><span className={`badge badge-${riskColors[change.risk]}`}>{change.risk}</span></td>
                  <td><span className={`badge badge-${change.status}`}>{statusLabels[change.status]}</span></td>
                  <td>{change.requested_by?.full_name}</td>
                  <td style={{ fontSize: '13px', color: 'var(--gray-500)' }}>{formatDistanceToNow(new Date(change.created_at))} ago</td>
                  <td>
                    {change.status === 'new' && (isAdmin || isManager) && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="btn btn-success btn-sm" onClick={() => approveMutation.mutate(change.id)}>Approve</button>
                        <button className="btn btn-danger btn-sm" onClick={() => rejectMutation.mutate(change.id)}>Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!data?.results?.length) && !isLoading && (
          <div className="empty-state">
            <RefreshCw size={64} />
            <h3>No change requests</h3>
            <p>Create a new change request to get started</p>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2>Create Change Request</h2>
              <button className="btn-icon" onClick={() => setShowCreateModal(false)}>X</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input type="text" className="form-input" value={newChange.title} onChange={(e) => setNewChange({...newChange, title: e.target.value})} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select className="form-select" value={newChange.type} onChange={(e) => setNewChange({...newChange, type: e.target.value})}>
                      <option value="normal">Normal</option>
                      <option value="standard">Standard</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Risk</label>
                    <select className="form-select" value={newChange.risk} onChange={(e) => setNewChange({...newChange, risk: e.target.value})}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <textarea className="form-textarea" value={newChange.description} onChange={(e) => setNewChange({...newChange, description: e.target.value})} rows={3} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Reason for Change *</label>
                  <textarea className="form-textarea" value={newChange.reason} onChange={(e) => setNewChange({...newChange, reason: e.target.value})} rows={3} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Implementation Plan</label>
                    <textarea className="form-textarea" value={newChange.implementation_plan} onChange={(e) => setNewChange({...newChange, implementation_plan: e.target.value})} rows={3} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Rollback Plan</label>
                    <textarea className="form-textarea" value={newChange.rollback_plan} onChange={(e) => setNewChange({...newChange, rollback_plan: e.target.value})} rows={3} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Change</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChangeRequests;
