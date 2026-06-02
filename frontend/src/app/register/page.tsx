"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageSquare, Mail, Lock, User, ArrowRight, Loader2, Award } from "lucide-react";
import api from "@/lib/api";

export default function Register() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("creator");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.register({
        email,
        password,
        full_name: fullName,
        role
      });
      // Automatically log user in after successful registration
      await api.login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to register. Email may already be in use.");
    } finally {
      setLoading(false);
    }
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
          <p className="text-slate-400 text-sm">Create automation rules for comment DMs</p>
        </div>

        {/* Register Card */}
        <div className="glass-panel p-8 rounded-2xl border border-slate-800 shadow-2xl">
          <h2 className="text-xl font-bold text-slate-100 mb-6 text-center">Create Your Account</h2>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-200 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500"
                  placeholder="Kesava Kantipudi"
                  required
                />
              </div>
            </div>

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
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500"
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Account Role
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole("creator")}
                  className={`py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    role === "creator"
                      ? "border-cyan-500 bg-cyan-950/20 text-cyan-400 shadow-lg shadow-cyan-500/5"
                      : "border-slate-800 bg-slate-900/20 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <User className="w-4 h-4" /> Creator
                </button>
                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  className={`py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    role === "admin"
                      ? "border-purple-500 bg-purple-950/20 text-purple-400 shadow-lg shadow-purple-500/5"
                      : "border-slate-800 bg-slate-900/20 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <Award className="w-4 h-4" /> Admin
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-4 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 font-bold hover:shadow-lg hover:shadow-cyan-500/10 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> Registering...
                </>
              ) : (
                <>
                  Register & Sign In <ArrowRight className="w-4 h-4 text-slate-950" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footnote */}
        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
