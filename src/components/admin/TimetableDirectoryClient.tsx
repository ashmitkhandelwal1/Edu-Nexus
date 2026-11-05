"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertCircle,
  Users,
  BookOpen,
  Coffee,
  Building,
  Eye,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TimetableFormModal } from "./TimetableFormModal";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

interface TimetableClientProps {
  initialClasses: any[];
  initialTeachers: any[];
}

export function TimetableDirectoryClient({
  initialClasses,
  initialTeachers,
}: TimetableClientProps) {
  const [timetables, setTimetables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [academicYear, setAcademicYear] = useState("2026-27");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTimetables = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedClassId) params.append("classId", selectedClassId);
      if (selectedDay) params.append("dayOfWeek", selectedDay);
      if (academicYear) params.append("academicYear", academicYear);

      const res = await fetch(`/api/timetable?${params.toString()}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Failed to fetch timetable data");
      }

      setTimetables(json.data || []);
    } catch (err: any) {
      setError(err.message || "Error connecting to timetable API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetables();
  }, [selectedClassId, selectedDay, academicYear]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this day's timetable schedule?")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/timetable/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to delete timetable");
        return;
      }
      fetchTimetables();
    } catch (err: any) {
      alert(err.message || "Network error deleting timetable");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleCreateNew = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  // Filtered by search term (class name, subject, or teacher name)
  const filteredTimetables = timetables.filter((tt) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const className = tt.classId?.className?.toLowerCase() || "";
    const section = tt.classId?.section?.toLowerCase() || "";
    const day = tt.dayOfWeek.toLowerCase();

    // Also check if any period matches subject or teacher
    const matchesPeriod = tt.periods.some(
      (p: any) =>
        p.subjectName?.toLowerCase().includes(q) ||
        p.roomNumber?.toLowerCase().includes(q) ||
        p.teacherId?.firstName?.toLowerCase().includes(q) ||
        p.teacherId?.lastName?.toLowerCase().includes(q)
    );

    return (
      className.includes(q) ||
      section.includes(q) ||
      day.includes(q) ||
      matchesPeriod
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-indigo-400" />
            Timetable Management
          </h1>
          <p className="text-sm text-slate-400">
            Design master schedules, map class periods, and prevent teacher and room collisions
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/admin/timetable/classes">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 gap-1.5"
            >
              <BookOpen className="w-4 h-4 text-sky-400" /> Class Weekly View
            </Button>
          </Link>
          <Link href="/admin/timetable/teachers">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 gap-1.5"
            >
              <Users className="w-4 h-4 text-emerald-400" /> Teacher Weekly View
            </Button>
          </Link>
          <Button
            onClick={handleCreateNew}
            className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 font-medium"
          >
            <Plus className="w-4 h-4" /> Create Timetable
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search subject, teacher, room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Class Filter */}
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Classes</option>
            {initialClasses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.className} - {c.section}
              </option>
            ))}
          </select>

          {/* Day Filter */}
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Days</option>
            {DAYS_OF_WEEK.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Academic Year */}
          <input
            type="text"
            placeholder="Year (e.g. 2026-27)"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="w-28 bg-slate-950 border border-slate-800 text-xs rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 hidden sm:block"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchTimetables}
          disabled={loading}
          className="border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 text-xs gap-1.5 self-end md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Main Content State */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && timetables.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading master timetable schedules...</p>
        </div>
      ) : filteredTimetables.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Clock className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-white">No Timetable Schedules Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {selectedClassId || selectedDay || searchQuery
              ? "No schedules match your current filter criteria."
              : "Get started by creating your first daily class timetable schedule."}
          </p>
          <Button
            onClick={handleCreateNew}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs mt-2"
          >
            Create Timetable Now
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTimetables.map((tt) => {
            const classObj = tt.classId || {};
            const periods = (tt.periods || []).sort(
              (a: any, b: any) => a.periodNumber - b.periodNumber
            );

            return (
              <div
                key={tt._id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-bold text-xs rounded-lg uppercase tracking-wider">
                      {tt.dayOfWeek}
                    </span>
                    <div>
                      <h3 className="text-base font-semibold text-white">
                        {classObj.className || "Class"} - {classObj.section || "Section"}
                      </h3>
                      <p className="text-xs text-slate-400">
                        Academic Year: {tt.academicYear} • Class Room: {classObj.roomNumber || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(tt)}
                      className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-indigo-400" /> Edit Schedule
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={deletingId === tt._id}
                      onClick={() => handleDelete(tt._id)}
                      className="border-rose-900/40 text-rose-400 hover:bg-rose-950/20 text-xs gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Period Slots Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                  {periods.map((p: any, pIdx: number) => {
                    const isClass = p.type === "class";
                    const isLunch = p.type === "lunch";
                    const isBreak = p.type === "break";

                    return (
                      <div
                        key={pIdx}
                        className={`p-3 rounded-xl border flex flex-col justify-between text-xs transition ${
                          isBreak
                            ? "bg-amber-950/20 border-amber-900/30 text-amber-200"
                            : isLunch
                            ? "bg-emerald-950/20 border-emerald-900/30 text-emerald-200"
                            : "bg-slate-950/60 border-slate-800 text-slate-200"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1">
                            <span className="text-indigo-400 font-bold">P{p.periodNumber}</span>
                            <span className="font-mono text-[10px]">
                              {p.startTime} - {p.endTime}
                            </span>
                          </div>

                          <div className="font-bold text-white truncate text-xs">
                            {isClass ? p.subjectName || "Subject" : isBreak ? "Short Break" : "Lunch Break"}
                          </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400 space-y-0.5">
                          {isClass ? (
                            <>
                              <div className="flex items-center gap-1 truncate text-slate-300">
                                <Users className="w-3 h-3 text-slate-500 shrink-0" />
                                <span className="truncate">
                                  {p.teacherId
                                    ? `${p.teacherId.firstName} ${p.teacherId.lastName}`
                                    : "No Teacher"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                <Building className="w-3 h-3 text-slate-600 shrink-0" />
                                <span>Room: {p.roomNumber || classObj.roomNumber || "—"}</span>
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center gap-1 text-slate-400">
                              <Coffee className="w-3 h-3 shrink-0" />
                              <span>{isBreak ? "Recess" : "Lunch Hour"}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <TimetableFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchTimetables}
        classes={initialClasses}
        teachers={initialTeachers}
        initialData={editingItem}
      />
    </div>
  );
}

