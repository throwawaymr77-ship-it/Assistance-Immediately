import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditLogAPI } from '../api';
import { formatDistanceToNow, format } from 'date-fns';

const AuditLogs = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => auditLogAPI.list().then(r => r.data),
  });

  const actionIcons = {
    create: '+',
    update: '~',
    delete: '-',
    assign: '->',
    status_change: '>>',
    comment: '#',
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Audit Logs</h1>
          <p>System activity and change tracking</p>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Model</th>
                <th>Object ID</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {data?.results?.map(log => (
                <tr key={log.id}>
                  <td style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>
                    {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="user-avatar" style={{ width: '28px', height: '28px', fontSize: '11px' }}>
                        {log.user?.full_name?.[0] || '?'}
                      </div>
                      {log.user?.full_name || 'System'}
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${log.action === 'create' ? 'resolved' : log.action === 'delete' ? 'cancelled' : 'on_hold'}`}>
                      {log.action.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{log.model_name}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>#{log.object_id}</td>
                  <td style={{ fontSize: '13px', color: 'var(--gray-600)' }}>{log.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!data?.results?.length) && !isLoading && (
          <div className="empty-state">
            <h3>No audit logs</h3>
            <p>Activity will be logged here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
