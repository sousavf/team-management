import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../utils/api';
import AuthShell from '../components/AuthShell';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await authApi.resetPassword(token, password);
      toast.success('Password reset. Please sign in.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'This reset link is invalid or has expired.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <AuthShell
        title="Invalid reset link"
        subtitle="This link is missing or malformed. Request a new one to continue."
        footer={
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
            Back to sign in
          </Link>
        }
      >
        <Link to="/forgot-password" className="btn-primary w-full">
          Request a new link
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a password you'll remember. It must be at least 6 characters."
      footer={
        <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
          Back to sign in
        </Link>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="password" className="label">
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="label">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            className="input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Resetting…' : 'Reset password'}
        </button>
      </form>
    </AuthShell>
  );
};

export default ResetPassword;
