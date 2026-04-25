import React,{ useEffect, useState, useCallback } from 'react';
import api from '../../utils/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { RenewModal } from './MemberForm';

export default function ExpiringPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [selected, setSelected] = useState(null);

  const fetchExpiring = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/expiring?days=${days}`);
      if (res.data.success) setMembers(res.data.members);
    } catch {
      toast.error('Failed to load expiring members');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { fetchExpiring(); }, [fetchExpiring]);

  const getDaysTag = (daysLeft) => {
    if (daysLeft < 0) return <span className="badge badge-red">Expired {Math.abs(daysLeft)}d ago</span>;
    if (daysLeft === 0) return <span className="badge badge-red">Expires Today!</span>;
    if (daysLeft <= 2) return <span className="badge badge-red">{daysLeft}d left ⚠️</span>;
    if (daysLeft <= 4) return <span className="badge badge-orange">{daysLeft}d left</span>;
    return <span className="badge badge-gray">{daysLeft}d left</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">EXPIRING SOON</h1>
          <p className="page-subtitle">{members.length} member{members.length !== 1 ? 's' : ''} expiring in the next {days} days</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[2, 7, 14, 30].map(d => (
            <button key={d}
              className={`btn btn-sm ${days === d ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setDays(d)}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div className="loading-spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : members.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <h3>No members expiring in {days} days</h3>
            <p style={{ fontSize: 14, marginTop: 8 }}>All memberships are valid</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Contact</th>
                  <th>Plan</th>
                  <th>Next Due</th>
                  <th>Status</th>
                  <th>Last Payment</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m._id}
                    style={{
                      background: m.daysLeft <= 1 ? 'rgba(255,68,68,0.05)' :
                        m.daysLeft <= 2 ? 'rgba(255,170,0,0.05)' : undefined
                    }}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</div>
                      {m.hasPersonalTrainer && (
                        <span className="trainer-tag" style={{ marginTop: 4, display: 'inline-flex' }}>🏋️ {m.personalTrainerName || 'PT'}</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: 13 }}>{m.email}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.phone}</div>
                    </td>
                    <td><span className="badge badge-blue">{m.subscriptionType}M</span></td>
                    <td>
                      <div style={{ fontSize: 13 }}>{m.nextDueDate ? format(new Date(m.nextDueDate), 'dd MMM yyyy') : '—'}</div>
                    </td>
                    <td>{getDaysTag(m.daysLeft)}</td>
                    <td>
                      <div style={{ fontSize: 13 }}>
                        <span className="badge badge-gray">{m.paymentType}</span>
                        {m.feeAmount > 0 && <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 6 }}>₹{m.feeAmount}</span>}
                      </div>
                    </td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={() => setSelected(m)}>
                        🔄 Renew
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <RenewModal
          member={selected}
          onClose={() => setSelected(null)}
          onSuccess={() => { setSelected(null); fetchExpiring(); }}
        />
      )}
    </div>
  );
}