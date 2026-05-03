import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, User, Calendar, Flag, Tag, MessageSquare, 
  Paperclip, Clock, CheckCircle, XCircle, RefreshCw
} from 'lucide-react';
import { ticketsAPI, commentsAPI, usersAPI } from '../api';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const priorityLabels = { '1': 'Critical', '2': 'High', '3': 'Medium', '4': 'Low' };
const typeLabels = { 'incident': 'Incident', 'service_request': 'Service Request', 'problem': 'Problem', 'change': 'Change', 'task': 'Task' };

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isTechnician } = useAuth();
  
  const [comment, setComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolution, setResolution] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState(null);

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketsAPI.get(id).then(r => r.data),
  });

  const { data: technicians } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => usersAPI.technicians().then(r => r.data),
  });

  const assignMutation = useMutation({
    mutationFn: (userId) => ticketsAPI.assign(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['ticket', id]);
      toast.success('Ticket assigned');
      setSelectedAssignee(null);
    },
  });

  const commentMutation = useMutation({
    mutationFn: (data) => commentsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['ticket', id]);
      setComment('');
      toast.success('Comment added');
    },
  });

  const resolveMutation = useMutation({
    mutationFn: (data) => ticketsAPI.resolve(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['ticket', id]);
      setShowResolveModal(false);
      setResolution('');
      toast.success('Ticket resolved');
    },
  });

  const closeMutation = useMutation({
    mutationFn: () => ticketsAPI.close(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['ticket', id]);
      toast.success('Ticket closed');
    },
  });

  const reopenMutation = useMutation({
    mutationFn: () => ticketsAPI.reopen(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['ticket', id]);
      toast.success('Ticket reopened');
    },
  });

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    commentMutation.mutate({ ticket: parseInt(id), body: comment, is_internal: isInternal });
  };

  const handleResolve = () => {
    resolveMutation.mutate({ resolution, resolution_code: 'Solved' });
  };

  if (isLoading) {
    return <div className="loading"><div className="spinner" /></div>;
  }

  if (!ticket) {
    return <div className="empty-state"><h3>Ticket not found</h3></div>;
  }

  const isActive = ['new', 'in_progress', 'on_hold'].includes(ticket.status);

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/tickets')}>
          <ArrowLeft size={16} />
          Back to Tickets
        </button>
      </div>

      <div className="ticket-detail-header">
        <div className="ticket-detail-title" style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{ color: 'var(--gray-500)', fontSize: '14px' }}>{ticket.ticket_number}</span>
            <span className={`badge badge-${ticket.status}`}>{ticket.status.replace('_', ' ')}</span>
            <span className={`badge badge-${priorityLabels[ticket.priority]?.toLowerCase()}`}>{priorityLabels[ticket.priority]}</span>
          </div>
          <h1>{ticket.title}</h1>
          <div className="ticket-meta">
            <div className="ticket-meta-item">
              <User size={16} />
              <span>{ticket.created_by?.full_name || 'Unknown'}</span>
            </div>
            <div className="ticket-meta-item">
              <Calendar size={16} />
              <span>{format(new Date(ticket.created_at), 'MMM d, yyyy HH:mm')}</span>
            </div>
            {ticket.assigned_to && (
              <div className="ticket-meta-item">
                <User size={16} />
                <span>Assigned to {ticket.assigned_to.full_name}</span>
              </div>
            )}
          </div>
        </div>
        
        {isTechnician && (
          <div className="action-bar">
            {isActive && (
              <>
                <button className="btn btn-success btn-sm" onClick={() => setShowResolveModal(true)}>
                  <CheckCircle size={16} />
                  Resolve
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => closeMutation.mutate()}>
                  <XCircle size={16} />
                  Close
                </button>
              </>
            )}
            {ticket.status === 'resolved' && (
              <button className="btn btn-secondary btn-sm" onClick={() => reopenMutation.mutate()}>
                <RefreshCw size={16} />
                Reopen
              </button>
            )}
          </div>
        )}
      </div>

      <div className="ticket-detail-grid">
        <div>
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-header">
              <h3>Description</h3>
            </div>
            <div className="card-body">
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>{ticket.description}</p>
            </div>
          </div>

          {ticket.resolution && (
            <div className="card" style={{ marginBottom: '20px' }}>
              <div className="card-header">
                <h3>Resolution</h3>
              </div>
              <div className="card-body">
                <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>{ticket.resolution}</p>
              </div>
            </div>
          )}

          <div className="card comment-section">
            <div className="card-header">
              <h3>
                <MessageSquare size={18} style={{ display: 'inline', marginRight: '8px' }} />
                Comments ({ticket.comments?.length || 0})
              </h3>
            </div>
            
            <div>
              {ticket.comments?.map(c => (
                <div key={c.id} className="comment-item">
                  <div className="comment-header">
                    <span className="comment-author">{c.author?.full_name || 'Unknown'}</span>
                    <span className="comment-time">
                      {formatDistanceToNow(new Date(c.created_at))} ago
                      {c.is_internal && <span className="badge badge-on_hold" style={{ marginLeft: '8px' }}>Internal</span>}
                    </span>
                  </div>
                  <div className="comment-body">{c.body}</div>
                </div>
              ))}
              {(!ticket.comments?.length) && (
                <p style={{ textAlign: 'center', padding: '30px', color: 'var(--gray-500)' }}>
                  No comments yet
                </p>
              )}
            </div>

            {isActive && (
              <form className="comment-form" onSubmit={handleAddComment}>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                />
                <div className="comment-form-actions">
                  <label>
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                    />
                    Internal note
                  </label>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={!comment.trim()}>
                    Post Comment
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <div>
          <div className="ticket-sidebar-card">
            <h3>Details</h3>
            <div className="ticket-sidebar-content">
              <div className="ticket-sidebar-item">
                <div className="ticket-sidebar-label">Type</div>
                <div className="ticket-sidebar-value">{typeLabels[ticket.type]}</div>
              </div>
              <div className="ticket-sidebar-item">
                <div className="ticket-sidebar-label">Priority</div>
                <div className="ticket-sidebar-value">
                  <span className={`badge badge-${priorityLabels[ticket.priority]?.toLowerCase()}`}>
                    {priorityLabels[ticket.priority]}
                  </span>
                </div>
              </div>
              <div className="ticket-sidebar-item">
                <div className="ticket-sidebar-label">Impact</div>
                <div className="ticket-sidebar-value">{{ '1': 'High', '2': 'Medium', '3': 'Low' }[ticket.impact]}</div>
              </div>
              <div className="ticket-sidebar-item">
                <div className="ticket-sidebar-label">Urgency</div>
                <div className="ticket-sidebar-value">{{ '1': 'High', '2': 'Medium', '3': 'Low' }[ticket.urgency]}</div>
              </div>
              {ticket.category && (
                <div className="ticket-sidebar-item">
                  <div className="ticket-sidebar-label">Category</div>
                  <div className="ticket-sidebar-value">{ticket.category.name}</div>
                </div>
              )}
              {ticket.group && (
                <div className="ticket-sidebar-item">
                  <div className="ticket-sidebar-label">Group</div>
                  <div className="ticket-sidebar-value">{ticket.group}</div>
                </div>
              )}
              {ticket.due_date && (
                <div className="ticket-sidebar-item">
                  <div className="ticket-sidebar-label">Due Date</div>
                  <div className="ticket-sidebar-value">{format(new Date(ticket.due_date), 'MMM d, yyyy')}</div>
                </div>
              )}
            </div>
          </div>

          <div className="ticket-sidebar-card">
            <h3>Assignment</h3>
            <div className="ticket-sidebar-content">
              <div className="ticket-sidebar-item">
                <div className="ticket-sidebar-label">Assigned To</div>
                <div className="ticket-sidebar-value">
                  {ticket.assigned_to?.full_name || 'Unassigned'}
                </div>
              </div>
              <div className="ticket-sidebar-item">
                <div className="ticket-sidebar-label">Created By</div>
                <div className="ticket-sidebar-value">{ticket.created_by?.full_name}</div>
              </div>
              {isTechnician && (
                <div style={{ marginTop: '12px' }}>
                  <select
                    className="form-select"
                    value={selectedAssignee || ticket.assigned_to?.id || ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        assignMutation.mutate(parseInt(e.target.value));
                      }
                    }}
                  >
                    <option value="">Reassign to...</option>
                    {technicians?.map(t => (
                      <option key={t.id} value={t.id}>{t.full_name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {ticket.resolved_at && (
            <div className="ticket-sidebar-card">
              <h3>Timeline</h3>
              <div className="ticket-sidebar-content">
                <div className="ticket-sidebar-item">
                  <div className="ticket-sidebar-label">Resolved At</div>
                  <div className="ticket-sidebar-value">{format(new Date(ticket.resolved_at), 'MMM d, yyyy HH:mm')}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showResolveModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Resolve Ticket</h2>
              <button className="btn-icon" onClick={() => setShowResolveModal(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Resolution</label>
                <textarea
                  className="form-textarea"
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Describe how the issue was resolved..."
                  rows={4}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowResolveModal(false)}>Cancel</button>
              <button className="btn btn-success" onClick={handleResolve}>Resolve Ticket</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketDetail;
