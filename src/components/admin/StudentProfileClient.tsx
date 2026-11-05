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
  HeartHandshake,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StudentFormModal, StudentFormData } from "@/components/admin/StudentFormModal";

interface StudentProfileClientProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  student: any;
}

export function StudentProfileClient({ student: initialStudent }: StudentProfileClientProps) {
  const router = useRouter();
  const [student, setStudent] = useState(initialStudent);
  const [modalOpen, setModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const refreshStudent = async () => {
    try {
      const res = await fetch(`/api/students/${student._id}`);
      const data = await res.json();
      if (res.ok && data.student) {
        setStudent(data.student);
      }
    } catch {
      // fallback
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete the student record for ${student.firstName} ${student.lastName}?`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/students/${student._id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/admin/students");
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete student");
        setIsDeleting(false);
      }
    } catch {
      alert("Network error occurred while deleting.");
      setIsDeleting(false);
    }
  };

  const formData: StudentFormData = {
    admissionNumber: student.admissionNumber || "",
    firstName: student.firstName || "",
    lastName: student.lastName || "",
    email: student.email || "",
    phone: student.phone || "",
    dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split("T")[0] : "",
    gender: student.gender || "",
    address: student.address || "",
    className: student.className || "",
    section: student.section || "",
    rollNumber: student.rollNumber || "",
    guardianName: student.guardianName || "",
    guardianPhone: student.guardianPhone || "",
    guardianEmail: student.guardianEmail || "",
    admissionDate: student.admissionDate
      ? student.admissionDate.split("T")[0]
      : "",
    status: student.status || "active",
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/students"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Student Directory</span>
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
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg">
            {student.firstName[0]}
            {student.lastName[0]}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                {student.firstName} {student.lastName}
              </h1>
              <Badge
                variant={student.status === "active" ? "success" : "secondary"}
                className="capitalize text-xs"
              >
                {student.status}
              </Badge>
            </div>
            <p className="text-xs font-mono text-slate-500 mt-1">
              Admission ID:{" "}
              <span className="font-semibold text-slate-900">
                {student.admissionNumber}
              </span>
            </p>
            <p className="text-xs text-slate-600 mt-1">
              {student.className} • Section {student.section}
              {student.rollNumber && ` • Roll #${student.rollNumber}`}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:items-end text-xs text-slate-500 space-y-1">
          <div>
            Enrolled On:{" "}
            <span className="font-medium text-slate-900">
              {student.admissionDate
                ? new Date(student.admissionDate).toLocaleDateString()
                : "—"}
            </span>
          </div>
          <div>
            System Registered:{" "}
            <span className="font-medium text-slate-900">
              {new Date(student.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Profile Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Academic Details Card */}
        <Card className="border border-slate-200/80 shadow-sm bg-white">
          <CardHeader className="p-6 pb-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900">
              <BookOpen className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-sm font-bold">Academic Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-3.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Current Grade / Class</span>
              <span className="font-semibold text-slate-900">{student.className}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Section Allocation</span>
              <span className="font-semibold text-slate-900">{student.section}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Roll Number</span>
              <span className="font-semibold text-slate-900">{student.rollNumber || "Not Assigned"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Admission Number</span>
              <span className="font-mono font-semibold text-slate-900">{student.admissionNumber}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Academic Status</span>
              <Badge variant={student.status === "active" ? "success" : "secondary"} className="capitalize">
                {student.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Personal Details Card */}
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
              <span className="font-semibold text-slate-900">{student.firstName} {student.lastName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Gender</span>
              <span className="capitalize font-semibold text-slate-900">{student.gender || "Unspecified"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Date of Birth</span>
              <span className="font-semibold text-slate-900">
                {student.dateOfBirth
                  ? new Date(student.dateOfBirth).toLocaleDateString()
                  : "Unspecified"}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Student Email</span>
              <span className="font-semibold text-slate-900">{student.email || "—"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="border border-slate-200/80 shadow-sm bg-white">
          <CardHeader className="p-6 pb-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900">
              <Phone className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-sm font-bold">Contact Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-3.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Student Phone</span>
              <span className="font-semibold text-slate-900">{student.phone || "—"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Student Email</span>
              <span className="font-semibold text-slate-900">{student.email || "—"}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Residential Address</span>
              <span className="font-medium text-slate-900 text-right max-w-xs">{student.address || "—"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Parent / Guardian Information */}
        <Card className="border border-slate-200/80 shadow-sm bg-white">
          <CardHeader className="p-6 pb-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900">
              <HeartHandshake className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-sm font-bold">Guardian & Family Record</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-3.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Primary Guardian</span>
              <span className="font-semibold text-slate-900">{student.guardianName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Guardian Phone</span>
              <span className="font-mono font-semibold text-slate-900">{student.guardianPhone}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Guardian Email</span>
              <span className="font-semibold text-slate-900">{student.guardianEmail || "—"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      <StudentFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          refreshStudent();
          router.refresh();
        }}
        initialData={formData}
        studentId={student._id}
      />
    </div>
  );
}

