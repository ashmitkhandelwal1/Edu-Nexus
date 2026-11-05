"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  User,
  CalendarCheck,
  Clock,
  FileText,
  Award,
  CreditCard,
  Megaphone,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface StudentShellProps {
  studentEmail: string;
  studentName?: string;
  admissionNumber?: string;
  className?: string;
  section?: string;
  children: React.ReactNode;
}

export function StudentShell({
  studentEmail,
  studentName,
  admissionNumber,
  className,
  section,
  children,
}: StudentShellProps) {
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
    { label: "Dashboard", icon: LayoutDashboard, href: "/student", exact: true },
    { label: "My Profile", icon: User, href: "/student/profile", exact: false },
    { label: "My Attendance", icon: CalendarCheck, href: "/student/attendance", exact: false },
    { label: "My Timetable", icon: Clock, href: "/student/timetable", exact: false },
    { label: "Assignments", icon: FileText, href: "/student/assignments", exact: false },
    { label: "Exam Results", icon: Award, href: "/student/results", exact: false },
    { label: "Fee Details", icon: CreditCard, href: "/student/fees", exact: false },
    { label: "Announcements", icon: Megaphone, href: "/announcements", exact: false },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <Link href="/student" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white block">
                EDUNEXUS
              </span>
              <span className="text-[10px] tracking-wider text-sky-400 font-semibold uppercase">
                Student Portal
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student Badge Card */}
        <div className="p-4 mx-4 my-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-sm shrink-0">
              {studentName ? studentName.charAt(0).toUpperCase() : "S"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-white truncate">
                {studentName || "Student Account"}
              </div>
              <div className="text-xs text-slate-400 truncate">
                {className && section ? `${className} - ${section}` : studentEmail}
              </div>
              {admissionNumber && (
                <div className="text-[11px] text-sky-400/90 font-mono mt-0.5">
                  Adm: {admissionNumber}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-500/20 font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/70"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Footer */}
        <div className="p-4 border-t border-slate-800">
          <Button
            onClick={handleLogout}
            disabled={isLoggingOut}
            variant="ghost"
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl gap-3 text-sm h-11"
          >
            <LogOut className="w-4 h-4" />
            <span>{isLoggingOut ? "Signing out..." : "Logout"}</span>
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar for Mobile */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-bold text-white text-base">Student Portal</span>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 font-medium">
            {className && section ? `${className} • ${section}` : "Student"}
          </span>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

