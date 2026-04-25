import React,{ useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { format, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';


export default function UserDashboard() {
  const { user, member, refreshMember } = useAuth();
  const [newWeight, setNewWeight] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showWeightForm, setShowWeightForm] = useState(false);

  const days = member?.nextDueDate
    ? differenceInDays(new Date(member.nextDueDate), new Date())
    : null;

  const bmi = member?.weight && member?.height
    ? (member.weight / Math.pow(member.height / 100, 2)).toFixed(1)
    : null;

  const handleWeightUpdate = async () => {
    if (!newWeight || parseFloat(newWeight) <= 0) return toast.error('Please enter a valid weight');
    setUpdating(true);
    try {
      await api.put('/members/me/weight', { weight: parseFloat(newWeight) });
      await refreshMember();
      toast.success('Weight updated! 💪');
      setNewWeight('');
      setShowWeightForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update weight');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = () => {
    if (days === null) return 'var(--text-muted)';
    if (days < 0) return 'var(--accent-red)';
    if (days <= 2) return 'var(--accent-red)';
    if (days <= 7) return 'var(--accent-orange)';
    return 'var(--accent-green)';
  };

  const getDaysText = () => {
    if (days === null) return 'N/A';
    if (days < 0) return `Expired ${Math.abs(days)}d ago`;
    if (days === 0) return 'Expires Today!';
    return `${days} days left`;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">MY DASHBOARD</h1>
          <p className="page-subtitle">Welcome back, {user?.name}! Track your fitness journey.</p>
        </div>
      </div>

      {/* Subscription Status Banner */}
      {days !== null && days <= 7 && (
        <div className={`alert ${days <= 2 ? 'alert-error' : 'alert-warning'}`} style={{ marginBottom: 24 }}>
          ⚠️ <strong>Your subscription {days <= 0 ? 'has expired!' : `expires in ${days} day${days !== 1 ? 's' : ''}!`}</strong>
          {' '}Please contact the gym to renew your membership.
        </div>
      )}

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card green">
          <div className="stat-label">Membership Status</div>
          <div className="stat-value" style={{ fontSize: 24, color: getStatusColor() }}>{getDaysText()}</div>
          <div className="stat-sub">
            {member?.nextDueDate ? `Due: ${format(new Date(member.nextDueDate), 'dd MMM yyyy')}` : 'No due date'}
          </div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">Current Plan</div>
          <div className="stat-value">{member?.subscriptionType ?? '—'}<span style={{ fontSize: 16, fontWeight: 400 }}>M</span></div>
          <div className="stat-sub">{member?.paymentType || '—'} · ₹{member?.feeAmount || 0}</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-label">Current Weight</div>
          <div className="stat-value">{member?.weight ?? '—'}<span style={{ fontSize: 16, fontWeight: 400 }}>{member?.weight ? 'kg' : ''}</span></div>
          <div className="stat-sub">{bmi ? `BMI: ${bmi}` : 'No height recorded'}</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-label">Member Since</div>
          <div className="stat-value" style={{ fontSize: 20 }}>
            {member?.joiningDate ? format(new Date(member.joiningDate), 'MMM yyyy') : '—'}
          </div>
          <div className="stat-sub">{member?.joiningDate ? format(new Date(member.joiningDate), 'dd MMM yyyy') : '—'}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Weight Update */}
        <div className="card">
          <div className="card-title">Update My Weight</div>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
            Track your progress by updating your weight. This is visible to the admin.
          </p>

          {member?.weight && (
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: 16, marginBottom: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Current Weight</div>
              <div style={{ fontSize: 36, fontFamily: 'var(--font-display)', color: 'var(--accent-green)' }}>{member.weight} <span style={{ fontSize: 18 }}>kg</span></div>
              {bmi && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>BMI: {bmi}</div>}
            </div>
          )}

          {showWeightForm ? (
            <div>
              <div className="input-group">
                <label className="input-label">New Weight (kg)</label>
                <input
                  className="input-field"
                  type="number"
                  step="0.1"
                  min="1"
                  max="500"
                  placeholder={member?.weight ? `Current: ${member.weight} kg` : 'Enter weight in kg'}
                  value={newWeight}
                  onChange={e => setNewWeight(e.target.value)}
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={handleWeightUpdate} disabled={updating}>
                  {updating ? 'Updating...' : '💾 Save'}
                </button>
                <button className="btn btn-ghost" onClick={() => { setShowWeightForm(false); setNewWeight(''); }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowWeightForm(true)}>
              ⚖️ Update Weight
            </button>
          )}

          {/* Weight history mini chart */}
          {member?.weightHistory?.length > 1 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Recent History</div>
              {[...member.weightHistory].reverse().slice(0, 5).map((w, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{format(new Date(w.date), 'dd MMM yyyy')}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{w.weight} kg</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="card">
          <div className="card-title">My Profile</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { label: 'Name', value: member?.name || user?.name },
              { label: 'Email', value: member?.email || user?.email },
              { label: 'Phone', value: member?.phone || '—' },
              { label: 'Address', value: member?.address || '—' },
              { label: 'Height', value: member?.height ? `${member.height} cm` : '—' },
              { label: 'Joining Date', value: member?.joiningDate ? format(new Date(member.joiningDate), 'dd MMM yyyy') : '—' },
              { label: 'Last Fee Paid', value: member?.lastFeePaidDate ? format(new Date(member.lastFeePaidDate), 'dd MMM yyyy') : '—' },
              { label: 'Payment Method', value: member?.paymentType || '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
                <span style={{ fontSize: 13, color: 'var(--text-primary)', maxWidth: '55%', textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
              </div>
            ))}
          </div>

          {member?.hasPersonalTrainer && (
            <div style={{ marginTop: 16, padding: 12, background: 'var(--trainer-bg)', border: '1px solid var(--trainer-border)', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--trainer-accent)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Personal Trainer</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>🏋️ {member.personalTrainerName || 'Assigned'}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}