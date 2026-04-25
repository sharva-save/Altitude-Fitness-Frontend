import React,{ useEffect, useState, useCallback } from 'react';
import api from '../../utils/api';
import { format, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';
import { AddMemberModal, EditMemberModal, RenewModal } from './Memberform';
import MemberDetailModal from './MemberDetailModal';

export default function MemberList() {
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTrainer, setFilterTrainer] = useState('');
  const [filterActive, setFilterActive] = useState('true');
  const [modal, setModal] = useState(null); // null | 'add' | 'edit' | 'renew' | 'detail'
  const [selected, setSelected] = useState(null);

  const fetchMembers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterTrainer !== '') params.set('hasTrainer', filterTrainer);
      if (filterActive !== '') params.set('isActive', filterActive);
      const res = await api.get(`/members?${params}`);
      if (res.data.success) {
        setMembers(res.data.members);
        setStats(res.data.stats || {});
      }
    } catch {
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [search, filterTrainer, filterActive]);

  useEffect(() => {
    const delay = setTimeout(fetchMembers, 300);
    return () => clearTimeout(delay);
  }, [fetchMembers]);

  const openModal = (type, member = null) => {
    setSelected(member);
    setModal(type);
  };
  const closeModal = () => { setModal(null); setSelected(null); };

  const handleSuccess = (updated) => {
    closeModal();
    fetchMembers();
  };

  const getRowClass = (m) => {
    if (m.hasPersonalTrainer) return 'row-trainer';
    const days = differenceInDays(new Date(m.nextDueDate), new Date());
    if (days <= 1) return 'row-expiring-1';
    if (days <= 2) return 'row-expiring-2';
    return '';
  };

  const getDaysTag = (nextDueDate) => {
    const days = differenceInDays(new Date(nextDueDate), new Date());
    if (days < 0) return <span className="badge badge-red">Expired {Math.abs(days)}d ago</span>;
    if (days === 0) return <span className="badge badge-red">Expires Today!</span>;
    if (days <= 2) return <span className="badge badge-red">{days}d left ⚠️</span>;
    if (days <= 7) return <span className="badge badge-orange">{days}d left</span>;
    return <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{format(new Date(nextDueDate), 'dd MMM yyyy')}</span>;
  };

  if (loading) return (
    <div className="loading-page">
      <div className="loading-spinner" />
      <p style={{ color: 'var(--text-muted)' }}>Loading members...</p>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">ALL MEMBERS</h1>
          <p className="page-subtitle">
            {stats.total ?? 0} total · {stats.active ?? 0} active · {stats.withTrainer ?? 0} with PT
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal('add')}>➕ Add Member</button>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
          <div style={{ width: 14, height: 14, background: 'rgba(124,58,237,0.15)', borderRadius: 3, border: '1px solid #7c3aed' }} />
          Personal Trainer Members
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
          <div style={{ width: 14, height: 14, background: 'rgba(255,68,68,0.08)', borderRadius: 3, border: '1px solid rgba(255,68,68,0.2)' }} />
          Expiring in 1 day
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
          <div style={{ width: 14, height: 14, background: 'rgba(255,170,0,0.08)', borderRadius: 3, border: '1px solid rgba(255,170,0,0.2)' }} />
          Expiring in 2 days
        </div>
      </div>

      <div className="table-wrapper">
        <div className="table-header">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <select className="input-field" style={{ width: 'auto', padding: '8px 12px', fontSize: 13 }}
              value={filterActive} onChange={e => setFilterActive(e.target.value)}>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
              <option value="">All Members</option>
            </select>
            <select className="input-field" style={{ width: 'auto', padding: '8px 12px', fontSize: 13 }}
              value={filterTrainer} onChange={e => setFilterTrainer(e.target.value)}>
              <option value="">All Members</option>
              <option value="true">With Trainer 🏋️</option>
              <option value="false">No Trainer</option>
            </select>
          </div>
        </div>

        {members.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <h3>No members found</h3>
            <p style={{ fontSize: 14, marginTop: 8 }}>Try a different search or add a new member</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Contact</th>
                  <th>Body Stats</th>
                  <th>Plan</th>
                  <th>Next Due</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m._id} className={getRowClass(m)}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</div>
                      {m.hasPersonalTrainer && (
                        <div style={{ marginTop: 4 }}>
                          <span className="trainer-tag">🏋️ {m.personalTrainerName || 'PT'}</span>
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{m.email}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{m.phone}</div>
                    </td>
                    <td>
                      {m.weight || m.height ? (
                        <div style={{ fontSize: 13 }}>
                          {m.weight && <span style={{ color: 'var(--text-secondary)' }}>{m.weight}kg</span>}
                          {m.weight && m.height && <span style={{ color: 'var(--text-muted)' }}> · </span>}
                          {m.height && <span style={{ color: 'var(--text-secondary)' }}>{m.height}cm</span>}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td><span className="badge badge-blue">{m.subscriptionType}M</span></td>
                    <td>{getDaysTag(m.nextDueDate)}</td>
                    <td>
                      <div style={{ fontSize: 13 }}>
                        <span className="badge badge-gray">{m.paymentType}</span>
                      </div>
                      {m.feeAmount > 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>₹{m.feeAmount}</div>}
                    </td>
                    <td>
                      <span className={`badge ${m.isActive ? 'badge-green' : 'badge-red'}`}>
                        {m.isActive ? '● Active' : '● Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" title="View Details" onClick={() => openModal('detail', m)}>👁</button>
                        <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => openModal('edit', m)}>✏️</button>
                        <button className="btn btn-primary btn-sm" title="Renew" onClick={() => openModal('renew', m)}>🔄</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal === 'add' && <AddMemberModal onClose={closeModal} onSuccess={handleSuccess} />}
      {modal === 'edit' && selected && <EditMemberModal member={selected} onClose={closeModal} onSuccess={handleSuccess} />}
      {modal === 'renew' && selected && <RenewModal member={selected} onClose={closeModal} onSuccess={handleSuccess} />}
      {modal === 'detail' && selected && <MemberDetailModal member={selected} onClose={closeModal} onRenew={() => { closeModal(); openModal('renew', selected); }} />}
    </div>
  );
}
