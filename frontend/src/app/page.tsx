"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, MessageSquare, Zap, Target, ShieldCheck, Heart } from "lucide-react";
import api from "@/lib/api";

export default function Home() {
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    setIsAuth(api.isAuthenticated());
  }, []);

  return (
    <div className="relative min-h-screen bg-[#020617] text-slate-100 flex flex-col justify-between overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 to-purple-500 flex items-center justify-center glow-teal">
            <MessageSquare className="w-5 h-5 text-slate-900 stroke-[2.5]" />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            InstaFlow
          </span>
        </div>
        
        <div>
          {isAuth ? (
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 text-slate-950 font-bold hover:shadow-lg hover:shadow-cyan-500/20 transition-all flex items-center gap-1 text-sm"
            >
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-slate-300 hover:text-white font-medium text-sm transition-colors">
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-900/60 text-slate-100 hover:border-cyan-500 hover:bg-slate-900 transition-all text-sm font-semibold"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="w-full max-w-5xl mx-auto px-6 py-16 text-center z-10 flex-grow flex flex-col justify-center">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-cyan-400 text-xs font-semibold mb-6 shadow-inner tracking-wider uppercase">
          <Sparkles className="w-3.5 h-3.5" /> Automate Comment to DM Workflows
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
          Turn Comments Into{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Instant Sales
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Scale your Instagram marketing automatically. Detect comment triggers on your posts and reels, match keywords with AI, and instantly fire resources straight to user DMs.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-20">
          {isAuth ? (
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-600 text-white font-bold hover:opacity-95 hover:shadow-xl hover:shadow-cyan-500/10 transition-all flex items-center justify-center gap-2"
            >
              Open Your Dashboard <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-purple-500 text-slate-950 font-extrabold hover:shadow-xl hover:shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
              >
                Start Free Trial <ArrowRight className="w-5 h-5 text-slate-950" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-slate-800 bg-slate-900/30 text-slate-300 hover:border-slate-700 hover:text-white transition-all flex items-center justify-center"
              >
                Connect with Demo Account
              </Link>
            </>
          )}
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mt-8">
          <div className="glass-card p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-slate-100">Instant DM Delivery</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Responds to post comments in milliseconds. Keep your engagement rates high and strike while the lead is hot.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
              <Target className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-slate-100">AI Intent Detection</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Don't lose leads to typos. Our AI models detect the user's intent to request resources, even with spelling variations.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-slate-100">Fully Simulated Sandbox</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Configure, edit, and test all automations with our live simulator dashboard without requiring verified developer accounts.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 py-6 text-center z-10">
        <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
          Made with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> for Instagram Creators. © 2026 InstaFlow Auto DM.
        </p>
      </footer>
    </div>
  );
}
