"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Link2,
  Cpu,
  MessageSquareCode,
  Send,
  Percent,
  Key,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import api from "@/lib/api";

interface SummaryData {
  total_accounts: number;
  total_automations: number;
  total_comments_processed: number;
  total_dms_sent: number;
  conversion_rate: number;
  top_performing_keyword: string;
  recent_activity: any[];
}

export default function Dashboard() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [charts, setCharts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, chartRes] = await Promise.all([
        api.getAnalyticsSummary(),
        api.getAnalyticsCharts(),
      ]);
      setSummary(sumRes);
      setCharts(chartRes);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard metrics.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm">Aggregating platform metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Overview Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time statistics of comment rules and automated DM delivery.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/simulator"
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm font-semibold hover:border-cyan-500 hover:text-white transition-all text-slate-300"
          >
            Launch Webhook Simulator
          </Link>
          <Link
            href="/dashboard/automations/new"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 font-bold hover:shadow-lg hover:shadow-cyan-500/10 transition-all text-sm"
          >
            Create Automation
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Cards Matrix */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Linked Accounts */}
          <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Connected Accounts</span>
                <h3 className="text-3xl font-extrabold mt-2 text-white">{summary.total_accounts}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                <Link2 className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <Link href="/dashboard/accounts" className="text-xs font-bold text-cyan-400 hover:text-cyan-300 mt-4 flex items-center gap-1">
              Link account <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 2: Total Automations */}
          <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Workflows</span>
                <h3 className="text-3xl font-extrabold mt-2 text-white">{summary.total_automations}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <Cpu className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <Link href="/dashboard/automations" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 mt-4 flex items-center gap-1">
              Configure automations <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 3: Comments Processed */}
          <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Processed Comments</span>
                <h3 className="text-3xl font-extrabold mt-2 text-white">{summary.total_comments_processed}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                <MessageSquareCode className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <Link href="/dashboard/logs" className="text-xs font-bold text-purple-400 hover:text-purple-300 mt-4 flex items-center gap-1">
              Audit activity logs <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 4: DMs Sent */}
          <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">DMs Successfully Sent</span>
                <h3 className="text-3xl font-extrabold mt-2 text-white">{summary.total_dms_sent}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <Send className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <span className="text-[10px] text-slate-500 mt-4 block">Delivered in near real-time</span>
          </div>

          {/* Card 5: Conversion Rate */}
          <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Conversion Ratio</span>
                <h3 className="text-3xl font-extrabold mt-2 text-white">{summary.conversion_rate}%</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                <Percent className="w-5 h-5 text-violet-400" />
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-400 mt-4 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Processed comment conversion
            </span>
          </div>

          {/* Card 6: Top Performing Keyword */}
          <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Top Performing Keyword</span>
                <h3 className="text-2xl font-extrabold mt-2 text-white truncate max-w-[180px]">
                  {summary.top_performing_keyword}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <Key className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <span className="text-[10px] text-slate-500 mt-5 block">Highest matched triggers</span>
          </div>
        </div>
      )}

      {/* Analytics Graph & Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Column */}
        <div className="glass-card p-6 rounded-2xl lg:col-span-2 flex flex-col justify-between min-h-[350px]">
          <div>
            <h3 className="font-bold text-base text-slate-100">Automation Performance Charts</h3>
            <p className="text-slate-400 text-xs mt-0.5">Comparative timeseries review of comments processed vs. delivered DMs.</p>
          </div>
          <div className="w-full h-64 mt-6">
            {mounted && charts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "12px", fontSize: "12px" }}
                    labelStyle={{ color: "#94a3b8", fontWeight: "bold" }}
                  />
                  <Area type="monotone" dataKey="sent" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSent)" name="Sent DMs" />
                  <Area type="monotone" dataKey="processed" stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray="5 5" fill="none" name="Comments" />
                  <Area type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={1.5} fillOpacity={1} fill="url(#colorFailed)" name="Failed" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                No timeseries records available. Make simulated comments to populate.
              </div>
            )}
          </div>
        </div>

        {/* Activity Feed Column */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-100">Recent Engagement Activity</h3>
            <p className="text-slate-400 text-xs mt-0.5">Auditing feed of last triggered comment actions.</p>
          </div>
          
          <div className="flex-grow space-y-4 mt-6 overflow-y-auto max-h-[260px] pr-1">
            {summary && summary.recent_activity.length > 0 ? (
              summary.recent_activity.map((activity) => (
                <div key={activity.id} className="p-3 rounded-xl border border-slate-900 bg-slate-950/40 flex items-start gap-3">
                  <div className="mt-0.5">
                    {activity.status === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <div className="flex-grow overflow-hidden">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs text-slate-200">@{activity.username}</span>
                      <span className="text-[9px] text-slate-500 font-semibold">
                        {new Date(activity.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      "{activity.comment_text}"
                    </p>
                    <span className="inline-block px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[9px] text-cyan-400 font-semibold mt-1">
                      {activity.trigger_matched}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs text-center py-8">
                <HelpCircle className="w-8 h-8 text-slate-700 mb-2" />
                No comments registered yet.<br />Use simulator to test.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
