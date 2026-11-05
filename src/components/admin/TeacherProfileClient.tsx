"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  Calendar,
  UserCheck,
  Edit2,
  Trash2,
  Loader2,
  Award,
  BookOpen,
  Briefcase,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TeacherFormModal, TeacherFormData } from "@/components/admin/TeacherFormModal";

interface TeacherProfileClientProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  teacher: any;
}

export function TeacherProfileClient({ teacher: initialTeacher }: TeacherProfileClientProps) {
  const router = useRouter();
  const [teacher, setTeacher] = useState(initialTeacher);
  const [modalOpen, setModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const refreshTeacher = async () => {
    try {
      const res = await fetch(`/api/teachers/${teacher._id}`);
      const data = await res.json();
      if (res.ok && data.teacher) {
        setTeacher(data.teacher);
      }
    } catch {
      // fallback
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete the faculty record for ${teacher.firstName} ${teacher.lastName}?`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/teachers/${teacher._id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/admin/teachers");
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete teacher record");
        setIsDeleting(false);
      }
    } catch {
      alert("Network error occurred while deleting.");
      setIsDeleting(false);
    }
  };

  const formData: TeacherFormData = {
    employeeId: teacher.employeeId || "",
    firstName: teacher.firstName || "",
    lastName: teacher.lastName || "",
    email: teacher.email || "",
    phone: teacher.phone || "",
    dateOfBirth: teacher.dateOfBirth ? teacher.dateOfBirth.split("T")[0] : "",
    gender: teacher.gender || "",
    address: teacher.address || "",
    qualification: teacher.qualification || "",
    specialization: teacher.specialization || "",
    department: teacher.department || "",
    subjects: Array.isArray(teacher.subjects) ? teacher.subjects.join(", ") : "",
    joiningDate: teacher.joiningDate
      ? teacher.joiningDate.split("T")[0]
      : "",
    employmentType: teacher.employmentType || "full-time",
    status: teacher.status || "active",
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/teachers"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Faculty Directory</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setModalOpen(true)}
            className="text-xs text-slate-700 hover:bg-slate-50 gap-1.5"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>Edit Profile</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 gap-1.5"
          >
            {isDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            <span>Delete</span>
          </Button>
        </div>
      </div>

      {/* Profile Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-700 text-white flex items-center justify-center font-bold text-2xl shadow-lg">
            {teacher.firstName[0]}
            {teacher.lastName[0]}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                {teacher.firstName} {teacher.lastName}
              </h1>
              <Badge
                variant={teacher.status === "active" ? "success" : "secondary"}
                className="capitalize text-xs"
              >
                {teacher.status}
              </Badge>
            </div>
            <p className="text-xs font-mono text-slate-500 mt-1">
              Employee ID:{" "}
              <span className="font-semibold text-slate-900">
                {teacher.employeeId}
              </span>
            </p>
            <p className="text-xs text-slate-600 mt-1">
              {teacher.department} • <span className="capitalize">{teacher.employmentType}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:items-end text-xs text-slate-500 space-y-1">
          <div>
            Joined Institution:{" "}
            <span className="font-medium text-slate-900">
              {teacher.joiningDate
                ? new Date(teacher.joiningDate).toLocaleDateString()
                : "—"}
            </span>
          </div>
          <div>
            System Registered:{" "}
            <span className="font-medium text-slate-900">
              {new Date(teacher.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Profile Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Professional & Academic Qualifications */}
        <Card className="border border-slate-200/80 shadow-sm bg-white">
          <CardHeader className="p-6 pb-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900">
              <Award className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-sm font-bold">Academic & Professional Credentials</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-3.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Department</span>
              <span className="font-semibold text-slate-900">{teacher.department}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Highest Qualification</span>
              <span className="font-semibold text-slate-900">{teacher.qualification}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Area of Specialization</span>
              <span className="font-semibold text-slate-900">{teacher.specialization || "General"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Employment Contract</span>
              <span className="capitalize font-semibold text-slate-900">{teacher.employmentType}</span>
            </div>
            <div className="py-1">
              <span className="text-slate-500 block mb-1.5">Assigned Teaching Subjects</span>
              {teacher.subjects && teacher.subjects.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {teacher.subjects.map((sub: string, i: number) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-md text-xs bg-slate-100 font-medium text-slate-800 border border-slate-200"
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-slate-400">No subjects currently assigned</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Personal Details */}
        <Card className="border border-slate-200/80 shadow-sm bg-white">
          <CardHeader className="p-6 pb-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900">
              <UserCheck className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-sm font-bold">Personal Profile</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-3.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Full Name</span>
              <span className="font-semibold text-slate-900">{teacher.firstName} {teacher.lastName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Gender</span>
              <span className="capitalize font-semibold text-slate-900">{teacher.gender || "Unspecified"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Date of Birth</span>
              <span className="font-semibold text-slate-900">
                {teacher.dateOfBirth
                  ? new Date(teacher.dateOfBirth).toLocaleDateString()
                  : "Unspecified"}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Employee ID</span>
              <span className="font-mono font-semibold text-slate-900">{teacher.employeeId}</span>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="border border-slate-200/80 shadow-sm bg-white md:col-span-2">
          <CardHeader className="p-6 pb-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900">
              <Phone className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-sm font-bold">Contact & Residential Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
            <div>
              <span className="text-slate-500 block mb-1">Institutional Email</span>
              <span className="font-semibold text-slate-900 block">{teacher.email}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Contact Phone</span>
              <span className="font-semibold text-slate-900 block">{teacher.phone || "—"}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Residential Address</span>
              <span className="font-medium text-slate-900 block">{teacher.address || "—"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      <TeacherFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          refreshTeacher();
          router.refresh();
        }}
        initialData={formData}
        teacherId={teacher._id}
      />
    </div>
  );
}

