import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Scan, 
  LogIn, 
  Lock, 
  Mail, 
  UserCheck
} from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('engineer@roadsense.ai');
  const [password, setPassword] = useState('••••••••••••');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // Frontend-only demo login
    navigate('/dashboard');
  };

  const handleDemoAccess = () => {
    navigate('/dashboard');
  };

  return (
    <div className="py-16 lg:py-24 flex items-center justify-center min-h-[75vh]">
      <div className="max-w-md w-full mx-auto px-4 sm:px-6">
        
        {/* Glow behind card */}
        <div className="relative">
          <div className="absolute -top-10 -left-10 w-48 h-48 bg-cyber-blue/20 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-cyber-cyan/20 blur-3xl rounded-full pointer-events-none" />

          {/* Login Card */}
          <div className="glass-panel rounded-3xl p-8 sm:p-10 border border-slate-700/80 shadow-2xl relative z-10 space-y-6">
            
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyber-blue to-cyber-cyan p-0.5 mx-auto flex items-center justify-center shadow-glow-cyan">
                <div className="w-full h-full bg-navy-950 rounded-[14px] flex items-center justify-center">
                  <Scan className="w-6 h-6 text-cyber-cyan" />
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Civil Portal Access
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Log in to inspect municipal road surveys & AI detections
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative rounded-xl overflow-hidden">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@agency.gov"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-navy-900/90 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative rounded-xl overflow-hidden">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-navy-900/90 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-all"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-cyber-blue to-cyan-500 hover:from-blue-600 hover:to-cyan-400 shadow-glow-cyan transition-all transform hover:-translate-y-0.5"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </button>
              </div>
            </form>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-xs font-mono">OR</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* Continue as Demo User Button */}
            <div>
              <button
                type="button"
                onClick={handleDemoAccess}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-sm text-slate-200 hover:text-white bg-navy-850 hover:bg-navy-750 border border-slate-700 hover:border-cyber-cyan/40 transition-all"
              >
                <UserCheck className="w-4 h-4 text-cyber-cyan" />
                <span>Continue as Demo User</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-navy-950/60 border border-slate-800 text-[11px] font-mono text-slate-400 text-center">
              Frontend demo mode: Authentication bypass active.
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
