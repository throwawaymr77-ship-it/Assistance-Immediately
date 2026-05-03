import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users as UsersIcon, Plus, Search } from 'lucide-react';
import { usersAPI } from '../api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const UsersPage = () => {
  const queryClient = useQueryClient();
  const { isAdmin, isManager } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '', email: '', first_name: '', last_name: '', password: '', role: 'end_user', department: '', phone: ''
  });

  const { data, isLoading } = useQuery({
    queryKey: ['users', searchQuery],
    queryFn: () => usersAPI.list({ search: searchQuery || undefined }).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => usersAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setShowCreateModal(false);
      setNewUser({ username: '', email: '', first_name: '', last_name: '', password: '', role: 'end_user', department: '', phone: '' });
      toast.success('User created');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }) => usersAPI.update(id, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('User role updated');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }) => usersAPI.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('User status updated');
    },
  });

  const handleCreate = (e) => {
    e.preventDefault();
    createMutation.mutate(newUser);
  };

  const roleLabels = { admin: 'Admin', manager: 'Manager', technician: 'Technician', end_user: 'End User' };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Users</h1>
          <p>Manage system users and permissions</p>
        </div>
        {(isAdmin || isManager) && (
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} />
            Add User
          </button>
        )}
      </div>

      <div className="filters-bar">
        <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '36px' }}
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {data?.results?.map(user => (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="user-avatar" style={{ width: '36px', height: '36px', fontSize: '14px' }}>
                        {(user.first_name?.[0] || user.email?.[0] || '?').toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{user.full_name || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    {(isAdmin || isManager) ? (
                      <select
                        className="filter-select"
                        value={user.role}
                        onChange={(e) => updateRoleMutation.mutate({ id: user.id, role: e.target.value })}
                      >
                        <option value="end_user">End User</option>
                        <option value="technician">Technician</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className={`badge badge-${user.role === 'admin' ? 'cancelled' : user.role === 'manager' ? 'on_hold' : 'new'}`}>
                        {roleLabels[user.role]}
                      </span>
                    )}
                  </td>
                  <td>{user.department || '-'}</td>
                  <td>
                    {isAdmin && (
                      <button
                        className={`btn ${user.is_active ? 'btn-secondary' : 'btn-success'} btn-sm`}
                        onClick={() => toggleActiveMutation.mutate({ id: user.id, is_active: !user.is_active })}
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </button>
                    )}
                    {!isAdmin && (
                      <span className={`badge badge-${user.is_active ? 'resolved' : 'cancelled'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    )}
                  </td>
                  {isAdmin && <td>-</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!data?.results?.length) && !isLoading && (
          <div className="empty-state">
            <UsersIcon size={64} />
            <h3>No users found</h3>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Add User</h2>
              <button className="btn-icon" onClick={() => setShowCreateModal(false)}>X</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Username *</label>
                    <input type="text" className="form-input" value={newUser.username} onChange={(e) => setNewUser({...newUser, username: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input type="email" className="form-input" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">First Name</label>
                    <input type="text" className="form-input" value={newUser.first_name} onChange={(e) => setNewUser({...newUser, first_name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <input type="text" className="form-input" value={newUser.last_name} onChange={(e) => setNewUser({...newUser, last_name: e.target.value})} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Password *</label>
                    <input type="password" className="form-input" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select className="form-select" value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})}>
                      <option value="end_user">End User</option>
                      <option value="technician">Technician</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select className="form-select" value={newUser.department} onChange={(e) => setNewUser({...newUser, department: e.target.value})}>
                      <option value="">Select department</option>
                      <option value="IT">Information Technology</option>
                      <option value="HR">Human Resources</option>
                      <option value="Finance">Finance</option>
                      <option value="Operations">Operations</option>
                      <option value="Sales">Sales</option>
                      <option value="Marketing">Marketing</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input type="text" className="form-input" value={newUser.phone} onChange={(e) => setNewUser({...newUser, phone: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
