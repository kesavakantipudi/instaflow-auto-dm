"use client";

import React, { useEffect, useState } from "react";
import { 
  FileSpreadsheet, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Filter,
  Eye,
  FileCode
} from "lucide-react";
import api from "@/lib/api";

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("activity"); // activity / webhooks
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [usernameFilter, setUsernameFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState("");
  
  // Selected JSON popup for webhook payloads
  const [selectedJson, setSelectedJson] = useState<any | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [activeTab, statusFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError("");
      if (activeTab === "activity") {
        const res = await api.getActivityLogs({
          username: usernameFilter || undefined,
          status: statusFilter || undefined
        });
        setLogs(res);
      } else {
        const res = await api.getWebhookLogs();
        setWebhookLogs(res);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load logs details.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Audit & Webhook Logs</h1>
          <p className="text-slate-400 text-sm mt-1">Audit execution logs, DM deliveries, and inspect raw incoming webhook payloads.</p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="p-2.5 rounded-lg border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-900 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab("activity")}
          className={`pb-3 transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "activity"
              ? "border-b-2 border-cyan-500 text-cyan-400"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" /> Activity Execution Logs
        </button>
        <button
          onClick={() => setActiveTab("webhooks")}
          className={`pb-3 transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "webhooks"
              ? "border-b-2 border-cyan-500 text-cyan-400"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileCode className="w-4 h-4" /> Raw Webhooks Payload
        </button>
      </div>

      {/* Filters (conditional for activity logs) */}
      {activeTab === "activity" && (
        <div className="glass-panel p-4 rounded-xl border border-slate-900 flex flex-col md:flex-row items-center gap-4 justify-between">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={usernameFilter}
              onChange={(e) => setUsernameFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:border-cyan-500"
              placeholder="Search by username..."
            />
          </form>

          <div className="flex w-full md:w-auto items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-40 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:border-cyan-500"
            >
              <option value="">All Statuses</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      )}

      {/* Logs Table Area */}
      {loading ? (
        <div className="flex justify-center items-center py-24 border border-slate-900 bg-slate-950/20 rounded-2xl">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : activeTab === "activity" ? (
        logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-slate-900 bg-slate-950/20 rounded-2xl py-20 text-center px-6">
            <FileSpreadsheet className="w-12 h-12 text-slate-700 mb-3" />
            <h4 className="font-bold text-slate-300 text-sm">No activity logs found</h4>
            <p className="text-slate-500 text-xs max-w-sm mt-1">
              Comments triggered by automations will generate logging traces.
            </p>
          </div>
        ) : (
          <div className="border border-slate-900 rounded-2xl overflow-hidden bg-slate-950/20">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-900 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Trigger Comment</th>
                    <th className="px-6 py-4">Trigger Match</th>
                    <th className="px-6 py-4">Message Sent</th>
                    <th className="px-6 py-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/20 transition-all">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.status === "success" ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Success
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 text-red-400 font-semibold cursor-pointer"
                            onClick={() => alert(`Error Details:\n${log.error_detail || "Unknown error"}`)}
                            title="Click to view details"
                          >
                            <XCircle className="w-4 h-4 text-red-400" /> Failed <AlertCircle className="w-3 h-3 text-slate-500" />
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-200 whitespace-nowrap">
                        @{log.username}
                      </td>
                      <td className="px-6 py-4 max-w-[150px] truncate text-slate-300" title={log.comment_text}>
                        {log.comment_text}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-cyan-400 font-semibold">
                          {log.trigger_matched}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-[200px] truncate text-slate-400" title={log.dm_sent}>
                        {log.dm_sent}
                      </td>
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : webhookLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-slate-900 bg-slate-950/20 rounded-2xl py-20 text-center px-6">
          <FileCode className="w-12 h-12 text-slate-700 mb-3" />
          <h4 className="font-bold text-slate-300 text-sm">No webhook logs received</h4>
          <p className="text-slate-500 text-xs max-w-sm mt-1">
            Raw incoming Meta/Instagram HTTP POST JSON bodies will be saved and audited here.
          </p>
        </div>
      ) : (
        <div className="border border-slate-900 rounded-2xl overflow-hidden bg-slate-950/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-900 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Payload Preview</th>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {webhookLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/20 transition-all">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          log.status === "success" 
                            ? "bg-emerald-950/40 text-emerald-400" 
                            : "bg-amber-950/40 text-amber-400"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-[10px] text-slate-400 max-w-md truncate">
                      {JSON.stringify(log.payload)}
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedJson(log.payload)}
                        className="px-3 py-1 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold hover:text-white flex items-center gap-1.5 ml-auto cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* JSON Inspector Popup Modal */}
      {selectedJson && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="glass-panel w-full max-w-2xl rounded-2xl border border-slate-800 p-6 flex flex-col justify-between max-h-[85vh] shadow-2xl">
            <div>
              <h3 className="font-bold text-base text-slate-100 mb-2">Raw JSON payload Inspector</h3>
              <p className="text-slate-500 text-xs mb-4">Webhook HTTP POST message body schema.</p>
            </div>
            
            <div className="flex-grow bg-slate-950/80 border border-slate-900 rounded-xl p-4 overflow-auto font-mono text-[10px] text-slate-300 max-h-[50vh]">
              <pre>{JSON.stringify(selectedJson, null, 2)}</pre>
            </div>

            <button
              onClick={() => setSelectedJson(null)}
              className="mt-6 w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 font-bold text-slate-200 hover:text-white transition-all text-xs"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
