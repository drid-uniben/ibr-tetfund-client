"use client";

import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, Loader2, LogIn } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
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
    <div className="min-h-screen bg-muted flex flex-col justify-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/">
          <div className="mx-auto text-center">
            <h2 className="text-3xl font-bold text-primary py-8">DRID UNIBEN</h2>
            <p className="mt-1 text-muted-foreground">
              Directorate of Research, Innovation and Development
            </p>
          </div>
        </Link>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-md rounded-lg sm:px-10">
          <h1 className="text-xl font-semibold text-center text-foreground mb-6">
            Admin Login
          </h1>
          
          {displayError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                <p className="text-sm text-red-600">{displayError}</p>
              </div>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-muted-foreground">
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
                  className="appearance-none block w-full px-3 py-2 border border-border rounded-md shadow-sm placeholder-[#a48fa0] focus:outline-none focus:ring-ring focus:border-primary sm:text-sm"
                  placeholder="admin@uniben.edu"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-muted-foreground">
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
                  className="appearance-none block w-full px-3 py-2 border border-border rounded-md shadow-sm placeholder-[#a48fa0] focus:outline-none focus:ring-ring focus:border-primary sm:text-sm"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-[#4a0340] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:bg-primary/50 disabled:cursor-not-allowed transition-colors"
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
                className="text-sm text-primary hover:text-primary"
              >
                Return to Homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="mt-auto bg-muted">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} DRID UNIBEN. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
