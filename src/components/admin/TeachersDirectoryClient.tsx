"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
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
  Mail,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TeacherFormModal, TeacherFormData } from "@/components/admin/TeacherFormModal";

interface TeacherRecord {
  _id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department: string;
  qualification: string;
  specialization?: string;
  subjects: string[];
  employmentType: "full-time" | "part-time" | "contract";
  status: "active" | "inactive";
  joiningDate: string;
  createdAt: string;
}

export function TeachersDirectoryClient() {
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters and pagination state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Form Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherFormData | null>(null);
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);

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

  const fetchTeachers = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      if (debouncedSearch) params.set("search", debouncedSearch);
      if (departmentFilter) params.set("department", departmentFilter);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/teachers?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to retrieve teacher directory.");
        setIsLoading(false);
        return;
      }

      setTeachers(data.teachers || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalRecords(data.pagination?.total || 0);
      setIsLoading(false);
    } catch {
      setErrorMessage("Network error while connecting to server.");
      setIsLoading(false);
    }
  }, [page, debouncedSearch, departmentFilter, statusFilter]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setEditingTeacherId(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (teacher: TeacherRecord) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t = teacher as any;
    setEditingTeacher({
      employeeId: t.employeeId || "",
      firstName: t.firstName || "",
      lastName: t.lastName || "",
      email: t.email || "",
      phone: t.phone || "",
      dateOfBirth: t.dateOfBirth ? t.dateOfBirth.split("T")[0] : "",
      gender: t.gender || "",
      address: t.address || "",
      qualification: t.qualification || "",
      specialization: t.specialization || "",
      department: t.department || "",
      subjects: Array.isArray(t.subjects) ? t.subjects.join(", ") : "",
      joiningDate: t.joiningDate
        ? t.joiningDate.split("T")[0]
        : new Date().toISOString().split("T")[0],
      employmentType: t.employmentType || "full-time",
      status: t.status || "active",
    });
    setEditingTeacherId(teacher._id);
    setModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove the faculty record for ${name}?`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/teachers/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Could not delete faculty record.");
        setDeletingId(null);
        return;
      }

      setDeletingId(null);
      fetchTeachers();
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
              Faculty & Staff Directory
            </h1>
            <Badge variant="brand" className="text-[10px] font-bold">
              {totalRecords} Active Members
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Manage teacher profiles, departments, assigned subjects, and employment contracts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTeachers()}
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
            <span>Register Faculty</span>
          </Button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, employee ID, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Department Filter */}
          <div>
            <input
              type="text"
              placeholder="Filter by Department (e.g. Science)"
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
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
            <p className="text-xs font-medium">Loading faculty directory...</p>
          </div>
        ) : teachers.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center px-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No faculty members found</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              {search || departmentFilter || statusFilter
                ? "No teachers matched your search criteria. Try modifying your filters."
                : "Your faculty directory is empty. Click 'Register Faculty' to add your first teacher."}
            </p>
            <Button
              size="sm"
              onClick={handleOpenAdd}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Register Faculty</span>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Emp ID</th>
                  <th className="py-3 px-4">Faculty Member</th>
                  <th className="py-3 px-4">Department & Qualification</th>
                  <th className="py-3 px-4">Subjects</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {teachers.map((teacher) => (
                  <tr
                    key={teacher._id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                      {teacher.employeeId}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                          {teacher.firstName[0]}
                          {teacher.lastName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {teacher.firstName} {teacher.lastName}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {teacher.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <p className="font-medium text-slate-900">{teacher.department}</p>
                      <p className="text-[11px] text-slate-400">{teacher.qualification}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {teacher.subjects && teacher.subjects.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {teacher.subjects.slice(0, 2).map((sub, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700"
                            >
                              {sub}
                            </span>
                          ))}
                          {teacher.subjects.length > 2 && (
                            <span className="text-[10px] text-slate-400 font-medium self-center">
                              +{teacher.subjects.length - 2} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 capitalize">
                      {teacher.employmentType}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={teacher.status === "active" ? "success" : "secondary"}
                        className="capitalize text-[10px]"
                      >
                        {teacher.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/teachers/${teacher._id}`}>
                          <button
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="View faculty profile"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </Link>
                        <button
                          onClick={() => handleOpenEdit(teacher)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Edit faculty member"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(
                              teacher._id,
                              `${teacher.firstName} ${teacher.lastName}`
                            )
                          }
                          disabled={deletingId === teacher._id}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                          title="Delete faculty record"
                        >
                          {deletingId === teacher._id ? (
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
        {teachers.length > 0 && (
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

      {/* Add / Edit Modal */}
      <TeacherFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => fetchTeachers()}
        initialData={editingTeacher}
        teacherId={editingTeacherId}
      />
    </div>
  );
}

