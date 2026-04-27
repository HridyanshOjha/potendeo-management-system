import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NotFound() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      <div className="text-center animate-slide-up max-w-md">
        <div className="text-8xl font-display font-black text-surface-200 mb-2">404</div>
        <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-6">
          <span className="text-white font-display font-bold text-2xl">P</span>
        </div>
        <h1 className="text-2xl font-display font-bold text-surface-900 mb-2">Page Not Found</h1>
        <p className="text-surface-500 mb-8">
          The page you're looking for doesn't exist or you don't have access to it.
        </p>
        <button
          onClick={() => navigate(user ? `/${user.role}` : '/login')}
          className="btn-primary"
        >
          ← Go Back Home
        </button>
      </div>
    </div>
  );
}
