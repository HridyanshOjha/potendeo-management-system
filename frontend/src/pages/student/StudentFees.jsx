import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import Topbar from '../../components/shared/Topbar';
import api from '../../utils/api';
import { formatRelative } from '../../utils/helpers';
import toast from 'react-hot-toast';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

// ── Tuition type cards (matches screenshot exactly) ──────────────────────────
const TUITION_TYPES = [
  {
    key:    'onlineTuition',
    label:  'Online Tuition',
    icon:   '🌐',
    color:  { bg: 'bg-blue-50/80', border: 'border-blue-100', head: 'text-blue-800', price: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' },
    bullets: ['Classes 1–12 | All subjects', 'CBSE, ICSE, IB, IGCSE & international curricula', 'JEE, NEET, CUET, IPMAT, NDA, CLAT, CAT, SAT, ACT, GRE, GMAT, IELTS, TOEFL & More Entrance Exams', '1-to-1 & small batch options'],
  },
  {
    key:    'homeTuition',
    label:  'Home Tuition',
    icon:   '🏠',
    color:  { bg: 'bg-emerald-50/80', border: 'border-emerald-100', head: 'text-emerald-800', price: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
    bullets: ['Available across major Indian cities', 'Personal tutor matching', 'Board exam & academic support', 'Flexible scheduling'],
  },
  {
    key:    'competitiveExam',
    label:  'Competitive Exam Coaching',
    icon:   '🎯',
    color:  { bg: 'bg-red-50/80', border: 'border-red-100', head: 'text-red-800', price: 'text-red-700', badge: 'bg-red-100 text-red-700' },
    bullets: ['JEE, NEET, CUET, IPMAT, NDA, CLAT, CAT, SAT, ACT, GRE, GMAT, IELTS, TOEFL & More', 'Olympiads & foundation programs', 'Exam-focused mentorship', 'Advanced tutor expertise'],
  },
];

// Class segment colours
const SEG_COLORS = {
  'Class 1-5':         { border: 'border-l-green-400',  badge: 'bg-green-100 text-green-700',  icon: '🌱' },
  'Class 6-8':         { border: 'border-l-blue-400',   badge: 'bg-blue-100 text-blue-700',    icon: '📘' },
  'Class 9-10':        { border: 'border-l-indigo-400', badge: 'bg-indigo-100 text-indigo-700',icon: '📗' },
  'Class 11-12':       { border: 'border-l-purple-400', badge: 'bg-purple-100 text-purple-700',icon: '📙' },
  'Competitive Exams': { border: 'border-l-red-400',    badge: 'bg-red-100 text-red-700',      icon: '🏆' },
};

export default function StudentFees() {
  const { setMobileOpen } = useOutletContext();
  const [feeStructure, setFeeStructure] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState('cards');

  useEffect(() => {
    api.get('/fees')
      .then(res => setFeeStructure(res.data.feeStructure))
      .catch(() => toast.error('Failed to load fee structure'))
      .finally(() => setLoading(false));
  }, []);

  const segments      = feeStructure?.segments?.slice().sort((a, b) => a.order - b.order) || [];
  const tuitionTypes  = feeStructure?.tuitionTypes || {};

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Fee Structure" subtitle="Tuition pricing & rates" setMobileOpen={setMobileOpen} />

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-5">

        {/* Info banner */}
        <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
          <span className="text-lg flex-shrink-0">💡</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">About Fees</p>
            <p className="text-xs text-amber-700 mt-0.5">
              All prices are per hour (₹/hr). Contact admin for monthly package rates and payment details.
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-surface-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('cards')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'cards' ? 'bg-white shadow text-surface-900' : 'text-surface-500 hover:text-surface-700'}`}
          >
            🏷️ Tuition Types
          </button>
          <button
            onClick={() => setActiveTab('segments')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'segments' ? 'bg-white shadow text-surface-900' : 'text-surface-500 hover:text-surface-700'}`}
          >
            📚 By Class
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-64 skeleton rounded-2xl" />)}
          </div>
        ) : (
          <>
            {/* ── Cards tab — exactly like the screenshot ── */}
            {activeTab === 'cards' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {TUITION_TYPES.map((type, idx) => {
                  const data   = tuitionTypes[type.key] || {};
                  const colors = type.color;
                  return (
                    <div
                      key={type.key}
                      className={`rounded-2xl border ${colors.border} ${colors.bg} p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow duration-200 animate-fade-in`}
                      style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                      {/* Icon + title */}
                      <div className="text-center">
                        <div className="text-4xl mb-3">{type.icon}</div>
                        <h3 className={`text-lg font-display font-bold ${colors.head}`}>{type.label}</h3>

                        {/* Price range — bold like screenshot */}
                        <p className={`text-sm font-bold mt-2 ${colors.price}`}>
                          {data.note
                            ? data.note
                            : `${fmt(data.min)}/hr – ${fmt(data.max)}/hr`
                          }
                        </p>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-white/70" />

                      {/* Feature bullets — centred like screenshot */}
                      <ul className="space-y-2 text-sm text-surface-600 text-center">
                        {type.bullets.map((b, i) => (
                          <li key={i} className="leading-snug">{b}</li>
                        ))}
                      </ul>

                      {/* Recommended chip */}
                      {data.recommended > 0 && (
                        <div className={`mt-auto mx-auto px-3 py-1.5 rounded-full text-xs font-bold ${colors.badge}`}>
                          ✨ Typically {fmt(data.recommended)}/hr
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── By Class tab ── */}
            {activeTab === 'segments' && (
              <div className="space-y-3">
                {segments.length === 0 ? (
                  <div className="card flex flex-col items-center py-16 text-center">
                    <span className="text-4xl mb-3">💰</span>
                    <p className="text-surface-500">Fee structure not available yet.</p>
                  </div>
                ) : segments.map((seg, idx) => {
                  const sc = SEG_COLORS[seg.segment] || { border: 'border-l-surface-400', badge: 'badge-gray', icon: '📋' };
                  return (
                    <div key={seg.segment} className={`card border-l-4 ${sc.border} p-5 animate-fade-in`} style={{ animationDelay: `${idx * 0.06}s` }}>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-xl">{sc.icon}</span>
                        <h3 className="font-display font-bold text-surface-900">{seg.segment}</h3>
                        <span className={`badge ml-auto text-xs ${sc.badge}`}>Level {idx + 1}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* One-to-One */}
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                          <p className="text-xs font-bold text-blue-700 mb-3 flex items-center gap-1.5">
                            👤 One-to-One Tuition
                          </p>
                          <div className="space-y-1.5 text-sm">
                            <div className="flex justify-between">
                              <span className="text-surface-500">Minimum</span>
                              <span className="font-semibold">{fmt(seg.oneToOne?.min)}/hr</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-surface-500">Maximum</span>
                              <span className="font-semibold">{fmt(seg.oneToOne?.max)}/hr</span>
                            </div>
                            <div className="flex justify-between bg-white rounded-lg px-3 py-1.5 mt-2">
                              <span className="text-primary-700 font-bold">Recommended</span>
                              <span className="font-bold text-primary-700">{fmt(seg.oneToOne?.recommended)}/hr</span>
                            </div>
                          </div>
                        </div>

                        {/* Group Tuition */}
                        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                          <p className="text-xs font-bold text-emerald-700 mb-3 flex items-center gap-1.5">
                            👥 Group / Batch Tuition
                          </p>
                          <div className="space-y-1.5 text-sm">
                            <div className="flex justify-between">
                              <span className="text-surface-500">Minimum</span>
                              <span className="font-semibold">{fmt(seg.groupTuition?.min)}/hr</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-surface-500">Maximum</span>
                              <span className="font-semibold">{fmt(seg.groupTuition?.max)}/hr</span>
                            </div>
                            <div className="flex justify-between bg-white rounded-lg px-3 py-1.5 mt-2">
                              <span className="text-primary-700 font-bold">Recommended</span>
                              <span className="font-bold text-primary-700">{fmt(seg.groupTuition?.recommended)}/hr</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {feeStructure?.updatedAt && (
                  <p className="text-xs text-center text-surface-400 pt-1">
                    Last updated {formatRelative(feeStructure.updatedAt)}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
