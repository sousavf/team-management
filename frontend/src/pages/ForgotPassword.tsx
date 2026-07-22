import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../utils/api';
import AuthShell from '../components/AuthShell';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <AuthShell
        title="Check your email"
        subtitle={`If an account exists for ${email}, we've sent a link to reset your password.`}
        footer={
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
            Back to sign in
          </Link>
        }
      >
        <p className="text-sm text-gray-600">
          The link expires in 60 minutes. Didn't get it? Check your spam folder, or{' '}
          <button
            type="button"
            onClick={() => setSent(false)}
            className="font-medium text-primary-600 hover:text-primary-700"
          >
            try a different email
          </button>
          .
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we'll send you a link to set a new one."
      footer={
        <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
          Back to sign in
        </Link>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="label">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
    </AuthShell>
  );
};

export default ForgotPassword;
