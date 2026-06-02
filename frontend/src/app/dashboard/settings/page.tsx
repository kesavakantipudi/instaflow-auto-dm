"use client";

import React, { useEffect, useState } from "react";
import { Settings, Save, CheckCircle, ShieldAlert, Key, Loader2 } from "lucide-react";
import api from "@/lib/api";

export default function SettingsPage() {
  const [verifyToken, setVerifyToken] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [appId, setAppId] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [defaultDmMessage, setDefaultDmMessage] = useState("");
  const [timezone, setTimezone] = useState("UTC");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.getSettings();
      setVerifyToken(res.verify_token || "instaflow_verify_token");
      setAccessToken(res.access_token || "");
      setAppId(res.app_id || "");
      setAppSecret(res.app_secret || "");
      setDefaultDmMessage(res.default_dm_message || "");
      setTimezone(res.timezone || "UTC");
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to load settings.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", type: "" });

    try {
      await api.updateSettings({
        verify_token: verifyToken,
        access_token: accessToken,
        app_id: appId,
        app_secret: appSecret,
        default_dm_message: defaultDmMessage,
        timezone: timezone
      });
      setMessage({ text: "Configurations saved successfully!", type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 4000);
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to save settings.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-xs">Retrieving preferences...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Configuration Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Configure Meta API Application credentials, Webhook Verify Tokens, and defaults.</p>
      </div>

      {message.text && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center gap-3 ${
            message.type === "success"
              ? "bg-emerald-950/40 border-emerald-800 text-emerald-200"
              : "bg-red-950/40 border-red-800 text-red-200"
          }`}
        >
          {message.type === "success" ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <ShieldAlert className="w-5 h-5 text-red-400" />}
          {message.text}
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: API secrets */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-900 space-y-6">
          <h3 className="font-bold text-base border-b border-slate-900 pb-3 flex items-center gap-2">
            <Key className="w-5 h-5 text-cyan-400" /> Developer Meta API Credentials
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Meta App ID
              </label>
              <input
                type="text"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm"
                placeholder="e.g. 8472912401824"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Meta App Secret
              </label>
              <input
                type="password"
                value={appSecret}
                onChange={(e) => setAppSecret(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm"
                placeholder="••••••••••••••••••••••••••••••••"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-900/60">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Webhook Verification Token (verify_token)
              </label>
              <input
                type="text"
                value={verifyToken}
                onChange={(e) => setVerifyToken(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono"
                placeholder="e.g. instaflow_verify_token"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Provide this token inside the Meta Graph API App Webhooks Dashboard subscriptions card.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                System Default Access Token
              </label>
              <textarea
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                rows={3}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-600 focus:border-cyan-500"
                placeholder="EAAW..."
              />
            </div>
          </div>
        </div>

        {/* Right Side: default styles preferences */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-6 h-fit">
          <h3 className="font-bold text-base border-b border-slate-900 pb-3 flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" /> Platform Defaults
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Default DM Template message
              </label>
              <textarea
                value={defaultDmMessage}
                onChange={(e) => setDefaultDmMessage(e.target.value)}
                rows={4}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                placeholder="Hey {username}!..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Default Account Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-300 focus:border-cyan-500"
              >
                <option value="UTC">Coordinated Universal Time (UTC)</option>
                <option value="EST">Eastern Standard Time (EST)</option>
                <option value="PST">Pacific Standard Time (PST)</option>
                <option value="IST">Indian Standard Time (IST)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 mt-4 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 font-bold hover:shadow-lg hover:shadow-cyan-500/10 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> Saving...
                </>
              ) : (
                <>
                  Save Changes <Save className="w-4 h-4 text-slate-950 stroke-[3]" />
                </>
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
