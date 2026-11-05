"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  Clock,
  CalendarCheck,
  FileText,
  Megaphone,
  LogOut,
  Menu,
  X,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface TeacherShellProps {
  teacherEmail: string;
  teacherName?: string;
  children: React.ReactNode;
}

export function TeacherShell({ teacherEmail, teacherName, children }: TeacherShellProps) {
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
    { label: "Dashboard", icon: LayoutDashboard, href: "/teacher", exact: true },
    { label: "My Classes", icon: BookOpen, href: "/teacher/classes", exact: false },
    { label: "My Timetable", icon: Clock, href: "/teacher/timetable", exact: false },
    { label: "Attendance", icon: CalendarCheck, href: "/teacher/attendance", exact: false },
    { label: "Assignments", icon: FileText, href: "/teacher/assignments", exact: false },
    { label: "Announcements", icon: Megaphone, href: "/announcements", exact: false },
  ];

  const isNavActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <Link href="/teacher" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white block">EDUNEXUS</span>
              <span className="text-[10px] text-blue-400 font-bold tracking-widest uppercase block">
                Teacher Portal
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = isNavActive(item.href, item.exact);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  active
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* User Profile & Sign Out Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
              {teacherName ? teacherName[0] : "T"}
            </div>
            <div className="overflow-hidden">
              <span className="block text-xs font-bold text-white truncate">
                {teacherName || "Faculty Member"}
              </span>
              <span className="block text-[10px] text-slate-400 truncate">{teacherEmail}</span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full justify-start text-xs border-slate-800 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 gap-2 h-8"
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-xs font-medium text-slate-400 hidden sm:inline-block">
              Faculty Workspace • Academic Session 2026-27
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/announcements">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs h-8 gap-1.5"
              >
                <Megaphone className="w-3.5 h-3.5 text-blue-400" /> Announcements
              </Button>
            </Link>
          </div>
        </header>

        {/* Child Pages */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}

