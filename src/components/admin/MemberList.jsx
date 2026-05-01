import React, { useEffect, useState, useCallback } from 'react';
import api from '../../utils/api';
import { format, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';
import { AddMemberModal, EditMemberModal, RenewModal } from './Memberform';
import MemberDetailModal from './Memberdetailmodal';


const CSS = `
  /* Header */
  .ml-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 20px;
  }

  /* Legend */
  .ml-legend {
    display: flex;
    gap: 16px;
    margin-bottom: 18px;
    flex-wrap: wrap;
  }

  /* Filter row inside table-header */
  .ml-filter-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
  }
  .ml-filter-row select {
    width: auto !important;
    flex: 1;
    min-width: 130px;
  }

  /* Desktop table (default) */
  .ml-desktop-table { display: block; }
  .ml-mobile-cards  { display: none;  }

  /* ── Mobile ── */
  @media (max-width: 720px) {
    .ml-header { flex-direction: column; gap: 12px; }
    .ml-header .btn-primary { width: 100%; text-align: center; }

    .ml-legend { gap: 10px; }
    .ml-legend-item { font-size: 11px !important; }

    /* table → cards */
    .ml-desktop-table { display: none; }
    .ml-mobile-cards  { display: flex; flex-direction: column; gap: 10px; }

    /* Search + filters stack */
    .table-header {
      flex-direction: column !important;
      align-items: stretch !important;
      gap: 10px !important;
    }
    .search-bar { width: 100% !important; }
    .ml-filter-row { width: 100%; }
    .ml-filter-row select { min-width: 0; }

    .ml-page-title { font-size: 20px !important; }
    .ml-page-sub   { font-size: 11px !important; }
  }

  /* ── Member card ── */
  .ml-card {
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
  }
  .ml-card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 12px 14px 10px;
    gap: 8px;
  }
  .ml-card-name {
    font-weight: 700;
    font-size: 14px;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ml-card-email {
    font-size: 12px;
    color: var(--text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-top: 2px;
  }
  .ml-card-meta {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    border-top: 1px solid var(--border);
  }
  .ml-card-meta-cell {
    padding: 9px 12px;
    display: flex;
    flex-direction: column;
    gap: 3px;
    border-right: 1px solid var(--border);
  }
  .ml-card-meta-cell:last-child { border-right: none; }
  .ml-card-meta-label {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--text-muted);
  }
  .ml-card-meta-value {
    font-size: 12px;
    color: var(--text-secondary);
  }
  .ml-card-actions {
    display: flex;
    gap: 0;
    border-top: 1px solid var(--border);
  }
  .ml-card-action-btn {
    flex: 1;
    padding: 10px 0;
    background: none;
    border: none;
    border-right: 1px solid var(--border);
    color: var(--text-muted);
    cursor: pointer;
    font-size: 16px;
    transition: background 0.15s;
  }
  .ml-card-action-btn:last-child { border-right: none; }
  .ml-card-action-btn:hover { background: var(--bg-hover); }
  .ml-card-action-btn.renew {
    color: var(--accent-blue);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  /* Row tint classes for cards */
  .ml-card.row-trainer {
    border-left: 3px solid #7c3aed;
    background: rgba(124,58,237,0.04);
  }
  .ml-card.row-expiring-1 {
    border-left: 3px solid var(--accent-red);
    background: rgba(255,68,68,0.04);
  }
  .ml-card.row-expiring-2 {
    border-left: 3px solid #f59e0b;
    background: rgba(255,170,0,0.04);
  }
`;

if (typeof document !== 'undefined' && !document.getElementById('memberlist-styles')) {
  const s = document.createElement('style');
  s.id = 'memberlist-styles';
  s.textContent = CSS;
  document.head.appendChild(s);
}

/* ── Helpers ── */
const getRowClass = (m) => {
  if (m.hasPersonalTrainer) return 'row-trainer';
  const days = differenceInDays(new Date(m.nextDueDate), new Date());
  if (days <= 1) return 'row-expiring-1';
  if (days <= 2) return 'row-expiring-2';
  return '';
};

const getDaysTag = (nextDueDate) => {
  const days = differenceInDays(new Date(nextDueDate), new Date());
  if (days < 0)   return <span className="badge badge-red">Expired {Math.abs(days)}d ago</span>;
  if (days === 0) return <span className="badge badge-red">Today!</span>;
  if (days <= 2)  return <span className="badge badge-red">{days}d ⚠️</span>;
  if (days <= 7)  return <span className="badge badge-orange">{days}d left</span>;
  return <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{format(new Date(nextDueDate), 'dd MMM yy')}</span>;
};

/* ── Component ── */
export default function MemberList() {
  const [members, setMembers]           = useState([]);
  const [stats, setStats]               = useState({});
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [filterTrainer, setFilterTrainer] = useState('');
  const [filterActive, setFilterActive] = useState('true');
  const [modal, setModal]               = useState(null);
  const [selected, setSelected]         = useState(null);

  const fetchMembers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search)        params.set('search', search);
      if (filterTrainer !== '') params.set('hasTrainer', filterTrainer);
      if (filterActive  !== '') params.set('isActive',  filterActive);
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

  const openModal  = (type, member = null) => { setSelected(member); setModal(type); };
  const closeModal = () => { setModal(null); setSelected(null); };
  const handleSuccess = () => { closeModal(); fetchMembers(); };

  if (loading) return (
    <div className="loading-page">
      <div className="loading-spinner" />
      <p style={{ color: 'var(--text-muted)' }}>Loading members...</p>
    </div>
  );

  return (
    <div>
      {/* ── Header ── */}
      <div className="ml-header">
        <div style={{ minWidth: 0 }}>
          <h1 className="page-title ml-page-title">ALL MEMBERS</h1>
          <p className="page-subtitle ml-page-sub">
            {stats.total ?? 0} total · {stats.active ?? 0} active · {stats.withTrainer ?? 0} with PT
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal('add')}>
          ➕ Add Member
        </button>
      </div>

      {/* ── Legend ── */}
      <div className="ml-legend">
        {[
          { bg: 'rgba(124,58,237,0.15)', border: '#7c3aed', label: 'Personal Trainer' },
          { bg: 'rgba(255,68,68,0.08)',  border: 'rgba(255,68,68,0.2)', label: 'Expires in 1d' },
          { bg: 'rgba(255,170,0,0.08)', border: 'rgba(255,170,0,0.2)', label: 'Expires in 2d' },
        ].map(({ bg, border, label }) => (
          <div key={label} className="ml-legend-item" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
            <div style={{ width: 12, height: 12, background: bg, borderRadius: 3, border: `1px solid ${border}`, flexShrink: 0 }} />
            {label}
          </div>
        ))}
      </div>

      {/* ── Table wrapper ── */}
      <div className="table-wrapper">
        {/* Search + filters */}
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
          <div className="ml-filter-row">
            <select
              className="input-field"
              style={{ padding: '8px 12px', fontSize: 13 }}
              value={filterActive}
              onChange={e => setFilterActive(e.target.value)}
            >
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
              <option value="">All Members</option>
            </select>
            <select
              className="input-field"
              style={{ padding: '8px 12px', fontSize: 13 }}
              value={filterTrainer}
              onChange={e => setFilterTrainer(e.target.value)}
            >
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
          <>
            {/* ── Desktop Table ── */}
            <div className="ml-desktop-table" style={{ overflowX: 'auto' }}>
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
                        <div style={{ fontSize: 13 }}>{m.email}</div>
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
                        <span className="badge badge-gray">{m.paymentType}</span>
                        {m.feeAmount > 0 && (
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>₹{m.feeAmount}</div>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${m.isActive ? 'badge-green' : 'badge-red'}`}>
                          {m.isActive ? '● Active' : '● Inactive'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-sm" title="View" onClick={() => openModal('detail', m)}>👁</button>
                          <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => openModal('edit', m)}>✏️</button>
                          <button className="btn btn-primary btn-sm" title="Renew" onClick={() => openModal('renew', m)}>🔄</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Mobile Cards ── */}
            <div className="ml-mobile-cards">
              {members.map(m => (
                <div key={m._id} className={`ml-card ${getRowClass(m)}`}>
                  {/* Top: name + status */}
                  <div className="ml-card-top">
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="ml-card-name">{m.name}</div>
                      <div className="ml-card-email">{m.email}</div>
                      {m.hasPersonalTrainer && (
                        <div style={{ marginTop: 4 }}>
                          <span className="trainer-tag" style={{ fontSize: 10 }}>
                            🏋️ {m.personalTrainerName || 'PT'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', flexShrink: 0 }}>
                      <span className={`badge ${m.isActive ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 10 }}>
                        {m.isActive ? '● Active' : '● Inactive'}
                      </span>
                      {getDaysTag(m.nextDueDate)}
                    </div>
                  </div>

                  {/* Meta grid: plan / stats / payment */}
                  <div className="ml-card-meta">
                    <div className="ml-card-meta-cell">
                      <span className="ml-card-meta-label">Plan</span>
                      <span><span className="badge badge-blue" style={{ fontSize: 10 }}>{m.subscriptionType}M</span></span>
                    </div>
                    <div className="ml-card-meta-cell">
                      <span className="ml-card-meta-label">Body</span>
                      <span className="ml-card-meta-value">
                        {m.weight ? `${m.weight}kg` : '—'}
                        {m.weight && m.height ? ' · ' : ''}
                        {m.height ? `${m.height}cm` : ''}
                      </span>
                    </div>
                    <div className="ml-card-meta-cell">
                      <span className="ml-card-meta-label">Payment</span>
                      <span className="ml-card-meta-value">{m.paymentType}</span>
                      {m.feeAmount > 0 && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>₹{m.feeAmount}</span>
                      )}
                    </div>
                  </div>

                  {/* Action bar */}
                  <div className="ml-card-actions">
                    <button className="ml-card-action-btn" title="View" onClick={() => openModal('detail', m)}>👁</button>
                    <button className="ml-card-action-btn" title="Edit" onClick={() => openModal('edit', m)}>✏️</button>
                    <button className="ml-card-action-btn renew" title="Renew" onClick={() => openModal('renew', m)}>
                      🔄 Renew
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Modals ── */}
      {modal === 'add'    && <AddMemberModal onClose={closeModal} onSuccess={handleSuccess} />}
      {modal === 'edit'   && selected && <EditMemberModal member={selected} onClose={closeModal} onSuccess={handleSuccess} />}
      {modal === 'renew'  && selected && <RenewModal member={selected} onClose={closeModal} onSuccess={handleSuccess} />}
      {modal === 'detail' && selected && (
        <MemberDetailModal
          member={selected}
          onClose={closeModal}
          onRenew={() => { closeModal(); openModal('renew', selected); }}
        />
      )}
    </div>
  );
}