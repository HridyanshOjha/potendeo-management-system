import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import Topbar from '../../components/shared/Topbar';
import api from '../../utils/api';
import { formatRelative } from '../../utils/helpers';
import toast from 'react-hot-toast';

// ─── Constants ────────────────────────────────────────────────────────────────
const TUITION_TYPES = [
  {
    key: 'onlineTuition',
    label: 'Online Tuition',
    icon: '🌐',
    color: { bg: 'bg-blue-50', border: 'border-blue-200', head: 'text-blue-800', price: 'text-blue-700', ring: 'focus:ring-blue-400', inputBorder: 'border-blue-200' },
    bullets: ['Classes 1–12 | All subjects', 'CBSE, ICSE, IB, IGCSE & international curricula', 'JEE, NEET, CUET, IPMAT, NDA, CLAT, CAT, SAT, ACT, GRE, GMAT, IELTS, TOEFL & More', '1-to-1 & small batch options'],
  },
  {
    key: 'homeTuition',
    label: 'Home Tuition',
    icon: '🏠',
    color: { bg: 'bg-emerald-50', border: 'border-emerald-200', head: 'text-emerald-800', price: 'text-emerald-700', ring: 'focus:ring-emerald-400', inputBorder: 'border-emerald-200' },
    bullets: ['Available across major Indian cities', 'Personal tutor matching', 'Board exam & academic support', 'Flexible scheduling'],
  },
  {
    key: 'competitiveExam',
    label: 'Competitive Exam Coaching',
    icon: '🎯',
    color: { bg: 'bg-red-50', border: 'border-red-200', head: 'text-red-800', price: 'text-red-700', ring: 'focus:ring-red-400', inputBorder: 'border-red-200' },
    bullets: ['JEE, NEET, CUET, IPMAT, NDA, CLAT, CAT, SAT, ACT, GRE, GMAT, IELTS, TOEFL & More', 'Olympiads & foundation programs', 'Exam-focused mentorship', 'Advanced tutor expertise'],
  },
];

const CLASS_SEGMENTS = ['Class 1-5', 'Class 6-8', 'Class 9-10', 'Class 11-12', 'Competitive Exams'];

const SEG_META = {
  'Class 1-5':         { icon: '🌱', color: { bg: 'bg-green-50',  border: 'border-green-200',  head: 'text-green-800',  ring: 'focus:ring-green-400',  inputBorder: 'border-green-200'  } },
  'Class 6-8':         { icon: '📘', color: { bg: 'bg-blue-50',   border: 'border-blue-200',   head: 'text-blue-800',   ring: 'focus:ring-blue-400',   inputBorder: 'border-blue-200'   } },
  'Class 9-10':        { icon: '📗', color: { bg: 'bg-indigo-50', border: 'border-indigo-200', head: 'text-indigo-800', ring: 'focus:ring-indigo-400', inputBorder: 'border-indigo-200' } },
  'Class 11-12':       { icon: '📙', color: { bg: 'bg-purple-50', border: 'border-purple-200', head: 'text-purple-800', ring: 'focus:ring-purple-400', inputBorder: 'border-purple-200' } },
  'Competitive Exams': { icon: '🏆', color: { bg: 'bg-red-50',    border: 'border-red-200',    head: 'text-red-800',    ring: 'focus:ring-red-400',    inputBorder: 'border-red-200'    } },
};

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

const defaultTuitionTypes = () => ({
  onlineTuition:   { min: 200,  max: 2000, recommended: 500,  note: 'Starting from ₹200/hr for school classes' },
  homeTuition:     { min: 300,  max: 1500, recommended: 800,  note: 'Typically ₹300–₹1500/hr' },
  competitiveExam: { min: 400,  max: 2000, recommended: 1000, note: '₹400–₹2000/hr depending on level' },
});

const defaultSegments = () =>
  CLASS_SEGMENTS.map((seg, i) => ({
    segment: seg, order: i + 1, isActive: true,
    oneToOne:     { min: 200, max: 2000, recommended: 800 },
    groupTuition: { min: 150, max: 1500, recommended: 500 },
  }));

