import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BarChart3, Plus } from 'lucide-react';
import { slaAPI } from '../api';
import toast from 'react-hot-toast';

const SLAManagement = () => {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPolicy, setNewPolicy] = useState({
    name: '', description: '', priority: '3', response_time_hours: 4, resolution_time_hours: 24
  });

  const { data: policiesData, isLoading } = useQuery({
    queryKey: ['sla-policies'],
    queryFn: () => slaAPI.listPolicies().then(r => r.data),
  });

  const { data: recordsData } = useQuery({
    queryKey: ['sla-records'],
    queryFn: () => slaAPI.listRecords().then(r => r.data),
  });

  const policies = policiesData?.results || policiesData || [];
  const records = recordsData?.results || recordsData || [];

  const createMutation = useMutation({
    mutationFn: (data) => slaAPI.createPolicy(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['sla-policies']);
      setShowCreateModal(false);
      setNewPolicy({ name: '', description: '', priority: '3', response_time_hours: 4, resolution_time_hours: 24 });
      toast.success('SLA policy created');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => slaAPI.deletePolicy(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['sla-policies']);
      toast.success('SLA policy deleted');
    },
  });

  const handleCreate = (e) => {
    e.preventDefault();
    createMutation.mutate(newPolicy);
  };

  const priorityLabels = { '1': 'Critical', '2': 'High', '3': 'Medium', '4': 'Low' };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>SLA Management</h1>
          <p>Configure Service Level Agreement policies</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={18} />
          Add Policy
        </button>
      </div>

      {records && (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="stat-card">
            <div className="stat-card-title">SLA Met</div>
            <div className="stat-card-value" style={{ color: 'var(--success-500)' }}>
              {records.filter(r => r.resolution_met).length}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-title">SLA Breached</div>
            <div className="stat-card-value" style={{ color: 'var(--danger-500)' }}>
              {records.filter(r => r.resolution_met === false).length}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-title">Compliance Rate</div>
            <div className="stat-card-value">
              {records.length ? Math.round(records.filter(r => r.resolution_met).length / records.length * 100) : 100}%
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Policy Name</th>
                <th>Priority</th>
                <th>Response Time</th>
                <th>Resolution Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {policies?.map(policy => (
                <tr key={policy.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{policy.name}</div>
                    {policy.description && <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>{policy.description}</div>}
                  </td>
                  <td><span className={`badge badge-${priorityLabels[policy.priority]?.toLowerCase()}`}>{priorityLabels[policy.priority]}</span></td>
                  <td>{policy.response_time_hours} hours</td>
                  <td>{policy.resolution_time_hours} hours</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteMutation.mutate(policy.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!policies?.length) && !isLoading && (
          <div className="empty-state">
            <BarChart3 size={64} />
            <h3>No SLA policies</h3>
            <p>Create your first SLA policy</p>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Add SLA Policy</h2>
              <button className="btn-icon" onClick={() => setShowCreateModal(false)}>X</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Policy Name *</label>
                  <input type="text" className="form-input" value={newPolicy.name} onChange={(e) => setNewPolicy({...newPolicy, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input type="text" className="form-input" value={newPolicy.description} onChange={(e) => setNewPolicy({...newPolicy, description: e.target.value})} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select className="form-select" value={newPolicy.priority} onChange={(e) => setNewPolicy({...newPolicy, priority: e.target.value})}>
                      <option value="1">Critical</option>
                      <option value="2">High</option>
                      <option value="3">Medium</option>
                      <option value="4">Low</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Response Time (hours)</label>
                    <input type="number" className="form-input" value={newPolicy.response_time_hours} onChange={(e) => setNewPolicy({...newPolicy, response_time_hours: parseInt(e.target.value)})} min="1" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Resolution Time (hours)</label>
                  <input type="number" className="form-input" value={newPolicy.resolution_time_hours} onChange={(e) => setNewPolicy({...newPolicy, resolution_time_hours: parseInt(e.target.value)})} min="1" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Policy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SLAManagement;
