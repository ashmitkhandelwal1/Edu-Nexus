"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  BarChart3,
  CalendarCheck,
  History,
  TrendingUp,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  CircleSlash2,
  Loader2,
  AlertCircle,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface ClassBreakdown {
  classId: string;
  className: string;
  section: string;
  academicYear: string;
  total: number;
  present: number;
  late: number;
  halfDay: number;
  absent: number;
  percentage: number;
}

interface StudentRank {
  studentId: string;
  name: string;
  admissionNumber: string;
  className: string;
  section: string;
  totalDays: number;
  present: number;
  absent: number;
  percentage: number;
}

interface MonthlyTrend {
  month: string;
  total: number;
  present: number;
  absent: number;
  percentage: number;
}

interface ReportSummary {
  totalRecords: number;
  overallPercentage: number;
  totals: {
    present: number;
    absent: number;
    late: number;
    halfDay: number;
  };
}

export function AttendanceReportsClient() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [classStats, setClassStats] = useState<ClassBreakdown[]>([]);
  const [studentStats, setStudentStats] = useState<StudentRank[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyTrend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`/api/attendance/reports?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to load attendance reports.");
        setIsLoading(false);
        return;
      }

      setSummary(data.summary);
      setClassStats(data.classStats || []);
      setStudentStats(data.studentStats || []);
      setMonthlyStats(data.monthlyStats || []);
      setIsLoading(false);
    } catch {
      setErrorMessage("Network error while connecting to server.");
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return (
    <div className="space-y-6">
      {/* Title & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              Attendance Analytics &amp; Reports
            </h1>
            <Badge variant="brand" className="text-[10px] font-bold">
              Institutional Intelligence
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Real-time compliance rates, class comparisons, and student trajectory monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/admin/attendance">
            <Button variant="outline" size="sm" className="text-xs text-slate-700 hover:bg-slate-50 gap-1.5">
              <CalendarCheck className="h-3.5 w-3.5 text-blue-600" />
              <span>Daily Roll</span>
            </Button>
          </Link>
          <Link href="/admin/attendance/history">
            <Button variant="outline" size="sm" className="text-xs text-slate-700 hover:bg-slate-50 gap-1.5">
              <History className="h-3.5 w-3.5 text-blue-600" />
              <span>History Logs</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Date Range Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center gap-4 text-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="font-semibold text-slate-700 whitespace-nowrap">Filter Window:</span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-slate-500 text-[11px]">From:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 px-3 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-slate-500 text-[11px]">To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 px-3 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </div>
        {(startDate || endDate) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
            className="text-xs text-rose-600 hover:text-rose-700 h-8 px-2"
          >
            Clear Dates
          </Button>
        )}
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2 rounded-xl">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500 space-y-2 bg-white rounded-2xl border border-slate-200/80">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <p className="text-xs font-medium">Computing attendance analytics from database records...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Metrics Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="border border-slate-200/80 bg-white shadow-sm sm:col-span-2 lg:col-span-1">
              <CardHeader className="p-4 pb-1">
                <span className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                  Overall Compliance
                </span>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <div className="text-3xl font-extrabold text-blue-600">
                  {summary ? `${summary.overallPercentage}%` : "—"}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  (Present + Late + 0.5 × Half-Day) / Total
                </p>
              </CardContent>
            </Card>

            <Card className="border border-slate-200/80 bg-white shadow-sm">
              <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between">
                <span className="text-[11px] font-semibold uppercase text-slate-500">
                  Present
                </span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <div className="text-2xl font-bold text-slate-900">
                  {summary?.totals.present || 0}
                </div>
                <span className="text-[10px] text-emerald-600 font-medium">Full Day</span>
              </CardContent>
            </Card>

            <Card className="border border-slate-200/80 bg-white shadow-sm">
              <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between">
                <span className="text-[11px] font-semibold uppercase text-slate-500">
                  Absent
                </span>
                <XCircle className="h-4 w-4 text-rose-600" />
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <div className="text-2xl font-bold text-slate-900">
                  {summary?.totals.absent || 0}
                </div>
                <span className="text-[10px] text-rose-600 font-medium">Unexcused / Leave</span>
              </CardContent>
            </Card>

            <Card className="border border-slate-200/80 bg-white shadow-sm">
              <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between">
                <span className="text-[11px] font-semibold uppercase text-slate-500">
                  Late Arrival
                </span>
                <Clock className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <div className="text-2xl font-bold text-slate-900">
                  {summary?.totals.late || 0}
                </div>
                <span className="text-[10px] text-amber-600 font-medium">Partial Tardy</span>
              </CardContent>
            </Card>

            <Card className="border border-slate-200/80 bg-white shadow-sm">
              <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between">
                <span className="text-[11px] font-semibold uppercase text-slate-500">
                  Half-Day
                </span>
                <CircleSlash2 className="h-4 w-4 text-indigo-600" />
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <div className="text-2xl font-bold text-slate-900">
                  {summary?.totals.halfDay || 0}
                </div>
                <span className="text-[10px] text-indigo-600 font-medium">0.5 Attendance Weight</span>
              </CardContent>
            </Card>
          </div>

          {/* Two-Column Grid: Class Breakdown & Monthly Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Class-wise Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
              <h3 className="text-sm font-bold text-slate-950 mb-1">
                Class-wise Attendance Performance
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Comparison of calculated attendance percentages by grade level
              </p>

              {classStats.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-8 text-center">
                  No attendance records logged for classes in this window.
                </p>
              ) : (
                <div className="space-y-3.5">
                  {classStats.map((c) => (
                    <div key={c.classId} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-900">
                          {c.className} - {c.section}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400 font-mono">
                            {c.present + c.late} / {c.total} marks
                          </span>
                          <span
                            className={`font-bold ${
                              c.percentage >= 85
                                ? "text-emerald-600"
                                : c.percentage >= 75
                                ? "text-amber-600"
                                : "text-rose-600"
                            }`}
                          >
                            {c.percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            c.percentage >= 85
                              ? "bg-emerald-500"
                              : c.percentage >= 75
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          }`}
                          style={{ width: `${Math.min(100, c.percentage)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Monthly Trend Log */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
              <h3 className="text-sm font-bold text-slate-950 mb-1">
                Monthly Attendance Trends
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Aggregate compliance trajectory over previous cycles
              </p>

              {monthlyStats.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-8 text-center">
                  No monthly attendance aggregate records available.
                </p>
              ) : (
                <div className="space-y-3">
                  {monthlyStats.map((m) => (
                    <div
                      key={m.month}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 font-mono">
                          {m.month}
                        </span>
                        <span className="text-slate-500 ml-2 text-[11px]">
                          ({m.total} recorded logs)
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-emerald-600 font-medium">
                          {m.present} Present
                        </span>
                        <span className="text-rose-600 font-medium">
                          {m.absent} Absent
                        </span>
                        <Badge
                          variant={m.percentage >= 85 ? "success" : "secondary"}
                          className="font-bold"
                        >
                          {m.percentage}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Student Attention Watchlist */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-950 mb-1">
              Student Attendance Watchlist
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Students ranked by lower attendance percentages for intervention and counseling
            </p>

            {studentStats.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">
                No student records to display.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold uppercase text-slate-500 bg-slate-50/50">
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3">Class & Sec</th>
                      <th className="py-2.5 px-3">Total Sessions</th>
                      <th className="py-2.5 px-3">Present</th>
                      <th className="py-2.5 px-3">Absent</th>
                      <th className="py-2.5 px-3">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {studentStats.map((st) => (
                      <tr key={st.studentId} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          <Link
                            href={`/admin/students/${st.studentId}`}
                            className="hover:text-blue-600"
                          >
                            {st.name}
                          </Link>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {st.admissionNumber}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {st.className} - {st.section}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 font-mono">
                          {st.totalDays}
                        </td>
                        <td className="py-2.5 px-3 text-emerald-600 font-semibold font-mono">
                          {st.present}
                        </td>
                        <td className="py-2.5 px-3 text-rose-600 font-semibold font-mono">
                          {st.absent}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge
                            variant={
                              st.percentage >= 85
                                ? "success"
                                : st.percentage >= 75
                                ? "secondary"
                                : "default"
                            }
                            className={`text-[10px] font-bold ${
                              st.percentage < 75 ? "bg-rose-600" : ""
                            }`}
                          >
                            {st.percentage}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

