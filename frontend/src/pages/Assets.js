import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HardDrive, Plus, Search } from 'lucide-react';
import { assetsAPI } from '../api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const Assets = () => {
  const queryClient = useQueryClient();
  const { isAdmin, isManager } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAsset, setNewAsset] = useState({
    name: '', asset_tag: '', type: 'hardware', manufacturer: '', model: '', serial_number: '', location: '', notes: ''
  });

  const { data, isLoading } = useQuery({
    queryKey: ['assets', searchQuery, statusFilter, typeFilter],
    queryFn: () => assetsAPI.list({
      search: searchQuery || undefined,
      status: statusFilter || undefined,
      type: typeFilter || undefined,
    }).then(r => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['asset-stats'],
    queryFn: () => assetsAPI.statistics().then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => assetsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['assets']);
      setShowCreateModal(false);
      setNewAsset({ name: '', asset_tag: '', type: 'hardware', manufacturer: '', model: '', serial_number: '', location: '', notes: '' });
      toast.success('Asset created');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => assetsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['assets']);
      toast.success('Asset deleted');
    },
  });

  const handleCreate = (e) => {
    e.preventDefault();
    createMutation.mutate(newAsset);
  };

  const statusLabels = { in_use: 'In Use', in_stock: 'In Stock', maintenance: 'Maintenance', retired: 'Retired', disposed: 'Disposed' };
  const typeLabels = { hardware: 'Hardware', software: 'Software', license: 'License', network: 'Network', other: 'Other' };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Assets</h1>
          <p>Manage IT assets and inventory</p>
        </div>
        {(isAdmin || isManager) && (
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} />
            Add Asset
          </button>
        )}
      </div>

      {stats && (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="stat-card">
            <div className="stat-card-title">Total Assets</div>
            <div className="stat-card-value">{stats.total}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-title">In Use</div>
            <div className="stat-card-value">{stats.in_use}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-title">In Stock</div>
            <div className="stat-card-value">{stats.by_status?.find(s => s.status === 'in_stock')?.count || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-title">Types</div>
            <div className="stat-card-value">{stats.by_type?.length || 0}</div>
          </div>
        </div>
      )}

      <div className="filters-bar">
        <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '36px' }}
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {Object.entries(statusLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select className="filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          {Object.entries(typeLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Asset Tag</th>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {data?.results?.map(asset => (
                <tr key={asset.id}>
                  <td><span style={{ fontFamily: 'monospace', fontWeight: 500 }}>{asset.asset_tag}</span></td>
                  <td>{asset.name}</td>
                  <td>{typeLabels[asset.type]}</td>
                  <td><span className={`badge badge-${asset.status === 'in_use' ? 'new' : asset.status === 'in_stock' ? 'resolved' : 'on_hold'}`}>{statusLabels[asset.status]}</span></td>
                  <td>{asset.assigned_to?.full_name || '-'}</td>
                  <td>{asset.location || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!data?.results?.length) && !isLoading && (
          <div className="empty-state">
            <HardDrive size={64} />
            <h3>No assets found</h3>
            <p>Add your first asset to get started</p>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>Add Asset</h2>
              <button className="btn-icon" onClick={() => setShowCreateModal(false)}>X</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Asset Tag *</label>
                    <input type="text" className="form-input" value={newAsset.asset_tag} onChange={(e) => setNewAsset({...newAsset, asset_tag: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Name *</label>
                    <input type="text" className="form-input" value={newAsset.name} onChange={(e) => setNewAsset({...newAsset, name: e.target.value})} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select className="form-select" value={newAsset.type} onChange={(e) => setNewAsset({...newAsset, type: e.target.value})}>
                      <option value="hardware">Hardware</option>
                      <option value="software">Software</option>
                      <option value="license">License</option>
                      <option value="network">Network</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Manufacturer</label>
                    <input type="text" className="form-input" value={newAsset.manufacturer} onChange={(e) => setNewAsset({...newAsset, manufacturer: e.target.value})} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Model</label>
                    <input type="text" className="form-input" value={newAsset.model} onChange={(e) => setNewAsset({...newAsset, model: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Serial Number</label>
                    <input type="text" className="form-input" value={newAsset.serial_number} onChange={(e) => setNewAsset({...newAsset, serial_number: e.target.value})} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input type="text" className="form-input" value={newAsset.location} onChange={(e) => setNewAsset({...newAsset, location: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Asset</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assets;
