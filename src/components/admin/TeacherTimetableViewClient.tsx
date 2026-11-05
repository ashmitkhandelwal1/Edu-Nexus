"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Clock,
  ArrowLeft,
  Calendar,
  Building,
  RefreshCw,
  AlertCircle,
  Coffee,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface TeacherViewProps {
  teachers: any[];
}

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function TeacherTimetableViewClient({ teachers }: TeacherViewProps) {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    teachers[0]?._id || ""
  );
  const [timetables, setTimetables] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeacherSchedule = async (teacherId: string) => {
    if (!teacherId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/timetable?teacherId=${teacherId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load schedule");
      setTimetables(data.data || []);
    } catch (err: any) {
      setError(err.message || "Error loading teacher timetable");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTeacherId) {
      fetchTeacherSchedule(selectedTeacherId);
    }
  }, [selectedTeacherId]);

  const selectedTeacher = teachers.find((t) => t._id === selectedTeacherId);

  // Group periods assigned to this teacher by dayOfWeek
  const scheduleByDay: Record<string, any[]> = {};
  for (const day of DAYS_OF_WEEK) {
    scheduleByDay[day] = [];
  }

  for (const tt of timetables) {
    const day = tt.dayOfWeek;
    const matchingPeriods = (tt.periods || []).filter(
      (p: any) =>
        p.teacherId &&
        (typeof p.teacherId === "object"
          ? p.teacherId._id === selectedTeacherId
          : p.teacherId === selectedTeacherId)
    );

    for (const p of matchingPeriods) {
      if (scheduleByDay[day]) {
        scheduleByDay[day].push({
          ...p,
          className: tt.classId?.className || "Class",
          section: tt.classId?.section || "Section",
          academicYear: tt.academicYear,
        });
      }
    }
  }

  // Sort periods by startTime for each day
  for (const day of DAYS_OF_WEEK) {
    scheduleByDay[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  const totalAssignedPeriods = Object.values(scheduleByDay).reduce(
    (acc, arr) => acc + arr.length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin/timetable"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Timetable Management
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            Teacher Weekly Schedule View
          </h1>
          <p className="text-sm text-slate-400">
            Inspect faculty workloads, teaching hours, and weekly class assignments
          </p>
        </div>

        {/* Teacher Selector */}
        <div className="flex items-center gap-3">
          <select
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-sm rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          >
            {teachers.map((t) => (
              <option key={t._id} value={t._id}>
                {t.firstName} {t.lastName} ({t.employeeId}) — {t.department}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Teacher Profile Quick Card */}
      {selectedTeacher && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-lg">
              {selectedTeacher.firstName[0]}
              {selectedTeacher.lastName[0]}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {selectedTeacher.firstName} {selectedTeacher.lastName}
              </h3>
              <p className="text-xs text-slate-400">
                Department: <span className="text-slate-300">{selectedTeacher.department}</span> • ID:{" "}
                <span className="font-mono text-slate-300">{selectedTeacher.employeeId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Assigned Weekly Periods</span>
              <span className="text-xl font-black text-white">{totalAssignedPeriods}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchTeacherSchedule(selectedTeacherId)}
              disabled={loading}
              className="border-slate-800 text-slate-400 hover:text-white"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Weekly Schedule Grid (Monday to Saturday) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DAYS_OF_WEEK.map((day) => {
          const dayPeriods = scheduleByDay[day] || [];
          return (
            <div
              key={day}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    {day}
                  </h4>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                    {dayPeriods.length} {dayPeriods.length === 1 ? "Period" : "Periods"}
                  </span>
                </div>

                <div className="space-y-2 mt-3">
                  {dayPeriods.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500 italic">
                      No classes scheduled on {day}
                    </div>
                  ) : (
                    dayPeriods.map((p, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-400">
                            {p.className} - {p.section}
                          </span>
                          <span className="font-mono text-[11px] text-slate-400">
                            {p.startTime} - {p.endTime}
                          </span>
                        </div>

                        <div className="text-xs font-semibold text-white">
                          {p.subjectName}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                          <span className="flex items-center gap-1 text-[10px]">
                            <Building className="w-3 h-3 text-slate-500" />
                            Room: {p.roomNumber || "Main Room"}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Slot #{p.periodNumber}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

