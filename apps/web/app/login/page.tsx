'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { User, Lock, ArrowRight, Car, CheckCircle } from 'lucide-react';
import { MainLayout } from '@/components/MainLayout';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered') === 'true';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      // Safely parse JSON — a 404 or 500 may return HTML, not JSON
      const text = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Server error. Please try again.');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Redirect based on the role the server actually authenticated.
      if (data.user?.role === 'dealer') {
        router.push('/dealer/dashboard');
      } else {
        router.push('/account');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <MainLayout>
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                <Car className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-navy dark:text-ice mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to your Geely account</p>
          </div>

          {/* Form */}
          <div className="bg-white dark:bg-midnight-surface rounded-lg shadow-lg border border-gray-200 p-8">
            {registered && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 shrink-0" />
                Account created successfully! You can now sign in.
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
                {error.toLowerCase().includes('admin login') && (
                  <>
                    {' '}
                    <Link href="/admin/login" className="underline font-medium">
                      Go to staff sign in
                    </Link>
                  </>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-600">Remember me</span>
                </label>
                <Link href="/forgot-password" className="text-blue-600 hover:underline">
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? 'Signing in...' : 'Sign In'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-6 text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/register" className="text-blue-600 hover:underline font-medium">
                Create Account
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <Link href="/test-drive" className="hover:text-blue-600">Book a Test Drive</Link>
            {' • '}
            <Link href="/quote" className="hover:text-blue-600">Get a Quote</Link>
            {' • '}
            <Link href="/dealers" className="hover:text-blue-600">Find Dealers</Link>
          </div>

          {/* Staff sign-in */}
          <div className="mt-3 text-center text-xs text-gray-600">
            Geely staff member?{' '}
            <Link href="/admin/login" className="text-gray-600 hover:text-blue-600 underline">
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
