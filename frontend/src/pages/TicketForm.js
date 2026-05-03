import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ticketsAPI, categoriesAPI } from '../api';
import toast from 'react-hot-toast';

const TicketForm = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'incident',
    priority: '3',
    impact: '2',
    urgency: '2',
    category: '',
    group: '',
    due_date: '',
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.all().then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => ticketsAPI.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['tickets']);
      toast.success('Ticket created successfully');
      navigate(`/tickets/${response.data.id}`);
    },
    onError: () => {
      toast.error('Failed to create ticket');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      category: formData.category ? parseInt(formData.category) : null,
      due_date: formData.due_date || null,
    };
    createMutation.mutate(payload);
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/tickets')}>
          <ArrowLeft size={16} />
          Back to Tickets
        </button>
      </div>

      <div className="page-header">
        <div>
          <h1>Create New Ticket</h1>
          <p>Submit a new service ticket</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input
                type="text"
                className="form-input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Brief description of the issue"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea
                className="form-textarea"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed description of the issue or request..."
                rows={6}
                required
              />
            </div>

            <div className="form-row-3">
              <div className="form-group">
                <label className="form-label">Type</label>
                <select
                  className="form-select"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="incident">Incident</option>
                  <option value="service_request">Service Request</option>
                  <option value="problem">Problem</option>
                  <option value="task">Task</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Priority</label>
                <select
                  className="form-select"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="4">Low</option>
                  <option value="3">Medium</option>
                  <option value="2">High</option>
                  <option value="1">Critical</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="">Select category</option>
                  {categories?.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Impact</label>
                <select
                  className="form-select"
                  value={formData.impact}
                  onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
                >
                  <option value="3">Low</option>
                  <option value="2">Medium</option>
                  <option value="1">High</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Urgency</label>
                <select
                  className="form-select"
                  value={formData.urgency}
                  onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                >
                  <option value="3">Low</option>
                  <option value="2">Medium</option>
                  <option value="1">High</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Assignment Group</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.group}
                  onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                  placeholder="e.g., IT Support, Network Team"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Ticket'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/tickets')}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TicketForm;
