'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useRouter } from 'next/navigation';
import { Shield, Mail, Lock, AlertCircle, ArrowLeft } from 'lucide-react';

// Readable text for the ?error=sso_* codes the backend's SSO callback
// redirects back with (backend/src/routes/sso.routes.ts).
const SSO_ERRORS: Record<string, string> = {
  sso_no_account: 'Your Kerchanshe SSO account has no Geely staff account. Ask an administrator to create one with the same email address.',
  sso_disabled: 'Your Geely staff account is disabled. Contact an administrator.',
  sso_email_unverified: 'Kerchanshe SSO has not verified your email address, so it can’t be used to sign in here.',
  sso_subject_mismatch: 'This email is already linked to a different Kerchanshe SSO account. Contact an administrator.',
  sso_expired: 'The SSO sign-in took too long or was interrupted. Please try again.',
  sso_denied: 'Sign-in was cancelled at Kerchanshe SSO.',
  sso_invalid_token: 'Kerchanshe SSO returned a response that could not be verified. Please try again.',
  sso_error: 'Kerchanshe SSO sign-in failed. Please try again, or use your password.',
};

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [ssoEnabled, setSsoEnabled] = useState(false);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('error');
    if (code && SSO_ERRORS[code]) setError(SSO_ERRORS[code]);

    apiClient
      .get('/auth/sso/status')
      .then((res) => setSsoEnabled(!!res.data?.enabled))
      .catch(() => setSsoEnabled(false));
  }, []);

  const handleSsoLogin = () => {
    setLoading(true);
    // Full-page navigation, not XHR — the backend answers with a redirect
    // to the IdP, and the callback comes back as a top-level navigation.
    window.location.href = `${apiClient.defaults.baseURL}/auth/sso/login`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiClient.post('/auth/admin-login', { email, password });
      router.push('/admin/analytics');
      router.refresh();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Invalid email or password');
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send OTP');
        setLoading(false);
        return;
      }

      setOtpSent(true);
      setLoading(false);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Backend destructures `code`, not `otp` — sending the wrong key
        // meant every submission failed with "Email, code, and new password
        // are required" even with all three fields visibly filled in.
        body: JSON.stringify({ email, code: otp, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to reset password');
        setLoading(false);
        return;
      }

      setResetSuccess(true);
      setLoading(false);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        setShowForgotPassword(false);
        setOtpSent(false);
        setResetSuccess(false);
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
      }, 2000);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setOtpSent(false);
    setResetSuccess(false);
    setError('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-geely-blue rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Geely Ethiopia</h1>
          <p className="text-blue-200">Admin Panel - Kerchanshe Group</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex items-center mb-6">
            {showForgotPassword && (
              <button
                onClick={handleBackToLogin}
                className="text-gray-500 hover:text-gray-700 mr-3"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-2xl font-bold text-gray-900">
              {showForgotPassword ? 'Reset Password' : 'Sign In'}
            </h2>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {resetSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">Password reset successfully! Redirecting to login...</p>
            </div>
          )}

          {!showForgotPassword ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                    placeholder="admin@geelyethiopia.com"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-geely-blue text-white py-3 rounded-lg font-semibold hover:bg-navy transition-colors disabled:bg-geely-blue/50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              {ssoEnabled && (
                <>
                  <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-gray-400">
                    <span className="h-px flex-1 bg-gray-200" />
                    or
                    <span className="h-px flex-1 bg-gray-200" />
                  </div>
                  <button
                    type="button"
                    onClick={handleSsoLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 border-2 border-geely-blue text-geely-blue py-3 rounded-lg font-semibold hover:bg-geely-blue hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Shield className="w-5 h-5" />
                    Sign in with Kerchanshe SSO
                  </button>
                </>
              )}
            </form>
          ) : !otpSent ? (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <p className="text-sm text-gray-600 mb-4">
                Enter your email address and we'll send you a One-Time Password (OTP) to reset your password.
              </p>
              
              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                    placeholder="admin@geelyethiopia.com"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-geely-blue text-white py-3 rounded-lg font-semibold hover:bg-navy transition-colors disabled:bg-geely-blue/50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <p className="text-sm text-gray-600 mb-4">
                We've sent a 6-digit OTP to <strong>{email}</strong>. Please check your email and enter the code below.
              </p>

              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                  OTP Code
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent text-center text-2xl tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                    placeholder="Enter new password"
                    required
                    minLength={8}
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                    placeholder="Confirm new password"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-geely-blue text-white py-3 rounded-lg font-semibold hover:bg-navy transition-colors disabled:bg-geely-blue/50 disabled:cursor-not-allowed"
              >
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </form>
          )}

          {!showForgotPassword && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-geely-blue hover:text-navy hover:underline"
              >
                Forgot your password?
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-blue-200 text-sm">
          <p>Secured by Geely Ethiopia Admin System</p>
          <p className="mt-2">© {currentYear} Kerchanshe Group. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
