import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader } from 'lucide-react';

export default function LoginPage() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoggingIn(true);
      const user = await login();
      if (user) {
        navigate('/');
      }
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="flex h-screen bg-dark-900">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-neu-blue via-neu-purple to-neu-cyan flex-col items-center justify-center p-12 text-white">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-6">Knowledge Starts Here</h1>
          <p className="text-2xl text-opacity-90 mb-8">
            Welcome to NEU Library Visitor Management System
          </p>
          <div className="w-24 h-24 bg-white bg-opacity-20 rounded-lg mx-auto mb-8 flex items-center justify-center">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" />
            </svg>
          </div>
          <p className="text-lg text-opacity-75">
            New Era University Library System
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 bg-dark-950 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-2">Knowledge Starts Here</h1>
            <p className="text-dark-400">NEU Library Visitor Management</p>
          </div>

          {/* Login Card */}
          <div className="bg-dark-900 rounded-2xl p-8 border border-dark-800">
            <h2 className="text-3xl font-bold text-white mb-2 text-center">Welcome Back</h2>
            <p className="text-dark-400 text-center mb-8">
              Sign in with your NEU email to continue
            </p>

            {error && (
              <div className="mb-6 p-4 bg-red-900 bg-opacity-30 border border-red-500 rounded-lg">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleGoogleLogin}
              disabled={isLoggingIn || loading}
              className="w-full flex items-center justify-center gap-3 bg-white text-dark-900 font-semibold py-3 rounded-lg mb-6 hover:bg-dark-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingIn ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </>
              )}
            </button>


            <p className="text-dark-400 text-xs text-center mt-6">
              Only @neu.edu.ph email addresses are allowed
            </p>
          </div>

          {/* Admin Portal Link */}
        </div>
      </div>
    </div>
  );
}
