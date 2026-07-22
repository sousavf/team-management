import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthShell from '../components/AuthShell';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { state, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (state.user) {
      navigate('/holiday-calendar');
    }
  }, [state.user, navigate]);

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    }
  }, [state.error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage time off and team availability."
      footer={
        <>
          Just here to check the calendar?{' '}
          <Link to="/holiday-calendar" className="font-medium text-primary-600 hover:text-primary-700">
            View it without signing in
          </Link>
        </>
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

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="label mb-0">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <button type="submit" disabled={state.isLoading} className="btn-primary w-full">
          {state.isLoading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthShell>
  );
};

export default Login;
