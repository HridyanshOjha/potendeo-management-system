import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

export const formatTime = (date) => {
  return format(new Date(date), 'HH:mm');
};

export const formatDate = (date) => {
  const d = new Date(date);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM dd, yyyy');
};

export const formatDateTime = (date) => {
  return format(new Date(date), 'MMM dd, yyyy • HH:mm');
};

export const formatRelative = (date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const getInitials = (name = '') => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const getRoleColor = (role) => {
  const map = {
    admin: 'bg-violet-100 text-violet-700',
    teacher: 'bg-blue-100 text-blue-700',
    student: 'bg-emerald-100 text-emerald-700',
  };
  return map[role] || 'bg-surface-100 text-surface-600';
};

export const getRoleBubbleColor = (role) => {
  const map = {
    admin: 'bg-violet-500',
    teacher: 'bg-blue-500',
    student: 'bg-emerald-500',
  };
  return map[role] || 'bg-surface-500';
};

export const getPriorityColor = (priority) => {
  const map = {
    urgent: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    normal: 'bg-blue-100 text-blue-700 border-blue-200',
    low: 'bg-surface-100 text-surface-600 border-surface-200',
  };
  return map[priority] || map.normal;
};

export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const truncate = (str, len = 80) => {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '...' : str;
};

export const classSegmentColors = {
  'Class 1-5': 'bg-green-100 text-green-700',
  'Class 6-8': 'bg-blue-100 text-blue-700',
  'Class 9-10': 'bg-indigo-100 text-indigo-700',
  'Class 11-12': 'bg-purple-100 text-purple-700',
  'Competitive Exams': 'bg-red-100 text-red-700',
};
