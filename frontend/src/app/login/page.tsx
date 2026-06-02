"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageSquare, Mail, Lock, ArrowRight, Loader2, Globe } from "lucide-react";
import api from "@/lib/api";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (api.isAuthenticated()) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      // In production we would receive this token from Google Auth SDK
      const mockGoogleToken = "mock_google_token";
      await api.loginWithGoogle(mockGoogleToken);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to log in with Google.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const loadDemoUser = () => {
    setEmail("creator@instaflow.io");
    setPassword("password123");
  };

  return (
    <div className="relative min-h-screen bg-[#020617] text-slate-100 flex items-center justify-center p-6 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] rounded-full bg-cyan-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[20%] w-[40%] h-[40%] rounded-full bg-purple-500/5 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-purple-500 flex items-center justify-center glow-teal">
              <MessageSquare className="w-5 h-5 text-slate-900 stroke-[2.5]" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              InstaFlow
            </span>
          </Link>
          <p className="text-slate-400 text-sm">Automate comments to DMs instantly</p>
        </div>

        {/* Login Card */}
        <div className="glass-panel p-8 rounded-2xl border border-slate-800 shadow-2xl">
          <h2 className="text-xl font-bold text-slate-100 mb-6 text-center">Welcome Back</h2>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-200 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 font-bold hover:shadow-lg hover:shadow-cyan-500/10 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> Logging in...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4 text-slate-950" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0b0f19] px-3 text-slate-500 font-semibold tracking-wider">
                Or Continue With
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full py-3 rounded-xl border border-slate-800 bg-slate-900/40 text-slate-200 hover:bg-slate-900 hover:border-slate-700 transition-all flex items-center justify-center gap-2 text-sm font-semibold mb-4"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Globe className="w-4 h-4 text-cyan-400" />
            )}
            Sign in with Google
          </button>
          
          <button
            type="button"
            onClick={loadDemoUser}
            className="w-full py-2 rounded-xl bg-purple-950/20 border border-purple-900/30 text-purple-300 hover:bg-purple-950/40 transition-all text-xs font-semibold"
          >
            Fill Demo Admin Credentials
          </button>
        </div>

        {/* Footnote */}
        <p className="mt-6 text-center text-sm text-slate-500">
          Don't have an account?{" "}
          <Link href="/register" className="text-cyan-400 hover:text-cyan-300 font-semibold underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
