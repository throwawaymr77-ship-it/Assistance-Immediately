import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, BookOpen, Eye, ThumbsUp, ThumbsDown, Search, Filter } from 'lucide-react';
import { knowledgeBaseAPI } from '../api';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const KnowledgeBase = () => {
  const queryClient = useQueryClient();
  const { isAdmin, isManager } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newArticle, setNewArticle] = useState({ title: '', content: '', summary: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['knowledge-base', searchQuery, statusFilter],
    queryFn: () => knowledgeBaseAPI.list({ 
      search: searchQuery || undefined,
      status: statusFilter || undefined
    }).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => knowledgeBaseAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['knowledge-base']);
      setShowCreateModal(false);
      setNewArticle({ title: '', content: '', summary: '' });
      toast.success('Article created');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => knowledgeBaseAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['knowledge-base']);
      toast.success('Article deleted');
    },
  });

  const handleCreate = (e) => {
    e.preventDefault();
    createMutation.mutate(newArticle);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Knowledge Base</h1>
          <p>Browse articles and documentation</p>
        </div>
        {(isAdmin || isManager) && (
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} />
            New Article
          </button>
        )}
      </div>

      <div className="filters-bar">
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '36px' }}
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Articles</option>
          <option value="published">Published</option>
          {(isAdmin || isManager) && <option value="draft">Draft</option>}
          {(isAdmin || isManager) && <option value="review">Under Review</option>}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {data?.results?.map(article => (
          <div key={article.id} className="card" style={{ transition: 'transform 0.2s, box-shadow 0.2s' }}>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span className={`badge badge-${article.status}`}>{article.status}</span>
                {article.category_name && (
                  <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{article.category_name}</span>
                )}
              </div>
              <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>
                <Link to={`/knowledge-base/${article.id}`} className="ticket-link">
                  {article.title}
                </Link>
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--gray-600)', marginBottom: '16px', lineHeight: '1.5' }}>
                {article.summary}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: 'var(--gray-500)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Eye size={14} /> {article.views}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ThumbsUp size={14} /> {article.is_helpful_yes}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ThumbsDown size={14} /> {article.is_helpful_no}
                  </span>
                </div>
                <span>{formatDistanceToNow(new Date(article.updated_at))} ago</span>
              </div>
              {(isAdmin || isManager) && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--gray-100)' }}>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteMutation.mutate(article.id)}>
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {(!data?.results?.length) && !isLoading && (
        <div className="empty-state">
          <BookOpen size={64} />
          <h3>No articles found</h3>
          <p>{(isAdmin || isManager) ? 'Create the first knowledge base article' : 'No articles available yet'}</p>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2>Create Article</h2>
              <button className="btn-icon" onClick={() => setShowCreateModal(false)}>X</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newArticle.title}
                    onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Summary</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newArticle.summary}
                    onChange={(e) => setNewArticle({ ...newArticle, summary: e.target.value })}
                    placeholder="Brief summary of the article"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Content *</label>
                  <textarea
                    className="form-textarea"
                    value={newArticle.content}
                    onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                    rows={8}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Article</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
