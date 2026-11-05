"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  AlertCircle,
  Clock,
  BookOpen,
  User,
  Building,
  Coffee,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClassSubject {
  subjectName: string;
  teacher?: string;
}

interface ClassOption {
  _id: string;
  className: string;
  section: string;
  academicYear: string;
  roomNumber?: string;
  subjects?: ClassSubject[];
}

interface TeacherOption {
  _id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  department?: string;
  subjects?: string[];
}

interface PeriodFormItem {
  _id?: string;
  periodNumber: number;
  type: "class" | "break" | "lunch";
  startTime: string;
  endTime: string;
  subjectName: string;
  teacherId: string;
  roomNumber: string;
}

interface TimetableFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classes: ClassOption[];
  teachers: TeacherOption[];
  initialData?: {
    _id?: string;
    classId: string | { _id: string };
    academicYear: string;
    dayOfWeek: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";
    periods: any[];
  } | null;
}

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function TimetableFormModal({
  isOpen,
  onClose,
  onSuccess,
  classes,
  teachers,
  initialData,
}: TimetableFormModalProps) {
  const isEditing = !!initialData?._id;

  const [selectedClassId, setSelectedClassId] = useState("");
  const [academicYear, setAcademicYear] = useState("2026-27");
  const [dayOfWeek, setDayOfWeek] = useState<typeof DAYS_OF_WEEK[number]>("Monday");
  const [periods, setPeriods] = useState<PeriodFormItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);

  // Set up form state when modal opens or initialData changes
  useEffect(() => {
    if (initialData) {
      const cId = typeof initialData.classId === "object" ? initialData.classId._id : initialData.classId;
      setSelectedClassId(cId || "");
      setAcademicYear(initialData.academicYear || "2026-27");
      setDayOfWeek(initialData.dayOfWeek || "Monday");

      if (initialData.periods && initialData.periods.length > 0) {
        setPeriods(
          initialData.periods.map((p, idx) => ({
            _id: p._id,
            periodNumber: p.periodNumber || idx + 1,
            type: p.type || "class",
            startTime: p.startTime || "",
            endTime: p.endTime || "",
            subjectName: p.subjectName || "",
            teacherId: typeof p.teacherId === "object" && p.teacherId ? p.teacherId._id : (p.teacherId || ""),
            roomNumber: p.roomNumber || "",
          }))
        );
      } else {
        setDefaultPeriods();
      }
    } else {
      if (classes.length > 0 && !selectedClassId) {
        setSelectedClassId(classes[0]._id);
        setAcademicYear(classes[0].academicYear || "2026-27");
      }
      setDayOfWeek("Monday");
      setDefaultPeriods();
    }
    setConflictError(null);
  }, [initialData, isOpen, classes]);

  const setDefaultPeriods = () => {
    setPeriods([
      {
        periodNumber: 1,
        type: "class",
        startTime: "09:00",
        endTime: "09:45",
        subjectName: "",
        teacherId: "",
        roomNumber: "",
      },
      {
        periodNumber: 2,
        type: "class",
        startTime: "09:45",
        endTime: "10:30",
        subjectName: "",
        teacherId: "",
        roomNumber: "",
      },
      {
        periodNumber: 3,
        type: "break",
        startTime: "10:30",
        endTime: "10:45",
        subjectName: "",
        teacherId: "",
        roomNumber: "",
      },
      {
        periodNumber: 4,
        type: "class",
        startTime: "10:45",
        endTime: "11:30",
        subjectName: "",
        teacherId: "",
        roomNumber: "",
      },
      {
        periodNumber: 5,
        type: "lunch",
        startTime: "12:15",
        endTime: "13:00",
        subjectName: "",
        teacherId: "",
        roomNumber: "",
      },
    ]);
  };

  const selectedClass = classes.find((c) => c._id === selectedClassId);
  const classSubjects = selectedClass?.subjects || [];

  const handleClassChange = (cId: string) => {
    setSelectedClassId(cId);
    const cls = classes.find((c) => c._id === cId);
    if (cls) {
      if (cls.academicYear) setAcademicYear(cls.academicYear);
      // Pre-fill classroom if not already set
      if (cls.roomNumber) {
        setPeriods((prev) =>
          prev.map((p) => ({
            ...p,
            roomNumber: p.roomNumber || cls.roomNumber || "",
          }))
        );
      }
    }
  };

  const handleAddPeriod = (type: "class" | "break" | "lunch" = "class") => {
    const nextNumber = periods.length > 0 ? Math.max(...periods.map((p) => p.periodNumber)) + 1 : 1;
    let nextStart = "13:00";
    let nextEnd = "13:45";

    if (periods.length > 0) {
      const last = periods[periods.length - 1];
      nextStart = last.endTime;
      // Add 45 mins as default
      const [h, m] = nextStart.split(":").map(Number);
      const totalMinutes = h * 60 + m + (type === "break" ? 15 : 45);
      const endH = Math.min(23, Math.floor(totalMinutes / 60)).toString().padStart(2, "0");
      const endM = (totalMinutes % 60).toString().padStart(2, "0");
      nextEnd = `${endH}:${endM}`;
    }

    setPeriods((prev) => [
      ...prev,
      {
        periodNumber: nextNumber,
        type,
        startTime: nextStart,
        endTime: nextEnd,
        subjectName: "",
        teacherId: "",
        roomNumber: selectedClass?.roomNumber || "",
      },
    ]);
  };

  const handleRemovePeriod = (index: number) => {
    setPeriods((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updatePeriod = (index: number, updates: Partial<PeriodFormItem>) => {
    setPeriods((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const handleSubjectChange = (index: number, subjName: string) => {
    const assignedSubj = classSubjects.find(
      (s) => s.subjectName.toLowerCase() === subjName.toLowerCase()
    );
    const assignedTeacherId = assignedSubj?.teacher ? String(assignedSubj.teacher) : "";

    updatePeriod(index, {
      subjectName: subjName,
      teacherId: assignedTeacherId || periods[index].teacherId,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError(null);

    if (!selectedClassId) {
      setConflictError("Please select a target class.");
      return;
    }

    if (periods.length === 0) {
      setConflictError("Please add at least one period to the schedule.");
      return;
    }

    // Client-side quick check on times
    for (const p of periods) {
      if (p.startTime >= p.endTime) {
        setConflictError(
          `Period ${p.periodNumber}: Start time (${p.startTime}) must be strictly before End time (${p.endTime}).`
        );
        return;
      }
      if (p.type === "class" && !p.subjectName) {
        setConflictError(`Period ${p.periodNumber}: Class periods must have a subject assigned.`);
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        classId: selectedClassId,
        academicYear,
        dayOfWeek,
        periods: periods.map((p) => ({
          periodNumber: Number(p.periodNumber),
          type: p.type,
          startTime: p.startTime,
          endTime: p.endTime,
          subjectName: p.type === "class" ? p.subjectName : undefined,
          teacherId: p.type === "class" && p.teacherId ? p.teacherId : null,
          roomNumber: p.roomNumber?.trim() || null,
        })),
      };

      const url = isEditing ? `/api/timetable/${initialData._id}` : "/api/timetable";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEditing ? { periods: payload.periods } : payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setConflictError(data.message || "Failed to save timetable schedule.");
        return;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setConflictError(err.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              {isEditing ? "Edit Day Timetable" : "Create Class Timetable"}
            </h3>
            <p className="text-xs text-slate-400">
              Configure periods, teachers, rooms, and break intervals with conflict detection
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {conflictError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-200">Scheduling Conflict Detected</p>
                <p className="text-xs mt-0.5">{conflictError}</p>
              </div>
            </div>
          )}

          {/* Class, Academic Year, and Day selectors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-800/40 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Class & Section <span className="text-rose-400">*</span>
              </label>
              <select
                value={selectedClassId}
                disabled={isEditing}
                onChange={(e) => handleClassChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <option value="">Select Class</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.className} - {c.section} ({c.academicYear})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Academic Year <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={academicYear}
                disabled={isEditing}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2026-27"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Day of Week <span className="text-rose-400">*</span>
              </label>
              <select
                value={dayOfWeek}
                disabled={isEditing}
                onChange={(e) => setDayOfWeek(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Periods Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  Periods & Schedule ({periods.length})
                </h4>
                <p className="text-xs text-slate-400">
                  Arrange period slots, assigned subject, teacher, and classroom
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddPeriod("class")}
                  className="border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10 text-xs gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Class Period
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddPeriod("break")}
                  className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10 text-xs gap-1.5"
                >
                  <Coffee className="w-3.5 h-3.5" /> Add Break
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddPeriod("lunch")}
                  className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 text-xs gap-1.5"
                >
                  <Coffee className="w-3.5 h-3.5" /> Add Lunch
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {periods.map((period, index) => {
                const isClass = period.type === "class";
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border transition-colors ${
                      period.type === "class"
                        ? "bg-slate-800/30 border-slate-700/60"
                        : period.type === "break"
                        ? "bg-amber-950/20 border-amber-900/40"
                        : "bg-emerald-950/20 border-emerald-900/40"
                    }`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                      {/* Period # & Type */}
                      <div className="md:col-span-2 flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-slate-800 text-indigo-300 font-bold text-xs flex items-center justify-center border border-slate-700 shrink-0">
                          #{period.periodNumber}
                        </span>
                        <select
                          value={period.type}
                          onChange={(e) =>
                            updatePeriod(index, {
                              type: e.target.value as any,
                            })
                          }
                          className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-2 py-1.5 text-white focus:outline-none"
                        >
                          <option value="class">Class</option>
                          <option value="break">Short Break</option>
                          <option value="lunch">Lunch</option>
                        </select>
                      </div>

                      {/* Time Slots */}
                      <div className="md:col-span-3 flex items-center gap-1.5">
                        <input
                          type="time"
                          value={period.startTime}
                          onChange={(e) => updatePeriod(index, { startTime: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <span className="text-slate-500 text-xs">to</span>
                        <input
                          type="time"
                          value={period.endTime}
                          onChange={(e) => updatePeriod(index, { endTime: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      {/* Subject (if class) */}
                      <div className="md:col-span-3">
                        {isClass ? (
                          <div className="relative">
                            <select
                              value={period.subjectName}
                              onChange={(e) => handleSubjectChange(index, e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                              <option value="">Select Subject *</option>
                              {classSubjects.length > 0 ? (
                                classSubjects.map((s, sIdx) => (
                                  <option key={sIdx} value={s.subjectName}>
                                    {s.subjectName}
                                  </option>
                                ))
                              ) : (
                                <option value="General">General</option>
                              )}
                            </select>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic px-2">
                            {period.type === "break" ? "Tea / Recess" : "Lunch Break"}
                          </div>
                        )}
                      </div>

                      {/* Teacher & Room */}
                      <div className="md:col-span-3 grid grid-cols-2 gap-2">
                        {isClass ? (
                          <>
                            <select
                              value={period.teacherId}
                              onChange={(e) => updatePeriod(index, { teacherId: e.target.value })}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                              <option value="">Teacher</option>
                              {teachers.map((t) => (
                                <option key={t._id} value={t._id}>
                                  {t.firstName} {t.lastName}
                                </option>
                              ))}
                            </select>

                            <input
                              type="text"
                              placeholder="Room #"
                              value={period.roomNumber}
                              onChange={(e) =>
                                updatePeriod(index, { roomNumber: e.target.value })
                              }
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </>
                        ) : (
                          <div className="col-span-2 text-xs text-slate-500 italic">
                            No teacher required
                          </div>
                        )}
                      </div>

                      {/* Remove Period Button */}
                      <div className="md:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemovePeriod(index)}
                          className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
                          title="Remove Period"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              * EDUNEXUS checks for teacher and classroom collisions across all grades before saving.
            </p>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 font-medium"
              >
                {loading ? "Checking Conflicts..." : isEditing ? "Update Timetable" : "Save Timetable"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
