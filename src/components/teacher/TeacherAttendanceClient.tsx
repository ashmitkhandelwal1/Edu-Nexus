"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Save,
  RefreshCw,
  Calendar,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClassItem {
  _id: string;
  className: string;
  section: string;
  academicYear: string;
}

interface StudentItem {
  _id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  rollNumber?: string;
}

interface TeacherAttendanceClientProps {
  assignedClasses: ClassItem[];
}

export function TeacherAttendanceClient({ assignedClasses }: TeacherAttendanceClientProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>(assignedClasses[0]?._id || "");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, "present" | "absent" | "late" | "half-day">>({});
  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // History tab
  const [showHistory, setShowHistory] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);

  // Load students and existing attendance for selected class and date
  const loadClassAttendance = async () => {
    if (!selectedClassId) return;
    setLoading(true);
    setMessage(null);
    try {
      // 1. Fetch class details (students)
      const classRes = await fetch(`/api/classes/${selectedClassId}`);
      const classData = await classRes.json();
      const studentList = classData.students || [];
      setStudents(studentList);

      // 2. Fetch attendance for this class and date
      const attRes = await fetch(`/api/attendance?classId=${selectedClassId}&date=${date}&limit=100`);
      const attData = await attRes.json();
      const existingRecords = attData.attendance || [];

      // Initialize state (default: all present unless recorded)
      const newStatusMap: Record<string, "present" | "absent" | "late" | "half-day"> = {};
      const newRemarksMap: Record<string, string> = {};

      studentList.forEach((s: StudentItem) => {
        newStatusMap[s._id] = "present";
      });

      existingRecords.forEach((rec: any) => {
        const sId = typeof rec.studentId === "object" ? rec.studentId?._id : rec.studentId;
        if (sId) {
          newStatusMap[sId] = rec.status;
          if (rec.remarks) newRemarksMap[sId] = rec.remarks;
        }
      });

      setAttendanceMap(newStatusMap);
      setRemarksMap(newRemarksMap);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to load class attendance." });
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    if (!selectedClassId) return;
    try {
      const res = await fetch(`/api/attendance?classId=${selectedClassId}&limit=50`);
      const data = await res.json();
      if (res.ok) setHistoryRecords(data.attendance || []);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    if (!showHistory) {
      loadClassAttendance();
    } else {
      loadHistory();
    }
  }, [selectedClassId, date, showHistory]);

  const handleMarkAll = (status: "present" | "absent") => {
    const updated = { ...attendanceMap };
    students.forEach((s) => {
      updated[s._id] = status;
    });
    setAttendanceMap(updated);
  };

  const handleSaveAttendance = async () => {
    if (!selectedClassId || students.length === 0) return;
    setSaving(true);
    setMessage(null);
    try {
      const records = students.map((s) => ({
        studentId: s._id,
        status: attendanceMap[s._id] || "present",
        remarks: remarksMap[s._id] || undefined,
      }));

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: selectedClassId,
          date,
          records,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save attendance.");

      setMessage({ type: "success", text: `Attendance for ${date} saved successfully (${records.length} students).` });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Error submitting attendance." });
    } finally {
      setSaving(false);
    }
  };

  const selectedClass = assignedClasses.find((c) => c._id === selectedClassId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-blue-400" />
            Class Attendance Management
          </h1>
          <p className="text-sm text-slate-400">
            Mark daily attendance logs for your assigned teaching sections
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs gap-1.5"
          >
            <History className="w-3.5 h-3.5 text-indigo-400" />
            {showHistory ? "Back to Marking" : "View Class Attendance History"}
          </Button>
        </div>
      </div>

      {/* Class & Date Selector Header */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <label className="text-[10px] text-slate-400 font-semibold block mb-1">Select Teaching Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {assignedClasses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.className} - {c.section} ({c.academicYear})
                </option>
              ))}
            </select>
          </div>

          {!showHistory && (
            <div>
              <label className="text-[10px] text-slate-400 font-semibold block mb-1">Attendance Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {!showHistory && students.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleMarkAll("present")}
              className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs h-8"
            >
              Mark All Present
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleMarkAll("absent")}
              className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs h-8"
            >
              Mark All Absent
            </Button>
            <Button
              type="button"
              onClick={handleSaveAttendance}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs h-8 gap-1.5 shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving..." : "Save Attendance"}
            </Button>
          </div>
        )}
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          {message.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Student Attendance List */}
      {!showHistory ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-4">Roll #</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Admission #</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-400" />
                      Loading class student roster...
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500 italic">
                      No students enrolled in this class.
                    </td>
                  </tr>
                ) : (
                  students.map((student) => {
                    const status = attendanceMap[student._id] || "present";
                    return (
                      <tr key={student._id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-4 font-mono font-bold text-white">
                          #{student.rollNumber || "—"}
                        </td>
                        <td className="py-3 px-4 font-bold text-white">
                          {student.firstName} {student.lastName}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400">
                          {student.admissionNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setAttendanceMap({ ...attendanceMap, [student._id]: "present" })}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase transition ${
                                status === "present"
                                  ? "bg-emerald-600 text-white shadow-sm"
                                  : "bg-slate-950 text-slate-400 hover:text-white"
                              }`}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              onClick={() => setAttendanceMap({ ...attendanceMap, [student._id]: "absent" })}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase transition ${
                                status === "absent"
                                  ? "bg-rose-600 text-white shadow-sm"
                                  : "bg-slate-950 text-slate-400 hover:text-white"
                              }`}
                            >
                              Absent
                            </button>
                            <button
                              type="button"
                              onClick={() => setAttendanceMap({ ...attendanceMap, [student._id]: "late" })}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase transition ${
                                status === "late"
                                  ? "bg-amber-600 text-white shadow-sm"
                                  : "bg-slate-950 text-slate-400 hover:text-white"
                              }`}
                            >
                              Late
                            </button>
                            <button
                              type="button"
                              onClick={() => setAttendanceMap({ ...attendanceMap, [student._id]: "half-day" })}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase transition ${
                                status === "half-day"
                                  ? "bg-sky-600 text-white shadow-sm"
                                  : "bg-slate-950 text-slate-400 hover:text-white"
                              }`}
                            >
                              Half-Day
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            placeholder="Optional remark..."
                            value={remarksMap[student._id] || ""}
                            onChange={(e) => setRemarksMap({ ...remarksMap, [student._id]: e.target.value })}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* History View */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-4 space-y-3">
          <h3 className="text-sm font-bold text-white">Recent Attendance Logs ({historyRecords.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-semibold">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Student</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {historyRecords.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500 italic">No attendance records found.</td>
                  </tr>
                ) : (
                  historyRecords.map((r) => (
                    <tr key={r._id}>
                      <td className="py-2.5 px-3 font-mono text-white">{r.date}</td>
                      <td className="py-2.5 px-3 font-semibold text-white">
                        {r.studentId?.firstName} {r.studentId?.lastName} ({r.studentId?.admissionNumber})
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="uppercase font-bold text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                          {r.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{r.remarks || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

