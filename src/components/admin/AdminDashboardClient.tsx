"use client";

import React from "react";
import {
  Users,
  GraduationCap as StudentIcon,
  CalendarCheck,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  BookOpen,
  PlusCircle,
  FileText,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AdminDashboardClientProps {
  realStats?: {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    totalExams?: number;
    totalTimetables?: number;
    totalAssignments?: number;
    publishedAssignments?: number;
    totalSubmissions?: number;
    pendingSubmissions?: number;
    totalFeesExpected?: number;
    totalFeesCollected?: number;
    totalFeesOutstanding?: number;
    overdueFeeCount?: number;
    attendanceRate: string;
  };
}

export function AdminDashboardClient({ realStats }: AdminDashboardClientProps) {
  const stats = [
    {
      title: "Total Students",
      value: realStats !== undefined ? realStats.totalStudents.toLocaleString() : "0",
      change: "Active Enrollment",
      isPositive: true,
      subtext: "MongoDB Verified",
      icon: StudentIcon,
    },
    {
      title: "Total Teachers",
      value: realStats !== undefined ? realStats.totalTeachers.toLocaleString() : "0",
      change: "Faculty Roster",
      isPositive: true,
      subtext: "MongoDB Verified",
      icon: Users,
    },
    {
      title: "Active Classes",
      value: realStats !== undefined ? realStats.totalClasses.toLocaleString() : "0",
      change: "Configured Sections",
      isPositive: true,
      subtext: "MongoDB Verified",
      icon: BookOpen,
    },
    {
      title: "Exams Scheduled",
      value: realStats?.totalExams !== undefined ? realStats.totalExams.toLocaleString() : "0",
      change: "Curriculum Evaluations",
      isPositive: true,
      subtext: "Evaluation Center",
      icon: CalendarCheck,
    },
    {
      title: "Active Schedules",
      value: realStats?.totalTimetables !== undefined ? realStats.totalTimetables.toLocaleString() : "0",
      change: "Class Master Days",
      isPositive: true,
      subtext: "Conflict Verified",
      icon: Clock,
    },
    {
      title: "Assignments",
      value: realStats?.totalAssignments !== undefined ? realStats.totalAssignments.toLocaleString() : "0",
      change: `${realStats?.publishedAssignments || 0} Published`,
      isPositive: true,
      subtext: `${realStats?.pendingSubmissions || 0} Submissions Pending`,
      icon: FileText,
    },
    {
      title: "Fee Collections",
      value: `$${(realStats?.totalFeesCollected || 0).toLocaleString()}`,
      change: `$${(realStats?.totalFeesOutstanding || 0).toLocaleString()} Pending`,
      isPositive: true,
      subtext: `${realStats?.overdueFeeCount || 0} Overdue Accounts`,
      icon: CreditCard,
    },
  ];

  const recentActivities = [
    {
      id: 1,
      type: "admissions",
      title: "New student enrollment approved",
      detail: "Grade 9 - Section B • Aryan Patel",
      time: "10 mins ago",
      icon: CheckCircle,
      iconColor: "text-emerald-500",
    },
    {
      id: 2,
      type: "attendance",
      title: "Biometric sync completed",
      detail: "Terminal 04 (Main Academic Wing) uploaded 1,420 scans",
      time: "32 mins ago",
      icon: Clock,
      iconColor: "text-blue-500",
    },
    {
      id: 3,
      type: "alert",
      title: "Low attendance warning triggered",
      detail: "3 students flagged below 75% baseline requirement",
      time: "1 hour ago",
      icon: AlertTriangle,
      iconColor: "text-amber-500",
    },
    {
      id: 4,
      type: "exam",
      title: "Mid-Term Examination schedule generated",
      detail: "Automatic clash detection passed with 0 conflicts",
      time: "2 hours ago",
      icon: ShieldCheck,
      iconColor: "text-indigo-500",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              Campus Overview
            </h1>
            <Badge variant="brand" className="text-[10px] uppercase font-bold">
              Live Terminal
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Welcome back. Institutional key indicators and administrative summaries.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            className="text-xs font-semibold text-slate-700 hover:bg-slate-50 gap-1.5"
          >
            <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
            <span>Export Reports</span>
          </Button>
          <Link href="/admin/students">
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold gap-1.5 shadow-sm"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Manage Students</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Metric Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className="border border-slate-200/80 bg-white hover:border-slate-300 shadow-sm"
            >
              <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {stat.title}
                </span>
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <div className="text-3xl font-extrabold text-slate-950 mt-1">
                  {stat.value}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-600">
                    {stat.change}
                  </span>
                  <span className="text-slate-400 text-[10px] font-mono">
                    {stat.subtext}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Split Section: Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity Feed (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-950">
                Recent Institutional Activity
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Live system audit log and event stream
              </p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700">
              View Full Audit Log
            </Button>
          </div>

          <div className="space-y-4">
            {recentActivities.map((act) => {
              const Icon = act.icon;
              return (
                <div
                  key={act.id}
                  className="flex items-start gap-4 p-3.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 shrink-0 mt-0.5">
                    <Icon className={`h-4 w-4 ${act.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {act.title}
                      </p>
                      <span className="text-[11px] text-slate-400 whitespace-nowrap">
                        {act.time}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      {act.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions Panel (1 Col) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-950 mb-1">
              Quick Administration
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Fast access to common administrative workflows
            </p>

            <div className="space-y-3">
              <Link
                href="/admin/students"
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 text-left hover:border-blue-500 hover:bg-blue-50/40 transition-all group"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    Student Directory
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Manage enrollment, sections & records
                  </p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/admin/teachers"
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 text-left hover:border-blue-500 hover:bg-blue-50/40 transition-all group"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    Register Faculty Member
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Issue department credential & schedule
                  </p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <button className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 text-left hover:border-blue-500 hover:bg-blue-50/40 transition-all group">
                <div>
                  <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    Broadcast Campus Notice
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Send automated SMS & Portal push
                  </p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>

          <div className="mt-8 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 leading-relaxed">
            <span className="font-semibold text-slate-700">Notice:</span> Figures
            displayed are preview dashboard indicators. Database telemetry will be
            linked in upcoming modules.
          </div>
        </div>
      </div>
    </div>
  );
}
