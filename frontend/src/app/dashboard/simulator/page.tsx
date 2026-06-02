"use client";

import React, { useEffect, useState } from "react";
import { Terminal, Send, CheckCircle, HelpCircle, Loader2, Sparkles } from "lucide-react";
import api from "@/lib/api";

interface SimulatorLog {
  time: string;
  type: "info" | "success" | "warning" | "error";
  text: string;
}

export default function SimulatorPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [automations, setAutomations] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [selectedAutomationId, setSelectedAutomationId] = useState("");
  
  // Input fields
  const [username, setUsername] = useState("jane_dev");
  const [commentText, setCommentText] = useState("send me the python playlist");
  const [mediaId, setMediaId] = useState("media_post_1");
  
  // Simulator logs
  const [simLogs, setSimLogs] = useState<SimulatorLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setInitLoading(true);
      const linked = await api.getAccounts();
      setAccounts(linked);
      
      if (linked.length > 0) {
        setSelectedAccountId(linked[0].id);
        const autos = await api.getAutomations();
        setAutomations(autos.filter(a => a.instagram_account_id === linked[0].id));
      }
    } catch (err) {
      console.error("Failed to load simulator data", err);
    } finally {
      setInitLoading(false);
    }
  };

  const handleAccountChange = async (acctId: string) => {
    setSelectedAccountId(acctId);
    try {
      const autos = await api.getAutomations();
      const filtered = autos.filter(a => a.instagram_account_id === acctId);
      setAutomations(filtered);
      if (filtered.length > 0) {
        setSelectedAutomationId(filtered[0].id);
      } else {
        setSelectedAutomationId("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addLog = (text: string, type: "info" | "success" | "warning" | "error" = "info") => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setSimLogs(prev => [...prev, { time, type, text }]);
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId) {
      alert("Please link an Instagram account first.");
      return;
    }

    setLoading(true);
    setSimLogs([]); // Clear past logs
    
    addLog(`[Simulator] Constructing simulated comment event payload...`, "info");
    addLog(`[Event Source] Username: @${username} | Comment: "${commentText}" | Media ID: ${mediaId}`, "info");
    addLog(`[POST Request] Triggering /api/webhooks/simulate API endpoint...`, "info");

    try {
      // Simulate API call
      const res = await api.simulateComment({
        username,
        comment_text: commentText,
        media_id: mediaId,
        instagram_account_id: selectedAccountId
      });

      if (res.status === "ignored") {
        addLog(`[API Response] Event received: Comment IGNORED.`, "warning");
        addLog(`[Filter Match] Result: ${res.message}`, "warning");
      } else if (res.status === "failed") {
        addLog(`[API Response] Trigger matched automation rule: "${res.matched_automation}".`, "success");
        addLog(`[Instagram API] DM delivery FAILED: ${res.error}`, "error");
      } else {
        addLog(`[API Response] Trigger matched automation rule: "${res.matched_automation}".`, "success");
        addLog(`[Template Output] Content generated:\n"${res.message_sent}"`, "info");
        addLog(`[Instagram API] Direct Message successfully delivered.`, "success");
        addLog(`[Activity Logger] Saved execution trace logs inside database tables.`, "success");
        
        // Find if automation has follow-ups
        const matchedAuto = automations.find(a => a.name === res.matched_automation);
        if (matchedAuto && matchedAuto.follow_ups && matchedAuto.follow_ups.length > 0) {
          addLog(`[Follow-up Scheduler] Queued ${matchedAuto.follow_ups.length} follow-up steps in background worker thread.`, "info");
          matchedAuto.follow_ups.forEach((f: any, i: number) => {
            addLog(`[Follow-up Scheduled] Step ${i+1}: Delivers in ${f.delay_hours} hrs (simulated as ${f.delay_hours * 2} seconds locally).`, "info");
          });
        }
      }
    } catch (err: any) {
      addLog(`[API Error] Request failed: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  if (initLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-xs">Loading simulator sandbox...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Webhook Comment Simulator</h1>
        <p className="text-slate-400 text-sm mt-1">
          Sandbox console to test keyword matching, intent filters, and automated direct messages locally without linking Meta API dashboards.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Input Parameters Form */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-900 h-fit space-y-6">
          <div>
            <h3 className="font-bold text-base text-slate-100 flex items-center gap-1.5">
              <Send className="w-5 h-5 text-cyan-400" /> Event Parameters
            </h3>
            <p className="text-slate-400 text-xs mt-1">Configure the comment text and post context.</p>
          </div>

          {accounts.length === 0 ? (
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/30 text-amber-300 text-xs">
              Please connect a profile first on the Linked Accounts screen to trigger the simulator.
            </div>
          ) : (
            <form onSubmit={handleSimulate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Linked Account Context
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => handleAccountChange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:border-cyan-500"
                >
                  {accounts.map((acct) => (
                    <option key={acct.id} value={acct.id}>
                      @{acct.username}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Simulated Commenter Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                  placeholder="jane_doe"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Comment Text
                </label>
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                  placeholder="send python playlist"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Target Media ID (Matches media scoping)
                </label>
                <select
                  value={mediaId}
                  onChange={(e) => setMediaId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:border-cyan-500"
                >
                  <option value="media_post_1">Post 1: Python Playlist</option>
                  <option value="media_post_2">Post 2: AI Roadmap</option>
                  <option value="media_post_3">Post 3: Resume Template</option>
                  <option value="media_post_4">Post 4: GitHub Copilot Cheat Sheet</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 font-bold hover:shadow-lg hover:shadow-cyan-500/10 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> Executing trigger...
                  </>
                ) : (
                  <>
                    Fire Simulated Webhook <Sparkles className="w-4 h-4 text-slate-950" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Live Terminal Console Logs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-100 flex items-center gap-1.5">
              <Terminal className="w-5 h-5 text-indigo-400" /> Simulator Sandbox Terminal
            </h3>
            {simLogs.length > 0 && (
              <button
                onClick={() => setSimLogs([])}
                className="text-[10px] font-semibold text-slate-500 hover:text-slate-300"
              >
                Clear Console
              </button>
            )}
          </div>

          {/* Terminal Console Screen */}
          <div className="border border-slate-900 bg-black/90 rounded-2xl p-6 min-h-[400px] font-mono text-xs overflow-y-auto max-h-[500px] space-y-3.5 shadow-2xl relative">
            <div className="absolute top-2 right-4 text-[9px] text-slate-700 select-none">
              INSTAFLOW TERMINAL v1.0.0
            </div>

            {simLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center py-28 select-none">
                <Terminal className="w-12 h-12 text-slate-800 mb-3" />
                <span>Sandbox terminal ready. Configure parameters and click "Fire simulated webhook" to stream execution logs.</span>
              </div>
            ) : (
              simLogs.map((log, idx) => {
                let color = "text-slate-400";
                if (log.type === "success") color = "text-emerald-400";
                if (log.type === "warning") color = "text-amber-400";
                if (log.type === "error") color = "text-red-400";

                return (
                  <div key={idx} className="flex items-start gap-3 border-b border-slate-900/40 pb-2">
                    <span className="text-slate-600 select-none">[{log.time}]</span>
                    <span className={`flex-grow whitespace-pre-wrap leading-relaxed ${color}`}>
                      {log.text}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