// ─── KEY FIX: RupeeInput is defined OUTSIDE the parent component.
// Defining it inside would cause React to remount it on every render,
// destroying focus and making typing impossible.
// It uses uncontrolled defaultValue + onBlur to avoid re-render issues.
function RupeeInput({ value, onCommit, disabled, color }) {
  const [local, setLocal] = useState(String(value ?? ''));

  // Sync if parent value changes (e.g. after load/cancel)
  useEffect(() => {
    setLocal(String(value ?? ''));
  }, [value]);

  const commit = () => {
    const n = parseFloat(local);
    onCommit(isNaN(n) ? 0 : Math.max(0, n));
  };

  return (
    <div className="relative">
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm font-bold text-surface-400 pointer-events-none select-none">₹</span>
      <input
        type="number"
        min={0}
        step={10}
        disabled={disabled}
        value={local}
        onChange={e => setLocal(e.target.value)}   // local state only — no parent re-render
        onBlur={commit}                            // commit to parent only on blur
        onKeyDown={e => { if (e.key === 'Enter') { e.target.blur(); } }}
        className={`w-full pl-7 pr-2 py-2.5 text-sm font-semibold rounded-xl border-2 transition-all outline-none
          ${disabled
            ? 'bg-white/60 border-transparent text-surface-400 cursor-not-allowed'
            : `bg-white ${color?.inputBorder || 'border-surface-300'} text-surface-900 hover:border-primary-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200`
          }`}
      />
    </div>
  );
}

