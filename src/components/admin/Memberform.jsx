import React,{ useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const SUBSCRIPTION_OPTIONS = [
  { value: 1, label: '1 Month' },
  { value: 3, label: '3 Months' },
  { value: 6, label: '6 Months' },
  { value: 12, label: '12 Months' },
];
const PAYMENT_OPTIONS = ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Cheque'];

// ─── Add Member Modal ───────────────────────────────────────────────────────────
export function AddMemberModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '',
    weight: '', height: '',
    subscriptionType: 1,
    feeAmount: '',
    paymentType: 'Cash',
    joiningDate: new Date().toISOString().split('T')[0],
    hasPersonalTrainer: false,
    personalTrainerName: ''
  });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name || !form.email) return toast.error('Name and email are required');
    setLoading(true);
    try {
      await api.post('/members', form);
      toast.success(`${form.name} added successfully!`);
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper title="ADD MEMBER" onClose={onClose}>
      <div className="form-grid">
        <div className="input-group">
          <label className="input-label">Full Name *</label>
          <input className="input-field" placeholder="John Doe" value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div className="input-group">
          <label className="input-label">Email *</label>
          <input className="input-field" type="email" placeholder="john@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
        </div>
        <div className="input-group">
          <label className="input-label">Phone</label>
          <input className="input-field" placeholder="+91 98765 43210" value={form.phone} onChange={e => set('phone', e.target.value)} />
        </div>
        <div className="input-group">
          <label className="input-label">Joining Date</label>
          <input className="input-field" type="date" value={form.joiningDate} onChange={e => set('joiningDate', e.target.value)} />
        </div>
        <div className="input-group full">
          <label className="input-label">Address</label>
          <input className="input-field" placeholder="City, State" value={form.address} onChange={e => set('address', e.target.value)} />
        </div>

        <div className="form-divider">Body Stats</div>

        <div className="input-group">
          <label className="input-label">Weight (kg)</label>
          <input className="input-field" type="number" placeholder="70" value={form.weight} onChange={e => set('weight', e.target.value)} />
        </div>
        <div className="input-group">
          <label className="input-label">Height (cm)</label>
          <input className="input-field" type="number" placeholder="175" value={form.height} onChange={e => set('height', e.target.value)} />
        </div>

        <div className="form-divider">Subscription & Payment</div>

        <div className="input-group">
          <label className="input-label">Subscription Plan</label>
          <select className="input-field" value={form.subscriptionMonths} onChange={e => set('subscriptionType', parseInt(e.target.value))}>
            {SUBSCRIPTION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="input-group">
          <label className="input-label">Fee Amount (₹)</label>
          <input className="input-field" type="number" placeholder="1000" value={form.feeAmount} onChange={e => set('feeAmount', e.target.value)} />
        </div>
        <div className="input-group full">
          <label className="input-label">Payment Method</label>
          <select className="input-field" value={form.paymentType} onChange={e => set('paymentType', e.target.value)}>
            {PAYMENT_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>

        <div className="form-divider">Personal Trainer</div>

        <div className="input-group full">
          <div className="toggle-group">
            <label className="toggle">
              <input type="checkbox" checked={form.hasPersonalTrainer} onChange={e => set('hasPersonalTrainer', e.target.checked)} />
              <span className="toggle-slider" />
            </label>
            <span className="toggle-label">Has Personal Trainer</span>
          </div>
        </div>
        {form.hasPersonalTrainer && (
          <div className="input-group full">
            <label className="input-label">Trainer Name</label>
            <input className="input-field" placeholder="Trainer's name" value={form.personalTrainerName} onChange={e => set('personalTrainerName', e.target.value)} />
          </div>
        )}
      </div>

      <ModalFooter onClose={onClose} onSubmit={handleSubmit} loading={loading} submitLabel="➕ Add Member" />
    </ModalWrapper>
  );
}

// ─── Edit Member Modal ──────────────────────────────────────────────────────────
export function EditMemberModal({ member, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: member.name || '',
    email: member.email || '',
    phone: member.phone || '',
    address: member.address || '',
    weight: member.weight || '',
    height: member.height || '',
    hasPersonalTrainer: member.hasPersonalTrainer || false,
    personalTrainerName: member.personalTrainerName || '',
    isActive: member.isActive !== undefined ? member.isActive : true
  });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.put(`/members/${member._id}`, form);
      toast.success('Member updated!');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper title="EDIT MEMBER" onClose={onClose}>
      <div className="form-grid">
        <div className="input-group">
          <label className="input-label">Full Name</label>
          <input className="input-field" value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div className="input-group">
          <label className="input-label">Email</label>
          <input className="input-field" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
        </div>
        <div className="input-group">
          <label className="input-label">Phone</label>
          <input className="input-field" value={form.phone} onChange={e => set('phone', e.target.value)} />
        </div>
        <div className="input-group">
          <label className="input-label">Address</label>
          <input className="input-field" value={form.address} onChange={e => set('address', e.target.value)} />
        </div>
        <div className="input-group">
          <label className="input-label">Weight (kg)</label>
          <input className="input-field" type="number" value={form.weight} onChange={e => set('weight', e.target.value)} />
        </div>
        <div className="input-group">
          <label className="input-label">Height (cm)</label>
          <input className="input-field" type="number" value={form.height} onChange={e => set('height', e.target.value)} />
        </div>

        <div className="form-divider">Personal Trainer</div>

        <div className="input-group full">
          <div className="toggle-group">
            <label className="toggle">
              <input type="checkbox" checked={form.hasPersonalTrainer} onChange={e => set('hasPersonalTrainer', e.target.checked)} />
              <span className="toggle-slider" />
            </label>
            <span className="toggle-label">Has Personal Trainer</span>
          </div>
        </div>
        {form.hasPersonalTrainer && (
          <div className="input-group full">
            <label className="input-label">Trainer Name</label>
            <input className="input-field" placeholder="Trainer's name" value={form.personalTrainerName} onChange={e => set('personalTrainerName', e.target.value)} />
          </div>
        )}

        <div className="form-divider">Status</div>

        <div className="input-group full">
          <div className="toggle-group">
            <label className="toggle">
              <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} />
              <span className="toggle-slider" />
            </label>
            <span className="toggle-label">{form.isActive ? '● Active Member' : '● Inactive Member'}</span>
          </div>
        </div>
      </div>

      <ModalFooter onClose={onClose} onSubmit={handleSubmit} loading={loading} submitLabel="💾 Save Changes" />
    </ModalWrapper>
  );
}

