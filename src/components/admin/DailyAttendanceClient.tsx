"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  CircleSlash2,
  Save,
  Loader2,
  AlertCircle,
  History,
  BarChart3,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ClassOption {
  _id: string;
  className: string;
  section: string;
  academicYear: string;
}

interface StudentInClass {
  _id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  rollNumber?: string;
}

type AttendanceStatus = "present" | "absent" | "late" | "half-day";

interface StudentAttendanceRow {
  studentId: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  rollNumber?: string;
  status: AttendanceStatus;
  remarks: string;
}

export function DailyAttendanceClient() {
  const todayStr = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState<string>(todayStr);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [rows, setRows] = useState<StudentAttendanceRow[]>([]);

  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load available classes
  useEffect(() => {
    fetch("/api/classes?limit=100")
      .then((res) => res.json())
      .then((data) => {
        if (data.classes && data.classes.length > 0) {
          setClasses(data.classes);
          setSelectedClassId(data.classes[0]._id);
        }
        setIsLoadingClasses(false);
      })
      .catch(() => {
        setIsLoadingClasses(false);
      });
  }, []);

  // Fetch class students and existing attendance for date
  const loadClassAttendance = useCallback(async () => {
    if (!selectedClassId || !date) return;

    setIsLoadingStudents(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // 1. Get class students
      const studentsRes = await fetch(`/api/classes/${selectedClassId}/students`);
      const studentsData = await studentsRes.json();

      if (!studentsRes.ok) {
        setErrorMessage(studentsData.error || "Failed to load class roster.");
        setIsLoadingStudents(false);
        return;
      }

      const classStudents: StudentInClass[] = studentsData.students || [];

      // 2. Get existing attendance records for this class & date
      const attendanceRes = await fetch(
        `/api/attendance?classId=${selectedClassId}&date=${date}&limit=100`
      );
      const attendanceData = await attendanceRes.json();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existingAttendanceMap = new Map<string, any>();
      if (attendanceData.attendance) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        attendanceData.attendance.forEach((rec: any) => {
          const sId = typeof rec.studentId === "object" ? rec.studentId._id : rec.studentId;
          existingAttendanceMap.set(sId, rec);
        });
      }

      // 3. Assemble attendance row state
      const initialRows: StudentAttendanceRow[] = classStudents.map((st) => {
        const existing = existingAttendanceMap.get(st._id);
        return {
          studentId: st._id,
          admissionNumber: st.admissionNumber,
          firstName: st.firstName,
          lastName: st.lastName,
          rollNumber: st.rollNumber,
          status: existing ? (existing.status as AttendanceStatus) : "present",
          remarks: existing?.remarks || "",
        };
      });

      setRows(initialRows);
      setIsLoadingStudents(false);
    } catch {
      setErrorMessage("Network error while loading class attendance.");
      setIsLoadingStudents(false);
    }
  }, [selectedClassId, date]);

  useEffect(() => {
    if (selectedClassId) {
      loadClassAttendance();
    }
  }, [loadClassAttendance, selectedClassId, date]);

  const handleStatusChange = (index: number, newStatus: AttendanceStatus) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], status: newStatus };
      return updated;
    });
  };

  const handleRemarksChange = (index: number, remarks: string) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], remarks };
      return updated;
    });
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    setRows((prev) => prev.map((r) => ({ ...r, status })));
  };

  const handleSaveAttendance = async () => {
    if (rows.length === 0) return;

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload = {
        classId: selectedClassId,
        date,
        records: rows.map((r) => ({
          studentId: r.studentId,
          status: r.status,
          remarks: r.remarks,
        })),
      };

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to record attendance.");
        setIsSaving(false);
        return;
      }

      setSuccessMessage(`Attendance recorded successfully for ${rows.length} students on ${date}.`);
      setIsSaving(false);
    } catch {
      setErrorMessage("Network error while saving attendance.");
      setIsSaving(false);
    }
  };

  const selectedClass = classes.find((c) => c._id === selectedClassId);

  const presentCount = rows.filter((r) => r.status === "present").length;
  const absentCount = rows.filter((r) => r.status === "absent").length;
  const lateCount = rows.filter((r) => r.status === "late").length;
  const halfDayCount = rows.filter((r) => r.status === "half-day").length;

  return (
    <div className="space-y-6">
      {/* Header and Nav Links */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              Daily Attendance Roll
            </h1>
            <Badge variant="brand" className="text-[10px] font-bold">
              Attendance Module
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Log and review daily class presence with multi-status support and historical preservation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/admin/attendance/history">
            <Button variant="outline" size="sm" className="text-xs text-slate-700 hover:bg-slate-50 gap-1.5">
              <History className="h-3.5 w-3.5 text-blue-600" />
              <span>History Logs</span>
            </Button>
          </Link>
          <Link href="/admin/attendance/reports">
            <Button variant="outline" size="sm" className="text-xs text-slate-700 hover:bg-slate-50 gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-blue-600" />
              <span>Analytics & Reports</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Attendance Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Class & Section
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              disabled={isLoadingClasses || classes.length === 0}
              className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:bg-slate-100"
            >
              {classes.length === 0 ? (
                <option value="">No classes configured</option>
              ) : (
                classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.className} - Section {c.section} ({c.academicYear})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleMarkAll("present")}
                disabled={rows.length === 0 || isLoadingStudents}
                className="flex-1 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50"
              >
                Mark All Present
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleMarkAll("absent")}
                disabled={rows.length === 0 || isLoadingStudents}
                className="flex-1 text-xs text-rose-700 border-rose-200 hover:bg-rose-50"
              >
                Mark All Absent
              </Button>
            </div>
          </div>
        </div>

        {/* Live Status Counter Pill */}
        {rows.length > 0 && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs font-medium">
            <span className="text-slate-500">Summary for {date}:</span>
            <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Present: <strong>{presentCount}</strong>
            </span>
            <span className="text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
              Absent: <strong>{absentCount}</strong>
            </span>
            <span className="text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              Late: <strong>{lateCount}</strong>
            </span>
            <span className="text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
              Half-Day: <strong>{halfDayCount}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Alert Messages */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Attendance Roll Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoadingStudents ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 space-y-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <p className="text-xs font-medium">Loading student roster and existing records...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center px-4">
            <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">No students enrolled in this class</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Navigate to Classes &amp; Sections to enroll students into {selectedClass?.className || "this class"}.
            </p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Roll</th>
                    <th className="py-3 px-4">Admission #</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Attendance Status</th>
                    <th className="py-3 px-4">Remarks (Optional)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {rows.map((row, index) => (
                    <tr key={row.studentId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-600">
                        {row.rollNumber || "—"}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {row.admissionNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {row.firstName} {row.lastName}
                      </td>
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 border border-slate-200">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(index, "present")}
                            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                              row.status === "present"
                                ? "bg-emerald-600 text-white shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(index, "absent")}
                            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                              row.status === "absent"
                                ? "bg-rose-600 text-white shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            Absent
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(index, "late")}
                            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                              row.status === "late"
                                ? "bg-amber-600 text-white shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            Late
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(index, "half-day")}
                            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                              row.status === "half-day"
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            Half Day
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          placeholder="e.g. Sick note submitted"
                          value={row.remarks}
                          onChange={(e) => handleRemarksChange(index, e.target.value)}
                          className="w-full text-xs rounded-lg border border-slate-200 px-3 py-1.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Save CTA Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-xs text-slate-500">
                Ready to sync <strong>{rows.length}</strong> attendance records for{" "}
                <strong>{selectedClass?.className} - {selectedClass?.section}</strong>.
              </span>
              <Button
                onClick={handleSaveAttendance}
                disabled={isSaving || rows.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold gap-1.5 shadow-sm px-5"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving Attendance...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    <span>Save Attendance</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

