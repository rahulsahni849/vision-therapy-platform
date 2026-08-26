import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { apiClient } from '../../lib/api';
import { ThemeToggle } from '../../components/ThemeToggle';
import leftLogin from '../../assets/left_login.png';
import { appConfig } from '../../config';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await apiClient.login(email, password);
      apiClient.setAccessToken(result.accessToken);
      login(result.user, result.accessToken);
      const roleRoute = result.user.role.toLowerCase();
      navigate(`/${roleRoute}`);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex bg-[var(--bg-primary)] overflow-hidden">
      {/* Left side — Brand Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center bg-[var(--bg-secondary)]">
        <img
          src={leftLogin}
          alt="V-One"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Right side — Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative overflow-y-auto">
        {/* Theme toggle */}
        <div className="absolute top-6 right-6 z-10">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo (hidden on desktop) */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-4xl font-bold text-gradient">{appConfig.name}</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[var(--text-primary)]">
              Welcome back
            </h2>
            <p className="mt-2 text-[var(--text-secondary)]">
              Sign in to your account
            </p>
          </div>

          {/* Login Card */}
          <div className="glass-card p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm animate-slide-down">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Demo credentials */}
            <div className="mt-6 pt-6 border-t border-[var(--border-primary)]">
              <p className="text-xs text-[var(--text-tertiary)] text-center mb-3">Demo Credentials</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { role: 'Admin', email: 'admin@visiontherapy.com', pass: 'Admin123!' },
                  { role: 'Practitioner', email: 'practitioner@visiontherapy.com', pass: 'Practitioner123!' },
                  { role: 'Patient', email: 'patient@visiontherapy.com', pass: 'Patient123!' },
                ].map((cred) => (
                  <button
                    key={cred.role}
                    type="button"
                    onClick={() => {
                      setEmail(cred.email);
                      setPassword(cred.pass);
                    }}
                    className="px-3 py-2 text-xs font-medium rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)]
                             hover:bg-[var(--bg-card-hover)] hover:border-brand-500/30
                             transition-all duration-200 text-[var(--text-secondary)]"
                  >
                    {cred.role}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-[var(--text-tertiary)]">
            V-One v{appConfig.version}
          </p>
        </div>
      </div>
    </div>
  );
}
