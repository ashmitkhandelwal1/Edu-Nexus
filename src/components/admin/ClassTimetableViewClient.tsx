"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  ArrowLeft,
  Calendar,
  Users,
  Building,
  RefreshCw,
  AlertCircle,
  Coffee,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClassViewProps {
  classes: any[];
}

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function ClassTimetableViewClient({ classes }: ClassViewProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>(
    classes[0]?._id || ""
  );
  const [timetables, setTimetables] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClassSchedule = async (classId: string) => {
    if (!classId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/timetable?classId=${classId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load schedule");
      setTimetables(data.data || []);
    } catch (err: any) {
      setError(err.message || "Error loading class timetable");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClassId) {
      fetchClassSchedule(selectedClassId);
    }
  }, [selectedClassId]);

  const selectedClass = classes.find((c) => c._id === selectedClassId);

  // Map timetables by day of week
  const scheduleByDay: Record<string, any[]> = {};
  for (const day of DAYS_OF_WEEK) {
    scheduleByDay[day] = [];
  }

  for (const tt of timetables) {
    if (scheduleByDay[tt.dayOfWeek]) {
      const sortedPeriods = [...(tt.periods || [])].sort(
        (a: any, b: any) => a.periodNumber - b.periodNumber
      );
      scheduleByDay[tt.dayOfWeek] = sortedPeriods;
    }
  }

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
            <BookOpen className="w-6 h-6 text-sky-400" />
            Class Weekly Timetable View
          </h1>
          <p className="text-sm text-slate-400">
            View full weekly schedules for students and teachers of each class and section
          </p>
        </div>

        {/* Class Selector */}
        <div className="flex items-center gap-3">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-sm rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
          >
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.className} - {c.section} ({c.academicYear})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Class Overview Quick Bar */}
      {selectedClass && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 font-bold flex items-center justify-center text-lg">
              {selectedClass.className.slice(0, 2)}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {selectedClass.className} - {selectedClass.section}
              </h3>
              <p className="text-xs text-slate-400">
                Academic Year: <span className="text-slate-300">{selectedClass.academicYear}</span> •
                Default Room:{" "}
                <span className="font-mono text-slate-300">
                  {selectedClass.roomNumber || "Not Assigned"}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchClassSchedule(selectedClassId)}
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

      {/* Weekly Columns (Monday to Saturday) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DAYS_OF_WEEK.map((day) => {
          const periods = scheduleByDay[day] || [];
          return (
            <div
              key={day}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-sky-400" />
                    {day}
                  </h4>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                    {periods.length} {periods.length === 1 ? "Slot" : "Slots"}
                  </span>
                </div>

                <div className="space-y-2 mt-3">
                  {periods.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500 italic">
                      No schedule configured for {day}
                    </div>
                  ) : (
                    periods.map((p, idx) => {
                      const isClass = p.type === "class";
                      const isBreak = p.type === "break";
                      const isLunch = p.type === "lunch";

                      return (
                        <div
                          key={idx}
                          className={`rounded-xl p-3 space-y-1.5 border text-xs ${
                            isBreak
                              ? "bg-amber-950/20 border-amber-900/30 text-amber-200"
                              : isLunch
                              ? "bg-emerald-950/20 border-emerald-900/30 text-emerald-200"
                              : "bg-slate-950/70 border-slate-800/80 text-white"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                            <span className="text-sky-400 font-bold">Period {p.periodNumber}</span>
                            <span className="font-mono text-[10px]">
                              {p.startTime} - {p.endTime}
                            </span>
                          </div>

                          <div className="font-bold text-white text-xs">
                            {isClass ? p.subjectName : isBreak ? "Short Break" : "Lunch Break"}
                          </div>

                          {isClass && (
                            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                              <span className="flex items-center gap-1 truncate text-slate-300">
                                <Users className="w-3 h-3 text-slate-500 shrink-0" />
                                <span className="truncate">
                                  {p.teacherId
                                    ? `${p.teacherId.firstName} ${p.teacherId.lastName}`
                                    : "No Teacher"}
                                </span>
                              </span>
                              <span className="flex items-center gap-1 text-[10px] text-slate-500 shrink-0">
                                <Building className="w-3 h-3 text-slate-600" />
                                {p.roomNumber || selectedClass?.roomNumber || "Main Room"}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })
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