// ─── Tuition Type Card ────────────────────────────────────────────────────────
function TuitionCard({ type, data, editing, onUpdate }) {
  const c = type.color;
  return (
    <div className={`rounded-2xl border-2 ${c.border} ${c.bg} overflow-hidden transition-all duration-200 ${editing ? 'shadow-lg' : 'shadow-sm'}`}>
      <div className="p-6">
        <div className="text-center mb-4">
          <span className="text-5xl">{type.icon}</span>
          <h3 className={`mt-3 text-lg font-display font-bold ${c.head}`}>{type.label}</h3>
          <p className={`text-sm font-bold mt-1 ${c.price}`}>
            {data?.note || `${fmt(data?.min)}/hr – ${fmt(data?.max)}/hr`}
          </p>
        </div>

        {editing ? (
          <div className="space-y-3 border-t border-white/70 pt-4">
            <div className="grid grid-cols-3 gap-2">
              {['min', 'max', 'recommended'].map(field => (
                <div key={field}>
                  <label className={`text-xs font-bold mb-1.5 block ${field === 'recommended' ? 'text-primary-600' : 'text-surface-500'}`}>
                    {field === 'recommended' ? 'Typical' : field.charAt(0).toUpperCase() + field.slice(1)}
                  </label>
                  <RupeeInput
                    value={data?.[field] ?? 0}
                    onCommit={v => onUpdate(field, v)}
                    disabled={false}
                    color={c}
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="text-xs font-bold text-surface-500 mb-1.5 block">Display Note</label>
              <input
                type="text"
                className={`w-full px-3 py-2 text-xs border-2 rounded-xl outline-none bg-white ${c.inputBorder} focus:border-primary-500`}
                value={data?.note || ''}
                onChange={e => onUpdate('note', e.target.value)}
                placeholder="e.g. Starting from ₹200/hr"
              />
            </div>
          </div>
        ) : (
          <ul className="space-y-1.5 text-sm text-surface-600 text-center border-t border-white/70 pt-4">
            {type.bullets.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─── Segment Card ─────────────────────────────────────────────────────────────
// Also defined OUTSIDE parent — same reason as RupeeInput
function SegmentCard({ seg, editing, onUpdate }) {
  const meta = SEG_META[seg.segment] || SEG_META['Class 1-5'];
  const c = meta.color;

  return (
    <div className={`rounded-2xl border-2 ${c.border} ${c.bg} overflow-hidden transition-all duration-200 ${editing ? 'shadow-lg' : 'shadow-sm'}`}>
      {/* Header */}
      <div className={`px-5 py-3.5 flex items-center gap-3 border-b ${c.border} bg-white/50`}>
        <span className="text-2xl">{meta.icon}</span>
        <h3 className={`font-display font-bold text-base ${c.head}`}>{seg.segment}</h3>
      </div>

      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* One-to-One */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-lg bg-blue-100 flex items-center justify-center text-sm">👤</span>
            One-to-One Tuition
          </p>
          <div className="grid grid-cols-3 gap-2">
            {['min', 'max', 'recommended'].map(field => (
              <div key={field}>
                <label className={`text-xs font-bold mb-1.5 block ${field === 'recommended' ? 'text-primary-600' : 'text-surface-500'}`}>
                  {field === 'recommended' ? 'Typical' : field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <RupeeInput
                  value={seg.oneToOne?.[field] ?? 0}
                  onCommit={v => onUpdate('oneToOne', field, v)}
                  disabled={!editing}
                  color={c}
                />
              </div>
            ))}
          </div>
          {!editing && (
            <p className="text-xs text-surface-500">
              {fmt(seg.oneToOne?.min)} – {fmt(seg.oneToOne?.max)} ·{' '}
              <span className="text-primary-600 font-bold">{fmt(seg.oneToOne?.recommended)} typical</span>
            </p>
          )}
        </div>

        {/* Group Tuition */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-lg bg-emerald-100 flex items-center justify-center text-sm">👥</span>
            Group / Batch Tuition
          </p>
          <div className="grid grid-cols-3 gap-2">
            {['min', 'max', 'recommended'].map(field => (
              <div key={field}>
                <label className={`text-xs font-bold mb-1.5 block ${field === 'recommended' ? 'text-primary-600' : 'text-surface-500'}`}>
                  {field === 'recommended' ? 'Typical' : field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <RupeeInput
                  value={seg.groupTuition?.[field] ?? 0}
                  onCommit={v => onUpdate('groupTuition', field, v)}
                  disabled={!editing}
                  color={c}
                />
              </div>
            ))}
          </div>
          {!editing && (
            <p className="text-xs text-surface-500">
              {fmt(seg.groupTuition?.min)} – {fmt(seg.groupTuition?.max)} ·{' '}
              <span className="text-primary-600 font-bold">{fmt(seg.groupTuition?.recommended)} typical</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminFees() {
  const { setMobileOpen } = useOutletContext();
  const [feeStructure, setFeeStructure]   = useState(null);
  const [segments, setSegments]           = useState(defaultSegments());
  const [tuitionTypes, setTuitionTypes]   = useState(defaultTuitionTypes());
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);
  const [editing, setEditing]             = useState(false);
  const [activeTab, setActiveTab]         = useState('cards');

  const loadFees = useCallback(() => {
    setLoading(true);
    api.get('/fees')
      .then(res => {
        const fs = res.data.feeStructure;
        setFeeStructure(fs);
        const existing = fs.segments || [];
        const filled = CLASS_SEGMENTS.map((seg, i) => {
          const found = existing.find(s => s.segment === seg);
          return found ? { ...found } : defaultSegments()[i];
        });
        setSegments(filled);
        if (fs.tuitionTypes) setTuitionTypes({ ...defaultTuitionTypes(), ...fs.tuitionTypes });
      })
      .catch(() => toast.error('Failed to load fee structure'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadFees(); }, [loadFees]);

  // Update a segment field — stable reference avoids remounts
  const updateSegment = useCallback((segIdx, type, field, value) => {
    setSegments(prev => prev.map((s, i) =>
      i !== segIdx ? s : { ...s, [type]: { ...s[type], [field]: value } }
    ));
  }, []);

  // Update a tuition type field
  const updateTuitionType = useCallback((typeKey, field, value) => {
    setTuitionTypes(prev => ({ ...prev, [typeKey]: { ...prev[typeKey], [field]: value } }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put('/fees', { segments, currency: 'INR', tuitionTypes });
      setFeeStructure(res.data.feeStructure);
      setEditing(false);
      toast.success('Fee structure saved! ✅');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => { loadFees(); setEditing(false); };

  return (
    <div className="flex flex-col h-full">
      <Topbar
        title="Fee Structure"
        subtitle="Manage tuition pricing"
        setMobileOpen={setMobileOpen}
        actions={
          editing ? (
            <div className="flex gap-2">
              <button className="btn-secondary" onClick={handleCancel} disabled={saving}>Cancel</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving
                  ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Saving...</>
                  : '💾 Save Changes'
                }
              </button>
            </div>
          ) : (
            <button className="btn-primary" onClick={() => setEditing(true)}>✏️ Edit Fees</button>
          )
        }
      />

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-5">
        {/* Status banners */}
        {feeStructure && !editing && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Last updated {formatRelative(feeStructure.updatedAt)} · All prices in ₹/hr
          </div>
        )}
        {editing && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-300 rounded-xl text-sm text-amber-800 font-semibold">
            ✏️ Edit mode — type a value and press Tab or click elsewhere to confirm, then click Save
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex gap-1 bg-surface-100 p-1 rounded-xl w-fit">
          {[{ key: 'cards', label: '🏷️ Tuition Types' }, { key: 'segments', label: '📚 Class Segments' }].map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === t.key ? 'bg-white shadow text-surface-900' : 'text-surface-500 hover:text-surface-700'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-64 skeleton rounded-2xl" />)}
          </div>
        ) : (
          <>
            {/* Tuition type cards */}
            {activeTab === 'cards' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {TUITION_TYPES.map(type => (
                  <TuitionCard
                    key={type.key}
                    type={type}
                    data={tuitionTypes[type.key]}
                    editing={editing}
                    onUpdate={(field, value) => updateTuitionType(type.key, field, value)}
                  />
                ))}
              </div>
            )}

            {/* Class segment cards */}
            {activeTab === 'segments' && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {segments.map((seg, idx) => (
                  <SegmentCard
                    key={seg.segment}
                    seg={seg}
                    editing={editing}
                    onUpdate={(type, field, value) => updateSegment(idx, type, field, value)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