// ─── Renew Modal ────────────────────────────────────────────────────────────────
export function RenewModal({ member, onClose, onSuccess }) {
  const [form, setForm] = useState({
    subscriptionMonths: 1,
    feeAmount: member.feeAmount || '',
    paymentType: member.paymentType || 'Cash',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.feeAmount) return toast.error('Please enter fee amount');
    setLoading(true);
    try {
      await api.post(`/members/${member._id}/renew`, form);
      console.log(form);
      
      toast.success(`${member.name}'s subscription renewed!`);
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Renewal failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper title="RENEW SUBSCRIPTION" onClose={onClose}>
      <div className="alert alert-info" style={{ marginBottom: 20 }}>
        <span>Renewing for: <strong>{member.name}</strong> · Current plan: <strong>{member.subscriptionType}M</strong></span>
      </div>
      <div className="form-grid">
        <div className="input-group">
          <label className="input-label">New Subscription Plan</label>
          <select className="input-field" value={form.subscriptionMonths} onChange={e => setForm(f => ({ ...f, subscriptionType: parseInt(e.target.value) }))}>
            {SUBSCRIPTION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="input-group">
          <label className="input-label">Fee Amount (₹)</label>
          <input className="input-field" type="number" placeholder="1000" value={form.feeAmount} onChange={e => setForm(f => ({ ...f, feeAmount: e.target.value }))} />
        </div>
        <div className="input-group full">
          <label className="input-label">Payment Method</label>
          <select className="input-field" value={form.paymentType} onChange={e => setForm(f => ({ ...f, paymentType: e.target.value }))}>
            {PAYMENT_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div className="input-group full">
          <label className="input-label">Notes (optional)</label>
          <input className="input-field" placeholder="Any notes about this renewal..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
      </div>

      <ModalFooter onClose={onClose} onSubmit={handleSubmit} loading={loading} submitLabel="🔄 Renew Subscription" />
    </ModalWrapper>
  );
}

// ─── Shared Modal Helpers ───────────────────────────────────────────────────────
function ModalWrapper({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg animate-fade">
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}

function ModalFooter({ onClose, onSubmit, loading, submitLabel }) {
  return (
    <div className="modal-footer" style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
      <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
      <button className="btn btn-primary" onClick={onSubmit} disabled={loading}>
        {loading ? 'Saving...' : submitLabel}
      </button>
    </div>
  );
}