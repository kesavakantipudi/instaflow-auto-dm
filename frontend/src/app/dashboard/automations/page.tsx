"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Search, 
  Plus, 
  Edit2, 
  Copy, 
  Trash2, 
  Play, 
  Pause, 
  HelpCircle, 
  RefreshCw, 
  CheckCircle,
  AlertCircle
} from "lucide-react";
import api from "@/lib/api";

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    fetchAutomations();
  }, [statusFilter]);

  const fetchAutomations = async () => {
    try {
      setLoading(true);
      const res = await api.getAutomations({
        search: search || undefined,
        status: statusFilter || undefined
      });
      setAutomations(res);
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to load automations.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAutomations();
  };

  const toggleStatus = async (auto: any) => {
    const nextStatus = auto.status === "active" ? "paused" : "active";
    try {
      await api.updateAutomation(auto.id, { status: nextStatus });
      setMessage({ text: `Automation "${auto.name}" is now ${nextStatus}.`, type: "success" });
      fetchAutomations();
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to update status.", type: "error" });
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await api.duplicateAutomation(id);
      setMessage({ text: "Automation duplicated successfully! Status is set to Paused.", type: "success" });
      fetchAutomations();
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to duplicate automation.", type: "error" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this automation rule?")) {
      return;
    }
    try {
      await api.deleteAutomation(id);
      setMessage({ text: "Automation deleted successfully.", type: "success" });
      fetchAutomations();
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to delete automation.", type: "error" });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Automation Workflows</h1>
          <p className="text-slate-400 text-sm mt-1">Configure keywords, trigger limits, select posts, and custom reply DM messages.</p>
        </div>
        <Link
          href="/dashboard/automations/new"
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 font-bold hover:shadow-lg hover:shadow-cyan-500/10 transition-all text-sm flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4 text-slate-950 stroke-[3]" /> Create Automation
        </Link>
      </div>

      {message.text && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center gap-3 ${
            message.type === "success"
              ? "bg-emerald-950/40 border-emerald-800 text-emerald-200"
              : "bg-red-950/40 border-red-800 text-red-200"
          }`}
        >
          {message.type === "success" ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
          {message.text}
        </div>
      )}

      {/* Search & Filters */}
      <div className="glass-panel p-4 rounded-xl border border-slate-900 flex flex-col md:flex-row items-center gap-4 justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:border-cyan-500"
            placeholder="Search by automation name or keyword..."
          />
        </form>

        <div className="flex w-full md:w-auto items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-40 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:border-cyan-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>

          <button
            onClick={fetchAutomations}
            disabled={loading}
            className="p-2.5 rounded-lg border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Automations Listing */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 border border-slate-900 bg-slate-950/20 rounded-2xl">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : automations.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-slate-900 bg-slate-950/20 rounded-2xl py-20 text-center px-6">
          <HelpCircle className="w-12 h-12 text-slate-700 mb-3" />
          <h4 className="font-bold text-slate-300 text-sm">No Automations Found</h4>
          <p className="text-slate-500 text-xs max-w-sm mt-1">
            {search || statusFilter 
              ? "No automation workflows match your filters. Try resetting search criteria." 
              : "Create comment rules to deliver direct resources automatically on comments."}
          </p>
          {!search && !statusFilter && (
            <Link
              href="/dashboard/automations/new"
              className="mt-6 px-4 py-2 rounded-lg bg-cyan-950/40 border border-cyan-950 text-cyan-400 text-xs font-semibold hover:bg-cyan-950/60"
            >
              Configure First Rule
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {automations.map((auto) => (
            <div key={auto.id} className="glass-card p-6 rounded-2xl flex flex-col justify-between space-y-6">
              {/* Top details */}
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="font-bold text-base text-slate-200 truncate">{auto.name}</h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      auto.status === "active"
                        ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/30"
                        : "bg-amber-950/40 text-amber-400 border border-amber-900/30"
                    }`}
                  >
                    {auto.status}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 text-[10px] text-slate-500">
                  <span>Trigger:</span>
                  <span className="font-semibold text-slate-300 uppercase">{auto.trigger_type.replace("_", " ")}</span>
                  <span>•</span>
                  <span>Scope:</span>
                  <span className="font-semibold text-slate-300 uppercase">{auto.scope_type.replace("_", " ")}</span>
                </div>

                {/* Keywords list */}
                {auto.keywords && auto.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {auto.keywords.map((k: any) => (
                      <span
                        key={k.id}
                        className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-semibold"
                      >
                        {k.keyword}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-900">
                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/dashboard/automations/${auto.id}`}
                    className="p-2 rounded-lg border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200"
                    title="Edit Automation"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => handleDuplicate(auto.id)}
                    className="p-2 rounded-lg border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 cursor-pointer"
                    title="Duplicate automation"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(auto.id)}
                    className="p-2 rounded-lg border border-slate-800 hover:border-slate-700 text-red-400 hover:text-red-300 cursor-pointer"
                    title="Delete automation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => toggleStatus(auto)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    auto.status === "active"
                      ? "border-amber-950/20 bg-amber-950/10 text-amber-400 hover:bg-amber-950/20"
                      : "border-emerald-950/20 bg-emerald-950/10 text-emerald-400 hover:bg-emerald-950/20"
                  }`}
                >
                  {auto.status === "active" ? (
                    <>
                      <Pause className="w-3 h-3 text-amber-400 stroke-[3]" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" /> Activate
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
