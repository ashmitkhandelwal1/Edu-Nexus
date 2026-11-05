"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  BookOpen,
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
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClassFormModal, ClassFormData } from "@/components/admin/ClassFormModal";

interface ClassRecord {
  _id: string;
  className: string;
  section: string;
  academicYear: string;
  classTeacher?: {
    _id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    email: string;
  };
  roomNumber?: string;
  capacity: number;
  studentCount: number;
  availableSeats: number;
  createdAt: string;
}

export function ClassesDirectoryClient() {
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters & pagination
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [academicYearFilter, setAcademicYearFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassFormData | null>(null);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchClasses = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      if (debouncedSearch) params.set("search", debouncedSearch);
      if (academicYearFilter) params.set("academicYear", academicYearFilter);

      const res = await fetch(`/api/classes?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to load classes directory.");
        setIsLoading(false);
        return;
      }

      setClasses(data.classes || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalRecords(data.pagination?.total || 0);
      setIsLoading(false);
    } catch {
      setErrorMessage("Network error while connecting to server.");
      setIsLoading(false);
    }
  }, [page, debouncedSearch, academicYearFilter]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleOpenAdd = () => {
    setEditingClass(null);
    setEditingClassId(null);
    setModalOpen(true);
  };

  const handleOpenEdit = async (c: ClassRecord) => {
    try {
      const res = await fetch(`/api/classes/${c._id}`);
      const data = await res.json();
      if (res.ok && data.class) {
        const item = data.class;
        setEditingClass({
          className: item.className || "",
          section: item.section || "",
          academicYear: item.academicYear || "2026-27",
          classTeacher: item.classTeacher?._id || "",
          subjects: (item.subjects || []).map((s: { subjectName: string; teacher?: { _id: string } | string }) => ({
            subjectName: s.subjectName,
            teacher: typeof s.teacher === "object" ? s.teacher?._id || "" : s.teacher || "",
          })),
          roomNumber: item.roomNumber || "",
          capacity: item.capacity || 40,
        });
        setEditingClassId(c._id);
        setModalOpen(true);
      }
    } catch {
      alert("Failed to load class details for editing.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete class ${name}?`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/classes/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Could not delete class.");
        setDeletingId(null);
        return;
      }

      setDeletingId(null);
      fetchClasses();
    } catch {
      alert("Network error occurred while deleting.");
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              Classes & Sections
            </h1>
            <Badge variant="brand" className="text-[10px] font-bold">
              {totalRecords} Active Classes
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Configure academic cohorts, room capacities, class mentors and enrolled student cohorts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchClasses()}
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
            <span>Create Class</span>
          </Button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by class name, section or room number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Academic Year Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400 shrink-0 hidden sm:block" />
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

      {/* Classes Directory Table */}
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
            <p className="text-xs font-medium">Loading classes directory...</p>
          </div>
        ) : classes.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center px-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No classes found</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              {search || academicYearFilter
                ? "No classes match your search criteria. Try modifying your filter."
                : "No classes or sections configured yet. Click 'Create Class' to get started."}
            </p>
            <Button
              size="sm"
              onClick={handleOpenAdd}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Class</span>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Class & Section</th>
                  <th className="py-3 px-4">Academic Year</th>
                  <th className="py-3 px-4">Class Teacher</th>
                  <th className="py-3 px-4">Room</th>
                  <th className="py-3 px-4">Enrollment / Capacity</th>
                  <th className="py-3 px-4">Seat Availability</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {classes.map((c) => (
                  <tr
                    key={c._id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs border border-blue-100">
                          {c.section}
                        </div>
                        <span className="font-bold text-slate-900 text-sm">
                          {c.className}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {c.academicYear}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {c.classTeacher ? (
                        <div>
                          <p className="font-semibold text-slate-900">
                            {c.classTeacher.firstName} {c.classTeacher.lastName}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {c.classTeacher.employeeId}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {c.roomNumber || "—"}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">
                          {c.studentCount}
                        </span>
                        <span className="text-slate-400">/</span>
                        <span className="text-slate-500">{c.capacity}</span>
                      </div>
                      <div className="w-24 bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round((c.studentCount / (c.capacity || 1)) * 100)
                            )}%`,
                          }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={c.availableSeats > 0 ? "success" : "secondary"}
                        className="text-[10px]"
                      >
                        {c.availableSeats} Seats Open
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/classes/${c._id}`}>
                          <button
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="View Class Roster & Mappings"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </Link>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Edit Class Specifications"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(c._id, `${c.className} - ${c.section}`)
                          }
                          disabled={deletingId === c._id}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                          title="Delete Class"
                        >
                          {deletingId === c._id ? (
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
        {classes.length > 0 && (
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

      {/* Modal */}
      <ClassFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => fetchClasses()}
        initialData={editingClass}
        classId={editingClassId}
      />
    </div>
  );
}

