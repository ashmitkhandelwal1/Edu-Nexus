"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  GraduationCap,
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
  Users,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StudentFormModal, StudentFormData } from "@/components/admin/StudentFormModal";

interface StudentRecord {
  _id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  className: string;
  section: string;
  rollNumber?: string;
  guardianName: string;
  guardianPhone: string;
  status: "active" | "inactive";
  admissionDate: string;
  createdAt: string;
}

export function StudentsDirectoryClient() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters and pagination state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [classNameFilter, setClassNameFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Form Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentFormData | null>(null);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

  // Delete action state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      if (debouncedSearch) params.set("search", debouncedSearch);
      if (classNameFilter) params.set("className", classNameFilter);
      if (sectionFilter) params.set("section", sectionFilter);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/students?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to retrieve student directory.");
        setIsLoading(false);
        return;
      }

      setStudents(data.students || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalRecords(data.pagination?.total || 0);
      setIsLoading(false);
    } catch {
      setErrorMessage("Network error while connecting to server.");
      setIsLoading(false);
    }
  }, [page, debouncedSearch, classNameFilter, sectionFilter, statusFilter]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setEditingStudentId(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (student: StudentRecord) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = student as any;
    setEditingStudent({
      admissionNumber: s.admissionNumber || "",
      firstName: s.firstName || "",
      lastName: s.lastName || "",
      email: s.email || "",
      phone: s.phone || "",
      dateOfBirth: s.dateOfBirth ? s.dateOfBirth.split("T")[0] : "",
      gender: s.gender || "",
      address: s.address || "",
      className: s.className || "",
      section: s.section || "",
      rollNumber: s.rollNumber || "",
      guardianName: s.guardianName || "",
      guardianPhone: s.guardianPhone || "",
      guardianEmail: s.guardianEmail || "",
      admissionDate: s.admissionDate
        ? s.admissionDate.split("T")[0]
        : new Date().toISOString().split("T")[0],
      status: s.status || "active",
    });
    setEditingStudentId(student._id);
    setModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the record for ${name}?`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Could not delete student.");
        setDeletingId(null);
        return;
      }

      setDeletingId(null);
      fetchStudents();
    } catch {
      alert("Network error occurred while deleting.");
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              Student Directory
            </h1>
            <Badge variant="brand" className="text-[10px] font-bold">
              {totalRecords} Enrolled
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Manage student registrations, academic rosters, and guardian records.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchStudents()}
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
            <span>Enroll Student</span>
          </Button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, admission no, roll..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Class Filter */}
          <div>
            <input
              type="text"
              placeholder="Filter by Class (e.g. Grade 10)"
              value={classNameFilter}
              onChange={(e) => {
                setClassNameFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Section Filter */}
          <div>
            <input
              type="text"
              placeholder="Section (e.g. A)"
              value={sectionFilter}
              onChange={(e) => {
                setSectionFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Status Filter */}
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Directory Table / Status Views */}
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
            <p className="text-xs font-medium">Loading student directory...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center px-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No students found</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              {search || classNameFilter || sectionFilter || statusFilter
                ? "No student records matched your search filters. Try clearing filters."
                : "Your student roster is currently empty. Click 'Enroll Student' to add your first record."}
            </p>
            <Button
              size="sm"
              onClick={handleOpenAdd}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Enroll Student</span>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Adm #</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Class & Sec</th>
                  <th className="py-3 px-4">Roll</th>
                  <th className="py-3 px-4">Guardian Contact</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {students.map((student) => (
                  <tr
                    key={student._id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                      {student.admissionNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                          {student.firstName[0]}
                          {student.lastName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {student.email || "No email"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <span className="font-medium">{student.className}</span>
                      <span className="text-slate-400 ml-1">({student.section})</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {student.rollNumber || "—"}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <p className="font-medium">{student.guardianName}</p>
                      <p className="text-[11px] text-slate-400">{student.guardianPhone}</p>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={student.status === "active" ? "success" : "secondary"}
                        className="capitalize text-[10px]"
                      >
                        {student.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/students/${student._id}`}>
                          <button
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="View student profile"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </Link>
                        <button
                          onClick={() => handleOpenEdit(student)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Edit student"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(
                              student._id,
                              `${student.firstName} ${student.lastName}`
                            )
                          }
                          disabled={deletingId === student._id}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                          title="Delete student"
                        >
                          {deletingId === student._id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-rose-600" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
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
        {students.length > 0 && (
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

      {/* Add / Edit Student Modal */}
      <StudentFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => fetchStudents()}
        initialData={editingStudent}
        studentId={editingStudentId}
      />
    </div>
  );
}

