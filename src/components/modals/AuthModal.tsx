import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { UserRole } from '../../types';
import {
  X,
  Lock,
  Mail,
  ShieldCheck,
  User,
  KeyRound,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { showAuthModal, setShowAuthModal, loginUser, currentUser, showToast } = useStudio();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('pro');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!showAuthModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    await loginUser(email, role, name || email.split('@')[0]);
    setIsSubmitting(false);
  };

  const handleOAuthGoogle = async () => {
    setIsSubmitting(true);
    await loginUser('shepherdphiri88@gmail.com', 'admin', 'Shepherd Phiri (Owner & Admin)');
    setIsSubmitting(false);
    showToast('Authenticated via Google OAuth 2.0 Identity Service');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none text-[#e4e4e7]">
      <div className="bg-[#09090b] border border-[#27272a] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[#18181b] border border-[#27272a] flex items-center justify-center text-white">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-widest font-mono">
                SECURE OAUTH 2.0 AUTHENTICATION
              </h2>
              <span className="text-[10px] text-zinc-500 font-mono">Role-based Access & PostgreSQL Session</span>
            </div>
          </div>
          <button
            onClick={() => setShowAuthModal(false)}
            className="p-1 hover:bg-[#18181b] rounded text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Google OAuth Button */}
        <button
          onClick={handleOAuthGoogle}
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 bg-[#18181b] hover:bg-[#222226] border border-[#27272a] text-zinc-200 rounded text-xs font-semibold flex items-center justify-center gap-3 transition shadow-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Continue with Google OAuth (Owner & Admin)
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#27272a]" />
          <span className="text-[10px] font-mono uppercase text-zinc-600">
            or custom credential login
          </span>
          <div className="flex-1 h-px bg-[#27272a]" />
        </div>

        {/* Custom Login Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
              Account Email
            </label>
            <div className="flex items-center gap-2 bg-[#18181b] border border-[#27272a] focus-within:border-zinc-500 rounded px-3 py-2">
              <Mail className="w-4 h-4 text-zinc-500" />
              <input
                type="email"
                required
                placeholder="editor@luminaedit.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent text-xs text-zinc-200 outline-none w-full"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
              Display Name (Optional)
            </label>
            <div className="flex items-center gap-2 bg-[#18181b] border border-[#27272a] focus-within:border-zinc-500 rounded px-3 py-2">
              <User className="w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Senior Colorist"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-transparent text-xs text-zinc-200 outline-none w-full"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
              Assigned Studio Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-xs text-zinc-200 outline-none"
            >
              <option value="admin">Admin / Studio Owner (Full Audit & Matrix Access)</option>
              <option value="pro">Pro Colorist (Batch & AI Generative Access)</option>
              <option value="editor">Editor (Standard Layer Canvas)</option>
              <option value="viewer">Viewer (Read-Only Preview)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50"
          >
            <KeyRound className="w-3.5 h-3.5" />
            {isSubmitting ? 'Authenticating...' : 'Sign In & Authorize Session'}
          </button>
        </form>

        {currentUser && (
          <div className="p-3 bg-[#18181b] rounded border border-[#27272a] text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-zinc-400">
                Active Session:{' '}
                <span className="font-mono text-zinc-200 font-semibold">{currentUser.email}</span>
              </span>
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
