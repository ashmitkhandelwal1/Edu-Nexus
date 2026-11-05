"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  History,
  CalendarCheck,
  Search,
  Filter,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Save,
  X,
  RefreshCw,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ClassOption {
  _id: string;
  className: string;
  section: string;
}

interface AttendanceHistoryItem {
  _id: string;
  date: string;
  status: "present" | "absent" | "late" | "half-day";
  remarks?: string;
  studentId?: {
    _id: string;
    admissionNumber: string;
    firstName: string;
    lastName: string;
    rollNumber?: string;
  };
  classId?: {
    _id: string;
    className: string;
    section: string;
  };
  markedBy?: {
    name: string;
    email: string;
  };
}

export function AttendanceHistoryClient() {
  const [records, setRecords] = useState<AttendanceHistoryItem[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters & pagination
  const [dateFilter, setDateFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Edit record state
  const [editingRecord, setEditingRecord] = useState<AttendanceHistoryItem | null>(null);
  const [editStatus, setEditStatus] = useState<"present" | "absent" | "late" | "half-day">("present");
  const [editRemarks, setEditRemarks] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Load classes for filter dropdown
  useEffect(() => {
    fetch("/api/classes?limit=100")
      .then((res) => res.json())
      .then((data) => {
        if (data.classes) setClasses(data.classes);
      })
      .catch(() => {});
  }, []);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
      });

      if (dateFilter) params.set("date", dateFilter);
      if (classFilter) params.set("classId", classFilter);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/attendance?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to load attendance logs.");
        setIsLoading(false);
        return;
      }

      setRecords(data.attendance || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalRecords(data.pagination?.total || 0);
      setIsLoading(false);
    } catch {
      setErrorMessage("Network error while connecting to server.");
      setIsLoading(false);
    }
  }, [page, dateFilter, classFilter, statusFilter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleOpenEdit = (rec: AttendanceHistoryItem) => {
    setEditingRecord(rec);
    setEditStatus(rec.status);
    setEditRemarks(rec.remarks || "");
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    setIsUpdating(true);

    try {
      const res = await fetch(`/api/attendance/${editingRecord._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: editStatus, remarks: editRemarks }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to update attendance.");
        setIsUpdating(false);
        return;
      }

      setIsUpdating(false);
      setEditingRecord(null);
      fetchHistory();
    } catch {
      alert("Network error while updating attendance.");
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge variant="success">Present</Badge>;
      case "absent":
        return <Badge variant="default" className="bg-rose-600">Absent</Badge>;
      case "late":
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800">Late</Badge>;
      case "half-day":
        return <Badge variant="brand" className="bg-indigo-100 text-indigo-800 border-indigo-200">Half-Day</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              Attendance History &amp; Logs
            </h1>
            <Badge variant="brand" className="text-[10px] font-bold">
              {totalRecords} Total Records
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Search, filter, review and edit historical attendance logs across all classrooms.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/admin/attendance">
            <Button variant="outline" size="sm" className="text-xs text-slate-700 hover:bg-slate-50 gap-1.5">
              <CalendarCheck className="h-3.5 w-3.5 text-blue-600" />
              <span>Daily Roll</span>
            </Button>
          </Link>
          <Link href="/admin/attendance/reports">
            <Button variant="outline" size="sm" className="text-xs text-slate-700 hover:bg-slate-50 gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-blue-600" />
              <span>Analytics</span>
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchHistory()}
            className="text-xs text-slate-700 hover:bg-slate-50 gap-1.5"
            title="Refresh logs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Filter by Date
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Filter by Class
            </label>
            <select
              value={classFilter}
              onChange={(e) => {
                setClassFilter(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.className} - {c.section}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="">All Statuses</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="half-day">Half-Day</option>
            </select>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {errorMessage && (
          <div className="p-4 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 space-y-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <p className="text-xs font-medium">Loading attendance history...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center px-4">
            <History className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">No attendance records found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Try adjusting your date or class filters, or record daily attendance for today.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Remarks</th>
                  <th className="py-3 px-4">Marked By</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {records.map((rec) => (
                  <tr key={rec._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      {rec.date}
                    </td>
                    <td className="py-3 px-4">
                      {rec.studentId ? (
                        <div>
                          <p className="font-semibold text-slate-900">
                            {rec.studentId.firstName} {rec.studentId.lastName}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {rec.studentId.admissionNumber}
                            {rec.studentId.rollNumber && ` • Roll #${rec.studentId.rollNumber}`}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Student deleted</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {rec.classId
                        ? `${rec.classId.className} - ${rec.classId.section}`
                        : "—"}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(rec.status)}</td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {rec.remarks || "—"}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {rec.markedBy?.name || "System"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(rec)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit attendance"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {records.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing page <span className="font-semibold text-slate-900">{page}</span> of{" "}
              <span className="font-semibold text-slate-900">{totalPages}</span> (
              {totalRecords} records)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isLoading}
                className="h-8 px-2.5 text-xs gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Prev</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isLoading}
                className="h-8 px-2.5 text-xs gap-1"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Record Modal Dialog */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Edit Attendance Record</h3>
                <p className="text-xs text-slate-400">
                  {editingRecord.studentId?.firstName} {editingRecord.studentId?.lastName} • {editingRecord.date}
                </p>
              </div>
              <button
                onClick={() => setEditingRecord(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Attendance Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) =>
                    setEditStatus(e.target.value as "present" | "absent" | "late" | "half-day")
                  }
                  className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="present">Present (Full Day)</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late Arrival</option>
                  <option value="half-day">Half-Day Attendance (0.5)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Remarks / Notes
                </label>
                <input
                  type="text"
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  placeholder="e.g. Verified by parent notification"
                  className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingRecord(null)}
                  disabled={isUpdating}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={isUpdating}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      <span>Save Record</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

