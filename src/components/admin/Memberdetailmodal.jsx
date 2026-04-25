import { format, differenceInDays } from 'date-fns';
import React  from 'react'
export default function MemberDetailModal({ member, onClose, onRenew }) {
  const days = member.nextDueDate
    ? differenceInDays(new Date(member.nextDueDate), new Date())
    : null;

  const bmi = member.weight && member.height
    ? (member.weight / Math.pow(member.height / 100, 2)).toFixed(1)
    : null;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg animate-fade">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{member.name}</h2>
            <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
              <span className={`badge ${member.isActive ? 'badge-green' : 'badge-red'}`}>
                {member.isActive ? '● Active' : '● Inactive'}
              </span>
              <span className="badge badge-blue">{member.subscriptionType}M Plan</span>
              {member.hasPersonalTrainer && (
                <span className="trainer-tag">🏋️ {member.personalTrainerName || 'PT'}</span>
              )}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            {/* Contact Info */}
            <div className="card" style={{ padding: 16 }}>
              <div className="card-title">Contact</div>
              <InfoRow label="Email" value={member.email} />
              <InfoRow label="Phone" value={member.phone || '—'} />
              <InfoRow label="Address" value={member.address || '—'} />
              <InfoRow label="Joined" value={member.joiningDate ? format(new Date(member.joiningDate), 'dd MMM yyyy') : '—'} />
            </div>

            {/* Body Stats */}
            <div className="card" style={{ padding: 16 }}>
              <div className="card-title">Body Stats</div>
              <InfoRow label="Weight" value={member.weight ? `${member.weight} kg` : '—'} />
              <InfoRow label="Height" value={member.height ? `${member.height} cm` : '—'} />
              <InfoRow label="BMI" value={bmi ? `${bmi}` : '—'} />
              {member.weightHistory?.length > 1 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Weight History</div>
                  {[...member.weightHistory].reverse().slice(0, 4).map((w, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', color: 'var(--text-secondary)' }}>
                      <span>{format(new Date(w.date), 'dd MMM yyyy')}</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{w.weight} kg</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Subscription Info */}
          <div className="card" style={{ padding: 16, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="card-title" style={{ marginBottom: 0 }}>Subscription</div>
              <button className="btn btn-primary btn-sm" onClick={onRenew}>🔄 Renew</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <StatMini label="Last Paid" value={member.lastFeePaidDate ? format(new Date(member.lastFeePaidDate), 'dd MMM yy') : '—'} />
              <StatMini label="Next Due" value={member.nextDueDate ? format(new Date(member.nextDueDate), 'dd MMM yy') : '—'}
                valueStyle={{ color: days !== null && days <= 2 ? 'var(--accent-red)' : days !== null && days <= 7 ? 'var(--accent-orange)' : undefined }} />
              <StatMini label="Days Left" value={days !== null ? (days < 0 ? 'Expired' : `${days}d`) : '—'}
                valueStyle={{ color: days !== null && days <= 2 ? 'var(--accent-red)' : undefined }} />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <span className="badge badge-gray">{member.paymentType || '—'}</span>
              {member.feeAmount > 0 && <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>₹{member.feeAmount}</span>}
            </div>
          </div>

          {/* Fee History */}
          {member.feeHistory?.length > 0 && (
            <div>
              <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12, fontWeight: 600 }}>Fee History</div>
              <ul className="history-list">
                {[...member.feeHistory].reverse().map((h, i) => (
                  <li key={i} className="history-item">
                    <div className="history-dot" />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>₹{h.amount}</span>
                          <span className="badge badge-gray" style={{ marginLeft: 8 }}>{h.paymentType}</span>
                          <span className="badge badge-blue" style={{ marginLeft: 6 }}>{h.subscriptionType}M</span>
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {h.paymentDate ? format(new Date(h.paymentDate), 'dd MMM yyyy') : '—'}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                        {h.fromDate ? format(new Date(h.fromDate), 'dd MMM') : '—'} → {h.toDate ? format(new Date(h.toDate), 'dd MMM yyyy') : '—'}
                        {h.renewedBy && <span style={{ marginLeft: 8 }}>· by {h.renewedBy}</span>}
                      </div>
                      {h.notes && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{h.notes}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={onRenew}>🔄 Renew Subscription</button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--text-primary)', maxWidth: '60%', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function StatMini({ label, value, valueStyle }) {
  return (
    <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '12px', textAlign: 'center' }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', ...valueStyle }}>{value}</div>
    </div>
  );
}