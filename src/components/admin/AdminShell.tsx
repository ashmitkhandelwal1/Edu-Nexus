"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  GraduationCap as StudentIcon,
  CalendarCheck,
  FileSpreadsheet,
  Clock,
  FileText,
  CreditCard,
  Megaphone,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBellDropdown } from "@/components/admin/NotificationBellDropdown";

interface AdminShellProps {
  adminEmail: string;
  children: React.ReactNode;
}

export function AdminShell({ adminEmail, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      setIsLoggingOut(false);
    }
  };

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/admin", exact: true },
    { label: "Students", icon: StudentIcon, href: "/admin/students", exact: false },
    { label: "Teachers & Staff", icon: Users, href: "/admin/teachers", exact: false },
    { label: "Classes & Sections", icon: BookOpen, href: "/admin/classes", exact: false },
    { label: "Attendance Logs", icon: CalendarCheck, href: "/admin/attendance", exact: false },
    { label: "Timetable", icon: Clock, href: "/admin/timetable", exact: false },
    { label: "Assignments", icon: FileText, href: "/admin/assignments", exact: false },
    { label: "Exams & Marks", icon: FileSpreadsheet, href: "/admin/exams", exact: false },
    { label: "Fee Management", icon: CreditCard, href: "/admin/fees", exact: false },
    { label: "Announcements", icon: Megaphone, href: "/admin/announcements", exact: false },
    { label: "Platform Settings", icon: Settings, href: "/admin/settings", exact: true },
  ];

  const isNavActive = (href: string, exact: boolean) => {
    if (href === "#") return false;
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-950 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Area */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-white">
                EDU<span className="text-blue-500">NEXUS</span>
              </span>
              <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-400 -mt-1">
                Admin Command
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Operations
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(item.href, item.exact);
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* System Status in Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/80 m-4 rounded-xl bg-slate-900/60">
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-300">Cluster Connected</span>
          </div>
          <p className="text-[11px] text-slate-500">MongoDB Atlas • Mongoose</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="hidden sm:inline">Institution:</span>
              <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200">
                Nexus Global Academy
              </span>
            </div>
          </div>

          {/* Right Header items */}
          <div className="flex items-center gap-4">
            <NotificationBellDropdown />

            {/* Admin Profile & Logout */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-slate-900 truncate max-w-[140px] sm:max-w-none">
                  {adminEmail}
                </span>
                <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">
                  Super Administrator
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="h-8 px-2.5 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 gap-1.5"
                title="Log out of session"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {isLoggingOut ? "Leaving..." : "Log Out"}
                </span>
              </Button>
            </div>
          </div>
        </header>

        {/* Child Pages Body */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1">{children}</main>
      </div>
    </div>
  );
}
