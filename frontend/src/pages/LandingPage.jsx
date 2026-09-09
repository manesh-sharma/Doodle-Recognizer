import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DoodleBackground } from '../components/DoodleBackground';
import { showToast } from '../components/Toast';
import { Sparkles, ArrowRight, Lock, User, Mail, Brain, ShieldCheck, Zap } from 'lucide-react';

export function LandingPage() {
  const { login, register } = useAuth();
  const [tab, setTab] = useState('login'); // 'login' or 'register'
  
  // Form fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showToast('Please enter both username and password', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      if (tab === 'login') {
        await login(username, password);
        showToast(`Welcome back, ${username}!`, 'success');
      } else {
        await register(username, password, email || null);
        showToast(`Account created! Welcome, ${username}!`, 'success');
      }
    } catch (err) {
      showToast(err.message || 'Authentication failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden">
      <DoodleBackground />

      {/* Top Simple Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-300">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-doodle">
            Doodle<span className="text-indigo-600 dark:text-indigo-400">AI</span>
          </span>
        </div>

        
      </header>

      {/* Hero Section with Auth Box */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16">
        {/* Left Hero Pitch */}
        <div className="flex-1 max-w-xl text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 text-xs font-bold mb-4 shadow-sm">
            <Zap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>AI Neural Sketch Recognition</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]">
            Sketch your ideas. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 font-doodle">
              AI guesses instantly.
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Experience real-time stroke-by-stroke neural doodle recognition. Free draw in{' '}
            <strong className="text-slate-800 dark:text-slate-100">Normal Mode</strong> or challenge your reflexes in the{' '}
            <strong className="text-slate-800 dark:text-slate-100">4-Round Single Player Game</strong>.
          </p>

          {/* Feature Highlights */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/80 dark:border-slate-700/80 p-3.5 rounded-2xl shadow-sm">
              <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mb-1.5" />
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Stroke Recognition</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Top 5 predictions updated on every brush release</p>
            </div>
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/80 dark:border-slate-700/80 p-3.5 rounded-2xl shadow-sm">
              <Sparkles className="w-5 h-5 text-amber-500 mb-1.5" />
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Curated Classes</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Easy, Medium, and Hard calibrated prompts</p>
            </div>
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/80 dark:border-slate-700/80 p-3.5 rounded-2xl shadow-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-500 mb-1.5" />
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Game Analytics</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Round scores, high score history & doodle exports</p>
            </div>
          </div>
        </div>

        {/* Right Auth Card */}
        <div className="w-full max-w-md">
          <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/90 dark:border-slate-700/90 relative transition-colors">
            {/* Tab Switcher */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-900/60 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => setTab('login')}
                className={`py-2 text-xs font-bold rounded-xl transition ${
                  tab === 'login'
                    ? 'bg-white dark:bg-slate-700 text-indigo-950 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setTab('register')}
                className={`py-2 text-xs font-bold rounded-xl transition ${
                  tab === 'register'
                    ? 'bg-white dark:bg-slate-700 text-indigo-950 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-900/50 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              {tab === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Email (Optional)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-900/50 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-900/50 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2 transition disabled:opacity-60"
              >
                {submitting ? (
                  <span>Processing...</span>
                ) : tab === 'login' ? (
                  <>
                    <span>Enter Game Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Register & Start Playing</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 text-center text-xs text-slate-400 dark:text-slate-500">
              SQLite Authentication • Encrypted with JWT & BCrypt
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200/60 dark:border-slate-800">
        Doodle Recognizer Game • Powered by React, Vite, FastAPI & TensorFlow
      </footer>
    </div>
  );
}
