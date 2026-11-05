"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  RefreshCw,
  Award,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExamFormModal, ExamFormData } from "@/components/admin/ExamFormModal";

interface ExamRecord {
  _id: string;
  examName: string;
  examType: string;
  classId?: {
    _id: string;
    className: string;
    section: string;
    academicYear: string;
  };
  academicYear: string;
  startDate: string;
  endDate: string;
  subjects: {
    subjectName: string;
    maxMarks: number;
    passMarks: number;
    teacherId?: {
      firstName: string;
      lastName: string;
      employeeId: string;
    };
  }[];
  status: "draft" | "ongoing" | "completed" | "published";
  createdAt: string;
}

export function ExamsDirectoryClient() {
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters & pagination
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [academicYearFilter, setAcademicYearFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamFormData | null>(null);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchExams = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter) params.set("status", statusFilter);
      if (academicYearFilter) params.set("academicYear", academicYearFilter);

      const res = await fetch(`/api/exams?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to load examinations.");
        setIsLoading(false);
        return;
      }

      setExams(data.exams || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalRecords(data.pagination?.total || 0);
      setIsLoading(false);
    } catch {
      setErrorMessage("Network error while connecting to server.");
      setIsLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, academicYearFilter]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const handleOpenAdd = () => {
    setEditingExam(null);
    setEditingExamId(null);
    setModalOpen(true);
  };

  const handleOpenEdit = async (exam: ExamRecord) => {
    try {
      const res = await fetch(`/api/exams/${exam._id}`);
      const data = await res.json();
      if (res.ok && data.exam) {
        const item = data.exam;
        setEditingExam({
          examName: item.examName || "",
          examType: item.examType || "unit-test",
          classId: item.classId?._id || "",
          academicYear: item.academicYear || "2026-27",
          startDate: item.startDate || "",
          endDate: item.endDate || "",
          subjects: (item.subjects || []).map((s: { subjectName: string; maxMarks: number; passMarks: number; teacherId?: { _id: string } | string }) => ({
            subjectName: s.subjectName,
            maxMarks: s.maxMarks,
            passMarks: s.passMarks,
            teacherId: typeof s.teacherId === "object" ? s.teacherId?._id || "" : s.teacherId || "",
          })),
          status: item.status || "draft",
        });
        setEditingExamId(exam._id);
        setModalOpen(true);
      }
    } catch {
      alert("Failed to load examination details for editing.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete examination "${name}"?`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/exams/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Could not delete examination.");
        setDeletingId(null);
        return;
      }

      setDeletingId(null);
      fetchExams();
    } catch {
      alert("Network error occurred while deleting.");
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge variant="success">Published</Badge>;
      case "completed":
        return <Badge variant="brand" className="bg-blue-100 text-blue-800 border-blue-200">Completed</Badge>;
      case "ongoing":
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800">Ongoing</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              Examinations &amp; Evaluation Center
            </h1>
            <Badge variant="brand" className="text-[10px] font-bold">
              {totalRecords} Schedules
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Define exam calendars, curriculum thresholds, enter student marks and publish rank cards.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchExams()}
            className="text-xs text-slate-700 hover:bg-slate-50 gap-1.5"
            title="Refresh list"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </Button>
          <Button
            size="sm"
            onClick={handleOpenAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Schedule Exam</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search exam name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400 shrink-0 hidden sm:block" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div>
            <select
              value={academicYearFilter}
              onChange={(e) => {
                setAcademicYearFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="">All Academic Years</option>
              <option value="2026-27">2026-27</option>
              <option value="2025-26">2025-26</option>
            </select>
          </div>
        </div>
      </div>

      {/* Examinations Directory Table */}
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
            <p className="text-xs font-medium">Loading examinations...</p>
          </div>
        ) : exams.length === 0 ? (
          <div className="py-16 text-center px-4">
            <FileSpreadsheet className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">No examinations found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Click &quot;Schedule Exam&quot; to configure your first institutional assessment.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Examination</th>
                  <th className="py-3 px-4">Class Cohort</th>
                  <th className="py-3 px-4">Timeline</th>
                  <th className="py-3 px-4">Curriculum</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {exams.map((exam) => (
                  <tr key={exam._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 text-sm">{exam.examName}</p>
                      <span className="text-[10px] uppercase font-semibold text-blue-600 tracking-wider">
                        {exam.examType}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">
                        {exam.classId
                          ? `${exam.classId.className} - ${exam.classId.section}`
                          : "Unassigned"}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {exam.academicYear}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs font-mono">
                      {exam.startDate} <span className="text-slate-400">to</span> {exam.endDate}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {exam.subjects.map((sub, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-medium"
                          >
                            {sub.subjectName} ({sub.maxMarks}m)
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(exam.status)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/admin/exams/${exam._id}/marks`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[11px] gap-1 px-2 text-blue-600 hover:bg-blue-50"
                            title="Enter / Review Student Marks"
                          >
                            <Edit2 className="h-3 w-3" />
                            <span>Marks</span>
                          </Button>
                        </Link>
                        <Link href={`/admin/exams/${exam._id}/results`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[11px] gap-1 px-2 text-emerald-600 hover:bg-emerald-50"
                            title="View Class Results & Rankings"
                          >
                            <Award className="h-3 w-3" />
                            <span>Results</span>
                          </Button>
                        </Link>
                        <button
                          onClick={() => handleOpenEdit(exam)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Edit Exam Schedule"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(exam._id, exam.examName)}
                          disabled={deletingId === exam._id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                          title="Delete Exam"
                        >
                          {deletingId === exam._id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-600" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {exams.length > 0 && (
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

      {/* Schedule / Edit Modal */}
      <ExamFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => fetchExams()}
        initialData={editingExam}
        examId={editingExamId}
      />
    </div>
  );
}

