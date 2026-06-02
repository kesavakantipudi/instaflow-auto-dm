"use client";

import React, { useEffect, useState } from "react";
import { Link2, Unlink, CheckCircle2, ShieldAlert, Sparkles, Loader2, RefreshCw } from "lucide-react";
import api from "@/lib/api";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" }); // type: success / error

  useEffect(() => {
    fetchAccounts();
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    if (typeof window === "undefined") return;

    // Check hash parameters for access_token (Facebook OAuth Implicit Grant)
    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get("access_token");
      if (token) {
        setConnecting(true);
        setMessage({ text: "", type: "" });
        try {
          await api.connectAccount(token);
          setMessage({ text: "Instagram Business Profile linked successfully via Meta OAuth!", type: "success" });
          fetchAccounts();
        } catch (err: any) {
          setMessage({ text: err.message || "Failed to link profile via OAuth.", type: "error" });
        } finally {
          setConnecting(false);
          // Clean the url hash
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    }

    // Check query params for any login errors
    const searchParams = new URLSearchParams(window.location.search);
    const errorMsg = searchParams.get("error_message") || searchParams.get("error_description");
    if (errorMsg) {
      setMessage({ text: `Meta OAuth login rejected: ${errorMsg}`, type: "error" });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const triggerOAuth = () => {
    const appId = process.env.NEXT_PUBLIC_META_APP_ID;
    if (!appId) {
      setMessage({
        text: "Configuration error: NEXT_PUBLIC_META_APP_ID is not configured in environment settings.",
        type: "error"
      });
      return;
    }

    const redirectUri = process.env.NEXT_PUBLIC_META_REDIRECT_URI || `${window.location.origin}/dashboard/accounts`;
    const scopes = [
      "pages_show_list",
      "instagram_basic",
      "instagram_manage_messages",
      "pages_read_engagement",
      "pages_manage_metadata"
    ].join(",");

    const oauthUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=token`;
    
    setConnecting(true);
    window.location.href = oauthUrl;
  };

  const handleSimulatedConnect = async () => {
    setConnecting(true);
    setMessage({ text: "", type: "" });
    try {
      await api.connectAccount("mock_kesava_creator_token");
      setMessage({ text: "Sandbox simulation profile linked successfully!", type: "success" });
      fetchAccounts();
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to connect simulator profile.", type: "error" });
    } finally {
      setConnecting(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await api.getAccounts();
      setAccounts(res);
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to load accounts.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    if (!confirm("Are you sure you want to disconnect this Instagram Account? Automations for this account will stop running.")) {
      return;
    }
    try {
      await api.disconnectAccount(accountId);
      setMessage({ text: "Account disconnected successfully.", type: "success" });
      fetchAccounts();
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to disconnect account.", type: "error" });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Instagram Account Management</h1>
        <p className="text-slate-400 text-sm mt-1">Connect your Instagram Business or Creator Profiles to authorize Comment webhook rules.</p>
      </div>

      {message.text && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center gap-3 ${
            message.type === "success"
              ? "bg-emerald-950/40 border-emerald-800 text-emerald-200"
              : "bg-red-950/40 border-red-800 text-red-200"
          }`}
        >
          {message.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <ShieldAlert className="w-5 h-5 text-red-400" />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Link Account Form */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 h-fit space-y-6">
          <div>
            <h3 className="font-bold text-base text-slate-100 flex items-center gap-1.5">
              <Link2 className="w-5 h-5 text-cyan-400" /> Connect Profile
            </h3>
            <p className="text-slate-400 text-xs mt-1">
              Link your Instagram profile to start automated DMs.
            </p>
          </div>

          <button
            onClick={triggerOAuth}
            disabled={connecting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold hover:shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
          >
            {connecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" /> Authenticating...
              </>
            ) : (
              "Connect Instagram via Facebook"
            )}
          </button>

          {/* Local testing helper */}
          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-900/30 space-y-2.5">
            <h4 className="text-xs font-bold text-purple-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Sandbox Simulation Notice
            </h4>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Don't have real Facebook Developer credentials? Connect immediately by generating a simulated account with a mock token.
            </p>
            <button
              onClick={handleSimulatedConnect}
              disabled={connecting}
              className="w-full py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-cyan-400 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
            >
              Link Sandbox Profile <Sparkles className="w-3 h-3 text-cyan-400" />
            </button>
          </div>
        </div>

        {/* Connected Accounts List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-base text-slate-100">Connected Accounts ({accounts.length})</h3>
            <button
              onClick={fetchAccounts}
              disabled={loading}
              className="p-2 rounded-lg border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20 border border-slate-900 bg-slate-950/20 rounded-2xl">
              <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center border border-slate-900 bg-slate-950/20 rounded-2xl py-16 text-center px-6">
              <Link2 className="w-12 h-12 text-slate-700 mb-3" />
              <h4 className="font-bold text-slate-300 text-sm">No Accounts Connected</h4>
              <p className="text-slate-500 text-xs max-w-xs mt-1">
                Link an Instagram business profile using the form to create trigger automation rules.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {accounts.map((acct) => (
                <div key={acct.id} className="glass-card p-6 rounded-2xl flex flex-col justify-between space-y-6">
                  {/* Account Metadata */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center font-black text-cyan-400 uppercase text-lg">
                      {acct.username.substring(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-200">@{acct.username}</h4>
                      <span className="text-[10px] font-semibold text-slate-500 capitalize">{acct.account_type} Account</span>
                      
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="text-[10px] text-slate-400 font-medium">Webhooks Active</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-4 border-t border-slate-900">
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Instagram ID:</span>
                      <span className="font-mono text-slate-300">{acct.id}</span>
                    </div>
                    {acct.page_id && (
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>FB Page ID:</span>
                        <span className="font-mono text-slate-300">{acct.page_id}</span>
                      </div>
                    )}
                  </div>

                  {/* Disconnect Button */}
                  <button
                    onClick={() => handleDisconnect(acct.id)}
                    className="w-full py-2.5 rounded-xl border border-red-950/20 bg-red-950/10 text-red-400 font-bold hover:bg-red-950/30 transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer"
                  >
                    <Unlink className="w-3.5 h-3.5" /> Disconnect Profile
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
