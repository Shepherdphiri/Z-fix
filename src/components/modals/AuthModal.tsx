import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { UserRole } from '../../types';
import {
  X,
  Lock,
  Mail,
  User,
  KeyRound,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  CheckCircle2,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { showAuthModal, setShowAuthModal, loginUser, currentUser, showToast } = useStudio();

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('pro');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!showAuthModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both your email address and password');
      return;
    }
    setIsSubmitting(true);
    // If signing up as shepherdphiri88@gmail.com, automatically assign admin role
    const assignedRole = email.toLowerCase() === 'shepherdphiri88@gmail.com' ? 'admin' : role;
    const displayName = name || (email.toLowerCase() === 'shepherdphiri88@gmail.com' ? 'Shepherd Zisper Phiri (Admin)' : email.split('@')[0]);

    await loginUser(email, assignedRole, displayName);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none text-[#e4e4e7]">
      <div className="bg-[#09090b] border border-[#27272a] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[#18181b] border border-[#27272a] flex items-center justify-center text-indigo-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-widest font-mono">
                {authMode === 'signin' ? 'Studio Sign In' : 'Create Studio Account'}
              </h2>
              <span className="text-[10px] text-zinc-500 font-mono">
                Email & Password Authentication
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowAuthModal(false)}
            className="p-1 hover:bg-[#18181b] rounded text-zinc-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div className="grid grid-cols-2 p-1 bg-[#18181b] rounded-lg border border-[#27272a] text-xs font-semibold">
          <button
            type="button"
            onClick={() => setAuthMode('signin')}
            className={`py-2 rounded-md flex items-center justify-center gap-1.5 transition ${
              authMode === 'signin'
                ? 'bg-zinc-800 text-white shadow-sm font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('signup')}
            className={`py-2 rounded-md flex items-center justify-center gap-1.5 transition ${
              authMode === 'signup'
                ? 'bg-zinc-800 text-white shadow-sm font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Sign Up</span>
          </button>
        </div>

        {/* Email & Password Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {authMode === 'signup' && (
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                Full Name
              </label>
              <div className="flex items-center gap-2 bg-[#18181b] border border-[#27272a] focus-within:border-indigo-500 rounded px-3 py-2">
                <User className="w-4 h-4 text-zinc-500 shrink-0" />
                <input
                  type="text"
                  placeholder="e.g. Shepherd Phiri"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-transparent text-xs text-zinc-200 outline-none w-full placeholder:text-zinc-600"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
              Email Address
            </label>
            <div className="flex items-center gap-2 bg-[#18181b] border border-[#27272a] focus-within:border-indigo-500 rounded px-3 py-2">
              <Mail className="w-4 h-4 text-zinc-500 shrink-0" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent text-xs text-zinc-200 outline-none w-full placeholder:text-zinc-600"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                Password
              </label>
            </div>
            <div className="flex items-center gap-2 bg-[#18181b] border border-[#27272a] focus-within:border-indigo-500 rounded px-3 py-2">
              <Lock className="w-4 h-4 text-zinc-500 shrink-0" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent text-xs text-zinc-200 outline-none w-full placeholder:text-zinc-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {authMode === 'signup' && (
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                Account Workspace Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-xs text-zinc-200 outline-none cursor-pointer"
              >
                <option value="admin">Admin (Full Studio & Oversight Access)</option>
                <option value="pro">Pro Colorist (AI Generative & Batch Processing)</option>
                <option value="editor">Editor (Standard Layer Canvas)</option>
                <option value="viewer">Viewer (Read-Only Preview)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50 cursor-pointer shadow-lg shadow-indigo-600/20"
          >
            <KeyRound className="w-3.5 h-3.5" />
            {isSubmitting
              ? 'Verifying...'
              : authMode === 'signin'
              ? 'Sign In to Account'
              : 'Create Account & Sign In'}
          </button>
        </form>

        {currentUser && (
          <div className="p-3 bg-[#18181b] rounded border border-[#27272a] text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="font-medium text-white block">{currentUser.name}</span>
                <span className="text-[10px] font-mono text-zinc-500">
                  {currentUser.email} • Role: <strong className="text-indigo-400 uppercase">{currentUser.role}</strong>
                </span>
              </div>
            </div>
            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-black text-indigo-400 border border-indigo-900/50">
              {currentUser.role}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
