"use client";

import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, Loader2, LogIn } from 'lucide-react';
import Link from 'next/link';

export default function ResearcherLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const { login, isLoading, error, clearError } = useAuth();

  // Clear form error when user starts typing
  useEffect(() => {
  if (email || password) {
    setFormError('');
  }
}, [email, password]);

  // Clear auth error when component mounts or when user starts interacting
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    clearError(); // Clear any existing auth errors

    // Basic validation
    if (!email || !password) {
      setFormError('Email and password are required');
      return;
    }

    if (!email.includes('@')) {
      setFormError('Please enter a valid email address');
      return;
    }

    try {
      await login(email, password);
      // Success handling is done in AuthContext
    } catch (err: unknown) {
      console.error('Login submission error:', err);
      setFormError((err as Error).message || 'Login failed. Please try again.');
    }
  };

  // Don't clear fields on error - let user correct their input
  const displayError = formError || error;

  return (
    <div className="min-h-screen bg-[#faf7fc] flex flex-col justify-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/">
          <div className="mx-auto text-center">
            <h2 className="font-serif text-3xl font-semibold tracking-tight text-[#6d035c] py-8">DRID UNIBEN</h2>
            <p className="mt-1 text-[#6b5566]">
              Directorate of Research, Innovation and Development
            </p>
          </div>
        </Link>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/80 py-8 px-6 rounded-2xl border border-[#e6d9e6] shadow-[0_20px_60px_-40px_rgba(109,3,92,0.5)] sm:px-10">
          <h1 className="font-serif text-xl font-semibold text-center text-[#2b1229] mb-6">
            Researcher Login
          </h1>

          {displayError && (
            <div className="mb-4 p-3 bg-[#fef2f2] border border-red-200 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-[#b91c1c] mr-2 flex-shrink-0" />
                <p className="text-sm text-[#b91c1c]">{displayError}</p>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#2b1229]">
                Email Address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2.5 border border-[#e0d3e0] rounded-lg shadow-sm placeholder:text-[#a48fa0] text-[#2b1229] focus:outline-none focus:border-[#6d035c] focus:ring-2 focus:ring-[#6d035c]/20 sm:text-sm"
                  placeholder="researcher@uniben.edu"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#2b1229]">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2.5 border border-[#e0d3e0] rounded-lg shadow-sm placeholder:text-[#a48fa0] text-[#2b1229] focus:outline-none focus:border-[#6d035c] focus:ring-2 focus:ring-[#6d035c]/20 sm:text-sm"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 rounded-full shadow-sm text-sm font-semibold text-white bg-[#6d035c] hover:bg-[#4a0340] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6d035c]/30 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5 mr-2" />
                    Sign in
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="text-center">
              <Link
                href="/"
                className="text-sm text-[#6d035c] hover:text-[#4a0340]"
              >
                Return to Homepage
              </Link>
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-auto bg-[#f3e7d0]/40">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-[#6b5566]">
            © {new Date().getFullYear()} DRID UNIBEN. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
