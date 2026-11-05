"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Users,
  UserPlus,
  BookOpen,
  Calendar,
  Layers,
  Edit2,
  Trash2,
  UserCheck,
  UserMinus,
  Loader2,
  AlertCircle,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ClassFormModal, ClassFormData } from "@/components/admin/ClassFormModal";

interface StudentSummary {
  _id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  rollNumber?: string;
  email?: string;
  phone?: string;
}

interface SubjectMapping {
  subjectName: string;
  teacher?: {
    _id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    department?: string;
  };
}

interface ClassDetailClientProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialClass: any;
}

export function ClassDetailClient({ initialClass }: ClassDetailClientProps) {
  const router = useRouter();
  const [classData, setClassData] = useState(initialClass);
  const [modalOpen, setModalOpen] = useState(false);
  const [isDeletingClass, setIsDeletingClass] = useState(false);

  // Student allocation states
  const [eligibleStudents, setEligibleStudents] = useState<StudentSummary[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [removingStudentId, setRemovingStudentId] = useState<string | null>(null);
  const [allocationError, setAllocationError] = useState<string | null>(null);

  const refreshClass = useCallback(async () => {
    try {
      const res = await fetch(`/api/classes/${classData._id}`);
      const data = await res.json();
      if (res.ok && data.class) {
        setClassData(data.class);
      }
    } catch {
      // fallback
    }
  }, [classData._id]);

  // Load active students to allow assigning
  const fetchEligibleStudents = useCallback(async () => {
    try {
      const res = await fetch("/api/students?limit=100&status=active");
      const data = await res.json();
      if (res.ok && data.students) {
        setEligibleStudents(data.students);
      }
    } catch {
      // fallback
    }
  }, []);

  useEffect(() => {
    fetchEligibleStudents();
  }, [fetchEligibleStudents]);

  const handleAssignStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    setIsAssigning(true);
    setAllocationError(null);

    try {
      const res = await fetch(`/api/classes/${classData._id}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: selectedStudentId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAllocationError(data.error || "Failed to assign student.");
        setIsAssigning(false);
        return;
      }

      setSelectedStudentId("");
      setIsAssigning(false);
      refreshClass();
    } catch {
      setAllocationError("Network error occurred while enrolling student.");
      setIsAssigning(false);
    }
  };

  const handleRemoveStudent = async (studentId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from this class?`)) {
      return;
    }

    setRemovingStudentId(studentId);
    setAllocationError(null);

    try {
      const res = await fetch(
        `/api/classes/${classData._id}/students/${studentId}`,
        { method: "DELETE" }
      );

      const data = await res.json();

      if (!res.ok) {
        setAllocationError(data.error || "Could not remove student.");
        setRemovingStudentId(null);
        return;
      }

      setRemovingStudentId(null);
      refreshClass();
    } catch {
      setAllocationError("Network error while removing student.");
      setRemovingStudentId(null);
    }
  };

  const handleDeleteClass = async () => {
    if (!window.confirm(`Are you sure you want to delete class ${classData.className} - ${classData.section}?`)) {
      return;
    }

    setIsDeletingClass(true);
    try {
      const res = await fetch(`/api/classes/${classData._id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok) {
        router.push("/admin/classes");
        router.refresh();
      } else {
        alert(data.error || "Failed to delete class.");
        setIsDeletingClass(false);
      }
    } catch {
      alert("Network error occurred.");
      setIsDeletingClass(false);
    }
  };

  const formData: ClassFormData = {
    className: classData.className || "",
    section: classData.section || "",
    academicYear: classData.academicYear || "2026-27",
    classTeacher: classData.classTeacher?._id || "",
    subjects: (classData.subjects || []).map((s: SubjectMapping) => ({
      subjectName: s.subjectName,
      teacher: s.teacher?._id || "",
    })),
    roomNumber: classData.roomNumber || "",
    capacity: classData.capacity || 40,
  };

  const enrolledStudents: StudentSummary[] = classData.students || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/classes"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Classes Directory</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setModalOpen(true)}
            className="text-xs text-slate-700 hover:bg-slate-50 gap-1.5"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>Edit Specifications</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteClass}
            disabled={isDeletingClass}
            className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 gap-1.5"
          >
            {isDeletingClass ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            <span>Delete Class</span>
          </Button>
        </div>
      </div>

      {/* Class Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg">
            {classData.section}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                {classData.className} — Section {classData.section}
              </h1>
              <Badge variant="brand" className="text-xs">
                {classData.academicYear}
              </Badge>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Room: <span className="font-semibold text-slate-900">{classData.roomNumber || "Unassigned"}</span> • Capacity: <span className="font-semibold text-slate-900">{classData.capacity} Seats</span>
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs">
              <span className="text-slate-500">
                Enrollment: <strong className="text-slate-900">{classData.studentCount}</strong> / {classData.capacity}
              </span>
              <Badge
                variant={classData.availableSeats > 0 ? "success" : "secondary"}
                className="text-[10px]"
              >
                {classData.availableSeats} Open Seats
              </Badge>
            </div>
          </div>
        </div>

        {/* Class Teacher Callout */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 sm:text-right min-w-[200px]">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Class Mentor / Teacher
          </span>
          {classData.classTeacher ? (
            <div className="mt-1">
              <p className="font-bold text-sm text-slate-900">
                {classData.classTeacher.firstName} {classData.classTeacher.lastName}
              </p>
              <p className="text-xs text-slate-500 font-mono">
                {classData.classTeacher.employeeId}
              </p>
              <p className="text-xs text-blue-600">{classData.classTeacher.email}</p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic mt-1">No class teacher assigned</p>
          )}
        </div>
      </div>

      {allocationError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{allocationError}</span>
        </div>
      )}

      {/* Two Column Grid: Subjects & Student Enrollment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subjects & Teachers Column (1 Col) */}
        <div className="space-y-6">
          <Card className="border border-slate-200/80 shadow-sm bg-white">
            <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900">
                <BookOpen className="h-4 w-4 text-blue-600" />
                <CardTitle className="text-sm font-bold">Curriculum & Faculty</CardTitle>
              </div>
              <span className="text-xs font-bold text-slate-400">
                {classData.subjects?.length || 0} Subjects
              </span>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {classData.subjects && classData.subjects.length > 0 ? (
                classData.subjects.map((sub: SubjectMapping, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-xs text-slate-900">
                        {sub.subjectName}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {sub.teacher
                          ? `${sub.teacher.firstName} ${sub.teacher.lastName}`
                          : "Unassigned faculty"}
                      </p>
                    </div>
                    {sub.teacher && (
                      <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-white border border-slate-200">
                        {sub.teacher.employeeId}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic py-2 text-center">
                  No subjects mapped to this section yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Enrolled Students & Allocation Management (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Enroll Student Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 flex items-center gap-1.5">
              <UserPlus className="h-4 w-4 text-blue-600" />
              <span>Enroll / Reassign Existing Student</span>
            </h3>
            <form onSubmit={handleAssignStudent} className="flex flex-col sm:flex-row items-center gap-3 mt-3">
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                disabled={classData.availableSeats <= 0}
                className="w-full sm:flex-1 text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:bg-slate-100"
              >
                <option value="">
                  {classData.availableSeats <= 0
                    ? "Class is at maximum capacity"
                    : "Select student to allocate to this section..."}
                </option>
                {eligibleStudents.map((st) => (
                  <option key={st._id} value={st._id}>
                    {st.firstName} {st.lastName} ({st.admissionNumber})
                  </option>
                ))}
              </select>
              <Button
                type="submit"
                size="sm"
                disabled={!selectedStudentId || isAssigning || classData.availableSeats <= 0}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold gap-1.5 shadow-sm whitespace-nowrap"
              >
                {isAssigning ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Allocating...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    <span>Enroll Student</span>
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Roster Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-950">
                  Enrolled Students Roster
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official class roll and attendance baseline
                </p>
              </div>
              <Badge variant="brand" className="text-xs">
                {enrolledStudents.length} Students
              </Badge>
            </div>

            {enrolledStudents.length === 0 ? (
              <div className="py-14 text-center px-4">
                <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">No students enrolled</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Use the allocation tool above to enroll students into this class cohort.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-2.5 px-4">Roll</th>
                      <th className="py-2.5 px-4">Adm #</th>
                      <th className="py-2.5 px-4">Student Name</th>
                      <th className="py-2.5 px-4">Contact</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {enrolledStudents.map((st) => (
                      <tr key={st._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-4 font-mono font-semibold text-slate-600">
                          {st.rollNumber || "—"}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-700">
                          {st.admissionNumber}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-900">
                          <Link
                            href={`/admin/students/${st._id}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {st.firstName} {st.lastName}
                          </Link>
                        </td>
                        <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                          {st.email || st.phone || "—"}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            onClick={() =>
                              handleRemoveStudent(
                                st._id,
                                `${st.firstName} ${st.lastName}`
                              )
                            }
                            disabled={removingStudentId === st._id}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Remove from class"
                          >
                            {removingStudentId === st._id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-600" />
                            ) : (
                              <UserMinus className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Specifications Modal */}
      <ClassFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          refreshClass();
          router.refresh();
        }}
        initialData={formData}
        classId={classData._id}
      />
    </div>
  );
}

