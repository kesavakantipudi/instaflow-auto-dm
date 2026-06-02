"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  MessageSquare,
  LayoutDashboard,
  Link2,
  Cpu,
  Terminal,
  FileSpreadsheet,
  Settings,
  LogOut,
  User,
  Menu,
  X
} from "lucide-react";
import api from "@/lib/api";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!api.isAuthenticated()) {
      router.push("/login");
    } else {
      setAuthorized(true);
      const details = api.getUserDetails();
      setUsername(details.username || "Creator");
      setRole(details.role || "creator");
    }
  }, [router, pathname]);

  const handleLogout = () => {
    api.logout();
  };

  const navItems = [
    { name: "Overview", path: "/dashboard", icon: LayoutDashboard },
    { name: "Linked Accounts", path: "/dashboard/accounts", icon: Link2 },
    { name: "Automations", path: "/dashboard/automations", icon: Cpu },
    { name: "Comment Simulator", path: "/dashboard/simulator", icon: Terminal },
    { name: "Activity Logs", path: "/dashboard/logs", icon: FileSpreadsheet },
    { name: "Settings", path: "/dashboard/settings", icon: Settings },
  ];

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex justify-between items-center px-6 py-4 border-b border-slate-900 bg-slate-950/80 z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-400 to-purple-500 flex items-center justify-center">
            <MessageSquare className="w-4.5 h-4.5 text-slate-900 stroke-[2.5]" />
          </div>
          <span className="font-extrabold text-lg bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            InstaFlow
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1 rounded-lg border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:static inset-y-0 left-0 w-64 border-r border-slate-900 bg-slate-950/50 backdrop-blur-xl p-6 flex flex-col justify-between transform transition-transform duration-300 z-30 md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="space-y-8">
          {/* Logo */}
          <div className="hidden md:flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 to-purple-500 flex items-center justify-center glow-teal">
              <MessageSquare className="w-5 h-5 text-slate-900 stroke-[2.5]" />
            </div>
            <span className="font-extrabold text-xl bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              InstaFlow
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path || (item.path !== "/dashboard" && pathname.startsWith(item.path));
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-cyan-500/10 border-l-2 border-cyan-500 text-cyan-400"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card */}
        <div className="space-y-4 pt-6 border-t border-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
              <User className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="overflow-hidden">
              <h4 className="font-bold text-sm text-slate-200 truncate">{username}</h4>
              <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400">
                {role} account
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-red-400 bg-red-950/10 border border-red-950/20 hover:bg-red-950/30 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            Sign Out Account
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow min-h-screen overflow-y-auto px-6 md:px-10 py-8 md:py-10 z-10">
        <div className="max-w-6xl mx-auto">{children}</div>
      </div>
    </div>
  );
}
