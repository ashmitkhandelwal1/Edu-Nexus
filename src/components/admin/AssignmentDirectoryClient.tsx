"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  BookOpen,
  Users,
  Edit2,
  Trash2,
  Award,
  RefreshCw,
  AlertCircle,
  Paperclip,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssignmentFormModal } from "./AssignmentFormModal";
import { SubmissionGradingModal } from "./SubmissionGradingModal";

interface AssignmentDirectoryProps {
  initialClasses: any[];
  initialTeachers: any[];
}

export function AssignmentDirectoryClient({
  initialClasses,
  initialTeachers,
}: AssignmentDirectoryProps) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [classId, setClassId] = useState("");
  const [status, setStatus] = useState("");
  const [academicYear, setAcademicYear] = useState("2026-27");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any | null>(null);

  const [gradingModalOpen, setGradingModalOpen] = useState(false);
  const [gradingAssignment, setGradingAssignment] = useState<any | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAssignments = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (classId) params.append("classId", classId);
      if (status) params.append("status", status);
      if (academicYear) params.append("academicYear", academicYear);
      params.append("page", String(page));

      const res = await fetch(`/api/assignments?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load assignments");

      setAssignments(data.assignments || []);
      setPagination(data.pagination || { totalPages: 1, total: 0 });
    } catch (err: any) {
      setError(err.message || "Failed to connect to assignments API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [search, classId, status, academicYear, page]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/assignments/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to delete assignment");
        return;
      }
      fetchAssignments();
    } catch (err: any) {
      alert(err.message || "Network error deleting assignment");
    } finally {
      setDeletingId(null);
    }
  };

  const openEdit = (a: any) => {
    setEditingAssignment(a);
    setFormModalOpen(true);
  };

  const openGrading = (a: any) => {
    setGradingAssignment(a);
    setGradingModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-400" />
            Assignments & Homework
          </h1>
          <p className="text-sm text-slate-400">
            Publish coursework, collect student submissions, and manage digital grading
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingAssignment(null);
            setFormModalOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 font-medium"
        >
          <Plus className="w-4 h-4" /> Create Assignment
        </Button>
      </div>

      {/* Toolbar / Filters */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1 flex-wrap">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search title, subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-3 py-2 text-slate-300 focus:outline-none"
          >
            <option value="">All Classes</option>
            {initialClasses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.className} - {c.section}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-3 py-2 text-slate-300 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="closed">Closed</option>
          </select>

          <input
            type="text"
            placeholder="Year (2026-27)"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="w-28 bg-slate-950 border border-slate-800 text-xs rounded-lg px-3 py-2 text-slate-300 focus:outline-none hidden sm:block"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchAssignments}
          disabled={loading}
          className="border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 text-xs gap-1.5 self-end md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main List */}
      {loading && assignments.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading assignments roster...</p>
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <FileText className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-white">No Assignments Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Get started by creating your first homework or coursework assignment.
          </p>
          <Button
            onClick={() => {
              setEditingAssignment(null);
              setFormModalOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs mt-2"
          >
            Create Assignment Now
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignments.map((a) => {
            const classObj = a.classId || {};
            const isDuePassed = new Date(a.dueDate).getTime() < Date.now();

            return (
              <div
                key={a._id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Status & Subject Row */}
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                      {a.subjectName}
                    </span>

                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        a.status === "published"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : a.status === "closed"
                          ? "bg-slate-800 text-slate-400 border border-slate-700"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {a.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white line-clamp-1">{a.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">{a.description}</p>
                  </div>

                  {/* Metadata Chips */}
                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                        Class:
                      </span>
                      <span className="font-semibold text-slate-200">
                        {classObj.className} - {classObj.section}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Clock className={`w-3.5 h-3.5 ${isDuePassed ? "text-rose-400" : "text-slate-500"}`} />
                        Due Date:
                      </span>
                      <span className={`font-semibold ${isDuePassed ? "text-rose-400 font-bold" : "text-slate-200"}`}>
                        {new Date(a.dueDate).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        Max Marks:
                      </span>
                      <span className="font-bold text-white">{a.maxMarks}</span>
                    </div>

                    {a.attachments && a.attachments.length > 0 && (
                      <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800/60">
                        <span className="flex items-center gap-1.5 text-[11px]">
                          <Paperclip className="w-3 h-3 text-indigo-400" /> Attachments:
                        </span>
                        <span className="text-[11px] text-indigo-300 font-semibold">
                          {a.attachments.length} file(s)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submissions summary & Actions */}
                <div className="space-y-3 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Submissions:</span>
                    <span className="font-semibold text-slate-200">
                      <span className="text-indigo-400 font-bold">{a.submissionCount || 0}</span> submitted •{" "}
                      <span className="text-emerald-400 font-bold">{a.gradedCount || 0}</span> graded
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => openGrading(a)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold gap-1.5"
                    >
                      <Users className="w-3.5 h-3.5" /> Submissions
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(a)}
                      className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs px-2.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={deletingId === a._id}
                      onClick={() => handleDelete(a._id)}
                      className="border-rose-900/40 text-rose-400 hover:bg-rose-950/20 text-xs px-2.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <AssignmentFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSuccess={fetchAssignments}
        classes={initialClasses}
        teachers={initialTeachers}
        initialData={editingAssignment}
      />

      <SubmissionGradingModal
        isOpen={gradingModalOpen}
        onClose={() => setGradingModalOpen(false)}
        onSuccess={fetchAssignments}
        assignment={gradingAssignment}
      />
    </div>
  );
}

