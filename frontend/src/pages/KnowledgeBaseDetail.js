import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ThumbsUp, ThumbsDown, Eye } from 'lucide-react';
import { knowledgeBaseAPI } from '../api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const KnowledgeBaseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin, isManager } = useAuth();
  const [rating, setRating] = useState(null);

  const { data: article, isLoading } = useQuery({
    queryKey: ['knowledge-base', id],
    queryFn: () => knowledgeBaseAPI.get(id).then(r => r.data),
  });

  const rateMutation = useMutation({
    mutationFn: (helpful) => knowledgeBaseAPI.rate(id, helpful),
    onSuccess: () => {
      queryClient.invalidateQueries(['knowledge-base', id]);
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => knowledgeBaseAPI.publish(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['knowledge-base', id]);
      toast.success('Article published');
    },
  });

  const handleRate = (helpful) => {
    setRating(helpful);
    rateMutation.mutate(helpful);
  };

  if (isLoading) {
    return <div className="loading"><div className="spinner" /></div>;
  }

  if (!article) {
    return <div className="empty-state"><h3>Article not found</h3></div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/knowledge-base')}>
          <ArrowLeft size={16} />
          Back to Knowledge Base
        </button>
      </div>

      <div className="card">
        <div className="card-body" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span className={`badge badge-${article.status}`}>{article.status}</span>
            <span style={{ fontSize: '13px', color: 'var(--gray-500)' }}>
              By {article.author?.full_name} | {format(new Date(article.created_at), 'MMM d, yyyy')}
            </span>
          </div>

          <h1 style={{ fontSize: '28px', marginBottom: '24px', lineHeight: '1.3' }}>{article.title}</h1>

          {article.summary && (
            <p style={{ fontSize: '18px', color: 'var(--gray-600)', marginBottom: '32px', lineHeight: '1.6' }}>
              {article.summary}
            </p>
          )}

          <div className="kb-content" style={{ lineHeight: '1.8', fontSize: '15px' }}>
            {article.content.split('\n').map((paragraph, idx) => (
              <p key={idx} style={{ marginBottom: '16px' }}>{paragraph}</p>
            ))}
          </div>

          <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid var(--gray-200)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '14px', color: 'var(--gray-500)', marginBottom: '8px' }}>
                  Was this article helpful?
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className={`btn ${rating === true ? 'btn-success' : 'btn-secondary'} btn-sm`}
                    onClick={() => handleRate(true)}
                    disabled={rating !== null}
                  >
                    <ThumbsUp size={16} /> Yes ({article.is_helpful_yes})
                  </button>
                  <button
                    className={`btn ${rating === false ? 'btn-danger' : 'btn-secondary'} btn-sm`}
                    onClick={() => handleRate(false)}
                    disabled={rating !== null}
                  >
                    <ThumbsDown size={16} /> No ({article.is_helpful_no})
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--gray-400)', fontSize: '13px' }}>
                <Eye size={14} /> {article.views} views
              </div>
            </div>
          </div>

          {(isAdmin || isManager) && article.status !== 'published' && (
            <div style={{ marginTop: '24px' }}>
              <button className="btn btn-primary" onClick={() => publishMutation.mutate()}>
                Publish Article
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBaseDetail;
