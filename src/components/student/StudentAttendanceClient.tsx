"use client";

import React, { useState, useMemo } from "react";
import {
  CalendarCheck,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Filter,
} from "lucide-react";

interface AttendanceRecord {
  _id: string;
  date: string;
  status: "present" | "absent" | "late" | "half-day";
  remarks?: string;
}

interface StudentAttendanceClientProps {
  records: AttendanceRecord[];
}

export function StudentAttendanceClient({ records }: StudentAttendanceClientProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");

  // Summary Metrics
  const totalCount = records.length;
  const presentCount = records.filter((r) => r.status === "present").length;
  const absentCount = records.filter((r) => r.status === "absent").length;
  const lateCount = records.filter((r) => r.status === "late").length;
  const halfDayCount = records.filter((r) => r.status === "half-day").length;

  const effectivePresent = presentCount + lateCount + halfDayCount * 0.5;
  const attendanceRate = totalCount > 0 ? Math.round((effectivePresent / totalCount) * 100) : 100;

  // Extract unique months (YYYY-MM)
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    records.forEach((r) => {
      if (r.date && r.date.length >= 7) {
        months.add(r.date.substring(0, 7));
      }
    });
    return Array.from(months).sort().reverse();
  }, [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (monthFilter !== "all" && !r.date.startsWith(monthFilter)) return false;
      return true;
    });
  }, [records, statusFilter, monthFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Present
          </span>
        );
      case "absent":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" /> Absent
          </span>
        );
      case "late":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" /> Late
          </span>
        );
      case "half-day":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <AlertCircle className="w-3.5 h-3.5" /> Half Day
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Attendance Rate</div>
          <div className="mt-2 text-2xl font-black text-white">{attendanceRate}%</div>
          <div className="text-[11px] text-slate-500 mt-1">{totalCount} total working sessions</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Present</div>
          <div className="mt-2 text-2xl font-black text-emerald-400">{presentCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Full-day attendance</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs font-medium text-rose-400 uppercase tracking-wider">Absent</div>
          <div className="mt-2 text-2xl font-black text-rose-400">{absentCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Unexcused / Leave</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs font-medium text-amber-400 uppercase tracking-wider">Late</div>
          <div className="mt-2 text-2xl font-black text-amber-400">{lateCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Late arrivals</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 col-span-2 sm:col-span-1">
          <div className="text-xs font-medium text-sky-400 uppercase tracking-wider">Half Day</div>
          <div className="mt-2 text-2xl font-black text-sky-400">{halfDayCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Partial sessions</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Filter className="w-4 h-4 text-sky-400" />
          <span>Filter Attendance Records</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="all">All Statuses</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
            <option value="half-day">Half Day</option>
          </select>

          {/* Month Filter */}
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="all">All Recorded Months</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {new Date(m + "-01").toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table of Records */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800/80 overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CalendarCheck className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-base font-semibold text-slate-400">No attendance records found</p>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your status or month filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-xs font-semibold uppercase text-slate-400">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Day</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRecords.map((r) => {
                  const dateObj = new Date(r.date + "T00:00:00");
                  const dayName = dateObj.toLocaleDateString(undefined, { weekday: "long" });

                  return (
                    <tr key={r._id} className="hover:bg-slate-800/40 transition">
                      <td className="px-6 py-4 font-mono font-medium text-slate-200">{r.date}</td>
                      <td className="px-6 py-4 text-slate-400">{dayName}</td>
                      <td className="px-6 py-4">{getStatusBadge(r.status)}</td>
                      <td className="px-6 py-4 text-xs text-slate-400">{r.remarks || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

